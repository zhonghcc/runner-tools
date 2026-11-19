// 配置全部来自环境变量，密钥只放在服务器上的 .env，不进代码仓库

const env = process.env

export const config = {
  port: Number(env.PORT || 3100),
  host: env.HOST || '127.0.0.1',
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME || 'runner',
    user: env.DB_USER || 'runner',
    password: env.DB_PASSWORD || '',
  },
  mp: {
    appid: env.MP_APPID || '',
    secret: env.MP_SECRET || '',
    // 小程序码打开的版本：develop 开发版 / trial 体验版 / release 正式版
    envVersion: ['develop', 'trial', 'release'].includes(env.MP_ENV_VERSION) ? env.MP_ENV_VERSION : 'trial',
    loginPage: 'pages/login/index',
  },
  // 扫码票据 5 分钟有效，登录会话 30 天
  ticketTtlMs: 5 * 60 * 1000,
  sessionTtlMs: 30 * 24 * 3600 * 1000,
  cookieName: 'rt_session',
  // 本机开发时用 http，不能带 Secure
  cookieSecure: env.COOKIE_SECURE !== '0',
}

export const mpConfigured = () => Boolean(config.mp.appid && config.mp.secret)
