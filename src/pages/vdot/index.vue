<template>
  <view class="col">
    <view class="card">
      <text class="muted p">输入一个近期全力跑出的比赛成绩，或点选热门目标，看看达成它需要什么样的训练配速。</text>
      <RaceInput />
    </view>

    <template v-if="vdot && !invalid">
      <view class="card">
        <view class="headline">
          <view class="hl-item">
            <text class="muted small">跑力值</text>
            <text class="big num">{{ vdot.toFixed(1) }}</text>
          </view>
          <view class="hl-item">
            <text class="muted small">比赛平均配速</text>
            <text class="big num">{{ formatPace(racePace) }}<text class="unit">/公里</text></text>
          </view>
        </view>
        <text class="muted small p">跑力值采用 Daniels 公式（《丹尼尔斯经典跑步训练法》），与 RQ 跑力的刻度不同：同一个全马 3:59:59，这里约 37.9，RQ 给出 40.66，两边的数字不要直接比较。</text>
      </view>

      <view class="card">
        <text class="h2">六档训练配速</text>
        <view class="tbl">
          <view class="tr head">
            <text class="td w15">区间</text><text class="td w15">每公里</text><text class="td">时速</text><text class="td">400 米</text>
          </view>
          <view v-for="z in rows" :key="z.code" class="tr">
            <view class="td w15"><text class="badge">{{ z.code }}</text><text>{{ z.name }}</text></view>
            <text class="td w15">{{ z.pace }}</text>
            <text class="td">{{ z.speed }}</text>
            <text class="td">{{ z.lap }}</text>
          </view>
        </view>
        <view class="purposes">
          <view v-for="z in rows" :key="z.code" class="pp">
            <text class="badge">{{ z.code }}</text><text class="muted small">{{ z.purpose }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="h2">同跑力的等效成绩</text>
        <text class="muted small p">理论上能跑出的成绩。业余跑者的全马通常比这里慢一些，长距离耐力需要专门积累。</text>
        <view class="tbl">
          <view class="tr head"><text class="td">距离</text><text class="td">成绩</text><text class="td">平均配速</text></view>
          <view v-for="r in equivalents" :key="r.label" class="tr">
            <text class="td">{{ r.label }}</text><text class="td">{{ formatDuration(r.sec) }}</text><text class="td">{{ formatPace(r.pace) }}</text>
          </view>
        </view>
      </view>
    </template>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RaceInput from '../../components/RaceInput.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { profile, profileVdot as vdot } from '../../stores/profile'
import { zonePaces } from '../../core/zones'
import { raceTimeFromVdot, checkRaceInput } from '../../core/vdot'
import { DISTANCES, kmhFromPace, lapTime } from '../../core/pace'
import { formatDuration, formatPace, formatShort } from '../../core/time'

const invalid = computed(() => {
  if (!profile.raceSeconds) return true
  const w = checkRaceInput(profile.raceMeters, profile.raceSeconds)
  return w !== null && !w.includes('失真')
})
const racePace = computed(() => (profile.raceSeconds ?? 0) / (profile.raceMeters / 1000))
const rows = computed(() =>
  vdot.value
    ? zonePaces(vdot.value).map((z) => ({
        code: z.zone.code,
        name: z.zone.name,
        purpose: z.zone.purpose,
        pace: z.slowPace === null ? `快于 ${formatPace(z.fastPace)}` : `${formatPace(z.fastPace)}–${formatPace(z.slowPace)}`,
        speed: z.slowPace === null ? `${kmhFromPace(z.fastPace).toFixed(1)}+` : `${kmhFromPace(z.slowPace).toFixed(1)}–${kmhFromPace(z.fastPace).toFixed(1)}`,
        lap: z.slowPace === null ? `${formatShort(lapTime(z.fastPace))} 内` : `${formatShort(lapTime(z.fastPace))}–${formatShort(lapTime(z.slowPace))}`,
      }))
    : [],
)
const equivalents = computed(() =>
  vdot.value
    ? DISTANCES.map((d) => {
        const sec = raceTimeFromVdot(d.meters, vdot.value!)
        return { label: d.label, sec, pace: sec / (d.meters / 1000) }
      })
    : [],
)
</script>

<style scoped>
.headline { display: flex; gap: 36px; flex-wrap: wrap; margin-bottom: 8px; }
.hl-item { display: flex; flex-direction: column; }
.purposes { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line); }
.pp { display: flex; align-items: flex-start; margin-bottom: 4px; }
</style>
