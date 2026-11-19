<template>
  <div class="home-page">
    <div class="home">
      <section class="hero">
        <div class="intro">
          <div class="brand">
            <img src="/favicon.svg" width="44" height="44" alt="" />
            <h1>跑者拾穗</h1>
            <RouterLink v-if="auth.checked" to="/login" class="account">{{ auth.user ? displayName(auth.user) : '微信登录' }}</RouterLink>
          </div>
          <p class="lead">跑过的每一公里，都是拾起的一束穗。</p>
          <p class="sub">配速、训练区间和有氧基础测试，打开即用，不需要注册，数据只留在你的设备上。</p>
          <RouterLink v-if="profileVdot" to="/vdot" class="mine">
            <span class="small">我的跑力</span>
            <strong class="num">{{ profileVdot.toFixed(1) }}</strong>
            <span class="small">{{ distanceLabel(profile.raceMeters) }} {{ formatDuration(profile.raceSeconds!) }}</span>
          </RouterLink>
        </div>
        <div class="quote-slot"><QuoteBar /></div>
      </section>

      <section ref="grid" class="grid" aria-label="工具" @pointermove="onMove" @pointerleave="onLeave">
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
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import QuoteBar from '../components/QuoteBar.vue'
import ToolIcon from '../components/ToolIcon.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { TOOLS } from '../data/tools'
import { auth, displayName } from '../stores/auth'
import { profile, profileVdot } from '../stores/profile'
import { distanceLabel } from '../core/pace'
import { formatDuration } from '../core/time'

// 主页在 PC 上用深色背景；给根元素加标记，让页面滚动到边缘时露出的底色也是深色
onMounted(() => document.documentElement.classList.add('home-dark'))
onBeforeUnmount(() => document.documentElement.classList.remove('home-dark'))

// 照明效果：鼠标在卡片区移动时，把光源位置换算成每张卡片内的坐标写进 CSS 变量。
// 光源跟随整个网格而不是单张卡片，所以相邻卡片的边框也会被同一束光照亮
const grid = ref<HTMLElement | null>(null)
let frame = 0
function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !grid.value) return
  cancelAnimationFrame(frame)
  const { clientX, clientY } = e
  frame = requestAnimationFrame(() => {
    grid.value?.querySelectorAll<HTMLElement>('.tile').forEach((el) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${clientX - r.left}px`)
      el.style.setProperty('--my', `${clientY - r.top}px`)
    })
    grid.value?.classList.add('lit')
  })
}
function onLeave() {
  cancelAnimationFrame(frame)
  grid.value?.classList.remove('lit')
}
</script>

<style scoped>
/* 手机与平板：浅色，两列或三列卡片 */
.home { max-width: 1120px; margin: 0 auto; padding: 0 16px; }

.hero { display: grid; gap: 4px 32px; padding: 28px 0 12px; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand h1 { margin: 0; font-size: 1.7rem; letter-spacing: 3px; }
.account {
  margin-left: auto;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--gold-deep);
  font-size: 0.88rem;
  white-space: nowrap;
}
.account:hover { text-decoration: none; border-color: var(--gold); }
.lead { font-family: 'Songti SC', 'STSong', 'Noto Serif SC', serif; font-size: 1.1rem; margin: 12px 0 4px; }
.sub { color: var(--muted); font-size: 0.9rem; }
.mine {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--muted);
}
.mine strong { font-size: 1.2rem; color: var(--gold-deep); }
.mine:hover { text-decoration: none; border-color: var(--gold); }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 8px 0 20px; }
.tile {
  position: relative;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gold-soft);
  color: var(--gold-deep);
}
.text { position: relative; display: flex; flex-direction: column; gap: 4px; }
.title { font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.desc { color: var(--muted); font-size: 0.82rem; line-height: 1.5; }

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .tile { padding: 20px; }
}

/* PC：深色背景，四列卡片，鼠标照明 */
@media (min-width: 960px) {
  .home-page {
    --ink: #0d0b08;
    --glow: 232, 180, 90; /* 麦穗金，rgb 分量 */
    min-height: 100vh;
    color: #efe6d4;
    background:
      radial-gradient(900px 520px at 12% -8%, rgba(var(--glow), 0.16), transparent 60%),
      radial-gradient(760px 520px at 100% 10%, rgba(196, 98, 52, 0.10), transparent 62%),
      radial-gradient(1000px 600px at 50% 120%, rgba(var(--glow), 0.08), transparent 60%),
      var(--ink);
    position: relative;
    overflow: hidden;
  }
  /* 细网格，越往下越淡 */
  .home-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%);
    pointer-events: none;
  }
  .home { position: relative; }

  .hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; padding: 64px 0 36px; }
  .brand h1 {
    font-size: 2.4rem;
    background: linear-gradient(100deg, #fff4dc 0%, #e8b45a 55%, #c98a2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .brand img { filter: drop-shadow(0 0 18px rgba(var(--glow), 0.45)); }
  .lead { color: #f3e7cf; font-size: 1.2rem; }
  .sub { color: #a89a82; }
  .mine { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.10); color: #a89a82; }
  .mine strong { color: #e8b45a; }
  .mine:hover { border-color: rgba(var(--glow), 0.6); }
  .account { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.12); color: #e8b45a; }
  .account:hover { border-color: rgba(var(--glow), 0.6); }

  .quote-slot :deep(.quote) {
    background: linear-gradient(135deg, rgba(var(--glow), 0.12), rgba(255, 255, 255, 0.03));
    border-color: rgba(var(--glow), 0.25);
    backdrop-filter: blur(4px);
  }
  .quote-slot :deep(blockquote) { color: #f3e7cf; }
  .quote-slot :deep(figcaption) { color: #a89a82; }
  .quote-slot :deep(.swap) { color: #e8b45a; }

  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
  .tile {
    min-height: 176px;
    padding: 24px;
    color: #efe6d4;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015));
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    isolation: isolate;
  }
  /* 卡片内部的柔光，只在鼠标停在这张卡片上时出现 */
  .tile::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--glow), 0.26), transparent 65%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  /* 边框高光：同一束光扫过网格，相邻卡片的边框也会亮 */
  .tile::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: radial-gradient(440px circle at var(--mx, -999px) var(--my, -999px), rgba(var(--glow), 0.95), transparent 60%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }
  .grid.lit .tile::after { opacity: 1; }
  .tile:hover::before { opacity: 1; }
  .tile:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 40px rgba(var(--glow), 0.10);
  }
  .tile.soon { opacity: 0.55; }
  .icon {
    background: rgba(var(--glow), 0.12);
    color: #e8b45a;
    box-shadow: 0 0 0 1px rgba(var(--glow), 0.18) inset;
    transition: box-shadow 0.25s ease, background 0.25s ease;
  }
  .tile:hover .icon { background: rgba(var(--glow), 0.22); box-shadow: 0 0 0 1px rgba(var(--glow), 0.4) inset, 0 0 24px rgba(var(--glow), 0.35); }
  .title { font-size: 1.1rem; }
  .desc { color: #a89a82; font-size: 0.88rem; }
  .badge { background: rgba(var(--glow), 0.16); color: #e8b45a; }

  .home :deep(.site-footer), .home :deep(.site-footer a) { color: #7d705c; }
}
</style>
