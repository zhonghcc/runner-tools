// 用 FIT SDK 编码器合成一份跑步记录，再走一遍解析与分析流程
import { describe, expect, it } from 'vitest'
import { Encoder, Profile } from '@garmin/fitsdk'
import { parseFit, FitParseError } from '../src/core/fit'
import { analyzeAerobic } from '../src/core/aerobic'

interface SynthOptions {
  minutes: number
  pace: number // 秒/公里
  hrStart: number
  hrEnd: number
  pauses?: { atMin: number; sec: number }[] // 按停表暂停
  standStill?: { atMin: number; sec: number }[] // 不停表，原地停下
  noHr?: boolean
}

function synthFit(o: SynthOptions): Uint8Array {
  const enc = new Encoder()
  // SDK 的类型声明较窄，测试里按解码后的字段名直接写入
  const put = (mesgNum: number, mesg: Record<string, unknown>) => enc.onMesg(mesgNum as never, mesg as never)
  const start = new Date('2026-11-15T06:30:00+08:00').getTime()
  const speed = 1000 / o.pace
  put(Profile.MesgNum.FILE_ID, { manufacturer: 'development', product: 1, timeCreated: new Date(start), type: 'activity' })
  put(Profile.MesgNum.EVENT, { timestamp: new Date(start), event: 'timer', eventType: 'start' })

  let wall = start
  let dist = 0
  const total = o.minutes * 60
  for (let t = 0; t <= total; t++) {
    const pause = o.pauses?.find((p) => p.atMin * 60 === t)
    if (pause) {
      put(Profile.MesgNum.EVENT, { timestamp: new Date(wall), event: 'timer', eventType: 'stop' })
      wall += pause.sec * 1000
      put(Profile.MesgNum.EVENT, { timestamp: new Date(wall), event: 'timer', eventType: 'start' })
    }
    const stand = o.standStill?.find((p) => p.atMin * 60 === t)
    if (stand) {
      for (let k = 0; k < stand.sec; k++) {
        wall += 1000
        put(Profile.MesgNum.RECORD, { timestamp: new Date(wall), distance: dist, enhancedSpeed: 0, heartRate: 120 })
      }
    }
    const hr = o.hrStart + ((o.hrEnd - o.hrStart) * t) / total
    const rec: Record<string, unknown> = { timestamp: new Date(wall), distance: dist, enhancedSpeed: speed }
    if (!o.noHr) rec.heartRate = Math.round(hr)
    put(Profile.MesgNum.RECORD, rec)
    wall += 1000
    dist += speed
  }
  put(Profile.MesgNum.EVENT, { timestamp: new Date(wall), event: 'timer', eventType: 'stopAll' })
  put(Profile.MesgNum.SESSION, {
    timestamp: new Date(wall),
    startTime: new Date(start),
    sport: 'running',
    totalElapsedTime: (wall - start) / 1000,
    totalTimerTime: total,
    totalDistance: dist,
    totalAscent: 20,
  })
  return enc.close()
}

describe('FIT 解析', () => {
  it('读出记录、计时事件和总结信息', () => {
    const act = parseFit(synthFit({ minutes: 5, pace: 360, hrStart: 140, hrEnd: 145 }))
    expect(act.records.length).toBe(301)
    expect(act.sport).toBe('running')
    expect(act.timerEvents[0].type).toBe('start')
    expect(act.records[100].hr).toBeGreaterThan(139)
    expect(act.records[300].dist).toBeCloseTo(300 * (1000 / 360), 0)
  })
  it('不是 FIT 文件时报错', () => {
    expect(() => parseFit(new TextEncoder().encode('hello world, not a fit file'))).toThrow(FitParseError)
  })
})

describe('有氧基础测试', () => {
  it('90 分钟平稳跑，心率 140→150：漂移约 6.5%，判为良好', () => {
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 95, pace: 360, hrStart: 140, hrEnd: 150 })))
    expect(r.valid).toBe(true)
    expect(r.standard).toBe(true)
    // 第 10 分钟 ≈ 141.05，第 90 分钟 ≈ 149.47
    expect(r.hrA).toBeCloseTo(141.05, 0)
    expect(r.hrB).toBeCloseTo(149.47, 0)
    expect(r.driftPct!).toBeGreaterThan(5.5)
    expect(r.driftPct!).toBeLessThan(6.5)
    expect(r.rating?.level).toBe('good')
    expect(r.decouplingPct!).toBeGreaterThan(0)
    expect(r.paceCvPct!).toBeLessThan(1)
    expect(r.avgPace!).toBeCloseTo(360, 0)
  })

  it('停表 20 秒可以接受，停下的时间不计入有效时长', () => {
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 92, pace: 360, hrStart: 140, hrEnd: 144, pauses: [{ atMin: 40, sec: 20 }] })))
    expect(r.valid).toBe(true)
    expect(r.stops).toHaveLength(1)
    expect(r.stops[0].durationSec).toBeGreaterThanOrEqual(20)
    expect(r.stops[0].durationSec).toBeLessThan(22)
    expect(r.movingSec).toBeCloseTo(92 * 60, -1)
    expect(r.rating?.level).toBe('excellent')
  })

  it('不停表原地等 45 秒，判为无效并指出位置', () => {
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 95, pace: 360, hrStart: 140, hrEnd: 150, standStill: [{ atMin: 30, sec: 45 }] })))
    expect(r.valid).toBe(false)
    expect(r.issues.some((i) => i.level === 'error' && i.text.includes('第 30 分钟'))).toBe(true)
  })

  it('多次短停累计超过 90 秒，判为无效', () => {
    const pauses = [20, 30, 40, 50, 60].map((atMin) => ({ atMin, sec: 25 }))
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 95, pace: 360, hrStart: 140, hrEnd: 150, pauses })))
    expect(r.valid).toBe(false)
    expect(r.issues.some((i) => i.text.includes('累计停下'))).toBe(true)
  })

  it('70 分钟记录：给出结果但标为非标准时长', () => {
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 70, pace: 360, hrStart: 140, hrEnd: 160 })))
    expect(r.valid).toBe(true)
    expect(r.standard).toBe(false)
    expect(r.issues.some((i) => i.text.includes('非标准时长'))).toBe(true)
    expect(r.rating?.level).toBe('weak')
  })

  it('不足 60 分钟或没有心率，判为无效', () => {
    expect(analyzeAerobic(parseFit(synthFit({ minutes: 40, pace: 360, hrStart: 140, hrEnd: 150 }))).valid).toBe(false)
    expect(analyzeAerobic(parseFit(synthFit({ minutes: 95, pace: 360, hrStart: 0, hrEnd: 0, noHr: true }))).valid).toBe(false)
  })

  it('平均配速快于 E 区间时给出提醒', () => {
    // 跑力 40 的 E 区间约 6:10–7:20，这里用 5:00 跑
    const r = analyzeAerobic(parseFit(synthFit({ minutes: 95, pace: 300, hrStart: 150, hrEnd: 155 })), { vdot: 40 })
    expect(r.issues.some((i) => i.text.includes('快于你的 E 配速区间'))).toBe(true)
    expect(r.eShare).toBe(0)
  })
})
