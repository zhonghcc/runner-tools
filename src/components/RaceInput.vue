<template>
  <div class="field">
    <span class="label">{{ label ?? '近期比赛成绩' }}</span>
    <div class="race">
      <DistanceSelect v-model="profile.raceMeters" :min-meters="1500" />
      <DurationInput v-model="profile.raceSeconds" />
    </div>
    <div v-if="showTargets" class="chips targets">
      <button v-for="t in TARGETS" :key="t.label" type="button" class="chip" @click="useTarget(t)">{{ t.label }}</button>
    </div>
    <p v-if="warning" class="notice error small">{{ warning }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DistanceSelect from './DistanceSelect.vue'
import DurationInput from './DurationInput.vue'
import { profile } from '../stores/profile'
import { TARGETS, type Target } from '../data/targets'
import { checkRaceInput } from '../core/vdot'

// 近期成绩写进本地档案，配速助手各页和有氧测试共用
withDefaults(defineProps<{ label?: string; showTargets?: boolean }>(), { showTargets: true })

const warning = computed(() => (profile.raceSeconds ? checkRaceInput(profile.raceMeters, profile.raceSeconds) : null))

function useTarget(t: Target) {
  profile.raceMeters = t.meters
  profile.raceSeconds = t.seconds
}
</script>

<style scoped>
.race { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.targets { margin-top: 8px; }
</style>
