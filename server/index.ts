import 'dotenv/config'
import { createApp } from './app'
import { pool } from './db'

const PORT = parseInt(process.env.PORT || '3001', 10)
const app = createApp()

/** Try the database a few times so one slow or flaky connection doesn't look like an outage. */
async function checkDatabase(attempts = 3): Promise<string> {
  let last = ''
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1')
      return 'connected'
    } catch (err: any) {
      last = err?.code ?? err?.message ?? 'unknown error'
      if (i < attempts) await new Promise((r) => setTimeout(r, 2000))
    }
  }
  return `NOT reachable after ${attempts} tries (${last}). Check DATABASE_URL in server/.env and your internet connection.`
}

const server = app.listen(PORT, async () => {
  console.log(`\n  🎬  Klaket API  →  http://localhost:${PORT}/api   ·   checking database…`)
  console.log(`  🎬  database: ${await checkDatabase()}\n`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${PORT} is already in use: the API is probably already running in another terminal.\n`)
    process.exit(1)
  }
  throw err
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
