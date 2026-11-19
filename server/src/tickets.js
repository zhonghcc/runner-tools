// 扫码登录票据：只存在进程内存里，5 分钟过期。单实例部署足够；以后多实例再换 Redis
//   网页创建票据，拿到 ticket（写进小程序码）和 pollSecret（只留在发起登录的浏览器里）
//   小程序扫码 → scanned；用户点确认 → confirmed；网页凭 pollSecret 轮询到 confirmed 后领取一次，票据作废
import { randomBytes, timingSafeEqual } from 'node:crypto'

const MAX_TICKETS = 2000

export class TicketStore {
  constructor(ttlMs, now = () => Date.now()) {
    this.ttlMs = ttlMs
    this.now = now
    this.map = new Map()
  }

  create(meta = {}) {
    this.sweep()
    if (this.map.size >= MAX_TICKETS) throw new Error('登录请求过多，请稍后再试')
    // scene 最长 32 个字符，只允许数字、字母和少量符号；24 位十六进制足够
    const ticket = randomBytes(12).toString('hex')
    const pollSecret = randomBytes(24).toString('base64url')
    this.map.set(ticket, { status: 'pending', pollSecret, expiresAt: this.now() + this.ttlMs, userId: null, ...meta })
    return { ticket, pollSecret, expiresIn: Math.round(this.ttlMs / 1000) }
  }

  get(ticket) {
    const t = typeof ticket === 'string' ? this.map.get(ticket) : undefined
    if (!t) return null
    if (this.now() > t.expiresAt) {
      this.map.delete(ticket)
      return null
    }
    return t
  }

  /** 小程序端：扫码进入 */
  markScanned(ticket) {
    const t = this.get(ticket)
    if (!t) return 'expired'
    if (t.status === 'pending') t.status = 'scanned'
    return t.status
  }

  /** 小程序端：确认登录 */
  confirm(ticket, userId) {
    const t = this.get(ticket)
    if (!t) return 'expired'
    if (t.status !== 'pending' && t.status !== 'scanned') return t.status
    t.status = 'confirmed'
    t.userId = userId
    return 'confirmed'
  }

  cancel(ticket) {
    const t = this.get(ticket)
    if (!t) return 'expired'
    if (t.status === 'pending' || t.status === 'scanned') t.status = 'cancelled'
    return t.status
  }

  /** 网页端轮询。confirmed 时返回 userId 并作废票据，保证只能领取一次 */
  poll(ticket, pollSecret) {
    const t = this.get(ticket)
    if (!t) return { status: 'expired' }
    if (!safeEqual(t.pollSecret, pollSecret)) return { status: 'expired' }
    if (t.status === 'confirmed') {
      this.map.delete(ticket)
      return { status: 'confirmed', userId: t.userId }
    }
    if (t.status === 'cancelled') this.map.delete(ticket)
    return { status: t.status }
  }

  sweep() {
    const n = this.now()
    for (const [k, v] of this.map) if (n > v.expiresAt) this.map.delete(k)
  }
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** 简单的按键限流：windowMs 内最多 limit 次 */
export class RateLimiter {
  constructor(limit, windowMs, now = () => Date.now()) {
    this.limit = limit
    this.windowMs = windowMs
    this.now = now
    this.hits = new Map()
  }
  allow(key) {
    const n = this.now()
    const list = (this.hits.get(key) ?? []).filter((t) => n - t < this.windowMs)
    if (list.length >= this.limit) {
      this.hits.set(key, list)
      return false
    }
    list.push(n)
    this.hits.set(key, list)
    if (this.hits.size > 10000) this.hits.clear()
    return true
  }
}
