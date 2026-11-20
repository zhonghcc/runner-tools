<template>
  <view class="chart-box">
    <!-- #ifdef H5 -->
    <view class="svg" v-html="svg"></view>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas type="2d" id="hrpace" class="cv" :style="{ height: H + 'px' }"></canvas>
    <!-- #endif -->
    <view class="legend small">
      <text><text class="dot hr"></text>心率（左轴）</text>
      <text><text class="dot pace"></text>每公里配速（右轴，越高越快）</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, nextTick } from 'vue'
import type { MinutePoint } from '../core/aerobic'
import { buildChart, chartToSvg, drawChart } from '../core/chart'

defineOptions({ options: { styleIsolation: 'apply-shared' } })
const props = defineProps<{ series: MinutePoint[]; windowEnd: number }>()

const H = 220
const width = ref(340)
const model = computed(() => buildChart(props.series, props.windowEnd, width.value, H))
const svg = computed(() => chartToSvg(model.value))

const instance = getCurrentInstance()

function measure(): Promise<void> {
  return new Promise((resolve) => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy)
      .select('.chart-box')
      .boundingClientRect((r) => {
        const w = (r as UniApp.NodeInfo | null)?.width
        if (w) width.value = Math.round(w)
        resolve()
      })
      .exec()
  })
}

function paint() {
  // #ifdef MP-WEIXIN
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select('#hrpace')
    .fields({ node: true, size: true }, () => {})
    .exec((res) => {
      const node = res?.[0]?.node
      if (!node) return
      const dpr = uni.getWindowInfo().pixelRatio || 2
      node.width = width.value * dpr
      node.height = H * dpr
      const ctx = node.getContext('2d')
      ctx.scale(dpr, dpr)
      drawChart(ctx, model.value)
    })
  // #endif
}

onMounted(async () => {
  await nextTick()
  await measure()
  paint()
})
watch(model, () => paint())
</script>

<style scoped>
.chart-box { width: 100%; }
.cv { width: 100%; display: block; }
.legend { display: flex; flex-wrap: wrap; gap: 14px; color: var(--muted); margin-top: 4px; }
.dot { display: inline-block; width: 10px; height: 3px; margin-right: 6px; vertical-align: middle; }
.dot.hr { background: #b5483b; }
.dot.pace { background: #4f7a4a; }
</style>
