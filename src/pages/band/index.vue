<template>
  <view class="col">
    <view class="card no-print">
      <text class="muted p">给定目标完赛时间和配速策略，生成每个分段的累计时间，贴在手腕或号码布背面，赛中对照。</text>
      <view class="field">
        <text class="label">比赛距离</text>
        <DistanceSelect v-model="meters" :min-meters="3000" />
      </view>
      <view class="field">
        <text class="label">目标完赛时间</text>
        <DurationInput v-model="target" />
      </view>
      <view class="field">
        <text class="label">分段</text>
        <view class="chips">
          <text class="chip" :class="{ active: split === 1000 }" @tap="split = 1000">每公里</text>
          <text class="chip" :class="{ active: split === 5000 }" @tap="split = 5000">每 5 公里</text>
        </view>
      </view>
      <view class="field">
        <text class="label">策略</text>
        <view class="chips">
          <text v-for="s in strategies" :key="s.value" class="chip" :class="{ active: negative === s.value }" @tap="negative = s.value">{{ s.label }}</text>
        </view>
      </view>
      <text class="muted small p">后程加速指后半程配速比前半程快一定比例，总时间不变。大多数业余跑者用匀速或后程加速 1% 到 2% 更稳妥，前半程跑太快是全马撞墙最常见的原因。</text>
      <button v-if="rows.length && canPrint" class="btn" hover-class="btn-hover" @tap="printPage">打印手环</button>
      <text v-else-if="rows.length" class="muted small">截屏保存即可，打印请用电脑打开 run.zhonghcc.com。</text>
    </view>

    <view v-if="rows.length" class="card band">
      <view class="band-head">
        <text class="bh-title">{{ distanceLabel(meters) }} · 目标 {{ formatDuration(target || 0) }}</text>
        <text class="muted small">{{ strategyLabel }}</text>
      </view>
      <view class="tbl">
        <view class="tr head"><text class="td">位置</text><text class="td">累计</text><text class="td">分段</text><text class="td">配速</text></view>
        <view v-for="r in rows" :key="r.meters" class="tr" :class="{ half: r.isHalf, finish: r.label === '终点' }">
          <text class="td">{{ r.label }}</text>
          <text class="td strong">{{ formatDuration(r.cumSec) }}</text>
          <text class="td">{{ formatDuration(r.splitSec) }}</text>
          <text class="td">{{ formatPace(r.pace) }}</text>
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
import { buildPaceBand } from '../../core/paceBand'
import { distanceLabel } from '../../core/pace'
import { formatDuration, formatPace } from '../../core/time'
import { canPrint, printPage } from '../../utils/platform'

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
  target.value && target.value > 60 ? buildPaceBand({ meters: meters.value, targetSec: target.value, splitMeters: split.value, negativeSplit: negative.value }) : [],
)
</script>

<style scoped>
.band-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.bh-title { font-weight: 600; }
.half { background: var(--gold-soft); }
.finish .td { font-weight: 700; }
.strong { font-weight: 600; }
/* #ifdef H5 */
@media print {
  .band { max-width: 62mm; font-size: 9pt; border: 1px solid #999 !important; padding: 2mm !important; }
}
/* #endif */
</style>
