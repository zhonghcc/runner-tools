import { describe, expect, it } from 'vitest'
import { formatDuration, formatPace, parseDuration } from '../src/core/time'
import { raceTimeFromVdot, vdotFromRace, velocityAtVo2, vo2AtVelocity } from '../src/core/vdot'
import { zonePaces, zoneOfPace } from '../src/core/zones'
import { buildPaceBand } from '../src/core/paceBand'
import { riegel, kmhFromPace, lapTime, pacePerMile } from '../src/core/pace'
import { zonesByMax, zonesByReserve, estimateMaxHr } from '../src/core/heartRate'
import { diagnose } from '../src/core/diagnosis'

const hms = (h: number, m: number, s: number) => h * 3600 + m * 60 + s

describe('时间解析与格式化', () => {
  it('解析多种写法', () => {
    expect(parseDuration('1:23:45')).toBe(5025)
    expect(parseDuration('23:45')).toBe(1425)
    expect(parseDuration('5’30'.replace('’', "'"))).toBe(330)
    expect(parseDuration('abc')).toBeNull()
  })
  it('格式化', () => {
    expect(formatDuration(5025)).toBe('1:23:45')
    expect(formatDuration(1425)).toBe('23:45')
    expect(formatPace(330.4)).toBe('5:30')
  })
})

describe('跑力值公式', () => {
  it('速度与摄氧量互为反函数', () => {
    for (const v of [150, 200, 250, 300, 350]) expect(velocityAtVo2(vo2AtVelocity(v))).toBeCloseTo(v, 6)
  })

  // 校验数据：《丹尼尔斯经典跑步训练法》跑力值对照表
  const table: [number, number, number][] = [
    [50, 5000, hms(0, 19, 57)],
    [50, 10000, hms(0, 41, 21)],
    [50, 21097.5, hms(1, 31, 35)],
    [50, 42195, hms(3, 10, 49)],
    [40, 5000, hms(0, 24, 8)],
    [40, 10000, hms(0, 50, 3)],
    [40, 42195, hms(3, 49, 45)],
    [60, 5000, hms(0, 17, 3)],
    [60, 42195, hms(2, 43, 25)],
  ]
  it.each(table)('跑力 %d、%d 米：与对照表误差小于千分之三', (vdot, meters, sec) => {
    const t = raceTimeFromVdot(meters, vdot)
    expect(Math.abs(t - sec) / sec).toBeLessThan(0.003)
    expect(vdotFromRace(meters, sec)).toBeCloseTo(vdot, 0)
  })

  it('全马 3:59:59 的跑力约 37.9（RQ 跑力给出 40.66，两者刻度不同）', () => {
    expect(vdotFromRace(42195, hms(3, 59, 59))).toBeCloseTo(37.9, 1)
  })
})

describe('训练区间', () => {
  it('六档区间首尾相接、由慢到快', () => {
    const z = zonePaces(45)
    expect(z.map((x) => x.zone.code).join('')).toBe('EMTAIR')
    for (let i = 1; i < z.length - 1; i++) expect(z[i].slowPace).toBeCloseTo(z[i - 1].fastPace, 6)
    // R 档没有慢端，「快于」的界线就是 I 档的快端
    expect(z[5].slowPace).toBeNull()
    expect(z[5].fastPace).toBeCloseTo(z[4].fastPace, 6)
    for (const x of z) if (x.slowPace) expect(x.slowPace).toBeGreaterThan(x.fastPace)
  })
  it('跑力越高配速越快', () => {
    expect(zonePaces(50)[0].fastPace).toBeLessThan(zonePaces(40)[0].fastPace)
  })
  it('全马比赛配速落在 M 区间', () => {
    const vdot = 45
    const pace = raceTimeFromVdot(42195, vdot) / 42.195
    expect(zoneOfPace(vdot, pace)?.code).toBe('M')
  })
})

describe('配速换算', () => {
  it('基本换算', () => {
    expect(kmhFromPace(300)).toBeCloseTo(12, 6)
    expect(lapTime(300)).toBeCloseTo(120, 6)
    expect(pacePerMile(300)).toBeCloseTo(482.8, 1)
  })
  it('Riegel 公式', () => {
    expect(riegel(10000, 3000, 10000)).toBe(3000)
    expect(riegel(10000, hms(0, 50, 0), 42195)).toBeGreaterThan(hms(3, 49, 0))
  })
})

describe('配速手环', () => {
  it('匀速：累计时间等于目标，半程点单独列出', () => {
    const rows = buildPaceBand({ meters: 42195, targetSec: hms(4, 0, 0), splitMeters: 5000, negativeSplit: 0 })
    expect(rows[rows.length - 1].cumSec).toBeCloseTo(hms(4, 0, 0), 6)
    expect(rows.some((r) => r.isHalf)).toBe(true)
    expect(rows[0].pace).toBeCloseTo(rows[rows.length - 2].pace, 6)
  })
  it('后程加速 2%：后半程配速比前半程快 2%，总时间不变', () => {
    const rows = buildPaceBand({ meters: 21097.5, targetSec: hms(2, 0, 0), splitMeters: 1000, negativeSplit: 0.02 })
    expect(rows[rows.length - 1].cumSec).toBeCloseTo(hms(2, 0, 0), 6)
    expect(rows[rows.length - 2].pace / rows[0].pace).toBeCloseTo(0.98, 6)
  })
})

describe('心率区间', () => {
  it('最大心率法与储备心率法', () => {
    expect(zonesByMax(190)[1]).toMatchObject({ low: 114, high: 133 })
    expect(zonesByReserve(190, 50)[1]).toMatchObject({ low: 134, high: 148 })
    expect(estimateMaxHr(40)).toEqual({ classic: 180, tanaka: 180 })
  })
})

describe('强弱项诊断', () => {
  it('同跑力的两个成绩判为均衡', () => {
    const d = diagnose({ meters: 10000, seconds: raceTimeFromVdot(10000, 45) }, { meters: 42195, seconds: raceTimeFromVdot(42195, 45) })
    expect(d?.verdict).toBe('balanced')
  })
  it('全马明显落后判为耐力短板', () => {
    const d = diagnose({ meters: 10000, seconds: raceTimeFromVdot(10000, 45) }, { meters: 42195, seconds: raceTimeFromVdot(42195, 41) })
    expect(d?.verdict).toBe('endurance')
  })
})
