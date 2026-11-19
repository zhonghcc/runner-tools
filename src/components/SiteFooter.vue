<template>
  <footer class="site-footer no-print">
    <p>计算结果仅供训练参考。有伤病史或身体不适，请以医生意见为准。数据只保存在你的设备上。</p>
    <p>
      <a href="https://zhonghcc.com">Zhonghcc</a> · © {{ year }} ·
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">京ICP备20023556号-1</a>
    </p>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer { color: var(--muted); font-size: 0.78rem; padding: 12px 0 32px; text-align: center; }
.site-footer p { margin: 4px 0; }
.site-footer a { color: var(--muted); }
</style>
