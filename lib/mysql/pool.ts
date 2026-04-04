import mysql from 'mysql2/promise'
import type { Pool } from 'mysql2/promise'

declare global {
  var __taskifyMysqlPool: Pool | undefined
}

function getDbConfigFromEnv() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL not set')
  }

  const parsed = new URL(url)
  const configuredLimit = Number.parseInt(
    process.env.MYSQL_POOL_LIMIT || '2',
    10
  )
  const connectionLimit = Number.isNaN(configuredLimit)
    ? 2
    : Math.min(Math.max(configuredLimit, 1), 4)

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit,
    maxIdle: connectionLimit,
    idleTimeout: 10000,
    enableKeepAlive: true,
    queueLimit: 0,
  }
}

export function getMysqlPool() {
  if (!globalThis.__taskifyMysqlPool) {
    globalThis.__taskifyMysqlPool = mysql.createPool(getDbConfigFromEnv())
  }

  return globalThis.__taskifyMysqlPool
}
