<template>
  <nav class="tabs no-print">
    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to">{{ t.label }}</RouterLink>
  </nav>
  <RouterView />
</template>

<script setup lang="ts">
const tabs = [
  { to: '/pace/vdot', label: '跑力与区间' },
  { to: '/pace/convert', label: '配速换算' },
  { to: '/pace/predict', label: '成绩预测' },
  { to: '/pace/heart', label: '心率区间' },
  { to: '/pace/band', label: '配速手环' },
]
</script>

<style scoped>
.tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 16px; padding-bottom: 2px; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tabs a {
  flex: none;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--muted);
  font-size: 0.9rem;
}
.tabs a:hover { text-decoration: none; border-color: var(--gold); }
.tabs a.router-link-active { background: var(--gold); border-color: var(--gold); color: #fff; }
</style>
