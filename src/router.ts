import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { TOOLS } from './data/tools'

// 主页一种布局（适配 PC 与竖屏），每个工具一个独立页面（竖屏单栏），工具之间不互相挂标签
export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/', component: HomeView, meta: { layout: 'home' } },
    ...TOOLS.map((t) => ({ path: t.path, component: t.load, meta: { layout: 'tool', title: t.title } })),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · 跑者拾穗` : '跑者拾穗'
})
