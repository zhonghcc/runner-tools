<template>
  <div class="card">
    <div class="row">
      <div class="field">
        <label for="age">年龄</label>
        <input id="age" v-model.number="profile.age" type="number" inputmode="numeric" min="10" max="90" placeholder="用于估算" />
      </div>
      <div class="field">
        <label for="max">最大心率</label>
        <input id="max" v-model.number="profile.maxHr" type="number" inputmode="numeric" min="120" max="230" :placeholder="est ? `估算 ${est.tanaka}` : '实测值最好'" />
      </div>
      <div class="field">
        <label for="rest">静息心率</label>
        <input id="rest" v-model.number="profile.restHr" type="number" inputmode="numeric" min="30" max="100" placeholder="晨起静卧测量" />
      </div>
    </div>
    <p v-if="est && !profile.maxHr" class="muted small">
      按年龄估算：220 − 年龄 = {{ est.classic }}，Tanaka 公式 208 − 0.7 × 年龄 = {{ est.tanaka }}。公式只是人群平均值，个体差异可达 10 次以上，下方用 Tanaka 估算值计算，建议实测后填入。
    </p>
  </div>

  <div v-if="maxHr" class="card">
    <div class="table-wrap">
      <table class="num">
        <thead>
          <tr><th>区间</th><th>最大心率法</th><th v-if="reserve">储备心率法</th></tr>
        </thead>
        <tbody>
          <tr v-for="(z, i) in byMax" :key="z.zone.code">
            <td><span class="badge">{{ z.zone.code }}</span> {{ z.zone.name }} <span class="muted small">{{ z.zone.lo * 100 }}–{{ z.zone.hi * 100 }}%</span></td>
            <td>{{ z.low }} – {{ z.high }}</td>
            <td v-if="reserve">{{ reserve[i].low }} – {{ reserve[i].high }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted small">
      储备心率法（Karvonen 公式）把静息心率考虑进去，体能好、静息心率低的跑者用它更准。<template v-if="profile.age">MAF 有氧心率上限（180 − 年龄）为 {{ mafHr(profile.age) }}。</template>
    </p>
  </div>

  <div class="card">
    <h3>怎样实测最大心率</h3>
    <p class="muted small">以下是常见的操场测试方法，需要身体状况良好，最好有同伴在场。心血管疾病风险人群请勿自行测试。</p>
    <ol class="small">
      <li>戴好心率带或心率表，慢跑热身 10 分钟以上。</li>
      <li>在操场上跑 800 米，每趟比上一趟快一档，从轻松配速逐步加到全力，趟间慢跑 400 米恢复。</li>
      <li>最后一趟全力冲刺，冲刺结束时的心率接近最大心率。也可以在 400 米左右的陡坡上反复冲坡，直到心率不再上升。</li>
      <li>慢跑 5 分钟放松。取整次记录中的最高心率，填入上面。</li>
    </ol>
    <p class="muted small">在有氧基础测试里上传 FIT 文件时，也会读出那次记录的最高心率，供参考。</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { profile } from '../../stores/profile'
import { estimateMaxHr, mafHr, zonesByMax, zonesByReserve } from '../../core/heartRate'

const est = computed(() => (profile.age && profile.age > 5 && profile.age < 100 ? estimateMaxHr(profile.age) : null))
const maxHr = computed(() => profile.maxHr || est.value?.tanaka || null)
const byMax = computed(() => (maxHr.value ? zonesByMax(maxHr.value) : []))
const reserve = computed(() =>
  maxHr.value && profile.restHr && profile.restHr < maxHr.value ? zonesByReserve(maxHr.value, profile.restHr) : null,
)
</script>
