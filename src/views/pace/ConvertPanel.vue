<template>
  <div class="card">
    <h2>配速换算</h2>
    <div class="chips mode">
      <button v-for="m in modes" :key="m.key" type="button" class="chip" :class="{ active: mode === m.key }" @click="mode = m.key">{{ m.label }}</button>
    </div>

    <div class="row">
      <div v-if="mode !== 'distance'" class="field">
        <span class="label">距离</span>
        <DistanceSelect v-model="meters" />
      </div>
      <div v-if="mode !== 'time'" class="field">
        <span class="label">用时</span>
        <DurationInput v-model="seconds" />
      </div>
      <div v-if="mode !== 'pace'" class="field">
        <span class="label">配速（每公里）</span>
        <DurationInput v-model="pace" :with-hours="false" />
      </div>
    </div>

    <div v-if="result" class="result num">
      <div v-for="r in result" :key="r.label" class="cell">
        <div class="muted small">{{ r.label }}</div>
        <div class="value">{{ r.value }}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>跑步机时速对照</h2>
    <div class="table-wrap">
      <table class="num">
        <thead><tr><th>时速</th><th>每公里</th><th>每英里</th><th>400 米</th><th>全马用时</th></tr></thead>
        <tbody>
          <tr v-for="k in treadmill" :key="k">
            <td>{{ k.toFixed(1) }} 公里/时</td>
            <td>{{ formatPace(paceFromKmh(k)) }}</td>
            <td>{{ formatPace(pacePerMile(paceFromKmh(k))) }}</td>
            <td>{{ formatShort(lapTime(paceFromKmh(k))) }}</td>
            <td>{{ formatDuration(timeFromPace(paceFromKmh(k), 42195)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DistanceSelect from '../../components/DistanceSelect.vue'
import DurationInput from '../../components/DurationInput.vue'
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

const treadmill = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5)

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
.result { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 8px; padding-top: 12px; border-top: 1px dashed var(--line); }
.value { font-size: 1.25rem; font-weight: 600; }
</style>
