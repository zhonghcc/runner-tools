<template>
  <view class="home-page">
    <view class="home">
      <view class="hero">
        <view class="intro">
          <view class="brand">
            <image class="brand-logo" src="/static/favicon.svg" mode="aspectFit" />
            <text class="brand-name">跑者拾穗</text>
            <text v-if="auth.checked" class="account" @tap="go('/pages/login/index')">{{ auth.user ? displayName(auth.user) : '微信登录' }}</text>
          </view>
          <text class="lead">跑过的每一公里，都是拾起的一束穗。</text>
          <text class="sub">配速、训练区间和有氧基础测试，打开即用，不需要注册，数据只留在你的设备上。</text>
          <view v-if="profileVdot" class="mine" @tap="go('/pages/vdot/index')">
            <text class="small">我的跑力</text>
            <text class="mine-v num">{{ profileVdot.toFixed(1) }}</text>
            <text class="small">{{ distanceLabel(profile.raceMeters) }} {{ formatDuration(profile.raceSeconds || 0) }}</text>
          </view>
        </view>
        <view class="quote-slot"><QuoteBar /></view>
      </view>

      <view id="tool-grid" class="grid">
        <view v-for="t in TOOLS" :key="t.url" class="tile" :class="{ soon: t.soon }" hover-class="tile-hover" @tap="go(t.url)">
          <view class="icon">
            <image class="ic light" :src="`/static/icons/${t.icon}.png`" mode="aspectFit" />
            <!-- #ifdef H5 -->
            <image class="ic dark" :src="`/static/icons/${t.icon}-dark.png`" mode="aspectFit" />
            <!-- #endif -->
          </view>
          <view class="title">
            <text>{{ t.title }}</text>
            <text v-if="t.soon" class="badge">筹备中</text>
          </view>
          <text class="desc">{{ t.desc }}</text>
        </view>
      </view>

      <SiteFooter />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onShow } from '@dcloudio/uni-app'
import { onBeforeUnmount, onMounted } from 'vue'
import QuoteBar from '../../components/QuoteBar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { TOOLS } from '../../data/tools'
import { auth, displayName } from '../../stores/auth'
import { profile, profileVdot } from '../../stores/profile'
import { distanceLabel } from '../../core/pace'
import { formatDuration } from '../../core/time'
import { go } from '../../utils/platform'

// #ifdef H5
// 网页宽屏用深色背景；给根元素打标记，让滚动越界露出的底色也是深色
onShow(() => document.documentElement.classList.add('home-dark'))
onHide(() => document.documentElement.classList.remove('home-dark'))

// 照明效果：鼠标在卡片区移动时，把光源位置换算到每张卡片内，写进 CSS 变量。
// 光源跟随整个网格，相邻卡片的边框也会被同一束光照亮。只响应鼠标，触屏不触发
let gridEl: HTMLElement | null = null
let frame = 0
function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !gridEl) return
  cancelAnimationFrame(frame)
  const { clientX, clientY } = e
  frame = requestAnimationFrame(() => {
    gridEl?.querySelectorAll<HTMLElement>('.tile').forEach((el) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${clientX - r.left}px`)
      el.style.setProperty('--my', `${clientY - r.top}px`)
    })
    gridEl?.classList.add('lit')
  })
}
function onLeave() {
  cancelAnimationFrame(frame)
  gridEl?.classList.remove('lit')
}
onMounted(() => {
  gridEl = document.getElementById('tool-grid')
  gridEl?.addEventListener('pointermove', onMove)
  gridEl?.addEventListener('pointerleave', onLeave)
})
onBeforeUnmount(() => {
  gridEl?.removeEventListener('pointermove', onMove)
  gridEl?.removeEventListener('pointerleave', onLeave)
  document.documentElement.classList.remove('home-dark')
})
// #endif
</script>

<style scoped>
/* 手机与小程序：浅色，两列卡片 */
.home { box-sizing: border-box; max-width: 1120px; margin: 0 auto; padding: 0 16px; }
.hero { display: flex; flex-direction: column; padding: 24px 0 12px; }
.brand { display: flex; align-items: center; }
.brand-logo { width: 40px; height: 40px; flex: none; }
.brand-name { margin-left: 10px; font-size: 26px; font-weight: 700; letter-spacing: 3px; }
.account {
  margin-left: auto;
  padding: 4px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--gold-deep);
  font-size: 13px;
  white-space: nowrap;
}
.lead { display: block; font-family: 'Songti SC', 'STSong', 'Noto Serif SC', serif; font-size: 17px; margin: 12px 0 4px; }
.sub { display: block; color: var(--muted); font-size: 14px; margin-bottom: 8px; }
.mine {
  display: inline-flex;
  align-items: baseline;
  align-self: flex-start;
  gap: 8px;
  margin: 2px 0 12px;
  padding: 5px 14px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--muted);
}
.mine-v { font-size: 18px; font-weight: 600; color: var(--gold-deep); }

.grid { display: flex; flex-wrap: wrap; margin: 4px -6px 16px; }
.tile {
  position: relative;
  box-sizing: border-box;
  width: calc(50% - 12px);
  margin: 6px;
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  color: var(--text);
}
.tile-hover { border-color: var(--gold); }
.tile.soon { opacity: 0.7; }
.icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gold-soft);
  margin-bottom: 10px;
}
.ic { width: 26px; height: 26px; }
.ic.dark { display: none; }
.title { position: relative; display: flex; align-items: center; flex-wrap: wrap; font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.title .badge { margin-left: 6px; }
.desc { position: relative; color: var(--muted); font-size: 12px; line-height: 1.5; }

/* #ifdef H5 */
.tile { cursor: pointer; transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease; }
.account, .mine { cursor: pointer; }
.tile:hover { transform: translateY(-2px); border-color: var(--gold); box-shadow: 0 6px 20px rgba(183, 131, 47, 0.14); }

@media (min-width: 640px) {
  .tile { width: calc(33.33% - 16px); margin: 8px; padding: 20px; }
  .grid { margin: 4px -8px 20px; }
}

/* PC：深色背景，四列卡片，鼠标照明 */
@media (min-width: 960px) {
  .home-page {
    --glow: 232, 180, 90;
    min-height: 100vh;
    color: #efe6d4;
    background:
      radial-gradient(900px 520px at 12% -8%, rgba(var(--glow), 0.16), transparent 60%),
      radial-gradient(760px 520px at 100% 10%, rgba(196, 98, 52, 0.1), transparent 62%),
      radial-gradient(1000px 600px at 50% 120%, rgba(var(--glow), 0.08), transparent 60%),
      #0d0b08;
    position: relative;
    overflow: hidden;
  }
  .home-page::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%);
    pointer-events: none;
  }
  .home { position: relative; }
  .hero { flex-direction: row; align-items: center; padding: 64px 0 36px; }
  .intro, .quote-slot { flex: 1; min-width: 0; }
  .intro { margin-right: 32px; display: flex; flex-direction: column; }
  .brand-name {
    font-size: 38px;
    background: linear-gradient(100deg, #fff4dc 0%, #e8b45a 55%, #c98a2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .brand-logo { width: 46px; height: 46px; filter: drop-shadow(0 0 18px rgba(var(--glow), 0.45)); }
  .lead { color: #f3e7cf; font-size: 19px; }
  .sub { color: #a89a82; }
  .account { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.12); color: #e8b45a; }
  .mine { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.1); color: #a89a82; }
  .mine-v { color: #e8b45a; }
  .quote-slot :deep(.quote) { background: linear-gradient(135deg, rgba(var(--glow), 0.12), rgba(255, 255, 255, 0.03)); border-color: rgba(var(--glow), 0.25); }
  .quote-slot :deep(.q-text) { color: #f3e7cf; }
  .quote-slot :deep(.q-src) { color: #a89a82; }
  .quote-slot :deep(.swap) { color: #e8b45a; }

  .grid { margin: 0 -9px 20px; }
  .tile {
    width: calc(25% - 18px);
    margin: 9px;
    min-height: 176px;
    padding: 24px;
    color: #efe6d4;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015));
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    isolation: isolate;
  }
  .tile::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    background: radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--glow), 0.26), transparent 65%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .tile::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
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
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 40px rgba(var(--glow), 0.1);
  }
  .tile.soon { opacity: 0.55; }
  .icon { background: rgba(var(--glow), 0.12); box-shadow: 0 0 0 1px rgba(var(--glow), 0.18) inset; transition: box-shadow 0.25s ease, background 0.25s ease; }
  .tile:hover .icon { background: rgba(var(--glow), 0.22); box-shadow: 0 0 0 1px rgba(var(--glow), 0.4) inset, 0 0 24px rgba(var(--glow), 0.35); }
  .ic.light { display: none; }
  .ic.dark { display: block; }
  .title { font-size: 17px; }
  .desc { color: #a89a82; font-size: 14px; }
  .badge { background: rgba(var(--glow), 0.16); color: #e8b45a; }
  .home :deep(.site-footer), .home :deep(.flink) { color: #7d705c; }
}
/* #endif */
</style>
