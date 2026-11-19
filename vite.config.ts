import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // 离线可用：静态资源全部预缓存，开跑前在操场上没网也能算配速
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
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
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // 接口请求不能被离线缓存接管
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: {
    // 本地开发时把接口转给本机后端
    proxy: { '/api': 'http://127.0.0.1:3100' },
  },
  build: {
    sourcemap: false,
  },
})
