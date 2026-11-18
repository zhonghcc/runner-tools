// 跑者档案：近期成绩、心率参数，存在浏览器本地，各工具之间共用
import { reactive, watch, computed } from 'vue'
import { vdotFromRace } from '../core/vdot'

const KEY = 'runner-tools:profile:v1'
const HISTORY_KEY = 'runner-tools:aerobic:v1'

export interface Profile {
  raceMeters: number
  raceSeconds: number | null
  age: number | null
  maxHr: number | null
  restHr: number | null
}

const defaults: Profile = { raceMeters: 10000, raceSeconds: null, age: null, maxHr: null, restHr: null }

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export const profile = reactive<Profile>(typeof localStorage === 'undefined' ? { ...defaults } : load(KEY, { ...defaults }))

watch(profile, (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // 隐私模式或存储已满时静默失败，不影响计算
  }
})

export const profileVdot = computed(() =>
  profile.raceSeconds ? vdotFromRace(profile.raceMeters, profile.raceSeconds) : null,
)

// 有氧测试记录：只存摘要，不存原始文件
export interface AerobicSummary {
  id: string
  date: number
  movingSec: number
  distanceM: number
  driftPct: number
  decouplingPct: number | null
  valid: boolean
  standard: boolean
}

function loadHistory(): AerobicSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const aerobicHistory = reactive<AerobicSummary[]>(typeof localStorage === 'undefined' ? [] : loadHistory())

watch(aerobicHistory, (v) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(v))
  } catch {
    /* 同上 */
  }
})

/** 导出全部本地数据，换设备时手动迁移 */
export function exportData(): string {
  return JSON.stringify({ app: 'runner-tools', version: 1, profile, aerobicHistory }, null, 2)
}

export function importData(text: string): void {
  const data = JSON.parse(text)
  if (data?.app !== 'runner-tools') throw new Error('不是跑者拾穗导出的数据文件')
  if (data.profile) Object.assign(profile, { ...defaults, ...data.profile })
  if (Array.isArray(data.aerobicHistory)) {
    const known = new Set(aerobicHistory.map((x) => x.id))
    for (const item of data.aerobicHistory) if (!known.has(item.id)) aerobicHistory.push(item)
    aerobicHistory.sort((a, b) => b.date - a.date)
  }
}
