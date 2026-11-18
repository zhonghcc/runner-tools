<template>
  <div class="dist">
    <select :value="selectValue" @change="onSelect">
      <option v-for="d in options" :key="d.key" :value="d.key">{{ d.label }}</option>
      <option value="custom">自定义</option>
    </select>
    <div v-if="custom" class="custom">
      <input type="number" inputmode="decimal" min="0.1" step="0.1" :value="customKm" @input="onCustom" aria-label="自定义距离" />
      <span>公里</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DISTANCES } from '../core/pace'

const props = withDefaults(defineProps<{ modelValue: number; minMeters?: number }>(), { minMeters: 0 })
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const options = computed(() => DISTANCES.filter((d) => d.meters >= props.minMeters))
const matched = computed(() => options.value.find((d) => Math.abs(d.meters - props.modelValue) < 0.5))
const custom = ref(!matched.value)
const customKm = ref(+(props.modelValue / 1000).toFixed(3))
const selectValue = computed(() => (custom.value ? 'custom' : (matched.value?.key ?? 'custom')))

let lastCustom: number | null = null

// 外部改了距离（如点了目标成绩）时切回下拉选项
watch(
  () => props.modelValue,
  (v) => {
    if (v === lastCustom) return // 自定义输入框自己发出的值，不切换
    if (options.value.some((d) => Math.abs(d.meters - v) < 0.5)) custom.value = false
  },
)

function onSelect(e: Event) {
  const key = (e.target as HTMLSelectElement).value
  if (key === 'custom') {
    custom.value = true
    customKm.value = +(props.modelValue / 1000).toFixed(3)
    return
  }
  custom.value = false
  const d = DISTANCES.find((x) => x.key === key)
  if (d) emit('update:modelValue', d.meters)
}

function onCustom(e: Event) {
  const km = Number((e.target as HTMLInputElement).value)
  customKm.value = km
  if (Number.isFinite(km) && km > 0) {
    lastCustom = km * 1000
    emit('update:modelValue', lastCustom)
  }
}
</script>

<style scoped>
.dist { display: flex; gap: 8px; align-items: center; }
.custom { display: flex; align-items: center; gap: 4px; }
.custom input { width: 6em; }
.custom span { color: var(--muted); white-space: nowrap; }
</style>
