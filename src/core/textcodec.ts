// 小程序运行环境没有 TextEncoder / TextDecoder，FIT SDK 在模块加载时就会用到。
// 这里补一份只支持 UTF-8 的最小实现；浏览器和 Node 已有原生实现时不覆盖
const g = globalThis as Record<string, unknown>

class Utf8Encoder {
  readonly encoding = 'utf-8'
  encode(input = ''): Uint8Array {
    const out: number[] = []
    for (let i = 0; i < input.length; i++) {
      let c = input.charCodeAt(i)
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
        const d = input.charCodeAt(i + 1)
        if (d >= 0xdc00 && d <= 0xdfff) {
          c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00)
          i++
        }
      }
      if (c < 0x80) out.push(c)
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    }
    return new Uint8Array(out)
  }
}

class Utf8Decoder {
  readonly encoding = 'utf-8'
  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) return ''
    const b = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    let s = ''
    for (let i = 0; i < b.length; ) {
      const c = b[i++]
      let cp: number
      if (c < 0x80) cp = c
      else if (c >= 0xc0 && c < 0xe0 && i < b.length) cp = ((c & 31) << 6) | (b[i++] & 63)
      else if (c >= 0xe0 && c < 0xf0 && i + 1 < b.length) cp = ((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63)
      else if (c >= 0xf0 && i + 2 < b.length) cp = ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63)
      else cp = 0xfffd
      if (cp > 0xffff) {
        cp -= 0x10000
        s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023))
      } else s += String.fromCharCode(cp)
    }
    return s
  }
}

if (typeof g.TextEncoder === 'undefined') g.TextEncoder = Utf8Encoder
if (typeof g.TextDecoder === 'undefined') g.TextDecoder = Utf8Decoder

export { Utf8Encoder, Utf8Decoder }
