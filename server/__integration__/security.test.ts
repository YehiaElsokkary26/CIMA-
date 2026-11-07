import { describe, it, expect, beforeAll } from 'vitest'
import { sql, asRole, filmmaker, viewer, makeFilm, api, wipe, type TestUser } from './helpers'

/**
 * What someone holding the public anon key (shipped in the browser bundle)
 * can do by going straight to the database, skipping the Express API.
 */

const TABLES = ['profiles', 'films', 'featured_films', 'ratings', 'votes', 'reviews', 'cima_requests', 'cima_members', 'notifications']

let a: TestUser
let b: TestUser

beforeAll(async () => {
  await wipe()
  a = await filmmaker('Alice')
  b = await viewer('Bob')
  const film = await makeFilm(a)
  await api().post(`/api/films/${film.id}/review`).set(b.auth).send({ rating: 5, body: 'Loved it' }).expect(201)
  await api().post(`/api/films/${film.id}/vote`).set(b.auth).expect(201)
})

const denied = (p: Promise<unknown>) => expect(p).rejects.toMatchObject({ code: '42501' })

describe('table grants (least privilege)', () => {
  it('browser roles hold no privileges except SELECT on notifications', async () => {
    const rows = await sql(
      `SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
       WHERE table_schema = 'public' AND grantee IN ('anon','authenticated') ORDER BY 1,2,3`,
    )
    expect(rows).toEqual([{ table_name: 'notifications', grantee: 'authenticated', privilege_type: 'SELECT' }])
  })

  it('anon cannot read emails (or anything else) directly', async () => {
    await denied(asRole('anon', null, 'SELECT email FROM public.profiles'))
    for (const t of TABLES) await denied(asRole('anon', null, `SELECT 1 FROM public.${t} LIMIT 1`))
  })

  it('a signed-in user cannot write any table directly', async () => {
    await denied(asRole('authenticated', b.id, `UPDATE public.profiles SET role = 'filmmaker' WHERE id = $1`, [b.id]))
    await denied(asRole('authenticated', b.id, `INSERT INTO public.films (title, uploader_id) VALUES ('x', $1)`, [b.id]))
    await denied(asRole('authenticated', b.id, `INSERT INTO public.votes (film_id, user_id) SELECT id, $1 FROM public.films LIMIT 1`, [b.id]))
    await denied(asRole('authenticated', b.id, `INSERT INTO public.cima_requests (from_user_id, to_user_id) VALUES ($1, $2)`, [b.id, a.id]))
    await denied(asRole('authenticated', a.id, `UPDATE public.notifications SET is_read = true`))
    await denied(asRole('authenticated', a.id, `DELETE FROM public.notifications`))
    await denied(asRole('authenticated', b.id, 'TRUNCATE public.reviews'))
  })

  it('ballots stay secret even to signed-in users', async () => {
    await denied(asRole('authenticated', a.id, 'SELECT user_id FROM public.votes'))
  })

  it('new tables start locked down too', async () => {
    await sql('CREATE TABLE public.it_future_table (id int)')
    try {
      await denied(asRole('anon', null, 'SELECT * FROM public.it_future_table'))
    } finally {
      await sql('DROP TABLE public.it_future_table')
    }
  })
})

describe('row-level security (defence in depth)', () => {
  it('realtime notifications: each person sees only their own rows', async () => {
    const mine = await asRole('authenticated', a.id, 'SELECT user_id FROM public.notifications')
    expect(mine.rows.length).toBeGreaterThan(0)
    expect(mine.rows.every((r) => r.user_id === a.id)).toBe(true)
    const theirs = await asRole('authenticated', b.id, 'SELECT user_id FROM public.notifications')
    expect(theirs.rows).toHaveLength(0)
  })

  it('every public table has RLS on', async () => {
    const rows = await sql(`SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                            WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`)
    expect(rows).toEqual([])
  })

  it('no client write policies remain', async () => {
    const rows = await sql(`SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND cmd <> 'SELECT'`)
    expect(rows).toEqual([])
  })

  it('notifications are in the realtime publication', async () => {
    const rows = await sql(`SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'`)
    expect(rows).toHaveLength(1)
  })
})

describe('storage', () => {
  it('uploads only into your own folder', async () => {
    await asRole('authenticated', a.id, `INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', $1)`, [`${a.id}/me.png`])
    await denied(asRole('authenticated', a.id, `INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', $1)`, [`${b.id}/me.png`]))
    await denied(asRole('authenticated', a.id, `INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', 'loose.png')`))
    await denied(asRole('anon', null, `INSERT INTO storage.objects (bucket_id, name) VALUES ('films', $1)`, [`${a.id}/x.mp4`]))
  })

  it('cannot overwrite or delete someone else’s files', async () => {
    await sql(`INSERT INTO storage.objects (bucket_id, name) VALUES ('films', $1)`, [`${a.id}/cut.mp4`])
    const upd = await asRole('authenticated', b.id, `UPDATE storage.objects SET name = 'x' WHERE bucket_id = 'films'`)
    const del = await asRole('authenticated', b.id, `DELETE FROM storage.objects WHERE bucket_id = 'films'`)
    expect(upd.rowCount).toBe(0)
    expect(del.rowCount).toBe(0)
  })

  it('every bucket has a size cap and a file-type list', async () => {
    const rows = await sql('SELECT id, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id')
    expect(rows.map((r) => r.id)).toEqual(['avatars', 'banners', 'films', 'thumbnails', 'trailers'])
    for (const r of rows) {
      expect(Number(r.file_size_limit)).toBeGreaterThan(0)
      expect(r.allowed_mime_types.length).toBeGreaterThan(0)
    }
    const films = rows.find((r) => r.id === 'films')
    expect(films.allowed_mime_types).not.toContain('text/html')
  })
})
