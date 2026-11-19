<template>
  <div class="card">
    <h2>成绩预测</h2>
    <p class="muted">按同跑力推算其他距离的成绩，另附 Riegel 公式的结果对照。两者都假设你为目标距离做了相应训练。</p>
    <RaceInput label="已知成绩" :show-targets="false" />
    <div v-if="predictions.length" class="table-wrap">
      <table class="num">
        <thead><tr><th>距离</th><th>按跑力</th><th>配速</th><th>Riegel 公式</th></tr></thead>
        <tbody>
          <tr v-for="p in predictions" :key="p.label" :class="{ self: p.self }">
            <td>{{ p.label }}</td>
            <td>{{ formatDuration(p.vdotSec) }}</td>
            <td>{{ formatPace(p.vdotSec / (p.meters / 1000)) }}</td>
            <td>{{ formatDuration(p.riegelSec) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <h2>强弱项诊断</h2>
    <p class="muted">输入两个不同距离、时间相近的比赛成绩，比较两者的跑力，看速度和耐力哪一项是短板。</p>
    <div class="row">
      <div class="field">
        <span class="label">成绩一</span>
        <div class="race">
          <DistanceSelect v-model="a.meters" :min-meters="1500" />
          <DurationInput v-model="a.seconds" />
        </div>
      </div>
      <div class="field">
        <span class="label">成绩二</span>
        <div class="race">
          <DistanceSelect v-model="b.meters" :min-meters="1500" />
          <DurationInput v-model="b.seconds" />
        </div>
      </div>
    </div>
    <template v-if="diag">
      <div class="duo num">
        <div>
          <div class="muted small">{{ distanceLabel(diag.shorter.meters) }}的跑力</div>
          <div class="big">{{ diag.shorter.vdot.toFixed(1) }}</div>
        </div>
        <div>
          <div class="muted small">{{ distanceLabel(diag.longer.meters) }}的跑力</div>
          <div class="big">{{ diag.longer.vdot.toFixed(1) }}</div>
        </div>
        <div>
          <div class="muted small">差距</div>
          <div class="big">{{ (diag.diffPct * 100).toFixed(1) }}%</div>
        </div>
      </div>
      <p class="notice" :class="{ ok: diag.verdict === 'balanced' }">{{ diag.summary }}</p>
    </template>
    <p v-else-if="a.seconds && b.seconds" class="muted small">两个成绩的距离需要不同。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import RaceInput from '../../components/RaceInput.vue'
import DistanceSelect from '../../components/DistanceSelect.vue'
import DurationInput from '../../components/DurationInput.vue'
import { profile, profileVdot } from '../../stores/profile'
import { raceTimeFromVdot } from '../../core/vdot'
import { DISTANCES, distanceLabel, riegel } from '../../core/pace'
import { diagnose } from '../../core/diagnosis'
import { formatDuration, formatPace } from '../../core/time'

const predictions = computed(() => {
  const v = profileVdot.value
  if (!v || !profile.raceSeconds) return []
  return DISTANCES.map((d) => ({
    label: d.label,
    meters: d.meters,
    self: Math.abs(d.meters - profile.raceMeters) < 0.5,
    vdotSec: raceTimeFromVdot(d.meters, v),
    riegelSec: riegel(profile.raceMeters, profile.raceSeconds!, d.meters),
  }))
})

const a = reactive<{ meters: number; seconds: number | null }>({ meters: 10000, seconds: null })
const b = reactive<{ meters: number; seconds: number | null }>({ meters: 21097.5, seconds: null })
const diag = computed(() =>
  a.seconds && b.seconds ? diagnose({ meters: a.meters, seconds: a.seconds }, { meters: b.meters, seconds: b.seconds }) : null,
)
</script>

<style scoped>
.race { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
tr.self td { color: var(--gold-deep); font-weight: 600; }
.duo { display: flex; gap: 32px; flex-wrap: wrap; margin: 8px 0; }
</style>
