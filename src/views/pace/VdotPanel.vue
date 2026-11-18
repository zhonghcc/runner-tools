<template>
  <div class="card">
    <h2>跑力与训练区间</h2>
    <p class="muted">输入一个近期全力跑出的比赛成绩，或点选热门目标，看看达成它需要什么样的训练配速。</p>
    <RaceInput />
  </div>

  <template v-if="vdot && !invalid">
    <div class="card">
      <div class="headline">
        <div>
          <div class="muted small">跑力值</div>
          <div class="big num">{{ vdot.toFixed(1) }}</div>
        </div>
        <div>
          <div class="muted small">比赛平均配速</div>
          <div class="big num">{{ formatPace(racePace) }}<span class="unit">/公里</span></div>
        </div>
      </div>
      <p class="muted small">
        跑力值采用 Daniels 公式（《丹尼尔斯经典跑步训练法》）。它与 RQ 跑力的刻度不同，同一个全马 3:59:59，这里约 37.9，RQ 给出 40.66，两边的数字不要直接比较。
      </p>
    </div>

    <div class="card">
      <h2>六档训练配速</h2>
      <div class="table-wrap">
        <table class="num">
          <thead>
            <tr><th>区间</th><th>每公里</th><th class="hide-xs">时速</th><th>400 米</th><th class="hide-sm">用途</th></tr>
          </thead>
          <tbody>
            <tr v-for="z in zones" :key="z.zone.code">
              <td><span class="badge">{{ z.zone.code }}</span> {{ z.zone.name }}</td>
              <td>{{ paceRange(z) }}</td>
              <td class="hide-xs">{{ speedRange(z) }}</td>
              <td>{{ lapRange(z) }}</td>
              <td class="hide-sm wrap muted small">{{ z.zone.purpose }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>同跑力的等效成绩</h2>
      <p class="muted small">理论上能跑出的成绩。业余跑者的全马通常比这里慢一些，长距离耐力需要专门积累。</p>
      <div class="table-wrap">
        <table class="num">
          <thead><tr><th>距离</th><th>成绩</th><th>平均配速</th></tr></thead>
          <tbody>
            <tr v-for="r in equivalents" :key="r.label">
              <td>{{ r.label }}</td>
              <td>{{ formatDuration(r.sec) }}</td>
              <td>{{ formatPace(r.pace) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RaceInput from '../../components/RaceInput.vue'
import { profile, profileVdot as vdot } from '../../stores/profile'
import { zonePaces, type ZonePace } from '../../core/zones'
import { raceTimeFromVdot, checkRaceInput } from '../../core/vdot'
import { DISTANCES, kmhFromPace, lapTime } from '../../core/pace'
import { formatDuration, formatPace, formatShort } from '../../core/time'

const invalid = computed(() => {
  if (!profile.raceSeconds) return true
  const w = checkRaceInput(profile.raceMeters, profile.raceSeconds)
  return w !== null && !w.includes('失真')
})
const racePace = computed(() => (profile.raceSeconds ?? 0) / (profile.raceMeters / 1000))
const zones = computed(() => (vdot.value ? zonePaces(vdot.value) : []))
const equivalents = computed(() =>
  vdot.value
    ? DISTANCES.map((d) => {
        const sec = raceTimeFromVdot(d.meters, vdot.value!)
        return { label: d.label, sec, pace: sec / (d.meters / 1000) }
      })
    : [],
)

const paceRange = (z: ZonePace) => (z.slowPace === null ? `快于 ${formatPace(z.fastPace)}` : `${formatPace(z.fastPace)} – ${formatPace(z.slowPace)}`)
const speedRange = (z: ZonePace) =>
  z.slowPace === null ? `${kmhFromPace(z.fastPace).toFixed(1)} 以上` : `${kmhFromPace(z.slowPace).toFixed(1)} – ${kmhFromPace(z.fastPace).toFixed(1)}`
const lapRange = (z: ZonePace) =>
  z.slowPace === null ? `${formatShort(lapTime(z.fastPace))} 以内` : `${formatShort(lapTime(z.fastPace))} – ${formatShort(lapTime(z.slowPace))}`
</script>

<style scoped>
.headline { display: flex; gap: 40px; flex-wrap: wrap; margin-bottom: 8px; }
.unit { font-size: 0.9rem; color: var(--muted); font-weight: 400; margin-left: 2px; }
@media (max-width: 600px) { .hide-sm { display: none; } }
@media (max-width: 420px) { .hide-xs { display: none; } }
</style>
