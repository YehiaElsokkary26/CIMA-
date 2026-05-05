import { Pool, PoolClient, QueryResult } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Create server/.env with your Neon connection string.')
  process.exit(1)
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err)
})

// ---- helpers ----------------------------------------------------------------

/** Execute a single query */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (process.env.LOG_QUERIES === 'true') {
      console.log('query', { text: text.slice(0, 80), duration, rows: res.rowCount })
    }
    return res
  } catch (err) {
    console.error('DB query error:', { text: text.slice(0, 120), params })
    throw err
  }
}

/** Get a client for manual transactions */
export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

/** Run multiple queries in a transaction */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export default { query, transaction, pool }
