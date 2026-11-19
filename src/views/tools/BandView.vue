<template>
  <div class="card no-print">
    <p class="muted">给定目标完赛时间和配速策略，生成每个分段的累计时间。打印后剪成条，贴在手腕或号码布背面。</p>
    <div class="row">
      <div class="field">
        <span class="label">比赛距离</span>
        <DistanceSelect v-model="meters" :min-meters="3000" />
      </div>
      <div class="field">
        <span class="label">目标完赛时间</span>
        <DurationInput v-model="target" />
      </div>
    </div>
    <div class="row">
      <div class="field">
        <span class="label">分段</span>
        <div class="chips">
          <button type="button" class="chip" :class="{ active: split === 1000 }" @click="split = 1000">每公里</button>
          <button type="button" class="chip" :class="{ active: split === 5000 }" @click="split = 5000">每 5 公里</button>
        </div>
      </div>
      <div class="field">
        <span class="label">策略</span>
        <div class="chips">
          <button v-for="s in strategies" :key="s.value" type="button" class="chip" :class="{ active: negative === s.value }" @click="negative = s.value">{{ s.label }}</button>
        </div>
      </div>
    </div>
    <p class="muted small">后程加速指后半程配速比前半程快一定比例，总时间不变。大多数业余跑者用匀速或后程加速 1% 到 2% 更稳妥，前半程跑太快是全马撞墙最常见的原因。</p>
    <button v-if="rows.length" type="button" class="btn" @click="print">打印手环</button>
  </div>

  <div v-if="rows.length" class="card band">
    <div class="band-head">
      <strong>{{ distanceLabel(meters) }} · 目标 {{ formatDuration(target!) }}</strong>
      <span class="muted small">{{ strategyLabel }}</span>
    </div>
    <table class="num">
      <thead><tr><th>位置</th><th>累计</th><th>分段</th><th>配速</th></tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="r.meters" :class="{ half: r.isHalf, finish: r.label === '终点' }">
          <td>{{ r.label }}</td>
          <td><strong>{{ formatDuration(r.cumSec) }}</strong></td>
          <td>{{ formatDuration(r.splitSec) }}</td>
          <td>{{ formatPace(r.pace) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DistanceSelect from '../../components/DistanceSelect.vue'
import DurationInput from '../../components/DurationInput.vue'
import { buildPaceBand } from '../../core/paceBand'
import { distanceLabel } from '../../core/pace'
import { formatDuration, formatPace } from '../../core/time'

const meters = ref(42195)
const target = ref<number | null>(4 * 3600)
const split = ref(5000)
const negative = ref(0)
const strategies = [
  { label: '匀速', value: 0 },
  { label: '后程加速 1%', value: 0.01 },
  { label: '后程加速 2%', value: 0.02 },
  { label: '后程加速 3%', value: 0.03 },
]
const strategyLabel = computed(() => strategies.find((s) => s.value === negative.value)?.label ?? '')

const rows = computed(() =>
  target.value && target.value > 60
    ? buildPaceBand({ meters: meters.value, targetSec: target.value, splitMeters: split.value, negativeSplit: negative.value })
    : [],
)

const print = () => window.print()
</script>

<style scoped>

.band-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.band td, .band th { padding: 5px 6px; }
tr.half td { background: var(--gold-soft); }
tr.finish td { font-weight: 700; }
@media print {
  .band { max-width: 62mm; font-size: 9pt; border: 1px solid #999 !important; padding: 2mm !important; }
  .band td, .band th { padding: 1mm; border-bottom: 1px solid #ccc; }
}
</style>
