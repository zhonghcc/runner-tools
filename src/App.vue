<template>
  <header class="site-header no-print">
    <div class="container bar">
      <RouterLink to="/" class="brand">
        <img src="/favicon.svg" width="26" height="26" alt="" />
        <span>跑者拾穗</span>
      </RouterLink>
      <nav>
        <RouterLink to="/pace">配速助手</RouterLink>
        <RouterLink to="/aerobic">有氧测试</RouterLink>
        <RouterLink to="/plan">课表助手</RouterLink>
      </nav>
    </div>
  </header>

  <div class="container no-print">
    <QuoteBar />
  </div>

  <main class="container">
    <RouterView />
  </main>

  <footer class="container site-footer no-print">
    <p>
      计算结果仅供训练参考。有伤病史或身体不适，请以医生意见为准。数据只保存在你的设备上，<RouterLink to="/data">导出或清除</RouterLink>。
    </p>
    <p>
      <a href="https://zhonghcc.com">Zhonghcc</a> · © {{ year }} ·
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">京ICP备20023556号-1</a>
    </p>
  </footer>
</template>

<script setup lang="ts">
import QuoteBar from './components/QuoteBar.vue'

const year = new Date().getFullYear()
</script>

<style scoped>
.site-header {
  background: rgba(251, 247, 239, 0.92);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 10;
}
.bar { display: flex; align-items: center; justify-content: space-between; height: 54px; gap: 12px; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.1rem; color: var(--text); letter-spacing: 1px; }
.brand:hover { text-decoration: none; }
nav { display: flex; gap: 4px; }
nav a { padding: 6px 10px; border-radius: 8px; color: var(--muted); font-size: 0.95rem; white-space: nowrap; }
nav a:hover { text-decoration: none; background: var(--gold-soft); }
nav a.router-link-active { color: var(--gold-deep); background: var(--gold-soft); font-weight: 600; }
.site-footer { color: var(--muted); font-size: 0.8rem; padding-top: 12px; padding-bottom: 32px; text-align: center; }
.site-footer p { margin: 4px 0; }
.site-footer a { color: var(--muted); }
@media (max-width: 520px) {
  .brand span { display: none; }
  nav a { padding: 6px 8px; font-size: 0.9rem; }
}
</style>
