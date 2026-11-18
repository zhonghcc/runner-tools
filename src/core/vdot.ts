// 跑力值（VDOT）计算，公式出自 Jack Daniels 与 Jimmy Gilbert 的《Oxygen Power》(1979)，
// 也是《丹尼尔斯经典跑步训练法》各张对照表的来源。
//   摄氧量与速度：VO2 = -4.60 + 0.182258·v + 0.000104·v²   （v：米/分钟）
//   可持续比例：  %max = 0.8 + 0.1894393·e^(-0.012778·t) + 0.2989558·e^(-0.1932605·t)   （t：分钟）
//   跑力值 = VO2 / %max

/** 给定速度（米/分钟）时的摄氧需求 */
export function vo2AtVelocity(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v
}

/** 摄氧量对应的速度（米/分钟），即上式的反函数 */
export function velocityAtVo2(vo2: number): number {
  const a = 0.000104
  const b = 0.182258
  const c = -4.6 - vo2
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
}

/** 持续 t 分钟的比赛能维持的最大摄氧量比例 */
export function sustainableFraction(minutes: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * minutes) + 0.2989558 * Math.exp(-0.1932605 * minutes)
}

/** 由比赛成绩算跑力值 */
export function vdotFromRace(meters: number, seconds: number): number {
  const minutes = seconds / 60
  const v = meters / minutes
  return vo2AtVelocity(v) / sustainableFraction(minutes)
}

/** 由跑力值反推某距离的等效成绩（秒）。跑力值随用时单调递减，用二分法求解 */
export function raceTimeFromVdot(meters: number, vdot: number): number {
  let lo = 60 // 1 分钟
  let hi = 60 * 60 * 12 // 12 小时
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (vdotFromRace(meters, mid) > vdot) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 公式的可信范围：比赛时长 3.5 分钟到约 5 小时、跑力值 20 到 85 */
export function checkRaceInput(meters: number, seconds: number): string | null {
  const minutes = seconds / 60
  if (meters < 1500) return '距离太短，公式适用于 1500 米及以上的比赛成绩'
  if (minutes < 3.5) return '用时太短，请检查输入'
  const vdot = vdotFromRace(meters, seconds)
  if (vdot > 85) return '这个成绩超出世界纪录水平，请检查输入'
  if (vdot < 20) return '成绩低于公式的适用范围（跑力值 20 以下），结果会失真'
  if (minutes > 360) return '用时超过 6 小时，公式不再适用'
  return null
}
