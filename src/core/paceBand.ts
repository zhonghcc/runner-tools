// 比赛配速手环：按目标完赛时间和策略算每个分段的用时与累计时间

export interface PaceBandRow {
  label: string
  meters: number // 该分段终点的累计距离
  splitSec: number
  cumSec: number
  pace: number // 该分段的平均配速，秒/公里
  isHalf?: boolean
}

export interface PaceBandOptions {
  meters: number
  targetSec: number
  splitMeters: number // 1000 或 5000
  /** 后程加速比例：0 表示匀速；0.02 表示后半程配速比前半程快 2% */
  negativeSplit: number
}

/** 前半程配速，满足 前半程配速·半程 + 后半程配速·半程 = 目标时间 */
function firstHalfPace(o: PaceBandOptions): number {
  const halfKm = o.meters / 2000
  return o.targetSec / (halfKm * (2 - o.negativeSplit))
}

/** 从起点跑到某距离的累计用时 */
function timeAt(o: PaceBandOptions, meters: number): number {
  const p1 = firstHalfPace(o)
  const p2 = p1 * (1 - o.negativeSplit)
  const half = o.meters / 2
  if (meters <= half) return (meters / 1000) * p1
  return (half / 1000) * p1 + ((meters - half) / 1000) * p2
}

export function buildPaceBand(o: PaceBandOptions): PaceBandRow[] {
  const marks: number[] = []
  for (let m = o.splitMeters; m < o.meters - 1; m += o.splitMeters) marks.push(m)
  const half = o.meters / 2
  // 半程点单独列出，方便赛中核对
  if (!marks.some((m) => Math.abs(m - half) < 1)) marks.push(half)
  marks.push(o.meters)
  marks.sort((a, b) => a - b)

  const rows: PaceBandRow[] = []
  let prevM = 0
  let prevT = 0
  for (const m of marks) {
    const t = timeAt(o, m)
    const isHalf = Math.abs(m - half) < 1 && Math.abs(m - o.meters) > 1
    const label = m === o.meters ? '终点' : isHalf ? '半程' : `${+(m / 1000).toFixed(3)} 公里`
    rows.push({ label, meters: m, splitSec: t - prevT, cumSec: t, pace: (t - prevT) / ((m - prevM) / 1000), isHalf })
    prevM = m
    prevT = t
  }
  return rows
}
