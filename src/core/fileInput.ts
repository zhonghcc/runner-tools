// 读取用户选中的文件内容：.fit 直接解析；.zip（佳明网页版导出的原始文件）先解压取出其中的 .fit
import { unzipSync } from 'fflate'
import { FitParseError } from './fit'

export const MAX_FILE_BYTES = 30 * 1024 * 1024

export function extractFit(buf: Uint8Array): Uint8Array {
  if (buf.byteLength > MAX_FILE_BYTES) throw new FitParseError('文件超过 30MB，不像是单次跑步记录')
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b // "PK"
  if (!isZip) return buf
  const entries = unzipSync(buf, { filter: (f) => f.name.toLowerCase().endsWith('.fit') })
  const names = Object.keys(entries)
  if (names.length === 0) throw new FitParseError('压缩包里没有找到 .fit 文件')
  return entries[names[0]]
}
