<template>
  <view class="dist">
    <picker mode="selector" :range="labels" :value="selectIndex" @change="onSelect">
      <view class="picker-box">{{ labels[selectIndex] }} ▾</view>
    </picker>
    <view v-if="custom" class="custom">
      <input class="inp km" type="digit" :value="customKm" @input="onCustom" />
      <text class="muted">公里</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DISTANCES } from '../core/pace'

defineOptions({ options: { styleIsolation: 'apply-shared' } })
const props = withDefaults(defineProps<{ modelValue: number; minMeters?: number }>(), { minMeters: 0 })
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const options = computed(() => DISTANCES.filter((d) => d.meters >= props.minMeters))
const labels = computed(() => [...options.value.map((d) => d.label), '自定义'])
const matchIndex = () => options.value.findIndex((d) => Math.abs(d.meters - props.modelValue) < 0.5)
const custom = ref(matchIndex() < 0)
const customKm = ref(String(+(props.modelValue / 1000).toFixed(3)))
const selectIndex = computed(() => (custom.value ? options.value.length : Math.max(0, matchIndex())))

let lastCustom: number | null = null
// 外部改了距离（如点了目标成绩）时切回下拉选项
watch(
  () => props.modelValue,
  (v) => {
    if (v === lastCustom) return
    if (options.value.some((d) => Math.abs(d.meters - v) < 0.5)) custom.value = false
  },
)

function onSelect(ev: unknown) {
  const e = ev as UniInputEvent
  const i = Number(e.detail.value)
  if (i >= options.value.length) {
    custom.value = true
    customKm.value = String(+(props.modelValue / 1000).toFixed(3))
    return
  }
  custom.value = false
  emit('update:modelValue', options.value[i].meters)
}

function onCustom(ev: unknown) {
  const e = ev as UniInputEvent
  customKm.value = String(e.detail.value)
  const km = Number(e.detail.value)
  if (Number.isFinite(km) && km > 0) {
    lastCustom = km * 1000
    emit('update:modelValue', lastCustom)
  }
}
</script>

<style scoped>
.dist { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.custom { display: flex; align-items: center; gap: 4px; }
.km { width: 80px; }
</style>
