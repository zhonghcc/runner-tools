// MySQL 连接与建表。表结构变更只追加，不在启动时删改已有列
// 所有时间列统一存 UTC（库的默认时区是北京时间，所以写入时显式用 UTC_TIMESTAMP）
import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool({
  ...config.db,
  charset: 'utf8mb4',
  timezone: 'Z',
  connectionLimit: 5,
  waitForConnections: true,
  enableKeepAlive: true,
})

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mp_openid VARCHAR(64) NOT NULL COMMENT '小程序 openid',
    unionid VARCHAR(64) NULL COMMENT '绑定开放平台后才有',
    nickname VARCHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mp_openid (mp_openid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='跑者拾穗用户'`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) NOT NULL COMMENT '会话令牌的 SHA-256，库里不存明文',
    user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    user_agent VARCHAR(255) NULL,
    PRIMARY KEY (token_hash),
    KEY idx_user (user_id),
    KEY idx_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网页登录会话'`,
]

export async function migrate() {
  for (const sql of SCHEMA) await pool.query(sql)
}

export async function upsertUserByOpenid(openid, unionid) {
  await pool.query(
    `INSERT INTO users (mp_openid, unionid, created_at, last_login_at) VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE last_login_at = UTC_TIMESTAMP(), unionid = COALESCE(VALUES(unionid), unionid)`,
    [openid, unionid ?? null],
  )
  const [rows] = await pool.query('SELECT id, nickname, created_at FROM users WHERE mp_openid = ?', [openid])
  // 返回 id、nickname、created_at
  return rows[0]
}

export async function insertSession(tokenHash, userId, expiresAt, userAgent) {
  await pool.query('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?, ?, UTC_TIMESTAMP(), ?, ?)', [
    tokenHash,
    userId,
    expiresAt,
    userAgent?.slice(0, 255) ?? null,
  ])
}

export async function findSession(tokenHash) {
  const [rows] = await pool.query(
    `SELECT s.user_id, u.nickname, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [tokenHash],
  )
  return rows[0] ?? null
}

export async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM sessions WHERE token_hash = ?', [tokenHash])
}

export async function purgeExpiredSessions() {
  await pool.query('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()')
}
