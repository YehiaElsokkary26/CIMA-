import EmbeddedPostgres from 'embedded-postgres'
import { Client } from 'pg'
import fs from 'fs'
import os from 'os'
import path from 'path'

const PORT = Number(process.env.IT_PG_PORT) || 54329
let pg: EmbeddedPostgres | undefined
let dir = ''

export async function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klaket-pg-'))
  pg = new EmbeddedPostgres({
    databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT,
    persistent: false, onLog: () => {}, initdbFlags: ['--encoding=UTF8', '--locale=C'],
  })
  await pg.initialise()
  await pg.start()
  await pg.createDatabase('klaket')
  // Not UTC on purpose: proves vote weeks don't depend on the server's time zone.
  const admin = new Client({ connectionString: `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres` })
  await admin.connect()
  await admin.query("ALTER DATABASE klaket SET timezone = 'Pacific/Kiritimati'")
  await admin.end()

  try {
    await prepare()
  } catch (err) {
    await teardown()
    throw err
  }
}

async function prepare() {
  const url = `postgres://postgres:postgres@127.0.0.1:${PORT}/klaket`
  const c = new Client({ connectionString: url })
  await c.connect()
  await c.query(fs.readFileSync(path.join(__dirname, 'bootstrap.sql'), 'utf8'))
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8')
  await c.query(schema)
  await c.query(schema) // must be safe to re-run
  await c.end()

  process.env.DATABASE_URL = url
  process.env.DATABASE_SSL = 'false'
}

export async function teardown() {
  await pg?.stop()
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* Windows may hold a lock */ }
}
