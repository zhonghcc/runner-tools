// 心率区间：最大心率法与储备心率法（Karvonen）

export interface HrZoneDef {
  code: string
  name: string
  lo: number
  hi: number
}

export const HR_ZONES: HrZoneDef[] = [
  { code: 'Z1', name: '恢复', lo: 0.5, hi: 0.6 },
  { code: 'Z2', name: '有氧耐力', lo: 0.6, hi: 0.7 },
  { code: 'Z3', name: '节奏', lo: 0.7, hi: 0.8 },
  { code: 'Z4', name: '乳酸阈值', lo: 0.8, hi: 0.9 },
  { code: 'Z5', name: '最大强度', lo: 0.9, hi: 1.0 },
]

export interface HrZoneRange {
  zone: HrZoneDef
  low: number
  high: number
}

/** 最大心率法：最大心率 × 百分比 */
export function zonesByMax(maxHr: number): HrZoneRange[] {
  return HR_ZONES.map((zone) => ({ zone, low: Math.round(maxHr * zone.lo), high: Math.round(maxHr * zone.hi) }))
}

/** 储备心率法：(最大心率 − 静息心率) × 百分比 + 静息心率 */
export function zonesByReserve(maxHr: number, restHr: number): HrZoneRange[] {
  const reserve = maxHr - restHr
  return HR_ZONES.map((zone) => ({
    zone,
    low: Math.round(reserve * zone.lo + restHr),
    high: Math.round(reserve * zone.hi + restHr),
  }))
}

/** 年龄估算最大心率，只作参考，个体差异可达 ±10 次以上 */
export function estimateMaxHr(age: number) {
  return {
    classic: Math.round(220 - age),
    tanaka: Math.round(208 - 0.7 * age), // Tanaka 等 2001 年的回归公式
  }
}

/** MAF 心率（Maffetone）：180 − 年龄 */
export const mafHr = (age: number) => 180 - age
