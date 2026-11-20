<template>
  <view class="site-footer no-print">
    <text class="line">计算结果仅供训练参考。有伤病史或身体不适，请以医生意见为准。</text>
    <!-- #ifdef H5 -->
    <view class="line">
      <a class="flink" href="https://zhonghcc.com">Zhonghcc</a> · © {{ year }} ·
      <a class="flink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">京ICP备20023556号-1</a>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
defineOptions({ options: { styleIsolation: 'apply-shared' } })
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer { color: var(--muted); font-size: 12px; padding: 12px 0 28px; text-align: center; }
.line { display: block; margin: 4px 0; }
.flink { color: var(--muted); text-decoration: none; }
</style>
