// 强弱项诊断：比较两个不同距离成绩的跑力值
import { vdotFromRace } from './vdot'
import { distanceLabel } from './pace'

export interface RaceResult {
  meters: number
  seconds: number
}

export interface Diagnosis {
  shorter: RaceResult & { vdot: number }
  longer: RaceResult & { vdot: number }
  diffPct: number // (长距离跑力 − 短距离跑力) / 短距离跑力
  verdict: 'endurance' | 'speed' | 'balanced'
  summary: string
}

/** 差距在 ±2% 以内视为均衡 */
const BALANCE_BAND = 0.02

export function diagnose(a: RaceResult, b: RaceResult): Diagnosis | null {
  if (Math.abs(a.meters - b.meters) < 1) return null
  const [s, l] = a.meters < b.meters ? [a, b] : [b, a]
  const shorter = { ...s, vdot: vdotFromRace(s.meters, s.seconds) }
  const longer = { ...l, vdot: vdotFromRace(l.meters, l.seconds) }
  const diffPct = (longer.vdot - shorter.vdot) / shorter.vdot
  let verdict: Diagnosis['verdict'] = 'balanced'
  let summary = `两项成绩的跑力接近，速度与耐力比较均衡。`
  if (diffPct < -BALANCE_BAND) {
    verdict = 'endurance'
    summary = `${distanceLabel(longer.meters)}的跑力明显低于${distanceLabel(shorter.meters)}，耐力是短板。建议增加长距离慢跑和马拉松配速跑，提高周跑量。`
  } else if (diffPct > BALANCE_BAND) {
    verdict = 'speed'
    summary = `${distanceLabel(shorter.meters)}的跑力明显低于${distanceLabel(longer.meters)}，速度是短板。建议加入乳酸阈值跑和间歇训练。`
  }
  return { shorter, longer, diffPct, verdict, summary }
}
