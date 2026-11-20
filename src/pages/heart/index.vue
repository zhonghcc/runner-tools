<template>
  <view class="col">
    <view class="card">
      <view class="row">
        <view class="field">
          <text class="label">年龄</text>
          <input class="inp" type="number" placeholder="用于估算" :value="str(profile.age)" @input="setNum('age', $event)" />
        </view>
        <view class="field">
          <text class="label">最大心率</text>
          <input class="inp" type="number" :placeholder="est ? `估算 ${est.tanaka}` : '实测值最好'" :value="str(profile.maxHr)" @input="setNum('maxHr', $event)" />
        </view>
        <view class="field">
          <text class="label">静息心率</text>
          <input class="inp" type="number" placeholder="晨起静卧测量" :value="str(profile.restHr)" @input="setNum('restHr', $event)" />
        </view>
      </view>
      <text v-if="est && !profile.maxHr" class="muted small p">按年龄估算：220 − 年龄 = {{ est.classic }}，Tanaka 公式 208 − 0.7 × 年龄 = {{ est.tanaka }}。公式只是人群平均值，个体差异可达 10 次以上，下方用 Tanaka 估算值计算，建议实测后填入。</text>
    </view>

    <view v-if="maxHr" class="card">
      <view class="tbl">
        <view class="tr head"><text class="td w2">区间</text><text class="td">最大心率法</text><text v-if="reserve" class="td">储备心率法</text></view>
        <view v-for="(z, i) in byMax" :key="z.zone.code" class="tr">
          <view class="td w2"><text class="badge">{{ z.zone.code }}</text><text>{{ z.zone.name }}</text><text class="muted small"> {{ pct(z.zone.lo) }}–{{ pct(z.zone.hi) }}%</text></view>
          <text class="td">{{ z.low }}–{{ z.high }}</text>
          <text v-if="reserve" class="td">{{ reserve[i].low }}–{{ reserve[i].high }}</text>
        </view>
      </view>
      <text class="muted small p top">储备心率法（Karvonen 公式）把静息心率考虑进去，体能好、静息心率低的跑者用它更准。<text v-if="profile.age">MAF 有氧心率上限（180 − 年龄）为 {{ mafHr(profile.age) }}。</text></text>
    </view>

    <view class="card">
      <text class="h3">怎样实测最大心率</text>
      <text class="muted small p">以下是常见的操场测试方法，需要身体状况良好，最好有同伴在场。心血管疾病风险人群请勿自行测试。</text>
      <view class="ol">
        <view v-for="(s, i) in steps" :key="i" class="li"><text class="n">{{ i + 1 }}.</text><text>{{ s }}</text></view>
      </view>
      <text class="muted small">在有氧基础测试里上传 FIT 文件时，也会读出那次记录的最高心率，供参考。</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { profile } from '../../stores/profile'
import { estimateMaxHr, mafHr, zonesByMax, zonesByReserve } from '../../core/heartRate'

const steps = [
  '戴好心率带或心率表，慢跑热身 10 分钟以上。',
  '在操场上跑 800 米，每趟比上一趟快一档，从轻松配速逐步加到全力，趟间慢跑 400 米恢复。',
  '最后一趟全力冲刺，冲刺结束时的心率接近最大心率。也可以在 400 米左右的陡坡上反复冲坡，直到心率不再上升。',
  '慢跑 5 分钟放松。取整次记录中的最高心率，填入上面。',
]
const str = (v: number | null) => (v === null || v === undefined ? '' : String(v))
const pct = (v: number) => Math.round(v * 100)
function setNum(key: 'age' | 'maxHr' | 'restHr', ev: unknown) {
  const e = ev as UniInputEvent
  const n = Number(e.detail.value)
  profile[key] = String(e.detail.value) === '' || !Number.isFinite(n) ? null : n
}

const est = computed(() => (profile.age && profile.age > 5 && profile.age < 100 ? estimateMaxHr(profile.age) : null))
const maxHr = computed(() => profile.maxHr || est.value?.tanaka || null)
const byMax = computed(() => (maxHr.value ? zonesByMax(maxHr.value) : []))
const reserve = computed(() => (maxHr.value && profile.restHr && profile.restHr < maxHr.value ? zonesByReserve(maxHr.value, profile.restHr) : null))
</script>

<style scoped>
.top { margin-top: 10px; }
</style>
