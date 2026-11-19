// 微信服务端接口：稳定版 access_token、code2session、不限量小程序码
import { config } from './config.js'

const API = 'https://api.weixin.qq.com'

export class WechatError extends Error {
  constructor(errcode, errmsg) {
    super(`微信接口错误 ${errcode}：${errmsg}`)
    this.errcode = errcode
  }
}

async function wxFetch(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) })
  return res
}

// 用稳定版接口（stable_token），普通模式下不会让已发出的 token 失效
let tokenCache = { value: '', expiresAt: 0 }
export async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && tokenCache.value && Date.now() < tokenCache.expiresAt) return tokenCache.value
  const res = await wxFetch(`${API}/cgi-bin/stable_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credential', appid: config.mp.appid, secret: config.mp.secret, force_refresh: false }),
  })
  const data = await res.json()
  if (!data.access_token) throw new WechatError(data.errcode, data.errmsg)
  // 提前 5 分钟过期，避免边界时刻失效
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000 }
  return tokenCache.value
}

export async function code2session(code) {
  const q = new URLSearchParams({ appid: config.mp.appid, secret: config.mp.secret, js_code: code, grant_type: 'authorization_code' })
  const res = await wxFetch(`${API}/sns/jscode2session?${q}`)
  const data = await res.json()
  if (!data.openid) throw new WechatError(data.errcode, data.errmsg)
  return { openid: data.openid, unionid: data.unionid ?? null }
}

/** 生成指向登录页的小程序码，scene 携带票据。返回 PNG 二进制 */
export async function createLoginCode(scene) {
  const call = async (token) =>
    wxFetch(`${API}/wxa/getwxacodeunlimit?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene,
        page: config.mp.loginPage,
        // 体验版和开发版的页面不在线上，必须关闭路径校验
        check_path: config.mp.envVersion === 'release',
        env_version: config.mp.envVersion,
        width: 280,
      }),
    })
  let res = await call(await getAccessToken())
  if ((res.headers.get('content-type') || '').includes('json')) {
    const data = await res.json()
    // token 失效时刷新一次再试
    if (data.errcode === 40001 || data.errcode === 42001) {
      res = await call(await getAccessToken(true))
      if ((res.headers.get('content-type') || '').includes('json')) {
        const d2 = await res.json()
        throw new WechatError(d2.errcode, d2.errmsg)
      }
    } else {
      throw new WechatError(data.errcode, data.errmsg)
    }
  }
  return Buffer.from(await res.arrayBuffer())
}
