<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS[name]" />
</template>

<script setup lang="ts">
import type { IconName } from '../data/tools'

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 24 })

// 线性图标，内容固定，不含用户输入
const ICONS: Record<IconName, string> = {
  vdot: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.3"/>',
  aerobic: '<path d="M3 12h4l2.2-5.5L13 18l2.4-6H21"/>',
  convert: '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
  predict: '<path d="M4 18l5.5-6 4 4L20 8"/><path d="M15 8h5v5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  band: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 8h4M10 12h4M10 16h4"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M8.5 14.5l2 2 4-4"/>',
  data: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
}
</script>
