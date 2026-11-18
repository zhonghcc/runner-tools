<template>
  <figure class="quote" :key="index">
    <blockquote>{{ quote.text }}</blockquote>
    <figcaption>
      <span>{{ quote.source }}</span>
      <button class="swap" type="button" title="换一句" @click="next">换一句</button>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { QUOTES, pickQuote } from '../data/quotes'

const index = ref(pickQuote())
const quote = computed(() => QUOTES[index.value])
const next = () => (index.value = pickQuote(index.value))

// 切换到另一个工具时换一句；同一工具内切换子页不换
const route = useRoute()
watch(
  () => route.path.split('/')[1],
  () => next(),
)
</script>

<style scoped>
.quote {
  margin: 16px 0;
  padding: 14px 16px 10px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #fdf3dd 0%, #f8ecd4 60%, #f3e3c3 100%);
  border: 1px solid #eedcb6;
  animation: fade 0.5s ease;
}
blockquote {
  margin: 0;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', serif;
  font-size: 1.08rem;
  line-height: 1.7;
  color: #4a3a22;
}
figcaption { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; font-size: 0.8rem; color: var(--muted); }
figcaption span::before { content: '— '; }
.swap { border: none; background: none; color: var(--gold-deep); cursor: pointer; font-size: 0.8rem; padding: 2px 4px; white-space: nowrap; }
.swap:hover { text-decoration: underline; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
</style>
