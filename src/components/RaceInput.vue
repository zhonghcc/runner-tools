<template>
  <view class="field">
    <text class="label">{{ label || '近期比赛成绩' }}</text>
    <view class="race">
      <DistanceSelect v-model="profile.raceMeters" :min-meters="1500" />
      <DurationInput v-model="profile.raceSeconds" />
    </view>
    <view v-if="showTargets" class="chips targets">
      <text v-for="t in TARGETS" :key="t.label" class="chip" @tap="useTarget(t)">{{ t.label }}</text>
    </view>
    <text v-if="warning" class="notice error small">{{ warning }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DistanceSelect from './DistanceSelect.vue'
import DurationInput from './DurationInput.vue'
import { profile } from '../stores/profile'
import { TARGETS, type Target } from '../data/targets'
import { checkRaceInput } from '../core/vdot'

// 近期成绩写进本地档案，各工具共用
defineOptions({ options: { styleIsolation: 'apply-shared' } })
withDefaults(defineProps<{ label?: string; showTargets?: boolean }>(), { showTargets: true })

const warning = computed(() => (profile.raceSeconds ? checkRaceInput(profile.raceMeters, profile.raceSeconds) : null))

function useTarget(t: Target) {
  profile.raceMeters = t.meters
  profile.raceSeconds = t.seconds
}
</script>

<style scoped>
.race { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.targets { margin-top: 10px; }
</style>
