import { describe, it, expect, beforeAll } from 'vitest'
import { api, sql, wipe } from './helpers'

/**
 * Load check, opt-in: PERF=1 npm run test:integration
 * Seeds a busy term's worth of data, then times the hot endpoints.
 */
const USERS = 2000
const FILMS = 1000
const RATINGS_PER_FILM = 30
const VOTES = 1500

async function time(label: string, fn: () => Promise<unknown>, runs = 20) {
  const ms: number[] = []
  for (let i = 0; i < runs; i++) {
    const t = performance.now()
    await fn()
    ms.push(performance.now() - t)
  }
  ms.sort((a, b) => a - b)
  const p50 = ms[Math.floor(runs / 2)]
  const p95 = ms[Math.floor(runs * 0.95)]
  console.log(`  ${label.padEnd(36)} p50 ${p50.toFixed(0).padStart(5)} ms   p95 ${p95.toFixed(0).padStart(5)} ms`)
  return { p50, p95 }
}

describe.runIf(process.env.PERF)('load check', () => {
  beforeAll(async () => {
    await wipe()
    await sql(`INSERT INTO auth.users (id, email, raw_user_meta_data)
               SELECT gen_random_uuid(), 'perf' || g || '@klaket.test',
                      jsonb_build_object('name', 'Perf ' || g, 'role', CASE WHEN g % 4 = 0 THEN 'filmmaker' ELSE 'viewer' END)
               FROM generate_series(1, ${USERS}) g`)
    await sql(`INSERT INTO films (title, uploader_id, genre)
               SELECT 'Film ' || g, (SELECT id FROM profiles WHERE role = 'filmmaker' ORDER BY id OFFSET (g % 400) LIMIT 1),
                      ARRAY[(ARRAY['Drama','Documentary','Comedy','Horror'])[1 + g % 4]]
               FROM generate_series(1, ${FILMS}) g`)
    await sql(`INSERT INTO ratings (film_id, user_id, rating)
               SELECT f.id, u.id, 1 + (abs(hashtext(f.id::text || u.id::text)) % 5)
               FROM films f
               CROSS JOIN LATERAL (SELECT id FROM profiles ORDER BY md5(f.id::text || id::text) LIMIT ${RATINGS_PER_FILM}) u`)
    await sql(`INSERT INTO votes (film_id, user_id)
               SELECT (SELECT id FROM films ORDER BY md5(p.id::text) LIMIT 1), p.id
               FROM (SELECT id FROM profiles LIMIT ${VOTES}) p`)
    await sql('ANALYZE')
  }, 300_000)

  it('times the hot endpoints', async () => {
    const [{ id: filmId }] = await sql('SELECT film_id AS id FROM votes GROUP BY film_id ORDER BY COUNT(*) DESC LIMIT 1')
    console.log(`\n  ${USERS} users · ${FILMS} films · ${FILMS * RATINGS_PER_FILM} ratings · ${VOTES} votes`)
    const list = await time('GET /api/films (all)', () => api().get('/api/films').expect(200), 10)
    await time('GET /api/films?sort=top', () => api().get('/api/films?sort=top').expect(200), 10)
    await time('GET /api/films?genre=Drama', () => api().get('/api/films?genre=Drama').expect(200), 10)
    await time('GET /api/films/:id', () => api().get(`/api/films/${filmId}`).expect(200))
    await time('GET /api/discover/filmmakers', () => api().get('/api/discover/filmmakers').expect(200))

    const body = (await api().get('/api/films')).body
    console.log(`  /api/films payload: ${body.length} films, ${(JSON.stringify(body).length / 1024).toFixed(0)} KB\n`)
    expect(list.p50).toBeLessThan(5000)
  }, 300_000)
})
