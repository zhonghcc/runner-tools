// 时间与配速的解析、格式化。内部统一用秒，配速统一用「秒/公里」

/** 时、分、秒拼成总秒数；任何一项不是有限数字都返回 null */
export function hmsToSeconds(h: number | string, m: number | string, s: number | string): number | null {
  const parts = [h, m, s].map((v) => (v === '' || v === null || v === undefined ? 0 : Number(v)))
  if (parts.some((v) => !Number.isFinite(v) || v < 0)) return null
  const total = parts[0] * 3600 + parts[1] * 60 + parts[2]
  return total > 0 ? total : null
}

/** 解析 "1:23:45"、"23:45"、"45" 这类写法 */
export function parseDuration(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const segs = t.split(/[:：']/).map((x) => x.trim())
  if (segs.length > 3 || segs.some((x) => !/^\d+(\.\d+)?$/.test(x))) return null
  const nums = segs.map(Number)
  while (nums.length < 3) nums.unshift(0)
  return hmsToSeconds(nums[0], nums[1], nums[2])
}

export function splitSeconds(sec: number): { h: number; m: number; s: number } {
  const r = Math.round(sec)
  return { h: Math.floor(r / 3600), m: Math.floor((r % 3600) / 60), s: r % 60 }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 时长格式化：不足一小时显示 m:ss，否则 h:mm:ss */
export function formatDuration(sec: number, forceHours = false): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const { h, m, s } = splitSeconds(sec)
  if (h > 0 || forceHours) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

/** 配速格式化（秒/公里 → m:ss） */
export function formatPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '—'
  const r = Math.round(secPerKm)
  return `${Math.floor(r / 60)}:${pad(r % 60)}`
}

/** 带小数秒的格式化，用于 400 米单圈这类短时间 */
export function formatShort(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  if (sec < 60) return `${sec.toFixed(1)} 秒`
  return formatPace(sec)
}
