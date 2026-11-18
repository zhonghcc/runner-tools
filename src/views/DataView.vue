<template>
  <div class="card">
    <h2>我的数据</h2>
    <p>跑者拾穗没有账号和服务器存储，你填的成绩、心率参数和有氧测试记录都只保存在当前浏览器里。</p>
    <p class="muted small">
      清除浏览器数据会一并删除这些内容。iPhone 的 Safari 还会清理连续 7 天没有访问过的网站数据，把本站添加到主屏幕后不受此限。换手机或换浏览器时，先在这里导出，再到新设备上导入。
    </p>
    <div class="actions">
      <button type="button" class="btn" @click="doExport">导出数据</button>
      <label class="btn ghost">
        导入数据
        <input type="file" accept=".json,application/json" @change="doImport" />
      </label>
      <button type="button" class="btn ghost" @click="clearAll">清除全部</button>
    </div>
    <p v-if="msg" class="notice" :class="{ error: isError }">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { aerobicHistory, exportData, importData, profile } from '../stores/profile'

const msg = ref('')
const isError = ref(false)

function doExport() {
  const blob = new Blob([exportData()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `跑者拾穗-数据-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function doImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    importData(await file.text())
    msg.value = '导入完成'
    isError.value = false
  } catch (err) {
    msg.value = `导入失败：${(err as Error).message}`
    isError.value = true
  }
}

function clearAll() {
  if (!confirm('确定清除本机保存的所有成绩、心率参数和测试记录？此操作无法撤销。')) return
  Object.assign(profile, { raceMeters: 10000, raceSeconds: null, age: null, maxHr: null, restHr: null })
  aerobicHistory.splice(0)
  msg.value = '已清除'
  isError.value = false
}
</script>

<style scoped>
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.actions label input { display: none; }
.actions label { display: inline-block; }
</style>
