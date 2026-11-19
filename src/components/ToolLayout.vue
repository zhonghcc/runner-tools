<template>
  <div class="tool-page">
    <header class="tool-bar no-print">
      <RouterLink to="/" class="back" aria-label="返回跑者拾穗主页">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        <img src="/favicon.svg" width="22" height="22" alt="" />
      </RouterLink>
      <h1>{{ title }}</h1>
      <span class="spacer"></span>
    </header>

    <div class="tool-body">
      <main class="tool-main">
        <slot />
      </main>
      <SiteFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import SiteFooter from './SiteFooter.vue'

// 功能页按手机竖屏设计：单栏，最宽 520px；在 PC 上居中显示
defineProps<{ title: string }>()
</script>

<style scoped>
.tool-page { min-height: 100vh; }
.tool-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  align-items: center;
  height: 52px;
  max-width: 520px;
  margin: 0 auto;
  padding: 0 8px;
  background: rgba(251, 247, 239, 0.94);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
}
.back { display: flex; align-items: center; gap: 2px; color: var(--gold-deep); padding: 6px 4px; border-radius: 8px; }
.back:hover { background: var(--gold-soft); text-decoration: none; }
h1 { margin: 0; text-align: center; font-size: 1.05rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tool-body { max-width: 520px; margin: 0 auto; padding: 14px 14px 0; }
@media (min-width: 560px) {
  /* PC 上给单栏一个浅色边界，像一张竖放的纸 */
  .tool-page { background: linear-gradient(90deg, #f4ede0 0, var(--bg) 18%, var(--bg) 82%, #f4ede0 100%); }
}
</style>
