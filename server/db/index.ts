import { Pool, PoolClient, QueryResult } from 'pg'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

// ---- Validation -------------------------------------------------------------

const missing: string[] = []
if (!process.env.DATABASE_URL)              missing.push('DATABASE_URL')
if (!process.env.SUPABASE_URL)             missing.push('SUPABASE_URL')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')

if (missing.length) {
  console.error(`❌  Missing env vars in server/.env: ${missing.join(', ')}`)
  console.error('   Copy server/.env.example → server/.env and fill in your values.')
  process.exit(1)
}

// ---- Supabase Admin Client --------------------------------------------------
// Uses the SERVICE_ROLE key — bypasses RLS, never expose to browser.

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
)

// ---- PostgreSQL Pool (direct DB connection) ---------------------------------
// Use Supabase's "Transaction" pooler URL (port 6543) for serverless,
// or the "Session" pooler (port 5432) for long-lived Node.js processes.

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis:    30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err)
})

// ---- Helpers ----------------------------------------------------------------

/** Execute a single parameterised query */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    if (process.env.LOG_QUERIES === 'true') {
      console.log('query', { text: text.slice(0, 80), duration: Date.now() - start, rows: res.rowCount })
    }
    return res
  } catch (err) {
    console.error('DB query error:', { text: text.slice(0, 120), params })
    throw err
  }
}

/** Borrow a client for manual multi-step operations */
export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

/** Run multiple queries in a single transaction (auto-commit/rollback) */
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

export default { query, transaction, pool, supabaseAdmin }
