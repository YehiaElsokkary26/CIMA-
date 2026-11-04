import 'dotenv/config'
import { createApp } from './app'
import { pool } from './db'

const PORT = parseInt(process.env.PORT || '3001', 10)
const app = createApp()

const server = app.listen(PORT, async () => {
  let db = 'checking…'
  try {
    await pool.query('SELECT 1')
    db = 'connected'
  } catch (err: any) {
    db = `NOT reachable (${err?.code ?? err?.message ?? 'unknown error'})`
  }
  console.log(`\n  🎬  Klaket API  →  http://localhost:${PORT}/api   ·   database: ${db}\n`)
})

// Close the HTTP server and the DB pool cleanly on Ctrl+C / platform shutdown.
const shutdown = () => {
  server.close(() => {
    pool.end().finally(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default app
