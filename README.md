# 跑者拾穗

跑者工具集，访问地址：[run.zhonghcc.com](https://run.zhonghcc.com)。所有计算在浏览器里完成，成绩和测试记录目前只存在用户自己的设备上。代码基于 uni-app（Vue 3 + Vite + TypeScript），一份源码同时编译成网页和微信小程序。可选的微信登录由一个小后端提供，用于以后的跨设备同步。

## 一份代码两端

```bash
npm run dev:h5      # 网页开发
npm run dev:mp      # 小程序开发，用微信开发者工具打开 dist/dev/mp-weixin
npm run build:h5    # 网页产物 dist/build/h5
npm run build:mp    # 小程序产物 dist/build/mp-weixin
npm test            # 计算库单元测试
```

两端差异集中在 `src/utils/platform.ts`（选文件、导出文件、打印）和少量条件编译（`#ifdef H5` / `#ifdef MP-WEIXIN`）：

| 能力 | 网页 | 小程序 |
|---|---|---|
| 选 FIT 文件 | 文件选择框、拖拽 | 从微信聊天记录选择 |
| 心率配速曲线 | SVG | canvas 2D（同一套绘图数据，见 `src/core/chart.ts`） |
| 登录 | 显示小程序码，扫码确认，HttpOnly Cookie | 微信一键登录，Bearer 令牌 |
| 导出数据 | 下载 JSON | 发到微信聊天 |
| 配速手环 | 可打印 | 截屏 |
| PC 深色主页与卡片照明 | 有 | 无 |
| 离线可用 | Service Worker | 小程序本身 |

FIT SDK 在小程序里只引入解码器；`src/core/textcodec.ts` 补齐小程序缺少的 TextDecoder，`vite.config.ts` 把 SDK 里的 BigInt 字面量改写为 `BigInt()` 调用以便降级编译。

## 页面结构

- **主页**：适配 PC 与手机竖屏，所有工具以卡片排列（手机两列、平板三列、PC 四列）。宽度 960px 以上切换为深色背景，鼠标在卡片区移动时，所在卡片内有跟随光源的柔光，相邻卡片的边框也会被照亮。名言只在主页播报
- **功能页**：每个工具一个独立页面（`src/pages/*/index.vue`），按手机竖屏设计为单栏（最宽 520px，PC 上居中），顶部只有返回主页，工具之间不互相挂标签。表格按容器宽度而不是屏幕宽度隐藏次要列
- 工具清单集中在 `src/data/tools.ts`（主页卡片），页面路径在 `src/pages.json`

## 功能

- **配速类**
  - 跑力与训练区间：由一个近期比赛成绩算出跑力值（Daniels 公式），给出 E、M、T、A、I、R 六档训练配速和各距离等效成绩，附热门目标快捷入口
  - 配速换算：配速、用时、距离知二求一，每英里配速、400 米单圈，跑步机时速对照表
  - 成绩预测与强弱项：按跑力和 Riegel 公式推算其他距离；比较两个距离的跑力，判断速度和耐力哪项是短板
  - 心率区间：最大心率法与储备心率法，附实测方法
  - 比赛配速手环：匀速或后程加速，按公里或 5 公里列出累计时间，可打印
- **有氧基础测试**：上传 FIT 文件（或佳明导出的 zip），按心率漂移法判定有氧基础，同时给出有氧解耦率、配速波动、停顿检查和每分钟心率配速曲线
- **课表助手**：筹备中
- 每个页面顶部播报一句跑步、坚持主题的名言，内容在 `src/data/quotes.ts` 里维护

## 目录结构

```
src/
  core/        计算库，不依赖界面，全部有单元测试
    vdot.ts      跑力值公式（Daniels & Gilbert）
    zones.ts     六档训练区间
    pace.ts      配速换算、Riegel 公式
    heartRate.ts 心率区间
    paceBand.ts  配速手环
    diagnosis.ts 强弱项诊断
    fit.ts       FIT 文件解析（@garmin/fitsdk）
    aerobic.ts   有氧基础测试：停顿识别、心率清洗、漂移与解耦计算
  data/        名言库、热门目标
  stores/      本地存储（跑者档案、有氧测试记录、导入导出）
  data/tools.ts  工具清单（主页卡片与路由）
  components/  ToolLayout 功能页竖屏外壳、QuoteBar 名言、ToolIcon 图标等
  views/       HomeView 主页；tools/ 下每个工具一个页面
tests/         单元测试；有氧测试用 FIT SDK 编码器合成记录来验证
```

## 微信登录

个人主体无法使用微信开放平台的网站扫码登录，这里用个人小程序实现：

1. 网页请求 `POST /api/auth/qr`，后端生成一次性票据，调用 `getwxacodeunlimit` 生成指向小程序登录页的小程序码，票据放在 `scene` 里；同时返回只留在该浏览器的 `pollSecret`
2. 用户用微信扫码进入小程序 `pages/login/index`，点「确认登录」，小程序把 `wx.login` 的 code 和票据发给后端
3. 后端用 code 换 openid，建立或找到用户，票据标记为已确认
4. 网页凭 `pollSecret` 轮询到确认结果，后端写入 HttpOnly 会话 Cookie；票据只能领取一次

票据只在内存里，5 分钟过期；会话令牌在库里只存 SHA-256。

```
server/       后端（Node 20 + mysql2，零框架），只监听本机，由 Web 服务器反代 /api/
  src/index.js     路由
  src/tickets.js   扫码票据与限流（有单元测试）
  src/wechat.js    access_token（稳定版）、code2session、小程序码
  src/db.js        建表与查询（users、sessions）
```

后端配置全部来自环境变量（数据库、`MP_APPID`、`MP_SECRET`、`MP_ENV_VERSION`），见 `server/src/config.js`；密钥不进仓库。

## 有氧基础测试的判定

方法与 RQ 跑力的有氧基础检测一致：以 E 配速稳定跑满 90 分钟，心率漂移 =（B − A）÷ A，A、B 为第 10 分钟与第 90 分钟前后各 30 秒的平均心率。5% 以内为优秀，10% 以内为良好。

- 停下的时间不计入有效时长。停表、记录中断超过 10 秒、速度低于 0.8 米/秒都算停下
- 单次停下超过 30 秒或累计超过 90 秒，判为不符合检测条件
- 60 到 90 分钟的记录也计算，但标为非标准时长
- 心率剔除 40 以下、230 以上，以及比前 10 个有效值中位数突跳 30 以上的点

## 本地开发

```bash
npm install
npm run dev:h5   # 网页开发服务器，/api 转给本机 3100 端口
npm test         # 单元测试
npm run build    # 类型检查并构建两端
```

## 部署

`npm run build:h5` 产出的 `dist/build/h5/` 是纯静态文件，可以放在任何静态托管上。Web 服务器需要把找不到的路径回落到 `index.html`（单页应用的前端路由），`index.html` 与 `sw.js` 建议不缓存。

## 已知差异

跑力值采用 Daniels 公开公式，与 RQ 跑力的刻度不同：全马 3:59:59 这里约 37.9，RQ 为 40.66。E 配速也因此比 RQ 的第一区慢一些，同一个破 4 成绩，这里 E 为 6:06–7:17，RQ 为 5:50–6:34。
