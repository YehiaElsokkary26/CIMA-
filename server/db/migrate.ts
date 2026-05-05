/**
 * Run this once to create all tables in your Neon database.
 * Usage: npm run migrate   (from inside /server)
 */
import fs from 'fs'
import path from 'path'
import { pool } from './index'

async function migrate() {
  console.log('🔄  Running migrations…')
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

  try {
    await pool.query(sql)
    console.log('✅  Migration complete.')
  } catch (err) {
    console.error('❌  Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
