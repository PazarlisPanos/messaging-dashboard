import { Pool, PoolConfig } from 'pg'

declare global {
  var _pgCentralPool: Pool | undefined
  var _pgClientPools: Map<string, Pool> | undefined
}

function createCentralPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

const centralPool = globalThis._pgCentralPool ?? createCentralPool()
if (process.env.NODE_ENV !== 'production') globalThis._pgCentralPool = centralPool
export default centralPool

// Parse a postgresql:// URL into a PoolConfig object
// This avoids pg-connection-string issues with special chars in passwords
function parseDbUrl(url: string): PoolConfig {
  try {
    const u = new URL(url)
    return {
      host:     u.hostname,
      port:     u.port ? parseInt(u.port) : 5432,
      database: u.pathname.replace(/^\//, ''),
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      max: 3,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    }
  } catch {
    // fallback: pass as-is and hope for the best
    return {
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    }
  }
}

const clientPools: Map<string, Pool> =
  globalThis._pgClientPools ?? new Map()
if (process.env.NODE_ENV !== 'production') globalThis._pgClientPools = clientPools

export function getClientPool(databaseUrl: string): Pool {
  if (!clientPools.has(databaseUrl)) {
    const config = parseDbUrl(databaseUrl)
    const pool = new Pool(config)
    clientPools.set(databaseUrl, pool)
  }
  return clientPools.get(databaseUrl)!
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await centralPool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function clientQuery<T = Record<string, unknown>>(
  databaseUrl: string,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getClientPool(databaseUrl)
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}
