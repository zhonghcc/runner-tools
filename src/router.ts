import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: HomeView, meta: { title: '' } },
    {
      path: '/pace',
      component: () => import('./views/PaceView.vue'),
      redirect: '/pace/vdot',
      children: [
        { path: 'vdot', component: () => import('./views/pace/VdotPanel.vue'), meta: { title: '跑力与训练区间' } },
        { path: 'convert', component: () => import('./views/pace/ConvertPanel.vue'), meta: { title: '配速换算' } },
        { path: 'predict', component: () => import('./views/pace/PredictPanel.vue'), meta: { title: '成绩预测与强弱项' } },
        { path: 'heart', component: () => import('./views/pace/HeartPanel.vue'), meta: { title: '心率区间' } },
        { path: 'band', component: () => import('./views/pace/BandPanel.vue'), meta: { title: '比赛配速手环' } },
      ],
    },
    { path: '/aerobic', component: () => import('./views/AerobicView.vue'), meta: { title: '有氧基础测试' } },
    { path: '/plan', component: () => import('./views/PlanView.vue'), meta: { title: '课表助手' } },
    { path: '/data', component: () => import('./views/DataView.vue'), meta: { title: '我的数据' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · 跑者拾穗` : '跑者拾穗'
})
