import request from 'supertest'
import { Client } from 'pg'
import { randomUUID } from 'crypto'
import { createApp } from '../app'
import { tokens } from './setup'

export const app = createApp()
export const api = () => request(app)

const URL = process.env.DATABASE_URL!
if (!/127\.0\.0\.1:54329/.test(URL)) throw new Error('Integration tests must use the local embedded Postgres')

/** Superuser connection, like the API's own pool (bypasses RLS). */
export async function sql<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const c = new Client({ connectionString: URL })
  await c.connect()
  try { return (await c.query(text, params)).rows } finally { await c.end() }
}

/**
 * Run statements as a browser client would reach PostgREST:
 * as the anon or authenticated role, with auth.uid() = sub.
 */
export async function asRole(role: 'anon' | 'authenticated', sub: string | null, text: string, params: unknown[] = []) {
  const c = new Client({ connectionString: URL })
  await c.connect()
  try {
    await c.query('BEGIN')
    await c.query(`SET LOCAL ROLE ${role}`)
    await c.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [sub ?? ''])
    const res = await c.query(text, params)
    await c.query('ROLLBACK')
    return res
  } catch (err) {
    await c.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    await c.end()
  }
}

export type TestUser = { id: string; email: string; auth: { Authorization: string } }

/** Sign up through auth.users (fires the real handle_new_user trigger). */
export async function newUser(meta: Record<string, unknown> = {}, email?: string): Promise<TestUser> {
  const id = randomUUID()
  const addr = email ?? `${id.slice(0, 8)}@klaket.test`
  await sql('INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at) VALUES ($1,$2,$3,now())', [id, addr, meta])
  const token = `tok-${id}`
  tokens.set(token, { id, email: addr, user_metadata: meta })
  return { id, email: addr, auth: { Authorization: `Bearer ${token}` } }
}

export const filmmaker = (name = 'Hana Bakkali') => newUser({ name, role: 'filmmaker' })
export const viewer = (name = 'Omar Viewer') => newUser({ name, role: 'viewer' })

export async function makeFilm(owner: TestUser, body: Record<string, unknown> = {}) {
  const res = await api().post('/api/films').set(owner.auth).send({ title: 'The Tram', genre: ['Drama'], ...body })
  if (res.status !== 201) throw new Error(`makeFilm ${res.status} ${JSON.stringify(res.body)}`)
  return res.body
}

/** Fresh slate between test files. */
export async function wipe() {
  await sql(`TRUNCATE public.featured_films, public.votes, public.ratings, public.reviews,
             public.notifications, public.cima_members, public.cima_requests, public.films CASCADE`)
  await sql('DELETE FROM storage.objects')
}
