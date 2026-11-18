<template>
  <div class="card">
    <h2>有氧基础测试</h2>
    <p>
      以 E 配速在平坦路段稳定跑满 90 分钟，比较第 10 分钟与第 90 分钟的心率。心率上升越少，有氧基础越稳固。
      漂移 5% 以内为优秀，10% 以内为良好。
    </p>
    <details class="howto">
      <summary>测试要求与 FIT 文件导出方法</summary>
      <ol class="small">
        <li>先在<RouterLink to="/pace/vdot">配速助手</RouterLink>里填一个近期比赛成绩，得到自己的 E 配速。填过之后，这里会自动检查配速是否落在 E 区间。</li>
        <li>选平坦、少红绿灯的路线，充分热身后开始。全程维持配速不变，不要刻意去压心率。</li>
        <li>停下的时间不计入 90 分钟。单次停下不超过 30 秒、累计不超过 90 秒，超过时这次记录不能用于检测。补水尽量控制在 30 秒内。</li>
        <li>建议使用心率带。光学心率在前几分钟和出汗后容易跳动。</li>
      </ol>
      <p class="small"><strong>导出 FIT 文件：</strong></p>
      <ul class="small">
        <li>高驰：COROS App 打开这次运动记录，点右上角「…」→「导出数据」，选 .fit 格式保存到手机。电脑上也可以在 Training Hub 的运动详情里分享导出。</li>
        <li>佳明：Garmin Connect 网页版打开活动，点右上角齿轮选「导出原始文件」，得到的 .zip 可以直接上传。</li>
        <li>颂拓、Polar 等：在各自 App 或网页版的活动详情里导出 .fit。</li>
      </ul>
    </details>

    <label
      class="drop"
      :class="{ over: dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input type="file" accept=".fit,.zip,application/octet-stream" @change="onPick" />
      <strong>{{ busy ? '正在解析…' : '选择或拖入 .fit 文件' }}</strong>
      <span class="muted small">文件只在你的浏览器里解析，不会上传到任何服务器</span>
    </label>
    <p v-if="error" class="notice error">{{ error }}</p>
  </div>

  <template v-if="result">
    <div class="card">
      <div class="meta muted small">
        <span v-if="result.startTime">{{ formatDate(result.startTime) }}</span>
        <span>{{ fileName }}</span>
      </div>

      <div v-if="result.rating && result.driftPct !== null" class="verdict" :class="[result.rating.level, { invalid: !result.valid }]">
        <div>
          <div class="muted small">心率漂移</div>
          <div class="big num">{{ result.driftPct.toFixed(1) }}%</div>
        </div>
        <div class="verdict-text">
          <strong>{{ result.valid ? result.rating.title : '本次记录不符合检测条件' }}</strong>
          <p class="small">{{ result.valid ? result.rating.advice : '下面的数字仅供参考，原因见提示。' }}</p>
        </div>
      </div>

      <div v-for="(i, k) in result.issues" :key="k" class="notice" :class="{ error: i.level === 'error' }">{{ i.text }}</div>

      <div class="metrics num">
        <div><span class="muted small">第 10 分钟心率 A</span><b>{{ fmt(result.hrA) }}</b></div>
        <div><span class="muted small">第 {{ Math.round(result.windowEndSec / 60) }} 分钟心率 B</span><b>{{ fmt(result.hrB) }}</b></div>
        <div><span class="muted small">有氧解耦率</span><b>{{ result.decouplingPct === null ? '—' : result.decouplingPct.toFixed(1) + '%' }}</b></div>
        <div><span class="muted small">有效时长</span><b>{{ formatDuration(result.movingSec) }}</b></div>
        <div><span class="muted small">距离</span><b>{{ (result.distanceM / 1000).toFixed(2) }} 公里</b></div>
        <div><span class="muted small">测试段平均配速</span><b>{{ result.avgPace ? formatPace(result.avgPace) : '—' }}</b></div>
        <div><span class="muted small">配速波动</span><b>{{ result.paceCvPct === null ? '—' : result.paceCvPct.toFixed(1) + '%' }}</b></div>
        <div v-if="result.eShare !== null"><span class="muted small">落在 E 区间</span><b>{{ Math.round(result.eShare * 100) }}%</b></div>
        <div><span class="muted small">停下</span><b>{{ result.stops.length ? `${result.stops.length} 次，共 ${Math.round(totalStop)} 秒` : '无' }}</b></div>
      </div>
      <p class="muted small">
        心率漂移 =（B − A）÷ A，A、B 取前后各 30 秒的平均值。有氧解耦率比较前后两半「配速/心率」的变化，把配速变化也考虑进去，全程没能守住配速时可以参考它。
      </p>

      <p v-if="result.maxHr && (!profile.maxHr || result.maxHr > profile.maxHr)" class="small">
        这次记录的最高心率 {{ result.maxHr }}。<button type="button" class="btn ghost small" @click="profile.maxHr = result.maxHr">设为我的最大心率</button>
        <span class="muted">（平稳跑的最高心率通常低于真实最大心率，实测更准）</span>
      </p>
    </div>

    <div v-if="result.series.length > 10" class="card">
      <h3>每分钟心率与配速</h3>
      <HrPaceChart :series="result.series" :window-end="result.windowEndSec / 60" />
      <div v-if="result.stops.length" class="stops small muted">
        停下记录：
        <span v-for="(s, k) in result.stops" :key="k">第 {{ Math.floor(s.atSec / 60) }} 分钟停 {{ Math.round(s.durationSec) }} 秒；</span>
      </div>
    </div>
  </template>

  <div v-if="aerobicHistory.length" class="card">
    <h3>我的测试记录</h3>
    <div class="table-wrap">
      <table class="num">
        <thead><tr><th>日期</th><th>有效时长</th><th>距离</th><th>心率漂移</th><th>解耦率</th><th></th></tr></thead>
        <tbody>
          <tr v-for="h in aerobicHistory" :key="h.id">
            <td>{{ formatDate(h.date) }}</td>
            <td>{{ formatDuration(h.movingSec) }}</td>
            <td>{{ (h.distanceM / 1000).toFixed(1) }}</td>
            <td>{{ h.driftPct.toFixed(1) }}%<span v-if="!h.standard" class="muted small"> 非标准</span></td>
            <td>{{ h.decouplingPct === null ? '—' : h.decouplingPct.toFixed(1) + '%' }}</td>
            <td><button type="button" class="btn ghost small" @click="remove(h.id)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted small">只保存符合检测条件的结果摘要，原始文件不保存。隔几周测一次，看漂移是否在下降。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import HrPaceChart from '../components/HrPaceChart.vue'
import { parseFit, FitParseError } from '../core/fit'
import { readFitBytes } from '../core/fileInput'
import { analyzeAerobic, type AerobicResult } from '../core/aerobic'
import { aerobicHistory, profile, profileVdot } from '../stores/profile'
import { formatDuration, formatPace } from '../core/time'

const result = shallowRef<AerobicResult | null>(null)
const error = ref('')
const busy = ref(false)
const dragOver = ref(false)
const fileName = ref('')

const totalStop = computed(() => result.value?.stops.reduce((s, x) => s + x.durationSec, 0) ?? 0)
const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(1))
const formatDate = (ts: number) =>
  new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

async function handle(file: File | undefined) {
  if (!file) return
  error.value = ''
  result.value = null
  busy.value = true
  fileName.value = file.name
  try {
    const bytes = await readFitBytes(file)
    const act = parseFit(bytes)
    const r = analyzeAerobic(act, { vdot: profileVdot.value })
    result.value = r
    save(r)
  } catch (e) {
    error.value = e instanceof FitParseError ? e.message : `解析失败：${(e as Error).message ?? e}`
  } finally {
    busy.value = false
  }
}

function save(r: AerobicResult) {
  if (!r.valid || r.driftPct === null || !r.startTime) return
  const id = String(r.startTime)
  const summary = {
    id,
    date: r.startTime,
    movingSec: r.movingSec,
    distanceM: r.distanceM,
    driftPct: r.driftPct,
    decouplingPct: r.decouplingPct,
    valid: r.valid,
    standard: r.standard,
  }
  const i = aerobicHistory.findIndex((h) => h.id === id)
  if (i >= 0) aerobicHistory.splice(i, 1, summary)
  else aerobicHistory.push(summary)
  aerobicHistory.sort((a, b) => b.date - a.date)
}

function remove(id: string) {
  const i = aerobicHistory.findIndex((h) => h.id === id)
  if (i >= 0) aerobicHistory.splice(i, 1)
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  handle(input.files?.[0])
  input.value = '' // 允许重复选择同一个文件
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  handle(e.dataTransfer?.files?.[0])
}
</script>

<style scoped>
.howto { margin: 4px 0 14px; }
.howto summary { cursor: pointer; color: var(--gold-deep); font-size: 0.92rem; }
.howto ol, .howto ul { padding-left: 1.3em; margin: 8px 0; }
.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 2px dashed #e2cfa6;
  border-radius: var(--radius);
  padding: 26px 16px;
  cursor: pointer;
  background: #fffaf0;
  text-align: center;
}
.drop:hover, .drop.over { border-color: var(--gold); background: var(--gold-soft); }
.drop input { display: none; }
.meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.verdict { display: flex; gap: 20px; align-items: center; padding: 14px; border-radius: 10px; margin-bottom: 8px; }
.verdict.excellent { background: #eef5ea; }
.verdict.good { background: #f6f1e2; }
.verdict.weak { background: #fbefe9; }
.verdict.invalid { background: #f3f0ea; filter: grayscale(0.6); }
.verdict-text p { margin: 4px 0 0; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 14px 0 8px; }
.metrics div { display: flex; flex-direction: column; }
.metrics b { font-size: 1.15rem; }
.stops { margin-top: 8px; }
</style>
