<template>
  <view class="col">
    <view class="card">
      <view class="chips mode">
        <text v-for="m in modes" :key="m.key" class="chip" :class="{ active: mode === m.key }" @tap="mode = m.key">{{ m.label }}</text>
      </view>
      <view v-if="mode !== 'distance'" class="field">
        <text class="label">距离</text>
        <DistanceSelect v-model="meters" />
      </view>
      <view v-if="mode !== 'time'" class="field">
        <text class="label">用时</text>
        <DurationInput v-model="seconds" />
      </view>
      <view v-if="mode !== 'pace'" class="field">
        <text class="label">配速（每公里）</text>
        <DurationInput v-model="pace" :with-hours="false" />
      </view>

      <view v-if="result" class="grid3 result num">
        <view v-for="r in result" :key="r.label" class="cell">
          <text class="muted small">{{ r.label }}</text>
          <text class="cell-v">{{ r.value }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="h2">跑步机时速对照</text>
      <view class="tbl">
        <view class="tr head"><text class="td">公里/时</text><text class="td">每公里</text><text class="td">每英里</text><text class="td">全马</text></view>
        <view v-for="r in treadmill" :key="r.kmh" class="tr">
          <text class="td">{{ r.kmh }}</text><text class="td">{{ r.km }}</text><text class="td">{{ r.mile }}</text><text class="td">{{ r.full }}</text>
        </view>
      </view>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DistanceSelect from '../../components/DistanceSelect.vue'
import DurationInput from '../../components/DurationInput.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { kmhFromPace, lapTime, paceFromKmh, paceFromTime, pacePerMile, timeFromPace } from '../../core/pace'
import { formatDuration, formatPace, formatShort } from '../../core/time'

type Mode = 'pace' | 'time' | 'distance'
const modes: { key: Mode; label: string }[] = [
  { key: 'pace', label: '求配速' },
  { key: 'time', label: '求完赛时间' },
  { key: 'distance', label: '求距离' },
]
const mode = ref<Mode>('pace')
const meters = ref(10000)
const seconds = ref<number | null>(null)
const pace = ref<number | null>(null)

const treadmill = Array.from({ length: 25 }, (_, i) => {
  const k = 8 + i * 0.5
  const p = paceFromKmh(k)
  return { kmh: k.toFixed(1), km: formatPace(p), mile: formatPace(pacePerMile(p)), full: formatDuration(timeFromPace(p, 42195)) }
})

const result = computed(() => {
  let p: number | null = null
  let t: number | null = null
  let d: number | null = null
  if (mode.value === 'pace' && seconds.value) {
    p = paceFromTime(seconds.value, meters.value)
    t = seconds.value
    d = meters.value
  } else if (mode.value === 'time' && pace.value) {
    p = pace.value
    t = timeFromPace(pace.value, meters.value)
    d = meters.value
  } else if (mode.value === 'distance' && pace.value && seconds.value) {
    p = pace.value
    t = seconds.value
    d = (seconds.value / pace.value) * 1000
  }
  if (!p || !t || !d) return null
  return [
    { label: '每公里配速', value: formatPace(p) },
    { label: '每英里配速', value: formatPace(pacePerMile(p)) },
    { label: '时速', value: `${kmhFromPace(p).toFixed(2)} 公里/时` },
    { label: '400 米单圈', value: formatShort(lapTime(p)) },
    { label: '用时', value: formatDuration(t) },
    { label: '距离', value: `${(d / 1000).toFixed(2)} 公里` },
  ]
})
</script>

<style scoped>
.mode { margin-bottom: 14px; }
.result { margin-top: 6px; padding-top: 12px; border-top: 1px dashed var(--line); }
</style>
