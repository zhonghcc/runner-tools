// 本地存储：小程序和网页都走 uni 的同步存储接口；单元测试等非 uni 环境下退回内存
const memory = new Map<string, string>()
const hasUni = typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function'

export function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = hasUni ? uni.getStorageSync(key) : memory.get(key)
    if (!raw) return fallback
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw
    return v ?? fallback
  } catch {
    return fallback
  }
}

export function setJson(key: string, value: unknown) {
  try {
    const raw = JSON.stringify(value)
    if (hasUni) uni.setStorageSync(key, raw)
    else memory.set(key, raw)
  } catch {
    // 存储已满或隐私模式时静默失败，不影响计算
  }
}

export function remove(key: string) {
  try {
    if (hasUni) uni.removeStorageSync(key)
    else memory.delete(key)
  } catch {
    /* 同上 */
  }
}
