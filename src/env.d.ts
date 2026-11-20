/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// FIT SDK 只按需引入解码器，深层路径没有类型声明
declare module '@garmin/fitsdk/src/decoder.js' {
  const Decoder: any
  export default Decoder
}
declare module '@garmin/fitsdk/src/stream.js' {
  const Stream: any
  export default Stream
}

// 小程序全局对象，只在 #ifdef MP-WEIXIN 分支里使用
declare const wx: any

// uni 组件的输入事件：值在 detail.value 里
interface UniInputEvent {
  detail: { value: string | number }
}
