<template>
  <view class="col">
    <view class="brand">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="name">跑者拾穗</text>
    </view>

    <!-- 小程序：扫网页上的码进来，确认网页登录 -->
    <view v-if="mode === 'confirm'" class="card center">
      <template v-if="cState === 'loading'">
        <text class="muted">正在读取登录信息…</text>
      </template>
      <template v-else-if="cState === 'ready' || cState === 'submitting'">
        <text class="t">登录跑者拾穗网页版</text>
        <text class="muted d">你正在电脑或其他设备的浏览器上登录 run.zhonghcc.com。如果不是你本人操作，请点「取消」。</text>
        <button class="btn block" hover-class="btn-hover" :loading="cState === 'submitting'" :disabled="cState === 'submitting'" @tap="confirm">确认登录</button>
        <button class="btn ghost block gap" hover-class="btn-hover" :disabled="cState === 'submitting'" @tap="cancel">取消</button>
      </template>
      <template v-else>
        <text class="t">{{ cTitle }}</text>
        <text class="muted d">{{ cDesc }}</text>
        <button v-if="cState === 'error'" class="btn block" hover-class="btn-hover" @tap="scan">重试</button>
        <button class="btn ghost block gap" hover-class="btn-hover" @tap="home">去首页</button>
      </template>
    </view>

    <!-- 已登录 -->
    <view v-else-if="auth.user" class="card center">
      <text class="t">已登录为 {{ displayName(auth.user) }}</text>
      <text class="muted d">登录后，成绩和测试记录可以在网页和小程序之间同步（即将上线）。</text>
      <button class="btn block" hover-class="btn-hover" @tap="home">返回首页</button>
      <button class="btn ghost block gap" hover-class="btn-hover" @tap="doLogout">退出登录</button>
    </view>

    <!-- 小程序：直接用微信身份登录 -->
    <view v-else-if="isMiniProgram" class="card center">
      <text class="t">登录跑者拾穗</text>
      <text class="muted d">登录只用来识别你是谁，以后你的成绩和测试记录可以在网页和小程序之间同步。不登录也能使用全部工具。</text>
      <button class="btn block" hover-class="btn-hover" :loading="busy" :disabled="busy" @tap="mpLogin">微信一键登录</button>
      <text v-if="error" class="notice error">{{ error }}</text>
    </view>

    <!-- 网页：显示小程序码扫码登录 -->
    <view v-else class="card center">
      <text class="muted d">用微信扫描下方小程序码，在手机上点「确认登录」。登录后，你的成绩和测试记录可以跨设备同步（即将上线）。</text>
      <view class="qr-box">
        <image v-if="qr && qState !== 'expired' && qState !== 'failed' && qState !== 'cancelled'" class="qr" :class="{ dim: qState === 'scanned' }" :src="qr" mode="aspectFit" />
        <view v-else class="qr placeholder"><text class="muted">{{ loading ? '正在生成…' : '' }}</text></view>
        <view v-if="qState === 'scanned'" class="overlay"><text>已扫码</text><text class="small">请在手机上确认</text></view>
        <view v-if="qState === 'expired' || qState === 'cancelled' || qState === 'failed'" class="overlay refresh" @tap="startQr">
          <text>{{ refreshLabel }}</text><text class="small">{{ qState === 'failed' ? '点击重试' : '点击刷新' }}</text>
        </view>
      </view>
      <text v-if="error" class="notice error">{{ error }}</text>
      <text class="muted small">手机上浏览本页时，可以截图后在微信里长按识别，或直接在微信里搜索「跑者拾穗」小程序。</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import SiteFooter from '../../components/SiteFooter.vue'
import { api, applyLogin, auth, displayName, loginInMiniProgram, logout, refreshMe, wxCode, type User } from '../../stores/auth'
import { isMiniProgram } from '../../utils/platform'

const mode = ref<'normal' | 'confirm'>('normal')
const error = ref('')
const busy = ref(false)
const redirect = ref('/pages/index/index')

const home = () => uni.reLaunch({ url: redirect.value })

// —— 小程序：确认网页登录 ——
type CState = 'loading' | 'ready' | 'submitting' | 'done' | 'cancelled' | 'expired' | 'error'
const cState = ref<CState>('loading')
let ticket = ''
const cTitle = computed(() => ({ done: '已登录', cancelled: '已取消登录', expired: '登录码已失效', error: '出了点问题' } as Record<string, string>)[cState.value] ?? '')
const cDesc = computed(
  () =>
    (({
      done: '回到浏览器即可继续使用，小程序这边也已经登录。',
      cancelled: '网页上的登录码已失效。',
      expired: '登录码 5 分钟内有效。请在网页上点击刷新后重新扫码。',
      error: error.value,
    }) as Record<string, string>)[cState.value] ?? '',
)

async function scan() {
  cState.value = 'loading'
  try {
    const r = await api<{ status: string }>('/api/mp/login/scan', { ticket })
    cState.value = r.status === 'pending' || r.status === 'scanned' ? 'ready' : r.status === 'confirmed' ? 'done' : 'expired'
  } catch (e) {
    error.value = (e as Error).message
    cState.value = 'error'
  }
}

async function confirm() {
  if (cState.value !== 'ready') return
  cState.value = 'submitting'
  try {
    const r = await api<{ status: string; token?: string; user?: User }>('/api/mp/login/confirm', { ticket, code: await wxCode() })
    if (r.token && r.user) applyLogin(r.token, r.user)
    cState.value = r.status === 'confirmed' ? 'done' : r.status === 'cancelled' ? 'cancelled' : 'expired'
  } catch (e) {
    error.value = (e as Error).message
    cState.value = 'error'
  }
}

function cancel() {
  api('/api/mp/login/cancel', { ticket }).catch(() => undefined)
  cState.value = 'cancelled'
}

// —— 小程序：直接登录 ——
async function mpLogin() {
  busy.value = true
  error.value = ''
  try {
    await loginInMiniProgram()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

async function doLogout() {
  await logout()
  if (!isMiniProgram) startQr()
}

// —— 网页：扫码登录 ——
type QState = 'pending' | 'scanned' | 'confirmed' | 'expired' | 'cancelled' | 'failed'
const qr = ref('')
const qState = ref<QState>('pending')
const loading = ref(false)
let qTicket = ''
let pollSecret = ''
let timer: ReturnType<typeof setInterval> | undefined
let expireAt = 0
const refreshLabel = computed(() => ({ cancelled: '已取消', failed: '生成失败', expired: '已过期' } as Record<string, string>)[qState.value] ?? '')

async function startQr() {
  stopQr()
  error.value = ''
  loading.value = true
  qr.value = ''
  try {
    const r = await api<{ ticket: string; pollSecret: string; image: string; expiresIn: number }>('/api/auth/qr', {})
    qTicket = r.ticket
    pollSecret = r.pollSecret
    qr.value = r.image
    qState.value = 'pending'
    expireAt = Date.now() + r.expiresIn * 1000
    timer = setInterval(poll, 2000)
  } catch (e) {
    error.value = (e as Error).message
    qState.value = 'failed'
  } finally {
    loading.value = false
  }
}

async function poll() {
  if (Date.now() > expireAt) {
    qState.value = 'expired'
    return stopQr()
  }
  try {
    const r = await api<{ status: QState }>('/api/auth/qr/status', { ticket: qTicket, pollSecret })
    qState.value = r.status
    if (r.status === 'confirmed') {
      stopQr()
      await refreshMe()
      home()
    } else if (r.status === 'expired' || r.status === 'cancelled') stopQr()
  } catch {
    // 网络抖动时下一轮再试
  }
}

function stopQr() {
  if (timer) clearInterval(timer)
  timer = undefined
}

onLoad(async (query) => {
  const q = (query || {}) as Record<string, string>
  if (q.redirect && q.redirect.startsWith('/pages/')) redirect.value = q.redirect
  const scene = q.scene ? decodeURIComponent(q.scene) : ''
  if (isMiniProgram && /^[0-9a-f]{24}$/.test(scene)) {
    mode.value = 'confirm'
    ticket = scene
    scan()
    return
  }
  if (!auth.checked) await refreshMe()
  if (!isMiniProgram && !auth.user) startQr()
})
onUnload(stopQr)
</script>

<style scoped>
.brand { display: flex; flex-direction: column; align-items: center; margin: 16px 0 18px; }
.logo { width: 72px; height: 72px; border-radius: 50%; }
.name { margin-top: 8px; font-size: 18px; font-weight: 700; letter-spacing: 2px; }
.center { display: flex; flex-direction: column; align-items: center; text-align: center; }
.t { font-size: 18px; font-weight: 600; }
.d { margin: 8px 0 18px; line-height: 1.6; }
.gap { margin-top: 10px; }
.qr-box { position: relative; width: 220px; height: 220px; margin: 4px auto 14px; }
.qr { width: 220px; height: 220px; border-radius: 12px; }
.qr.dim { opacity: 0.15; }
.placeholder { display: flex; align-items: center; justify-content: center; background: var(--gold-soft); }
.overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--gold-deep);
  border-radius: 12px;
}
.refresh { border: 1px dashed var(--gold); background: rgba(255, 253, 248, 0.92); }
</style>
