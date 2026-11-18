<template>
  <section class="hero">
    <h1>跑者拾穗</h1>
    <p class="muted">跑过的每一公里，都是拾起的一束穗。配速、训练区间和有氧基础测试，打开即用，不需要注册，数据只留在你的设备上。</p>
  </section>

  <section class="tools">
    <RouterLink v-for="t in tools" :key="t.to" :to="t.to" class="tool card" :class="{ soon: t.soon }">
      <div class="tool-head">
        <h2>{{ t.title }}</h2>
        <span v-if="t.soon" class="badge">筹备中</span>
      </div>
      <p class="muted">{{ t.desc }}</p>
      <ul v-if="t.items" class="items">
        <li v-for="i in t.items" :key="i">{{ i }}</li>
      </ul>
    </RouterLink>
  </section>

  <section v-if="profileVdot" class="card mine">
    <h2>我的跑力</h2>
    <p>
      <span class="big num">{{ profileVdot.toFixed(1) }}</span>
      <span class="muted">　来自 {{ distanceLabel(profile.raceMeters) }} {{ formatDuration(profile.raceSeconds!) }}</span>
    </p>
    <RouterLink to="/pace/vdot">查看训练区间</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { profile, profileVdot } from '../stores/profile'
import { distanceLabel } from '../core/pace'
import { formatDuration } from '../core/time'

const tools = [
  {
    to: '/pace',
    title: '配速助手',
    desc: '由一个近期成绩，算出你的跑力、六档训练配速和各距离等效成绩。',
    items: ['跑力与训练区间', '配速换算', '成绩预测与强弱项', '心率区间', '比赛配速手环'],
  },
  {
    to: '/aerobic',
    title: '有氧基础测试',
    desc: '上传一次 90 分钟 E 配速平稳跑的 FIT 文件，算出心率漂移，判断有氧基础是否打牢。文件在本机解析，不会上传。',
  },
  {
    to: '/plan',
    title: '课表助手',
    desc: '按目标赛事和当前能力生成分期课表，可导入手机日历。',
    soon: true,
  },
]
</script>

<style scoped>
.hero { margin: 8px 0 20px; }
.hero h1 { font-size: 1.6rem; letter-spacing: 2px; }
.tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 16px; }
.tool { color: var(--text); margin: 0; transition: transform 0.15s ease, border-color 0.15s ease; }
.tool:hover { text-decoration: none; transform: translateY(-2px); border-color: var(--gold); }
.tool.soon { opacity: 0.75; }
.tool-head { display: flex; justify-content: space-between; align-items: center; }
.items { margin: 0; padding-left: 1.1em; color: var(--muted); font-size: 0.88rem; }
.mine p { margin-bottom: 4px; }
</style>
