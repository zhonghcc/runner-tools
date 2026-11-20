<template>
  <view class="quote">
    <text class="q-text">{{ quote.text }}</text>
    <view class="q-foot">
      <text class="q-src">— {{ quote.source }}</text>
      <text class="swap" @tap="next">换一句</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { QUOTES, pickQuote } from '../data/quotes'

defineOptions({ options: { styleIsolation: 'apply-shared' } })
const index = ref(pickQuote())
const quote = computed(() => QUOTES[index.value])
const next = () => (index.value = pickQuote(index.value))
</script>

<style scoped>
.quote {
  padding: 14px 16px 10px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #fdf3dd 0%, #f8ecd4 60%, #f3e3c3 100%);
  border: 1px solid #eedcb6;
}
.q-text {
  display: block;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', serif;
  font-size: 17px;
  line-height: 1.7;
  color: #4a3a22;
}
.q-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.q-src { font-size: 12px; color: var(--muted); }
.swap { font-size: 12px; color: var(--gold-deep); padding: 2px 4px; flex: none; }
</style>
