<template>
  <div class="hms">
    <template v-if="withHours">
      <input type="number" inputmode="numeric" min="0" placeholder="时" :value="parts.h" @input="set('h', $event)" aria-label="时" />
      <span>:</span>
    </template>
    <input type="number" inputmode="numeric" min="0" max="59" placeholder="分" :value="parts.m" @input="set('m', $event)" aria-label="分" />
    <span>:</span>
    <input type="number" inputmode="numeric" min="0" max="59" placeholder="秒" :value="parts.s" @input="set('s', $event)" aria-label="秒" />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { splitSeconds } from '../core/time'

// 时分秒三格输入；手机数字键盘没有冒号，分开填更顺手
const props = withDefaults(defineProps<{ modelValue: number | null; withHours?: boolean }>(), { withHours: true })
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

const parts = reactive<{ h: string; m: string; s: string }>({ h: '', m: '', s: '' })

function fromValue(v: number | null) {
  if (v === null || !Number.isFinite(v)) return
  const t = splitSeconds(v)
  const h = props.withHours ? t.h : 0
  const m = props.withHours ? t.m : t.h * 60 + t.m
  parts.h = props.withHours ? String(h) : ''
  parts.m = String(m)
  parts.s = String(t.s)
}
fromValue(props.modelValue)

const n = (x: string) => (x === '' ? 0 : Number(x))
const totalOfParts = () => {
  const total = n(parts.h) * 3600 + n(parts.m) * 60 + n(parts.s)
  return Number.isFinite(total) && total > 0 ? total : null
}

// 外部改值（如点了目标成绩）时同步到三格；值与当前输入一致时不动，避免打断输入
watch(
  () => props.modelValue,
  (v) => {
    if (v === totalOfParts()) return
    if (v === null) parts.h = parts.m = parts.s = ''
    else fromValue(v)
  },
)

function set(key: 'h' | 'm' | 's', e: Event) {
  parts[key] = (e.target as HTMLInputElement).value
  emit('update:modelValue', totalOfParts())
}
</script>

<style scoped>
.hms { display: flex; align-items: center; gap: 4px; }
.hms input { width: 4.2em; text-align: center; }
.hms span { color: var(--muted); }
</style>
