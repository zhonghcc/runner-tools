// 心率与配速曲线：先算出与平台无关的绘图元素，再分别输出成 SVG（网页）或画到 canvas（小程序）
import type { MinutePoint } from './aerobic'
import { formatPace } from './time'

export interface ChartText {
  x: number
  y: number
  text: string
  align: 'start' | 'middle' | 'end'
  color: string
  bold?: boolean
}
export interface ChartLine {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  dash?: boolean
}
export interface ChartPath {
  points: [number, number][][] // 多段折线，遇到缺失数据断开
  color: string
  width: number
}
export interface ChartModel {
  width: number
  height: number
  rect: { x: number; y: number; w: number; h: number; color: string }
  lines: ChartLine[]
  texts: ChartText[]
  paths: ChartPath[]
}

const PL = 38
const PR = 44
const PT = 12
const PB = 22
const HR_COLOR = '#b5483b'
const PACE_COLOR = '#4f7a4a'
const AXIS_COLOR = '#8a7a63'

export function buildChart(series: MinutePoint[], windowEnd: number, width: number, height = 220): ChartModel {
  const maxMin = Math.max(10, series.length)
  const x = (m: number) => PL + ((width - PL - PR) * m) / maxMin
  const innerH = height - PT - PB

  const hrVals = series.map((p) => p.hr).filter((v): v is number => v !== null)
  const hrMin = Math.floor((Math.min(...hrVals, 200) - 5) / 10) * 10
  const hrMax = Math.ceil((Math.max(...hrVals, 100) + 5) / 10) * 10
  const yHr = (v: number) => PT + (innerH * (hrMax - v)) / (hrMax - hrMin || 1)

  // 配速纵轴取 5% 到 95% 分位，避免个别异常分钟把曲线压扁；越快越靠上
  const paces = series
    .map((p) => p.pace)
    .filter((v): v is number => v !== null && v < 1200)
    .sort((a, b) => a - b)
  const q = (p: number) => paces[Math.min(paces.length - 1, Math.max(0, Math.floor(paces.length * p)))]
  const fast = paces.length ? Math.floor((q(0.05) - 15) / 15) * 15 : 240
  const slow = paces.length ? Math.ceil((q(0.95) + 15) / 15) * 15 : 480
  const yPace = (v: number) => PT + (innerH * (Math.min(Math.max(v, fast), slow) - fast)) / (slow - fast || 1)

  const lines: ChartLine[] = []
  const texts: ChartText[] = []
  const hrStep = hrMax - hrMin > 60 ? 20 : 10
  for (let v = hrMin; v <= hrMax; v += hrStep) {
    lines.push({ x1: PL, x2: width - PR, y1: yHr(v), y2: yHr(v), color: '#efe6d4', width: 1 })
    texts.push({ x: PL - 6, y: yHr(v) + 4, text: String(v), align: 'end', color: AXIS_COLOR })
  }
  const paceStep = slow - fast > 180 ? 60 : 30
  for (let v = Math.ceil(fast / paceStep) * paceStep; v <= slow; v += paceStep)
    texts.push({ x: width - PR + 6, y: yPace(v) + 4, text: formatPace(v), align: 'start', color: AXIS_COLOR })
  const minStep = maxMin > 100 || width < 480 ? 20 : 10
  for (let m = 0; m <= maxMin; m += minStep) texts.push({ x: x(m), y: height - 6, text: `${m}′`, align: 'middle', color: AXIS_COLOR })

  // 测试窗口：第 10 分钟到终点
  lines.push({ x1: x(10), x2: x(10), y1: PT, y2: height - PB, color: '#b7832f', width: 1, dash: true })
  lines.push({ x1: x(windowEnd), x2: x(windowEnd), y1: PT, y2: height - PB, color: '#b7832f', width: 1, dash: true })
  texts.push({ x: x(10) + 4, y: PT + 12, text: 'A', align: 'start', color: '#8e6320', bold: true })
  texts.push({ x: x(windowEnd) - 4, y: PT + 12, text: 'B', align: 'end', color: '#8e6320', bold: true })

  const toPath = (get: (p: MinutePoint) => number | null, y: (v: number) => number) => {
    const segs: [number, number][][] = []
    let cur: [number, number][] = []
    for (const p of series) {
      const v = get(p)
      if (v === null) {
        if (cur.length) segs.push(cur)
        cur = []
        continue
      }
      cur.push([x(p.minute - 0.5), y(v)])
    }
    if (cur.length) segs.push(cur)
    return segs
  }

  return {
    width,
    height,
    rect: { x: x(10), y: PT, w: Math.max(0, x(windowEnd) - x(10)), h: innerH, color: 'rgba(183,131,47,0.07)' },
    lines,
    texts,
    paths: [
      { points: toPath((p) => p.pace, yPace), color: PACE_COLOR, width: 1.6 },
      { points: toPath((p) => p.hr, yHr), color: HR_COLOR, width: 2 },
    ],
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const f1 = (n: number) => n.toFixed(1)

export function chartToSvg(m: ChartModel): string {
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.width} ${m.height}" width="100%" style="display:block">`]
  parts.push(`<rect x="${f1(m.rect.x)}" y="${m.rect.y}" width="${f1(m.rect.w)}" height="${m.rect.h}" fill="${m.rect.color}"/>`)
  for (const l of m.lines)
    parts.push(`<line x1="${f1(l.x1)}" y1="${f1(l.y1)}" x2="${f1(l.x2)}" y2="${f1(l.y2)}" stroke="${l.color}" stroke-width="${l.width}"${l.dash ? ' stroke-dasharray="4 3"' : ''}/>`)
  for (const p of m.paths) {
    const d = p.points.map((seg) => seg.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)},${f1(y)}`).join('')).join('')
    parts.push(`<path d="${d}" fill="none" stroke="${p.color}" stroke-width="${p.width}" stroke-linejoin="round"/>`)
  }
  for (const t of m.texts)
    parts.push(`<text x="${f1(t.x)}" y="${f1(t.y)}" text-anchor="${t.align}" font-size="11" fill="${t.color}"${t.bold ? ' font-weight="600"' : ''}>${esc(t.text)}</text>`)
  parts.push('</svg>')
  return parts.join('')
}

/** 画到 canvas 2D 上下文；ctx 已按设备像素比缩放好 */
export function drawChart(ctx: CanvasRenderingContext2D, m: ChartModel) {
  ctx.clearRect(0, 0, m.width, m.height)
  ctx.fillStyle = m.rect.color
  ctx.fillRect(m.rect.x, m.rect.y, m.rect.w, m.rect.h)
  for (const l of m.lines) {
    ctx.beginPath()
    ctx.setLineDash(l.dash ? [4, 3] : [])
    ctx.strokeStyle = l.color
    ctx.lineWidth = l.width
    ctx.moveTo(l.x1, l.y1)
    ctx.lineTo(l.x2, l.y2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  for (const p of m.paths) {
    ctx.beginPath()
    ctx.strokeStyle = p.color
    ctx.lineWidth = p.width
    ctx.lineJoin = 'round'
    for (const seg of p.points) seg.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
  for (const t of m.texts) {
    ctx.fillStyle = t.color
    ctx.font = `${t.bold ? '600 ' : ''}11px sans-serif`
    ctx.textAlign = t.align === 'middle' ? 'center' : t.align === 'end' ? 'right' : 'left'
    ctx.fillText(t.text, t.x, t.y)
  }
}
