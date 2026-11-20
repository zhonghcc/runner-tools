// 跑者拾穗后端：只监听本机，由 Web 服务器把 /api/ 反代过来
import http from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { config, mpConfigured } from './config.js'
import * as db from './db.js'
import { code2session, createLoginCode, WechatError } from './wechat.js'
import { TicketStore, RateLimiter } from './tickets.js'

const tickets = new TicketStore(config.ticketTtlMs)
const qrLimiter = new RateLimiter(10, 60_000) // 每个 IP 每分钟最多生成 10 个登录码
const mpLimiter = new RateLimiter(30, 60_000)

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

function send(res, status, body, headers = {}) {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(json)
}

function clientIp(req) {
  return req.headers['x-real-ip'] || req.socket.remoteAddress || ''
}

async function readJson(req) {
  let size = 0
  const chunks = []
  for await (const c of req) {
    size += c.length
    if (size > 16 * 1024) throw Object.assign(new Error('请求体过大'), { status: 413 })
    chunks.push(c)
  }
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('请求格式错误'), { status: 400 })
  }
}

function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function sessionCookie(token, maxAgeSec) {
  const parts = [`${config.cookieName}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`]
  if (config.cookieSecure) parts.push('Secure')
  return parts.join('; ')
}

// 网页用 HttpOnly Cookie，小程序没有 Cookie，用 Authorization: Bearer 令牌
function requestToken(req) {
  const h = String(req.headers.authorization || '')
  if (h.startsWith('Bearer ')) return h.slice(7).trim()
  return parseCookies(req.headers.cookie)[config.cookieName] || ''
}

async function currentUser(req) {
  const token = requestToken(req)
  if (!token) return null
  return db.findSession(sha256(token))
}

async function issueSession(userId, req) {
  const token = randomBytes(32).toString('base64url')
  await db.insertSession(sha256(token), userId, new Date(Date.now() + config.sessionTtlMs), req.headers['user-agent'])
  return token
}

const publicUser = (u) => ({ id: u.id, nickname: u.nickname ?? null, since: u.created_at })

async function mpUserFromCode(code) {
  const wx = await code2session(code)
  return db.upsertUserByOpenid(wx.openid, wx.unionid)
}

function requireMp(res) {
  if (mpConfigured()) return true
  send(res, 503, { error: '小程序登录尚未配置，请稍后再试' })
  return false
}

function wxErrorMessage(e) {
  if (!(e instanceof WechatError)) return '微信服务暂时不可用，请稍后再试'
  if (e.errcode === 40029 || e.errcode === 40163) return '登录凭证已失效，请重试'
  if (e.errcode === 45011) return '操作太频繁，请稍后再试'
  return '微信服务暂时不可用，请稍后再试'
}

const routes = {
  'GET /api/health': async (req, res) => {
    await db.pool.query('SELECT 1')
    send(res, 200, { ok: true, mp: mpConfigured() })
  },

  // 网页：创建登录票据并返回小程序码
  'POST /api/auth/qr': async (req, res) => {
    if (!requireMp(res)) return
    if (!qrLimiter.allow(clientIp(req))) return send(res, 429, { error: '刷新太频繁，请稍后再试' })
    const t = tickets.create({ ua: String(req.headers['user-agent'] || '').slice(0, 200) })
    try {
      const png = await createLoginCode(t.ticket)
      send(res, 200, { ticket: t.ticket, pollSecret: t.pollSecret, expiresIn: t.expiresIn, image: `data:${png[0] === 0xff && png[1] === 0xd8 ? 'image/jpeg' : 'image/png'};base64,${png.toString('base64')}` })
    } catch (e) {
      console.error('[qr]', e.message)
      send(res, 502, { error: wxErrorMessage(e) })
    }
  },

  // 网页：轮询扫码状态，确认后写入会话 Cookie
  'POST /api/auth/qr/status': async (req, res) => {
    const { ticket, pollSecret } = await readJson(req)
    const r = tickets.poll(ticket, pollSecret)
    if (r.status !== 'confirmed') return send(res, 200, { status: r.status })
    const token = await issueSession(r.userId, req)
    send(res, 200, { status: 'confirmed' }, { 'Set-Cookie': sessionCookie(token, Math.round(config.sessionTtlMs / 1000)) })
  },

  'GET /api/me': async (req, res) => {
    const u = await currentUser(req)
    if (!u) return send(res, 401, { error: '未登录' })
    // 未登录与已登录的结果不能被缓存或混用
    send(res, 200, { user: { id: u.user_id, nickname: u.nickname, since: u.created_at } })
  },

  'POST /api/auth/logout': async (req, res) => {
    const token = requestToken(req)
    if (token) await db.deleteSession(sha256(token))
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) })
  },

  // 小程序：扫码进入登录页
  'POST /api/mp/login/scan': async (req, res) => {
    if (!mpLimiter.allow(clientIp(req))) return send(res, 429, { error: '操作太频繁' })
    const { ticket } = await readJson(req)
    send(res, 200, { status: tickets.markScanned(ticket) })
  },

  // 小程序：确认登录，用 wx.login 的 code 换 openid
  'POST /api/mp/login/confirm': async (req, res) => {
    if (!requireMp(res)) return
    if (!mpLimiter.allow(clientIp(req))) return send(res, 429, { error: '操作太频繁' })
    const { ticket, code } = await readJson(req)
    if (!tickets.get(ticket)) return send(res, 200, { status: 'expired' })
    if (typeof code !== 'string' || !code) return send(res, 400, { error: '缺少登录凭证' })
    let user
    try {
      user = await mpUserFromCode(code)
    } catch (e) {
      console.error('[confirm]', e.message)
      return send(res, 502, { error: wxErrorMessage(e) })
    }
    const status = tickets.confirm(ticket, user.id)
    // 确认网页登录的同时，小程序这边也登录上，返回小程序用的令牌
    if (status !== 'confirmed') return send(res, 200, { status })
    send(res, 200, { status, token: await issueSession(user.id, req), user: publicUser(user) })
  },

  // 小程序：直接登录（不经过网页扫码）
  'POST /api/mp/login/direct': async (req, res) => {
    if (!requireMp(res)) return
    if (!mpLimiter.allow(clientIp(req))) return send(res, 429, { error: '操作太频繁' })
    const { code } = await readJson(req)
    if (typeof code !== 'string' || !code) return send(res, 400, { error: '缺少登录凭证' })
    let user
    try {
      user = await mpUserFromCode(code)
    } catch (e) {
      console.error('[direct]', e.message)
      return send(res, 502, { error: wxErrorMessage(e) })
    }
    send(res, 200, { token: await issueSession(user.id, req), user: publicUser(user) })
  },

  'POST /api/mp/login/cancel': async (req, res) => {
    const { ticket } = await readJson(req)
    send(res, 200, { status: tickets.cancel(ticket) })
  },
}

const server = http.createServer(async (req, res) => {
  const path = (req.url || '').split('?')[0]
  const handler = routes[`${req.method} ${path}`]
  if (!handler) return send(res, 404, { error: '接口不存在' })
  try {
    await handler(req, res)
  } catch (e) {
    console.error(`[${req.method} ${path}]`, e)
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : '服务器出错了，请稍后再试' })
  }
})

await db.migrate()
setInterval(() => db.purgeExpiredSessions().catch((e) => console.error('[purge]', e.message)), 6 * 3600 * 1000).unref()
server.listen(config.port, config.host, () => {
  console.log(`runner-tools server on ${config.host}:${config.port}, mp configured: ${mpConfigured()}, env: ${config.mp.envVersion}`)
})
