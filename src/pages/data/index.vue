<template>
  <view class="col">
    <view class="card">
      <text class="p">你填的成绩、心率参数和有氧测试记录目前都只保存在本机。登录只用来识别你是谁，跨设备同步还在开发中，上线前登录也不会上传这些数据。</text>
      <text class="muted small p">{{ tip }}</text>
      <view class="actions">
        <button class="btn" hover-class="btn-hover" @tap="doExport">导出数据</button>
        <button class="btn ghost" hover-class="btn-hover" @tap="doImport">导入数据</button>
        <button class="btn ghost" hover-class="btn-hover" @tap="clearAll">清除全部</button>
      </view>
      <text v-if="msg" class="notice" :class="{ error: isError }">{{ msg }}</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SiteFooter from '../../components/SiteFooter.vue'
import { aerobicHistory, exportData, importData, profile } from '../../stores/profile'
import { confirmModal, isMiniProgram, pickFile, PickCancelled, saveTextFile } from '../../utils/platform'
import { Utf8Decoder } from '../../core/textcodec'

const tip = isMiniProgram
  ? '删除小程序或清理微信缓存会一并删除这些内容。换手机时先导出，文件会发到微信聊天里，再到新手机上导入。'
  : '清除浏览器数据会一并删除这些内容。iPhone 的 Safari 还会清理连续 7 天没有访问过的网站数据，把本站添加到主屏幕后不受此限。换设备时先导出，再到新设备上导入。'
const msg = ref('')
const isError = ref(false)
const show = (text: string, err = false) => {
  msg.value = text
  isError.value = err
}

async function doExport() {
  try {
    await saveTextFile(`跑者拾穗-数据-${new Date().toISOString().slice(0, 10)}.json`, exportData())
  } catch (e) {
    show((e as Error).message, true)
  }
}

async function doImport() {
  try {
    const f = await pickFile(['json'])
    importData(new Utf8Decoder().decode(f.bytes))
    show('导入完成')
  } catch (e) {
    if (!(e instanceof PickCancelled)) show(`导入失败：${(e as Error).message}`, true)
  }
}

async function clearAll() {
  if (!(await confirmModal('清除全部数据', '确定清除本机保存的所有成绩、心率参数和测试记录？此操作无法撤销。'))) return
  Object.assign(profile, { raceMeters: 10000, raceSeconds: null, age: null, maxHr: null, restHr: null })
  aerobicHistory.splice(0)
  show('已清除')
}
</script>

<style scoped>
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
