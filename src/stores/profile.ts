// 跑者档案：近期成绩、心率参数，存在本机，各工具之间共用
import { reactive, watch, computed } from 'vue'
import { vdotFromRace } from '../core/vdot'
import { getJson, setJson } from '../utils/storage'

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

export const profile = reactive<Profile>({ ...defaults, ...getJson<Partial<Profile>>(KEY, {}) })

watch(profile, (v) => setJson(KEY, v))

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

const storedHistory = getJson<AerobicSummary[]>(HISTORY_KEY, [])
export const aerobicHistory = reactive<AerobicSummary[]>(Array.isArray(storedHistory) ? storedHistory : [])

watch(aerobicHistory, (v) => setJson(HISTORY_KEY, v))

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
