// 六档训练配速区间（E/M/T/A/I/R），按跑力值的百分比换算为速度
// E、M、T、I 的比例取自 Daniels，A 档是徐国峰在 T 与 I 之间补的无氧耐力区间
import { velocityAtVo2 } from './vdot'

export interface ZoneDef {
  code: 'E' | 'M' | 'T' | 'A' | 'I' | 'R'
  name: string
  purpose: string
  lo: number // 跑力值百分比下限
  hi: number | null // 上限，R 档没有上限
}

export const ZONES: ZoneDef[] = [
  { code: 'E', name: '轻松跑', purpose: '建立有氧基础，热身、恢复与长距离慢跑', lo: 0.59, hi: 0.74 },
  { code: 'M', name: '马拉松配速', purpose: '熟悉全马目标节奏，提升长时间运动的能量利用', lo: 0.74, hi: 0.84 },
  { code: 'T', name: '乳酸阈值', purpose: '提高耐乳酸能力，节奏跑与巡航间歇', lo: 0.84, hi: 0.88 },
  { code: 'A', name: '无氧耐力', purpose: '在乳酸堆积状态下维持速度', lo: 0.88, hi: 0.95 },
  { code: 'I', name: '最大摄氧', purpose: '刺激最大摄氧量，3 到 5 分钟的间歇', lo: 0.95, hi: 1.0 },
  { code: 'R', name: '速度反复', purpose: '跑步经济性与速度，短距离快跑并充分休息', lo: 1.0, hi: null },
]

export interface ZonePace {
  zone: ZoneDef
  slowPace: number | null // 秒/公里，区间内较慢的一端
  fastPace: number // 较快的一端；R 档表示「快于此配速」
}

/** 某跑力值对应各区间的配速范围 */
export function zonePaces(vdot: number): ZonePace[] {
  const pace = (fraction: number) => 60000 / velocityAtVo2(vdot * fraction)
  return ZONES.map((zone) =>
    zone.hi === null
      ? { zone, slowPace: null, fastPace: pace(zone.lo) }
      : { zone, slowPace: pace(zone.lo), fastPace: pace(zone.hi) },
  )
}

/** 配速落在哪个区间 */
export function zoneOfPace(vdot: number, secPerKm: number): ZoneDef | null {
  const list = zonePaces(vdot)
  for (const z of list) {
    if (z.slowPace === null) {
      if (secPerKm <= z.fastPace) return z.zone
    } else if (secPerKm <= z.slowPace && secPerKm >= z.fastPace) {
      return z.zone
    }
  }
  return null
}
