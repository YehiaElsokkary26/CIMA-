/**
 * Runs all of Klaket on this machine with no real Supabase project:
 *
 *   npm run dev:local        (from the repo root)
 *
 *   database   embedded Postgres on 54330, data kept in server/local/.data
 *   supabase   local stand-in for sign-in and storage on 54321
 *   api        Express on 3097
 *   web        Vite on http://localhost:5183
 *
 * The first run applies db/schema.sql and the demo seed (accounts and
 * passwords are in db/seed.ts). Delete server/local/.data to start over.
 */
import EmbeddedPostgres from 'embedded-postgres'
import { Client } from 'pg'
import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { startFakeSupabase } from './fake-supabase'

const ROOT = path.resolve(__dirname, '..', '..')
const SERVER = path.join(ROOT, 'server')
const DATA = path.join(__dirname, '.data')
const PORTS = { pg: 54330, supabase: 54321, api: 3097, web: 5183 }

const DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORTS.pg}/klaket`
const SUPABASE_URL = `http://127.0.0.1:${PORTS.supabase}`

// Everything the API and seed need, pointed at the local pieces. These win
// over server/.env (dotenv never overrides variables that are already set).
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_URL,
  DATABASE_SSL: 'false',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: 'local-service-role-key',
  PORT: String(PORTS.api),
  VITE_SUPABASE_URL: SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: 'local-anon-key',
}
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const children: ChildProcess[] = []
const node = process.execPath
const tsx = path.join(SERVER, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function run(name: string, args: string[], cwd: string, keepAlive = true): ChildProcess {
  // stdin is ignored: Vite exits when its stdin closes.
  const child = spawn(node, args, { cwd, env, stdio: ['ignore', 'inherit', 'inherit'] })
  if (keepAlive) children.push(child)
  child.on('exit', (code) => keepAlive && console.log(`[local] ${name} exited (${code})`))
  return child
}

async function main() {
  const pgDir = path.join(DATA, 'pg')
  const fresh = !fs.existsSync(path.join(pgDir, 'PG_VERSION'))
  fs.mkdirSync(DATA, { recursive: true })

  const pg = new EmbeddedPostgres({
    databaseDir: pgDir, user: 'postgres', password: 'postgres', port: PORTS.pg,
    persistent: true, onLog: () => {}, initdbFlags: ['--encoding=UTF8', '--locale=C'],
  })
  if (fresh) await pg.initialise()
  await pg.start()
  const stop = async () => {
    children.forEach((c) => c.kill())
    await pg.stop().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  if (fresh) {
    console.log('[local] first run: creating the database and schema…')
    await pg.createDatabase('klaket')
    const c = new Client({ connectionString: DATABASE_URL })
    await c.connect()
    await c.query(fs.readFileSync(path.join(SERVER, '__integration__', 'bootstrap.sql'), 'utf8'))
    await c.query('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz')
    await c.end()
  }
  // Re-applied every start (it is idempotent) so schema changes land locally.
  const c = new Client({ connectionString: DATABASE_URL })
  await c.connect()
  await c.query(fs.readFileSync(path.join(SERVER, 'db', 'schema.sql'), 'utf8'))
  await c.end()

  await startFakeSupabase({ port: PORTS.supabase, databaseUrl: DATABASE_URL, dataDir: DATA })
  console.log(`[local] database on ${PORTS.pg}, Supabase stand-in on ${PORTS.supabase}`)

  if (fresh) {
    console.log('[local] seeding demo accounts and films…')
    await new Promise<void>((resolve, reject) => {
      run('seed', [tsx, 'db/seed.ts'], SERVER, false).on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exited ${code}`))))
    })
  }

  run('api', [tsx, 'watch', 'index.ts'], SERVER)
  run('web', [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORTS.web), '--strictPort'], ROOT)
  console.log(`\n  🎬  Local Klaket → http://localhost:${PORTS.web}   (demo accounts: server/db/seed.ts)\n`)
}

main().catch(async (err) => {
  console.error('[local] failed to start:', err?.message ?? err)
  children.forEach((c) => c.kill())
  process.exit(1)
})
