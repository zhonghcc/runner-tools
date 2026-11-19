// 工具清单：主页卡片、路由标题都从这里取，增删工具只改这一处
import type { Component } from 'vue'

export interface ToolMeta {
  path: string
  title: string
  desc: string
  icon: IconName
  soon?: boolean
  load: () => Promise<{ default: Component }>
}

export type IconName = 'vdot' | 'aerobic' | 'convert' | 'predict' | 'heart' | 'band' | 'plan' | 'data'

export const TOOLS: ToolMeta[] = [
  { path: '/vdot', title: '跑力与训练区间', desc: '由近期成绩算出跑力，给出六档训练配速', icon: 'vdot', load: () => import('../views/tools/VdotView.vue') },
  { path: '/aerobic', title: '有氧基础测试', desc: '上传 FIT 文件，看 90 分钟心率漂移', icon: 'aerobic', load: () => import('../views/tools/AerobicView.vue') },
  { path: '/convert', title: '配速换算', desc: '配速、用时、距离知二求一', icon: 'convert', load: () => import('../views/tools/ConvertView.vue') },
  { path: '/predict', title: '成绩预测', desc: '推算各距离成绩，诊断速度与耐力短板', icon: 'predict', load: () => import('../views/tools/PredictView.vue') },
  { path: '/heart', title: '心率区间', desc: '最大心率法与储备心率法', icon: 'heart', load: () => import('../views/tools/HeartView.vue') },
  { path: '/band', title: '比赛配速手环', desc: '按目标完赛时间生成分段，可打印', icon: 'band', load: () => import('../views/tools/BandView.vue') },
  { path: '/plan', title: '课表助手', desc: '按目标赛事生成分期课表', icon: 'plan', soon: true, load: () => import('../views/tools/PlanView.vue') },
  { path: '/data', title: '我的数据', desc: '导出、导入或清除本机保存的数据', icon: 'data', load: () => import('../views/tools/DataView.vue') },
]
