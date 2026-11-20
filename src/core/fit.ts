// FIT 文件解析：只取有氧测试需要的字段，全部在本机完成（浏览器或小程序里）
// 先装好 TextDecoder 替代实现，再加载 SDK；只引入解码器，编码器在小程序里用不到
import './textcodec'
import Decoder from '@garmin/fitsdk/src/decoder.js'
import Stream from '@garmin/fitsdk/src/stream.js'

export interface FitRecord {
  ts: number // 毫秒时间戳
  hr: number | null
  dist: number | null // 累计距离，米
  speed: number | null // 米/秒
  alt: number | null
}

export interface TimerEvent {
  ts: number
  type: 'start' | 'stop'
}

export interface FitActivity {
  startTime: number | null
  sport: string | null
  manufacturer: string | null
  records: FitRecord[]
  timerEvents: TimerEvent[]
  session: {
    totalTimerTime: number | null
    totalElapsedTime: number | null
    totalDistance: number | null
    totalAscent: number | null
    avgHr: number | null
    maxHr: number | null
  }
}

export class FitParseError extends Error {}

type AnyMesg = Record<string, unknown>

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const time = (v: unknown): number | null => (v instanceof Date ? v.getTime() : null)

export function parseFit(bytes: ArrayBuffer | Uint8Array): FitActivity {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  // 复制一份独立的 ArrayBuffer，避免视图只占底层缓冲区一部分时读到多余字节
  const stream = Stream.fromArrayBuffer(u8.slice().buffer)
  if (!Decoder.isFIT(stream)) throw new FitParseError('这不是 FIT 文件，请从手表 App 导出原始 .fit 文件')
  const decoder = new Decoder(stream)
  const { messages, errors } = decoder.read({ mergeHeartRates: true })
  const m = messages as unknown as Record<string, AnyMesg[] | undefined>
  const rawRecords = m.recordMesgs ?? []
  if (rawRecords.length === 0) {
    const detail = errors.length ? `（${String(errors[0])}）` : ''
    throw new FitParseError(`文件里没有逐点记录数据${detail}`)
  }

  const records: FitRecord[] = []
  for (const r of rawRecords) {
    const ts = time(r.timestamp)
    if (ts === null) continue
    records.push({
      ts,
      hr: num(r.heartRate),
      dist: num(r.distance),
      speed: num(r.enhancedSpeed) ?? num(r.speed),
      alt: num(r.enhancedAltitude) ?? num(r.altitude),
    })
  }
  records.sort((a, b) => a.ts - b.ts)

  const timerEvents: TimerEvent[] = []
  for (const e of m.eventMesgs ?? []) {
    if (e.event !== 'timer') continue
    const ts = time(e.timestamp)
    if (ts === null) continue
    const t = String(e.eventType)
    if (t === 'start') timerEvents.push({ ts, type: 'start' })
    else if (t.startsWith('stop')) timerEvents.push({ ts, type: 'stop' })
  }
  timerEvents.sort((a, b) => a.ts - b.ts)

  const s = (m.sessionMesgs ?? [])[0] ?? {}
  const fileId = (m.fileIdMesgs ?? [])[0] ?? {}
  return {
    startTime: time(s.startTime) ?? records[0]?.ts ?? null,
    sport: typeof s.sport === 'string' ? s.sport : null,
    manufacturer: typeof fileId.manufacturer === 'string' ? fileId.manufacturer : null,
    records,
    timerEvents,
    session: {
      totalTimerTime: num(s.totalTimerTime),
      totalElapsedTime: num(s.totalElapsedTime),
      totalDistance: num(s.totalDistance),
      totalAscent: num(s.totalAscent),
      avgHr: num(s.avgHeartRate),
      maxHr: num(s.maxHeartRate),
    },
  }
}
