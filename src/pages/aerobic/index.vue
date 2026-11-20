<template>
  <view class="col">
    <view class="card">
      <text class="p">以 E 配速在平坦路段稳定跑满 90 分钟，比较第 10 分钟与第 90 分钟的心率。心率上升越少，有氧基础越稳固。漂移 5% 以内为优秀，10% 以内为良好。</text>
      <text class="link toggle" @tap="showHow = !showHow">{{ showHow ? '收起' : '测试要求与 FIT 文件导出方法' }}</text>
      <view v-if="showHow" class="howto">
        <view class="ol">
          <view v-for="(s, i) in howto" :key="i" class="li"><text class="n">{{ i + 1 }}.</text><text>{{ s }}</text></view>
        </view>
        <text class="h3 top">导出 FIT 文件</text>
        <view class="ol">
          <view v-for="(s, i) in exports" :key="i" class="li"><text class="n">·</text><text>{{ s }}</text></view>
        </view>
      </view>

      <view id="drop" class="drop" :class="{ over: dragOver }" @tap="pick">
        <text class="drop-title">{{ busy ? '正在解析…' : pickLabel }}</text>
        <text class="muted small">{{ pickHint }}</text>
      </view>
      <text v-if="error" class="notice error">{{ error }}</text>
    </view>

    <template v-if="result">
      <view class="card">
        <view class="meta muted small">
          <text v-if="result.startTime">{{ formatDate(result.startTime) }}</text>
          <text>{{ fileName }}</text>
        </view>

        <view v-if="result.rating && result.driftPct !== null" class="verdict" :class="[result.rating.level, result.valid ? '' : 'invalid']">
          <view class="v-num">
            <text class="muted small">心率漂移</text>
            <text class="big num">{{ result.driftPct.toFixed(1) }}%</text>
          </view>
          <view class="v-text">
            <text class="v-title">{{ result.valid ? result.rating.title : '本次记录不符合检测条件' }}</text>
            <text class="small">{{ result.valid ? result.rating.advice : '下面的数字仅供参考，原因见提示。' }}</text>
          </view>
        </view>

        <text v-for="(i, k) in result.issues" :key="k" class="notice" :class="{ error: i.level === 'error' }">{{ i.text }}</text>

        <view class="grid3 metrics num">
          <view v-for="m in metrics" :key="m.label" class="cell">
            <text class="muted small">{{ m.label }}</text>
            <text class="cell-v">{{ m.value }}</text>
          </view>
        </view>
        <text class="muted small p">心率漂移 =（B − A）÷ A，A、B 取前后各 30 秒的平均值。有氧解耦率比较前后两半「配速/心率」的变化，把配速变化也考虑进去，全程没能守住配速时可以参考它。</text>

        <view v-if="showSetMax" class="setmax">
          <text class="small">这次记录的最高心率 {{ result.maxHr }}。</text>
          <button class="btn ghost mini" hover-class="btn-hover" @tap="setMax">设为我的最大心率</button>
          <text class="muted small block">平稳跑的最高心率通常低于真实最大心率，实测更准。</text>
        </view>
      </view>

      <view v-if="result.series.length > 10" class="card">
        <text class="h3">每分钟心率与配速</text>
        <HrPaceChart :series="result.series" :window-end="result.windowEndSec / 60" />
        <text v-if="stopsText" class="muted small block top">停下记录：{{ stopsText }}</text>
      </view>
    </template>

    <view v-if="aerobicHistory.length" class="card">
      <text class="h3">我的测试记录</text>
      <view v-for="h in aerobicHistory" :key="h.id" class="hist">
        <view class="h-main">
          <view class="h-line">
            <text class="h-drift num">{{ h.driftPct.toFixed(1) }}%</text>
            <text v-if="!h.standard" class="badge">非标准</text>
          </view>
          <text class="muted small">{{ formatDate(h.date) }} · {{ formatDuration(h.movingSec) }} · {{ (h.distanceM / 1000).toFixed(1) }} 公里 · 解耦 {{ h.decouplingPct === null ? '—' : h.decouplingPct.toFixed(1) + '%' }}</text>
        </view>
        <button class="btn ghost mini" hover-class="btn-hover" @tap="remove(h.id)">删除</button>
      </view>
      <text class="muted small block top">只保存符合检测条件的结果摘要，原始文件不保存。隔几周测一次，看漂移是否在下降。</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import HrPaceChart from '../../components/HrPaceChart.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { parseFit, FitParseError } from '../../core/fit'
import { extractFit } from '../../core/fileInput'
import { analyzeAerobic, type AerobicResult } from '../../core/aerobic'
import { aerobicHistory, profile, profileVdot } from '../../stores/profile'
import { formatDuration, formatPace } from '../../core/time'
import { isMiniProgram, pickFile, PickCancelled, type PickedFile } from '../../utils/platform'
// #ifdef H5
import { readBrowserFile } from '../../utils/platform'
// #endif

const howto = [
  '先在「跑力与训练区间」里填一个近期比赛成绩，得到自己的 E 配速。填过之后，这里会自动检查配速是否落在 E 区间。',
  '选平坦、少红绿灯的路线，充分热身后开始。全程维持配速不变，不要刻意去压心率。',
  '停下的时间不计入 90 分钟。单次停下不超过 30 秒、累计不超过 90 秒，超过时这次记录不能用于检测。补水尽量控制在 30 秒内。',
  '建议使用心率带。光学心率在前几分钟和出汗后容易跳动。',
]
const exports = [
  isMiniProgram
    ? '高驰：COROS App 打开这次运动记录，点右上角「…」→「导出数据」，选 .fit，发送到微信「文件传输助手」，再回到这里选择。'
    : '高驰：COROS App 打开这次运动记录，点右上角「…」→「导出数据」，选 .fit 格式保存。电脑上也可以在 Training Hub 的运动详情里导出。',
  '佳明：Garmin Connect 网页版打开活动，点右上角齿轮选「导出原始文件」，得到的 .zip 可以直接上传。',
  '颂拓、Polar 等：在各自 App 或网页版的活动详情里导出 .fit。',
]
const pickLabel = isMiniProgram ? '从微信聊天记录选择 .fit 文件' : '选择或拖入 .fit 文件'
const pickHint = isMiniProgram ? '文件只在手机上解析，不会上传到服务器' : '文件只在你的浏览器里解析，不会上传到任何服务器'

const showHow = ref(false)
const result = shallowRef<AerobicResult | null>(null)
const error = ref('')
const busy = ref(false)
const dragOver = ref(false)
const fileName = ref('')

const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(1))
const pad = (n: number) => String(n).padStart(2, '0')
const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const totalStop = computed(() => result.value?.stops.reduce((s, x) => s + x.durationSec, 0) ?? 0)
const metrics = computed(() => {
  const r = result.value
  if (!r) return []
  const list = [
    { label: '第 10 分钟心率 A', value: fmt(r.hrA) },
    { label: `第 ${Math.round(r.windowEndSec / 60)} 分钟心率 B`, value: fmt(r.hrB) },
    { label: '有氧解耦率', value: r.decouplingPct === null ? '—' : r.decouplingPct.toFixed(1) + '%' },
    { label: '有效时长', value: formatDuration(r.movingSec) },
    { label: '距离', value: `${(r.distanceM / 1000).toFixed(2)} 公里` },
    { label: '测试段平均配速', value: r.avgPace ? formatPace(r.avgPace) : '—' },
    { label: '配速波动', value: r.paceCvPct === null ? '—' : r.paceCvPct.toFixed(1) + '%' },
    { label: '停下', value: r.stops.length ? `${r.stops.length} 次 ${Math.round(totalStop.value)} 秒` : '无' },
  ]
  if (r.eShare !== null) list.push({ label: '落在 E 区间', value: `${Math.round(r.eShare * 100)}%` })
  return list
})
const stopsText = computed(() => result.value?.stops.map((s) => `第 ${Math.floor(s.atSec / 60)} 分钟停 ${Math.round(s.durationSec)} 秒`).join('；') ?? '')
const showSetMax = computed(() => {
  const r = result.value
  return !!(r && r.maxHr && (!profile.maxHr || r.maxHr > profile.maxHr))
})

function setMax() {
  if (result.value?.maxHr) profile.maxHr = result.value.maxHr
}

function handle(file: PickedFile) {
  error.value = ''
  result.value = null
  busy.value = true
  fileName.value = file.name
  // 让「正在解析」先渲染出来，大文件解析需要一两秒
  setTimeout(() => {
    try {
      const act = parseFit(extractFit(file.bytes))
      const r = analyzeAerobic(act, { vdot: profileVdot.value })
      result.value = r
      save(r)
    } catch (e) {
      error.value = e instanceof FitParseError ? e.message : `解析失败：${(e as Error).message ?? e}`
    } finally {
      busy.value = false
    }
  }, 30)
}

async function pick() {
  if (busy.value) return
  try {
    handle(await pickFile(['fit', 'zip']))
  } catch (e) {
    if (!(e instanceof PickCancelled)) error.value = (e as Error).message
  }
}

function save(r: AerobicResult) {
  if (!r.valid || r.driftPct === null || !r.startTime) return
  const id = String(r.startTime)
  const summary = { id, date: r.startTime, movingSec: r.movingSec, distanceM: r.distanceM, driftPct: r.driftPct, decouplingPct: r.decouplingPct, valid: r.valid, standard: r.standard }
  const i = aerobicHistory.findIndex((h) => h.id === id)
  if (i >= 0) aerobicHistory.splice(i, 1, summary)
  else aerobicHistory.push(summary)
  aerobicHistory.sort((a, b) => b.date - a.date)
}

function remove(id: string) {
  const i = aerobicHistory.findIndex((h) => h.id === id)
  if (i >= 0) aerobicHistory.splice(i, 1)
}

// 网页端支持把文件拖进上传框
// #ifdef H5
let dropEl: HTMLElement | null = null
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  dragOver.value = true
}
const onDragLeave = () => (dragOver.value = false)
const onDrop = async (e: DragEvent) => {
  e.preventDefault()
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) handle(await readBrowserFile(f))
}
onMounted(() => {
  dropEl = document.getElementById('drop')
  dropEl?.addEventListener('dragover', onDragOver)
  dropEl?.addEventListener('dragleave', onDragLeave)
  dropEl?.addEventListener('drop', onDrop)
})
onBeforeUnmount(() => {
  dropEl?.removeEventListener('dragover', onDragOver)
  dropEl?.removeEventListener('dragleave', onDragLeave)
  dropEl?.removeEventListener('drop', onDrop)
})
// #endif
</script>

<style scoped>
.toggle { display: block; font-size: 14px; margin-bottom: 12px; }
.howto { margin-bottom: 12px; }
.top { margin-top: 8px; }
.block { display: block; }
.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px dashed #e2cfa6;
  border-radius: var(--radius);
  padding: 24px 16px;
  background: #fffaf0;
  text-align: center;
}
.drop.over { border-color: var(--gold); background: var(--gold-soft); }
.drop-title { font-weight: 600; margin-bottom: 4px; }
.meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.verdict { display: flex; align-items: center; padding: 12px; border-radius: 10px; margin-bottom: 8px; }
.verdict.excellent { background: #eef5ea; }
.verdict.good { background: #f6f1e2; }
.verdict.weak { background: #fbefe9; }
.verdict.invalid { background: #f3f0ea; }
.v-num { display: flex; flex-direction: column; flex: none; margin-right: 16px; }
.v-text { display: flex; flex-direction: column; }
.v-title { font-weight: 600; margin-bottom: 2px; }
.metrics { margin: 12px 0 4px; }
.setmax { margin-top: 6px; }
.hist { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line); }
.hist:last-of-type { border-bottom: none; }
.h-main { display: flex; flex-direction: column; flex: 1; min-width: 0; margin-right: 8px; }
.h-line { display: flex; align-items: center; }
.h-drift { font-size: 17px; font-weight: 600; margin-right: 8px; }
</style>
