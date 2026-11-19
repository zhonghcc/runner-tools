import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TicketStore, RateLimiter } from '../src/tickets.js'

function store() {
  let now = 1_000_000
  const s = new TicketStore(5 * 60 * 1000, () => now)
  return { s, tick: (ms) => (now += ms) }
}

test('票据满足小程序 scene 的长度与字符要求', () => {
  const { s } = store()
  const { ticket } = s.create()
  assert.ok(ticket.length <= 32)
  assert.match(ticket, /^[0-9a-f]+$/)
})

test('完整流程：扫码、确认、网页领取一次后作废', () => {
  const { s } = store()
  const { ticket, pollSecret } = s.create()
  assert.equal(s.poll(ticket, pollSecret).status, 'pending')
  assert.equal(s.markScanned(ticket), 'scanned')
  assert.equal(s.poll(ticket, pollSecret).status, 'scanned')
  assert.equal(s.confirm(ticket, 42), 'confirmed')
  assert.deepEqual(s.poll(ticket, pollSecret), { status: 'confirmed', userId: 42 })
  assert.equal(s.poll(ticket, pollSecret).status, 'expired')
})

test('没有 pollSecret 的人拿不到登录结果', () => {
  const { s } = store()
  const { ticket } = s.create()
  s.confirm(ticket, 7)
  assert.equal(s.poll(ticket, 'guess').status, 'expired')
  assert.equal(s.poll(ticket, undefined).status, 'expired')
})

test('确认后不能被再次确认成别的用户', () => {
  const { s } = store()
  const { ticket, pollSecret } = s.create()
  s.confirm(ticket, 1)
  assert.equal(s.confirm(ticket, 2), 'confirmed')
  assert.equal(s.poll(ticket, pollSecret).userId, 1)
})

test('取消后网页收到 cancelled，票据作废', () => {
  const { s } = store()
  const { ticket, pollSecret } = s.create()
  assert.equal(s.cancel(ticket), 'cancelled')
  assert.equal(s.confirm(ticket, 1), 'cancelled')
  assert.equal(s.poll(ticket, pollSecret).status, 'cancelled')
  assert.equal(s.poll(ticket, pollSecret).status, 'expired')
})

test('5 分钟后过期', () => {
  const { s, tick } = store()
  const { ticket, pollSecret } = s.create()
  tick(5 * 60 * 1000 + 1)
  assert.equal(s.confirm(ticket, 1), 'expired')
  assert.equal(s.poll(ticket, pollSecret).status, 'expired')
})

test('限流：窗口内超过次数被拒绝，窗口过后恢复', () => {
  let now = 0
  const r = new RateLimiter(2, 1000, () => now)
  assert.ok(r.allow('a'))
  assert.ok(r.allow('a'))
  assert.ok(!r.allow('a'))
  assert.ok(r.allow('b'))
  now = 1001
  assert.ok(r.allow('a'))
})
