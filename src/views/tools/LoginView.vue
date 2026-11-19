<template>
  <div class="card login">
    <template v-if="auth.user">
      <p>已登录为 <strong>{{ displayName(auth.user) }}</strong>。</p>
      <div class="actions">
        <RouterLink :to="redirect" class="btn">返回</RouterLink>
        <button type="button" class="btn ghost" @click="doLogout">退出登录</button>
      </div>
    </template>

    <template v-else>
      <p class="muted">用微信扫描下方小程序码，在手机上点「确认登录」。登录后，你的成绩和测试记录可以跨设备同步（即将上线）。</p>

      <div class="qr-box">
        <img v-if="qr && state !== 'expired' && state !== 'failed'" :src="qr" alt="跑者拾穗登录小程序码" width="220" height="220" :class="{ dim: state === 'scanned' }" />
        <div v-else class="qr-placeholder">{{ loading ? '正在生成…' : '' }}</div>
        <div v-if="state === 'scanned'" class="overlay">已扫码<br /><span class="small">请在手机上确认</span></div>
        <button v-if="state === 'expired' || state === 'cancelled' || state === 'failed'" type="button" class="overlay refresh" @click="start">
          {{ refreshLabel }}<br /><span class="small">{{ state === 'failed' ? '点击重试' : '点击刷新' }}</span>
        </button>
      </div>

      <p v-if="error" class="notice error">{{ error }}</p>
      <p class="muted small tip">手机上浏览本页时，可以截图后在微信里长按识别，或用另一台设备打开本页扫码。</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, auth, displayName, logout, refreshMe } from '../../stores/auth'

type State = 'pending' | 'scanned' | 'confirmed' | 'expired' | 'cancelled' | 'failed'

const route = useRoute()
const router = useRouter()
const redirect = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/'
})

const qr = ref('')
const refreshLabel = computed(() => ({ cancelled: '已取消', failed: '生成失败', expired: '已过期' })[state.value as 'cancelled' | 'failed' | 'expired'] ?? '')
const state = ref<State>('pending')
const error = ref('')
const loading = ref(false)
let ticket = ''
let pollSecret = ''
let timer: number | undefined
let expireAt = 0

async function start() {
  stop()
  error.value = ''
  loading.value = true
  qr.value = ''
  try {
    const r = await api<{ ticket: string; pollSecret: string; image: string; expiresIn: number }>('/api/auth/qr', { method: 'POST' })
    ticket = r.ticket
    pollSecret = r.pollSecret
    qr.value = r.image
    state.value = 'pending'
    expireAt = Date.now() + r.expiresIn * 1000
    timer = window.setInterval(poll, 2000)
  } catch (e) {
    error.value = (e as Error).message
    state.value = 'failed'
  } finally {
    loading.value = false
  }
}

async function poll() {
  if (document.hidden) return
  if (Date.now() > expireAt) {
    state.value = 'expired'
    return stop()
  }
  try {
    const r = await api<{ status: State }>('/api/auth/qr/status', { method: 'POST', body: JSON.stringify({ ticket, pollSecret }) })
    state.value = r.status
    if (r.status === 'confirmed') {
      stop()
      await refreshMe()
      router.replace(redirect.value)
    } else if (r.status === 'expired' || r.status === 'cancelled') {
      stop()
    }
  } catch {
    // 网络抖动时下一轮再试
  }
}

function stop() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}

async function doLogout() {
  await logout()
  start()
}

onMounted(async () => {
  if (!auth.checked) await refreshMe()
  if (!auth.user) start()
})
onBeforeUnmount(stop)
</script>

<style scoped>
.login { text-align: center; }
.qr-box { position: relative; width: 220px; height: 220px; margin: 16px auto; }
.qr-box img { display: block; border-radius: 12px; transition: opacity 0.2s; }
.qr-box img.dim { opacity: 0.15; }
.qr-placeholder { width: 220px; height: 220px; border-radius: 12px; background: var(--gold-soft); display: flex; align-items: center; justify-content: center; color: var(--muted); }
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--gold-deep);
  border-radius: 12px;
}
.refresh { border: 1px dashed var(--gold); background: rgba(255, 253, 248, 0.92); cursor: pointer; font: inherit; font-weight: 600; color: var(--gold-deep); }
.actions { display: flex; gap: 10px; justify-content: center; }
.tip { margin-top: 8px; }
</style>
