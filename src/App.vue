<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { refreshMe } from './stores/auth'

// 启动时在后台确认一次登录状态，不阻塞页面
onLaunch(() => {
  refreshMe()
})
</script>

<style>
/* 全局样式：网页和小程序共用。单位一律用 px，两端尺寸一致 */
page {
  --bg: #fbf7ef;
  --card: #ffffff;
  --line: #ece2cf;
  --text: #3a2e1f;
  --muted: #8a7a63;
  --gold: #b7832f;
  --gold-soft: #f4e7cc;
  --gold-deep: #8e6320;
  --green: #4f7a4a;
  --red: #b5483b;
  --radius: 12px;
  --shadow: 0 1px 2px rgba(58, 46, 31, 0.06), 0 4px 16px rgba(58, 46, 31, 0.05);
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  line-height: 1.6;
}

/* 功能页：竖屏单栏，网页上最宽 520px 居中 */
.col {
  box-sizing: border-box;
  max-width: 520px;
  margin: 0 auto;
  padding: 14px 14px 8px;
}

.card {
  box-sizing: border-box;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  margin-bottom: 14px;
}

.h2 { display: block; font-size: 17px; font-weight: 600; margin-bottom: 10px; }
.h3 { display: block; font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.p { display: block; margin-bottom: 10px; }
.muted { color: var(--muted); font-size: 14px; }
.small { font-size: 12px; }
.num { font-variant-numeric: tabular-nums; }
.big { font-size: 30px; font-weight: 600; letter-spacing: 0.5px; line-height: 1.25; }
.unit { font-size: 13px; color: var(--muted); font-weight: 400; margin-left: 2px; }
.link { color: var(--gold-deep); }

/* 表单 */
.field { display: flex; flex-direction: column; margin-bottom: 12px; }
.label { font-size: 13px; color: var(--muted); margin-bottom: 4px; }
.inp {
  box-sizing: border-box;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 10px;
  background: #fffdf8;
  font-size: 15px;
}
.picker-box {
  box-sizing: border-box;
  height: 38px;
  line-height: 36px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 10px;
  background: #fffdf8;
  font-size: 15px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 38px;
  padding: 0 18px;
  margin: 0;
  border: 1px solid var(--gold);
  border-radius: 8px;
  background: var(--gold);
  color: #fff;
  font-size: 15px;
  line-height: 1;
}
.btn::after { border: none; }
.btn.ghost { background: transparent; color: var(--gold-deep); }
.btn.mini { height: 30px; padding: 0 12px; font-size: 13px; }
.btn.block { display: flex; width: 100%; }
.btn-hover { opacity: 0.85; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  border: 1px solid var(--line);
  background: #fffdf8;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--text);
}
.chip.active { border-color: var(--gold); background: var(--gold-soft); color: var(--gold-deep); }

/* 表格：用 flex 行代替 table，两端渲染一致 */
.tbl { display: flex; flex-direction: column; }
.tr { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.tr:last-child { border-bottom: none; }
.tr.head { padding: 4px 0 6px; }
.tr.head .td { color: var(--muted); font-size: 12px; }
.tr.hl .td { color: var(--gold-deep); font-weight: 600; }
.td { flex: 1; min-width: 0; font-size: 14px; font-variant-numeric: tabular-nums; }
.td.w2 { flex: 2; }
.td.w15 { flex: 1.5; }

.badge {
  display: inline-block;
  font-size: 12px;
  line-height: 18px;
  border-radius: 6px;
  padding: 0 7px;
  background: var(--gold-soft);
  color: var(--gold-deep);
  font-weight: 600;
  margin-right: 4px;
}

.notice {
  display: block;
  border-left: 3px solid var(--gold);
  background: #fdf8ee;
  padding: 9px 12px;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  margin: 10px 0;
}
.notice.error { border-color: var(--red); background: #fbf0ee; }
.notice.ok { border-color: var(--green); background: #f1f6ef; }

.row { display: flex; flex-wrap: wrap; gap: 12px; }
.row > .field { flex: 1 1 140px; }
.grid3 { display: flex; flex-wrap: wrap; }
.grid3 > .cell { width: 33.33%; margin-bottom: 12px; display: flex; flex-direction: column; }
.grid2 > .cell { width: 50%; }
.cell-v { font-size: 18px; font-weight: 600; }

.ol { display: flex; flex-direction: column; }
.ol .li { display: flex; font-size: 13px; margin-bottom: 6px; }
.ol .li .n { flex: none; width: 18px; color: var(--gold-deep); }

/* #ifdef H5 */
@media (min-width: 960px) {
  html.home-dark, html.home-dark body, html.home-dark uni-page-body { background: #0d0b08; }
}
@media print {
  .no-print { display: none !important; }
  uni-page-head { display: none !important; }
  .card { box-shadow: none; border: none; padding: 0; }
}
/* #endif */
</style>
