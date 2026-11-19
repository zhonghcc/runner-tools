<template>
  <div class="home">
    <section class="hero">
      <div class="intro">
        <div class="brand">
          <img src="/favicon.svg" width="44" height="44" alt="" />
          <h1>跑者拾穗</h1>
        </div>
        <p class="lead">跑过的每一公里，都是拾起的一束穗。</p>
        <p class="muted">配速、训练区间和有氧基础测试，打开即用，不需要注册，数据只留在你的设备上。</p>
        <RouterLink v-if="profileVdot" to="/vdot" class="mine">
          <span class="muted small">我的跑力</span>
          <strong class="num">{{ profileVdot.toFixed(1) }}</strong>
          <span class="muted small">{{ distanceLabel(profile.raceMeters) }} {{ formatDuration(profile.raceSeconds!) }}</span>
        </RouterLink>
      </div>
      <div class="quote-slot"><QuoteBar /></div>
    </section>

    <section class="grid" aria-label="工具">
      <RouterLink v-for="t in TOOLS" :key="t.path" :to="t.path" class="tile" :class="{ soon: t.soon }">
        <span class="icon"><ToolIcon :name="t.icon" :size="26" /></span>
        <span class="text">
          <span class="title">{{ t.title }}<span v-if="t.soon" class="badge">筹备中</span></span>
          <span class="desc">{{ t.desc }}</span>
        </span>
      </RouterLink>
    </section>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import QuoteBar from '../components/QuoteBar.vue'
import ToolIcon from '../components/ToolIcon.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { TOOLS } from '../data/tools'
import { profile, profileVdot } from '../stores/profile'
import { distanceLabel } from '../core/pace'
import { formatDuration } from '../core/time'
</script>

<style scoped>
/* 主页自适应：手机竖屏两列卡片，平板三列，PC 四列；PC 上标题与名言左右并排 */
.home { max-width: 1120px; margin: 0 auto; padding: 0 16px; }

.hero { display: grid; gap: 4px 32px; padding: 28px 0 12px; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand h1 { margin: 0; font-size: 1.7rem; letter-spacing: 3px; }
.lead { font-family: 'Songti SC', 'STSong', 'Noto Serif SC', serif; font-size: 1.1rem; margin: 12px 0 4px; }
.mine {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--text);
}
.mine strong { font-size: 1.2rem; color: var(--gold-deep); }
.mine:hover { text-decoration: none; border-color: var(--gold); }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 8px 0 20px; }
.tile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  color: var(--text);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.tile:hover { text-decoration: none; transform: translateY(-2px); border-color: var(--gold); box-shadow: 0 6px 20px rgba(183, 131, 47, 0.14); }
.tile.soon { opacity: 0.7; }
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gold-soft);
  color: var(--gold-deep);
}
.text { display: flex; flex-direction: column; gap: 4px; }
.title { font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.desc { color: var(--muted); font-size: 0.82rem; line-height: 1.5; }

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .tile { padding: 20px; }
}
@media (min-width: 960px) {
  .hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; padding: 56px 0 28px; }
  .brand h1 { font-size: 2.1rem; }
  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .tile { flex-direction: column; min-height: 168px; padding: 22px; }
  .title { font-size: 1.08rem; }
  .desc { font-size: 0.88rem; }
}
</style>
