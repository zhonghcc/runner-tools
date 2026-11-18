// 有氧基础测试：心率漂移法（徐国峰、RQ 跑力采用）为主，Friel 有氧解耦率为辅
//   漂移 = (B − A) ÷ A，A、B 为第 10 分钟与第 90 分钟前后各 30 秒的平均心率
//   有效条件：单次停下不超过 30 秒、累计不超过 90 秒；停下的时间不计入 90 分钟
import type { FitActivity, FitRecord } from './fit'
import { zonePaces } from './zones'

export const STANDARD_SEC = 90 * 60
export const MIN_SEC = 60 * 60
const A_AT = 10 * 60
const MAX_SINGLE_STOP = 30
const MAX_TOTAL_STOP = 90
const STOP_SPEED = 0.8 // 米/秒，低于此速度视为停下（约 20:50/公里，比快走还慢）
const GAP_SEC = 10 // 两条记录间隔超过 10 秒视为中断

export interface Issue {
  level: 'error' | 'warn'
  text: string
}

export interface Stop {
  atSec: number // 停下时已跑的有效时长
  durationSec: number
}

export interface MinutePoint {
  minute: number
  hr: number | null
  pace: number | null // 秒/公里
}

export type Rating = { level: 'excellent' | 'good' | 'weak'; title: string; advice: string }

export interface AerobicResult {
  valid: boolean
  standard: boolean // 是否跑满 90 分钟
  issues: Issue[]
  startTime: number | null
  movingSec: number
  elapsedSec: number
  distanceM: number
  windowEndSec: number
  avgPace: number | null // 测试窗口（第 10 分钟到终点）内的平均配速
  hrA: number | null
  hrB: number | null
  driftPct: number | null
  rating: Rating | null
  decouplingPct: number | null
  paceCvPct: number | null
  eShare: number | null // 测试窗口内落在 E 区间的分钟比例
  stops: Stop[]
  series: MinutePoint[]
  maxHr: number | null
}

interface Sample {
  t: number // 有效时长，秒
  d: number // 有效距离，米
  hr: number | null
  w: number // 该点代表的时长，用于加权平均
}

/** 剔除明显异常的心率：超出生理范围，或比前 10 个有效值的中位数突跳 30 次以上 */
export function cleanHeartRates(records: FitRecord[]): (number | null)[] {
  const out: (number | null)[] = []
  const recent: number[] = []
  for (const r of records) {
    let hr = r.hr
    if (hr !== null && (hr < 40 || hr > 230)) hr = null
    if (hr !== null && recent.length >= 5) {
      const sorted = [...recent].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      if (Math.abs(hr - median) > 30) hr = null
    }
    if (hr !== null) {
      recent.push(hr)
      if (recent.length > 10) recent.shift()
    }
    out.push(hr)
  }
  return out
}

function pausedBetween(paused: [number, number][], t0: number, t1: number): boolean {
  return paused.some(([s, e]) => s < t1 && e > t0)
}

/** 把原始记录换算成「有效时长」时间轴，同时找出所有停顿 */
export function buildTimeline(act: FitActivity): { samples: Sample[]; stops: Stop[] } {
  const recs = act.records
  const hrs = cleanHeartRates(recs)
  const paused: [number, number][] = []
  let stopTs: number | null = null
  for (const e of act.timerEvents) {
    if (e.type === 'stop' && stopTs === null) stopTs = e.ts
    else if (e.type === 'start' && stopTs !== null) {
      paused.push([stopTs, e.ts])
      stopTs = null
    }
  }

  const samples: Sample[] = [{ t: 0, d: 0, hr: hrs[0] ?? null, w: 0 }]
  const stops: Stop[] = []
  let t = 0
  let d = 0
  let currentStop = 0
  for (let i = 1; i < recs.length; i++) {
    const a = recs[i - 1]
    const b = recs[i]
    const dt = (b.ts - a.ts) / 1000
    if (dt <= 0) continue
    let seg = 0
    if (a.dist !== null && b.dist !== null) seg = Math.max(0, b.dist - a.dist)
    else if (b.speed !== null) seg = b.speed * dt
    const stopped = dt > GAP_SEC || pausedBetween(paused, a.ts, b.ts) || seg / dt < STOP_SPEED
    if (stopped) {
      currentStop += dt
      continue
    }
    if (currentStop > 0) {
      if (currentStop >= 3) stops.push({ atSec: t, durationSec: currentStop })
      currentStop = 0
    }
    t += dt
    d += seg
    samples.push({ t, d, hr: hrs[i], w: dt })
  }
  if (currentStop >= 3) stops.push({ atSec: t, durationSec: currentStop })
  return { samples, stops }
}

function meanHr(samples: Sample[], t0: number, t1: number): { mean: number | null; coverage: number } {
  let sum = 0
  let weight = 0
  let span = 0
  for (const s of samples) {
    if (s.t < t0 || s.t > t1 || s.w === 0) continue
    span += s.w
    if (s.hr === null) continue
    sum += s.hr * s.w
    weight += s.w
  }
  return { mean: weight > 0 ? sum / weight : null, coverage: span > 0 ? weight / span : 0 }
}

/** 有效时长 t 时的累计距离，线性插值 */
function distAt(samples: Sample[], t: number): number {
  if (t <= 0) return 0
  let lo = 0
  let hi = samples.length - 1
  if (t >= samples[hi].t) return samples[hi].d
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (samples[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = samples[lo]
  const b = samples[hi]
  return a.d + ((b.d - a.d) * (t - a.t)) / (b.t - a.t || 1)
}

export function rate(driftPct: number): Rating {
  if (driftPct <= 5)
    return {
      level: 'excellent',
      title: '有氧基础优秀',
      advice: '心率漂移在 5% 以内，有氧基础非常稳固。只练长距离慢跑已很难再进步，可以把训练重心放到乳酸阈值和间歇上。',
    }
  if (driftPct <= 10)
    return {
      level: 'good',
      title: '有氧基础良好',
      advice: '心率漂移在 10% 以内，有氧基础已经建立，可以开始加入高强度间歇训练。',
    }
  return {
    level: 'weak',
    title: '有氧基础待加强',
    advice: '心率漂移超过 10%，建议继续以 E 配速的长距离慢跑打底，过几周再测一次。',
  }
}

export interface AnalyzeOptions {
  vdot?: number | null
}

export function analyzeAerobic(act: FitActivity, opts: AnalyzeOptions = {}): AerobicResult {
  const issues: Issue[] = []
  const { samples, stops } = buildTimeline(act)
  const movingSec = samples[samples.length - 1].t
  const distanceM = samples[samples.length - 1].d
  const first = act.records[0]?.ts ?? 0
  const last = act.records[act.records.length - 1]?.ts ?? 0
  const elapsedSec = (last - first) / 1000
  const hasHr = act.records.some((r) => r.hr !== null)
  const maxHr = act.session.maxHr ?? (hasHr ? Math.max(...act.records.map((r) => r.hr ?? 0)) : null)

  const base: AerobicResult = {
    valid: false,
    standard: movingSec >= STANDARD_SEC,
    issues,
    startTime: act.startTime,
    movingSec,
    elapsedSec,
    distanceM,
    windowEndSec: Math.min(movingSec, STANDARD_SEC),
    avgPace: null,
    hrA: null,
    hrB: null,
    driftPct: null,
    rating: null,
    decouplingPct: null,
    paceCvPct: null,
    eShare: null,
    stops,
    series: [],
    maxHr,
  }

  if (act.sport && act.sport !== 'running') issues.push({ level: 'warn', text: `这条记录的运动类型是「${act.sport}」，不是跑步` })

  // 每分钟的心率与配速，用于画图
  for (let k = 0; (k + 1) * 60 <= movingSec; k++) {
    const meters = distAt(samples, (k + 1) * 60) - distAt(samples, k * 60)
    base.series.push({
      minute: k + 1,
      hr: meanHr(samples, k * 60, (k + 1) * 60).mean,
      pace: meters > 0 ? 60000 / meters : null,
    })
  }

  if (!hasHr) {
    issues.push({ level: 'error', text: '记录里没有心率数据，请确认跑步时佩戴了心率设备' })
    return base
  }
  if (movingSec < MIN_SEC) {
    issues.push({
      level: 'error',
      text: `有效跑步时长只有 ${Math.floor(movingSec / 60)} 分钟。检测需要以 E 配速跑满 90 分钟，至少也要 60 分钟`,
    })
    return base
  }
  if (!base.standard)
    issues.push({ level: 'warn', text: `有效时长 ${Math.floor(movingSec / 60)} 分钟，未跑满 90 分钟，结果为非标准时长，仅供参考` })

  const end = base.windowEndSec
  const windowStops = stops.filter((s) => s.atSec <= end)
  const longest = windowStops.reduce((m, s) => Math.max(m, s.durationSec), 0)
  const totalStop = windowStops.reduce((m, s) => m + s.durationSec, 0)
  if (longest > MAX_SINGLE_STOP) {
    const s = windowStops.find((x) => x.durationSec === longest)!
    issues.push({
      level: 'error',
      text: `第 ${Math.floor(s.atSec / 60)} 分钟停了 ${Math.round(longest)} 秒，单次停下超过 30 秒，心率会明显回落，这次记录不适合做检测`,
    })
  }
  if (totalStop > MAX_TOTAL_STOP)
    issues.push({ level: 'error', text: `累计停下 ${Math.round(totalStop)} 秒，超过 90 秒的上限，这次记录不适合做检测` })

  const a = meanHr(samples, A_AT - 30, A_AT + 30)
  const bWin: [number, number] = base.standard ? [end - 30, Math.min(end + 30, movingSec)] : [end - 60, end]
  const b = meanHr(samples, bWin[0], bWin[1])
  const cover = meanHr(samples, A_AT, end).coverage
  if (cover < 0.9 || a.mean === null || b.mean === null) {
    issues.push({ level: 'error', text: '测试时段内心率数据缺失较多，无法计算' })
    return base
  }
  base.hrA = a.mean
  base.hrB = b.mean
  base.driftPct = ((b.mean - a.mean) / a.mean) * 100
  base.rating = rate(Math.max(0, base.driftPct))
  if (base.driftPct < -3)
    issues.push({ level: 'warn', text: '后程心率反而下降，可能是后半程放慢了配速，或第 10 分钟时还没有热身充分' })

  // 有氧解耦率：前后两半「速度/心率」比值的下降幅度
  const mid = (A_AT + end) / 2
  const ef = (t0: number, t1: number) => {
    const speed = (distAt(samples, t1) - distAt(samples, t0)) / (t1 - t0)
    const hr = meanHr(samples, t0, t1).mean
    return hr ? speed / hr : null
  }
  const ef1 = ef(A_AT, mid)
  const ef2 = ef(mid, end)
  if (ef1 && ef2) base.decouplingPct = ((ef1 - ef2) / ef1) * 100

  // 配速稳定性：测试窗口内每分钟配速的变异系数
  const speeds: number[] = []
  for (let k = A_AT / 60; (k + 1) * 60 <= end; k++) speeds.push((distAt(samples, (k + 1) * 60) - distAt(samples, k * 60)) / 60)
  if (speeds.length > 2) {
    const mean = speeds.reduce((x, y) => x + y, 0) / speeds.length
    const sd = Math.sqrt(speeds.reduce((x, y) => x + (y - mean) ** 2, 0) / speeds.length)
    base.paceCvPct = (sd / mean) * 100
    if (base.paceCvPct > 10)
      issues.push({ level: 'warn', text: `配速波动较大（每分钟配速变异 ${base.paceCvPct.toFixed(1)}%），检测要求全程稳定在 E 配速，结果参考价值有限` })
  }
  const windowDist = distAt(samples, end) - distAt(samples, A_AT)
  base.avgPace = windowDist > 0 ? (end - A_AT) / (windowDist / 1000) : null

  if (opts.vdot && base.avgPace) {
    const e = zonePaces(opts.vdot)[0]
    const inE = speeds.filter((v) => {
      const p = 1000 / v
      return p <= (e.slowPace ?? Infinity) && p >= e.fastPace
    }).length
    base.eShare = speeds.length ? inE / speeds.length : null
    if (base.avgPace < e.fastPace)
      issues.push({ level: 'warn', text: '平均配速快于你的 E 配速区间，强度偏高会放大心率漂移' })
    else if (e.slowPace && base.avgPace > e.slowPace)
      issues.push({ level: 'warn', text: '平均配速慢于你的 E 配速区间，测得的漂移可能偏小' })
  }

  const ascent = act.session.totalAscent
  if (ascent !== null && distanceM > 0 && ascent / (distanceM / 1000) > 10)
    issues.push({ level: 'warn', text: `累计爬升 ${Math.round(ascent)} 米，路线有起伏，检测建议选择平坦路段` })

  base.valid = !issues.some((i) => i.level === 'error')
  return base
}
