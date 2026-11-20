<template>
  <view class="hms">
    <template v-if="withHours">
      <input class="inp cell" type="number" placeholder="时" :value="parts.h" @input="set('h', $event)" />
      <text class="sep">:</text>
    </template>
    <input class="inp cell" type="number" placeholder="分" :value="parts.m" @input="set('m', $event)" />
    <text class="sep">:</text>
    <input class="inp cell" type="number" placeholder="秒" :value="parts.s" @input="set('s', $event)" />
  </view>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { splitSeconds } from '../core/time'

// 时分秒三格输入；手机数字键盘没有冒号，分开填更顺手
defineOptions({ options: { styleIsolation: 'apply-shared' } })
const props = withDefaults(defineProps<{ modelValue: number | null; withHours?: boolean }>(), { withHours: true })
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

const parts = reactive({ h: '', m: '', s: '' })

function fromValue(v: number | null) {
  if (v === null || !Number.isFinite(v)) return
  const t = splitSeconds(v)
  parts.h = props.withHours ? String(t.h) : ''
  parts.m = String(props.withHours ? t.m : t.h * 60 + t.m)
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

function set(key: 'h' | 'm' | 's', ev: unknown) {
  const e = ev as UniInputEvent
  parts[key] = String(String(e.detail.value ?? '')).replace(/[^0-9]/g, '')
  emit('update:modelValue', totalOfParts())
}
</script>

<style scoped>
.hms { display: flex; align-items: center; }
.cell { width: 56px; text-align: center; padding: 0 4px; }
.sep { color: var(--muted); margin: 0 4px; }
</style>
