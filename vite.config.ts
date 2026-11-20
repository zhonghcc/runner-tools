import { defineConfig, type Plugin } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { VitePWA } from 'vite-plugin-pwa'

const platform = process.env.UNI_PLATFORM || 'h5'

// FIT SDK 的位流读取用了 BigInt 字面量（1n、0n），小程序构建会把代码降级到 ES2015，
// esbuild 不能降级这种字面量，这里换成等价的 BigInt(…) 调用
function bigintLiterals(): Plugin {
  return {
    name: 'fitsdk-bigint-literals',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@garmin/fitsdk')) return null
      const out = code.replace(/\b(0x[0-9a-fA-F]+|\d+)n\b/g, 'BigInt("$1")')
      return out === code ? null : { code: out, map: null }
    },
  }
}

const plugins: Plugin[] = [bigintLiterals(), ...(uni() as unknown as Plugin[])]

// 网页端保留离线可用：静态资源预缓存，开跑前在操场上没网也能算配速
if (platform === 'h5') {
  plugins.push(
    ...(VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: '跑者拾穗',
        short_name: '跑者拾穗',
        description: '配速、训练区间与有氧基础测试',
        lang: 'zh-CN',
        theme_color: '#B7832F',
        background_color: '#FBF7EF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/static/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/static/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/static/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // 接口请求不能被离线缓存接管
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }) as Plugin[]),
  )
}

export default defineConfig({
  plugins,
  server: {
    // 本地开发时把接口转给本机后端
    proxy: { '/api': 'http://127.0.0.1:3100' },
  },
  build: {
    sourcemap: false,
  },
})
