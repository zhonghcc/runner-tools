// 热门目标成绩，用于一键填入
export interface Target {
  label: string
  meters: number
  seconds: number
}

export const TARGETS: Target[] = [
  { label: '全马破 4', meters: 42195, seconds: 4 * 3600 - 1 },
  { label: '全马破 3:30', meters: 42195, seconds: 3.5 * 3600 - 1 },
  { label: '全马破 3', meters: 42195, seconds: 3 * 3600 - 1 },
  { label: '半马破 2', meters: 21097.5, seconds: 2 * 3600 - 1 },
  { label: '半马破 1:45', meters: 21097.5, seconds: 1.75 * 3600 - 1 },
  { label: '10 公里破 50', meters: 10000, seconds: 50 * 60 - 1 },
  { label: '5 公里破 25', meters: 5000, seconds: 25 * 60 - 1 },
]
