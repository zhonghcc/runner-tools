// 工具清单：主页卡片从这里生成。页面路径与 pages.json 保持一致
export type IconName = 'vdot' | 'aerobic' | 'convert' | 'predict' | 'heart' | 'band' | 'plan' | 'data'

export interface ToolMeta {
  url: string
  title: string
  desc: string
  icon: IconName
  soon?: boolean
}

export const TOOLS: ToolMeta[] = [
  { url: '/pages/vdot/index', title: '跑力与训练区间', desc: '由近期成绩算出跑力，给出六档训练配速', icon: 'vdot' },
  { url: '/pages/aerobic/index', title: '有氧基础测试', desc: '上传 FIT 文件，看 90 分钟心率漂移', icon: 'aerobic' },
  { url: '/pages/convert/index', title: '配速换算', desc: '配速、用时、距离知二求一', icon: 'convert' },
  { url: '/pages/predict/index', title: '成绩预测', desc: '推算各距离成绩，诊断速度与耐力短板', icon: 'predict' },
  { url: '/pages/heart/index', title: '心率区间', desc: '最大心率法与储备心率法', icon: 'heart' },
  { url: '/pages/band/index', title: '比赛配速手环', desc: '按目标完赛时间生成分段累计时间', icon: 'band' },
  { url: '/pages/plan/index', title: '课表助手', desc: '按目标赛事生成分期课表', icon: 'plan', soon: true },
  { url: '/pages/data/index', title: '我的数据', desc: '导出、导入或清除本机保存的数据', icon: 'data' },
]
