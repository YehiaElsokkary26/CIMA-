/**
 * Runs schema.sql against your Supabase database.
 *
 * Usage (from inside /server):
 *   npm run migrate
 *
 * Alternatively, paste schema.sql directly into the Supabase SQL Editor
 * (Dashboard → SQL Editor → New query) for a one-click setup.
 */
import fs from 'fs'
import path from 'path'
import { pool } from './index'

async function migrate() {
  console.log('🔄  Running Cima migrations…')
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

  try {
    await pool.query(sql)
    console.log('✅  Migration complete — all tables and triggers are ready.')
  } catch (err: any) {
    console.error('❌  Migration failed:', err?.message ?? err)
    console.error('    Tip: make sure DATABASE_URL and SUPABASE_URL are set in server/.env')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
