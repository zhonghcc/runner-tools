// 登录状态。账号只用于以后的数据同步，不登录时所有工具照常使用
import { reactive } from 'vue'

export interface User {
  id: number
  nickname: string | null
  since: string
}

export const auth = reactive<{ user: User | null; checked: boolean }>({ user: null, checked: false })

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || `请求失败（${res.status}）`), { status: res.status })
  return data as T
}

export async function refreshMe() {
  try {
    const { user } = await api<{ user: User }>('/api/me')
    auth.user = user
  } catch {
    auth.user = null
  } finally {
    auth.checked = true
  }
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
  auth.user = null
}

export const displayName = (u: User) => u.nickname || `跑者 ${u.id}`
