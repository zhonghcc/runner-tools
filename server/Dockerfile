FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# 国内服务器上 npm 官方源较慢，可在构建时换源：docker compose build --build-arg NPM_REGISTRY=...
ARG NPM_REGISTRY=https://registry.npmjs.org/
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --registry=$NPM_REGISTRY
COPY src ./src
USER node
CMD ["node", "src/index.js"]
