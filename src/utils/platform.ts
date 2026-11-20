// 两端差异集中在这里：选文件、导出文件、确认框、打印。页面只调这些函数，不直接写平台判断

export interface PickedFile {
  name: string
  size: number
  bytes: Uint8Array
}

export class PickCancelled extends Error {}

/** 选一个本地文件并读成字节。网页用文件选择框；小程序只能从微信聊天记录里选 */
export function pickFile(extensions: string[]): Promise<PickedFile> {
  // #ifdef H5
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = extensions.map((e) => '.' + e).join(',')
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return reject(new PickCancelled())
      resolve(await readBrowserFile(f))
    }
    input.click()
  })
  // #endif
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: extensions.flatMap((e) => [e, e.toUpperCase()]),
      success(res: { tempFiles: { name: string; size: number; path: string }[] }) {
        const f = res.tempFiles[0]
        wx.getFileSystemManager().readFile({
          filePath: f.path,
          success: (r: { data: ArrayBuffer }) => resolve({ name: f.name, size: f.size, bytes: new Uint8Array(r.data as ArrayBuffer) }),
          fail: () => reject(new Error('读取文件失败，请重试')),
        })
      },
      fail(err: { errMsg?: string }) {
        if (String(err?.errMsg || '').includes('cancel')) reject(new PickCancelled())
        else reject(new Error('选择文件失败，请重试'))
      },
    })
  })
  // #endif
}

// #ifdef H5
export async function readBrowserFile(f: File): Promise<PickedFile> {
  return { name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) }
}
// #endif

/** 导出文本文件。网页直接下载；小程序写入临时文件后发到微信聊天里 */
export function saveTextFile(fileName: string, text: string): Promise<void> {
  // #ifdef H5
  const blob = new Blob([text], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return Promise.resolve()
  // #endif
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    const path = `${wx.env.USER_DATA_PATH}/${fileName}`
    wx.getFileSystemManager().writeFile({
      filePath: path,
      data: text,
      encoding: 'utf8',
      success() {
        wx.shareFileMessage({ filePath: path, fileName, success: () => resolve(), fail: () => resolve() })
      },
      fail: () => reject(new Error('导出失败，请重试')),
    })
  })
  // #endif
}

export function confirmModal(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({ title, content, success: (r) => resolve(!!r.confirm), fail: () => resolve(false) })
  })
}

export function go(url: string) {
  uni.navigateTo({ url, fail: () => uni.reLaunch({ url }) })
}

export const canPrint = (() => {
  let v = false
  // #ifdef H5
  v = true
  // #endif
  return v
})()

export function printPage() {
  // #ifdef H5
  window.print()
  // #endif
}

export const isMiniProgram = (() => {
  let v = false
  // #ifdef MP-WEIXIN
  v = true
  // #endif
  return v
})()
