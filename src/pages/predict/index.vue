<template>
  <view class="col">
    <view class="card">
      <text class="h2">成绩预测</text>
      <text class="muted p">按同跑力推算其他距离的成绩，另附 Riegel 公式的结果对照。两者都假设你为目标距离做了相应训练。</text>
      <RaceInput label="已知成绩" :show-targets="false" />
      <view v-if="predictions.length" class="tbl">
        <view class="tr head"><text class="td w15">距离</text><text class="td">按跑力</text><text class="td">配速</text><text class="td">Riegel</text></view>
        <view v-for="p in predictions" :key="p.label" class="tr" :class="{ hl: p.self }">
          <text class="td w15">{{ p.label }}</text>
          <text class="td">{{ formatDuration(p.vdotSec) }}</text>
          <text class="td">{{ formatPace(p.vdotSec / (p.meters / 1000)) }}</text>
          <text class="td">{{ formatDuration(p.riegelSec) }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="h2">强弱项诊断</text>
      <text class="muted p">输入两个不同距离、时间相近的比赛成绩，比较两者的跑力，看速度和耐力哪一项是短板。</text>
      <view class="field">
        <text class="label">成绩一</text>
        <view class="race"><DistanceSelect v-model="a.meters" :min-meters="1500" /><DurationInput v-model="a.seconds" /></view>
      </view>
      <view class="field">
        <text class="label">成绩二</text>
        <view class="race"><DistanceSelect v-model="b.meters" :min-meters="1500" /><DurationInput v-model="b.seconds" /></view>
      </view>
      <template v-if="diag">
        <view class="grid3 num">
          <view class="cell"><text class="muted small">{{ distanceLabel(diag.shorter.meters) }}跑力</text><text class="cell-v">{{ diag.shorter.vdot.toFixed(1) }}</text></view>
          <view class="cell"><text class="muted small">{{ distanceLabel(diag.longer.meters) }}跑力</text><text class="cell-v">{{ diag.longer.vdot.toFixed(1) }}</text></view>
          <view class="cell"><text class="muted small">差距</text><text class="cell-v">{{ (diag.diffPct * 100).toFixed(1) }}%</text></view>
        </view>
        <text class="notice" :class="{ ok: diag.verdict === 'balanced' }">{{ diag.summary }}</text>
      </template>
      <text v-else-if="a.seconds && b.seconds" class="muted small">两个成绩的距离需要不同。</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import RaceInput from '../../components/RaceInput.vue'
import DistanceSelect from '../../components/DistanceSelect.vue'
import DurationInput from '../../components/DurationInput.vue'
import SiteFooter from '../../components/SiteFooter.vue'
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
const diag = computed(() => (a.seconds && b.seconds ? diagnose({ meters: a.meters, seconds: a.seconds }, { meters: b.meters, seconds: b.seconds }) : null))
</script>

<style scoped>
.race { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
</style>
