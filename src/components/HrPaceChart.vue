<template>
  <div ref="box">
  <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" aria-label="每分钟心率与配速曲线">
    <!-- 网格与坐标 -->
    <g class="grid">
      <line v-for="t in hrTicks" :key="'h' + t" :x1="PL" :x2="W - PR" :y1="yHr(t)" :y2="yHr(t)" />
    </g>
    <g class="axis left">
      <text v-for="t in hrTicks" :key="'ht' + t" :x="PL - 6" :y="yHr(t) + 4" text-anchor="end">{{ t }}</text>
    </g>
    <g class="axis right">
      <text v-for="t in paceTicks" :key="'pt' + t" :x="W - PR + 6" :y="yPace(t) + 4">{{ formatPace(t) }}</text>
    </g>
    <g class="axis bottom">
      <text v-for="t in minTicks" :key="'mt' + t" :x="x(t)" :y="H - 6" text-anchor="middle">{{ t }}′</text>
    </g>

    <!-- 测试窗口：第 10 分钟到终点 -->
    <rect :x="x(10)" :y="PT" :width="Math.max(0, x(windowEnd) - x(10))" :height="H - PT - PB" class="window" />
    <line :x1="x(10)" :x2="x(10)" :y1="PT" :y2="H - PB" class="marker" />
    <line :x1="x(windowEnd)" :x2="x(windowEnd)" :y1="PT" :y2="H - PB" class="marker" />
    <text :x="x(10) + 4" :y="PT + 12" class="marker-label">A</text>
    <text :x="x(windowEnd) - 4" :y="PT + 12" class="marker-label" text-anchor="end">B</text>

    <path :d="pacePath" class="pace" />
    <path :d="hrPath" class="hr" />
  </svg>
  <div class="legend small">
    <span><i class="dot hr"></i>心率（左轴）</span>
    <span><i class="dot pace"></i>每公里配速（右轴，越高越快）</span>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { MinutePoint } from '../core/aerobic'
import { formatPace } from '../core/time'

const props = defineProps<{ series: MinutePoint[]; windowEnd: number }>()

// 画布宽度跟随容器，手机上坐标文字不会被缩得太小
const box = ref<HTMLElement | null>(null)
const W = ref(680)
const H = 240
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!box.value) return
  ro = new ResizeObserver(([e]) => (W.value = Math.max(300, Math.round(e.contentRect.width))))
  ro.observe(box.value)
})
onBeforeUnmount(() => ro?.disconnect())
const PL = 40
const PR = 48
const PT = 12
const PB = 24

const maxMin = computed(() => Math.max(10, props.series.length))
const x = (m: number) => PL + ((W.value - PL - PR) * m) / maxMin.value

const hrVals = computed(() => props.series.map((p) => p.hr).filter((v): v is number => v !== null))
const hrMin = computed(() => Math.floor((Math.min(...hrVals.value, 200) - 5) / 10) * 10)
const hrMax = computed(() => Math.ceil((Math.max(...hrVals.value, 100) + 5) / 10) * 10)
const yHr = (v: number) => PT + ((H - PT - PB) * (hrMax.value - v)) / (hrMax.value - hrMin.value || 1)
const hrTicks = computed(() => {
  const out: number[] = []
  const step = hrMax.value - hrMin.value > 60 ? 20 : 10
  for (let v = hrMin.value; v <= hrMax.value; v += step) out.push(v)
  return out
})

// 配速取 5% 到 95% 分位作为纵轴范围，避免个别异常分钟把曲线压扁
const paceVals = computed(() =>
  props.series
    .map((p) => p.pace)
    .filter((v): v is number => v !== null && v < 1200)
    .sort((a, b) => a - b),
)
const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))]
const paceFast = computed(() => (paceVals.value.length ? Math.floor((q(paceVals.value, 0.05) - 15) / 15) * 15 : 240))
const paceSlow = computed(() => (paceVals.value.length ? Math.ceil((q(paceVals.value, 0.95) + 15) / 15) * 15 : 480))
const yPace = (v: number) => {
  const c = Math.min(Math.max(v, paceFast.value), paceSlow.value)
  return PT + ((H - PT - PB) * (c - paceFast.value)) / (paceSlow.value - paceFast.value || 1)
}
const paceTicks = computed(() => {
  const span = paceSlow.value - paceFast.value
  const step = span > 180 ? 60 : 30
  const out: number[] = []
  for (let v = Math.ceil(paceFast.value / step) * step; v <= paceSlow.value; v += step) out.push(v)
  return out
})

const minTicks = computed(() => {
  const step = maxMin.value > 100 || W.value < 480 ? 20 : 10
  const out: number[] = []
  for (let m = 0; m <= maxMin.value; m += step) out.push(m)
  return out
})

function path(get: (p: MinutePoint) => number | null, y: (v: number) => number) {
  let d = ''
  let pen = false
  for (const p of props.series) {
    const v = get(p)
    if (v === null) {
      pen = false
      continue
    }
    d += `${pen ? 'L' : 'M'}${x(p.minute - 0.5).toFixed(1)},${y(v).toFixed(1)}`
    pen = true
  }
  return d
}
const hrPath = computed(() => path((p) => p.hr, yHr))
const pacePath = computed(() => path((p) => p.pace, yPace))
</script>

<style scoped>
.chart { width: 100%; height: auto; display: block; }
.grid line { stroke: #efe6d4; stroke-width: 1; }
.axis text { font-size: 11px; fill: #8a7a63; }
.window { fill: rgba(183, 131, 47, 0.06); }
.marker { stroke: #b7832f; stroke-dasharray: 4 3; stroke-width: 1; }
.marker-label { font-size: 11px; fill: #8e6320; font-weight: 600; }
.hr { fill: none; stroke: #b5483b; stroke-width: 2; }
.pace { fill: none; stroke: #4f7a4a; stroke-width: 1.6; opacity: 0.85; }
.legend { display: flex; gap: 16px; color: var(--muted); margin-top: 4px; flex-wrap: wrap; }
.dot { display: inline-block; width: 10px; height: 3px; margin-right: 6px; vertical-align: middle; }
.dot.hr { background: #b5483b; }
.dot.pace { background: #4f7a4a; }
</style>
