#!/usr/bin/env bash
# 本机执行：测试、构建，并把静态文件同步到服务器上的宝塔站点目录
#   用法：deploy/deploy.sh
# 依赖：~/.ssh/config 中已配置 Host zhonghcc-lh，指向部署服务器；也可用 DEPLOY_HOST 覆盖
# 前提：宝塔里已建好 run.zhonghcc.com 站点（目录如下），伪静态已粘贴 deploy/baota-site.conf
set -euo pipefail

HOST="${DEPLOY_HOST:-zhonghcc-lh}"
SITE_DIR="${SITE_DIR:-/www/wwwroot/run.zhonghcc.com}"

cd "$(dirname "$0")/.."

# 排除宝塔自己维护的文件：.user.ini 带不可删除属性，.well-known 用于证书续签
EXCLUDES=(--exclude '.user.ini' --exclude '.htaccess' --exclude '.well-known' --exclude '404.html')

[ -d node_modules ] || npm ci
echo ">> 运行测试"
npm test
echo ">> 构建"
npm run build

echo ">> 检查服务器上的站点目录"
ssh "${HOST}" "test -d ${SITE_DIR}" || { echo "服务器上没有 ${SITE_DIR}，请先在宝塔添加站点"; exit 1; }

echo ">> 上传到 ${HOST}:${SITE_DIR}"
rsync -az --delete "${EXCLUDES[@]}" dist/ "${HOST}:${SITE_DIR}/"
ssh "${HOST}" "chown -R www:www ${SITE_DIR} 2>/dev/null || true"
echo ">> 完成"
