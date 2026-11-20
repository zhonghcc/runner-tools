// 登录状态与接口请求。两端共用：网页靠同源 Cookie，小程序里没有 Cookie，改用登录后拿到的令牌
import { reactive } from 'vue'
import { getJson, remove, setJson } from '../utils/storage'

export interface User {
  id: number
  nickname: string | null
  since: string
}

export const auth = reactive<{ user: User | null; checked: boolean }>({ user: null, checked: false })

let BASE = ''
// #ifdef MP-WEIXIN
// 小程序请求必须带完整域名，且要在小程序后台配置为 request 合法域名
BASE = 'https://run.zhonghcc.com'
// #endif

const TOKEN_KEY = 'runner-tools:token'
let token = getJson<string>(TOKEN_KEY, '')

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export function api<T>(path: string, data?: unknown, method: 'GET' | 'POST' = data === undefined ? 'GET' : 'POST'): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) header.Authorization = `Bearer ${token}`
    uni.request({
      url: BASE + path,
      method,
      data: data as never,
      header,
      timeout: 10000,
      success(res) {
        const body = (res.data || {}) as { error?: string }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body as T)
        else reject(new ApiError(body.error || `请求失败（${res.statusCode}）`, res.statusCode))
      },
      fail() {
        reject(new ApiError('网络不太顺畅，请稍后再试', 0))
      },
    })
  })
}

export async function refreshMe() {
  try {
    const { user } = await api<{ user: User }>('/api/me')
    auth.user = user
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) setToken('')
    auth.user = null
  } finally {
    auth.checked = true
  }
}

function setToken(t: string) {
  token = t
  if (t) setJson(TOKEN_KEY, t)
  else remove(TOKEN_KEY)
}

/** 记下后端发的令牌（小程序用），并更新登录状态 */
export function applyLogin(t: string, user: User) {
  setToken(t)
  auth.user = user
  auth.checked = true
}

export function wxCode(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (r) => (r.code ? resolve(r.code) : reject(new Error('登录失败，请重试'))),
      fail: () => reject(new Error('登录失败，请重试')),
    })
  })
}

/** 小程序内直接登录：wx.login 拿 code，后端换 openid 后发令牌 */
export async function loginInMiniProgram(): Promise<User> {
  const r = await api<{ token: string; user: User }>('/api/mp/login/direct', { code: await wxCode() })
  applyLogin(r.token, r.user)
  return r.user
}

export async function logout() {
  await api('/api/auth/logout', {}).catch(() => undefined)
  setToken('')
  auth.user = null
}

export const displayName = (u: User) => u.nickname || `跑者 ${u.id}`
