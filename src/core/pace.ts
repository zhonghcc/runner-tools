// 配速、速度、距离之间的换算

export const KM_PER_MILE = 1.609344

/** 常用比赛距离（米） */
export const DISTANCES = [
  { key: '1500', label: '1500 米', meters: 1500 },
  { key: 'mile', label: '1 英里', meters: 1609.344 },
  { key: '3k', label: '3 公里', meters: 3000 },
  { key: '5k', label: '5 公里', meters: 5000 },
  { key: '10k', label: '10 公里', meters: 10000 },
  { key: 'half', label: '半程马拉松', meters: 21097.5 },
  { key: 'full', label: '全程马拉松', meters: 42195 },
] as const

export type DistanceKey = (typeof DISTANCES)[number]['key']

export function distanceByKey(key: string): number | null {
  return DISTANCES.find((d) => d.key === key)?.meters ?? null
}

export function distanceLabel(meters: number): string {
  const hit = DISTANCES.find((d) => Math.abs(d.meters - meters) < 0.5)
  if (hit) return hit.label
  return `${+(meters / 1000).toFixed(3)} 公里`
}

export const paceFromTime = (sec: number, meters: number) => sec / (meters / 1000)
export const timeFromPace = (secPerKm: number, meters: number) => secPerKm * (meters / 1000)
export const kmhFromPace = (secPerKm: number) => 3600 / secPerKm
export const paceFromKmh = (kmh: number) => 3600 / kmh
export const pacePerMile = (secPerKm: number) => secPerKm * KM_PER_MILE
export const lapTime = (secPerKm: number, lapMeters = 400) => (secPerKm * lapMeters) / 1000
export const paceFromMs = (ms: number) => 1000 / ms

/** Riegel 公式：T2 = T1 × (D2/D1)^k，k 通常取 1.06 */
export function riegel(meters1: number, sec1: number, meters2: number, k = 1.06): number {
  return sec1 * Math.pow(meters2 / meters1, k)
}
