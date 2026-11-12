import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { db, ids, signIn } from './helpers'

const app = createApp()

const filmRow = (over: Record<string, unknown> = {}) => ({
  id: ids.film,
  title: 'Salt and Iron',
  description: 'A blacksmith in Old Cairo.',
  thumbnail_url: null,
  video_url: 'https://cdn.example.com/v.mp4',
  trailer_url: null,
  aspect_ratio: null,
  uploader_role: 'Director',
  genre: ['Drama'],
  runtime_min: 12,
  release_year: 2026,
  uploader_id: ids.other,
  uploader_name: 'Hana',
  uploader_account_role: 'filmmaker',
  uploader_school: 'CFI',
  uploader_bio: null,
  uploader_avatar: null,
  uploader_created_at: '2026-01-01',
  week_key: '2026-W45',
  avg_rating: 4.5,
  rating_count: 2,
  votes: 7,
  laurels: 1,
  is_film_of_the_week: false,
  created_at: '2026-11-03T10:00:00Z',
  ...over,
})

// ─── Platform ─────────────────────────────────────────────────────────────────

describe('platform', () => {
  it('health check reports the database as connected', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', db: 'connected' })
  })

  it('health check returns 503 when the database is down', async () => {
    db.on(/SELECT 1/, () => { throw new Error('ECONNREFUSED') })
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(503)
  })

  it('unknown API routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('malformed JSON returns 400, not 500', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).patch('/api/users/me').set(headers).set('Content-Type', 'application/json').send('{"name":')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('BAD_JSON')
  })

  it('maps database "invalid input" errors to 400', async () => {
    db.on(/FROM\s+films f/, () => { throw Object.assign(new Error('bad'), { code: '22P02' }) })
    const res = await request(app).get('/api/films')
    expect(res.status).toBe(400)
  })

  it('does not advertise Express in headers', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})

// ─── Authentication ───────────────────────────────────────────────────────────

describe('authentication', () => {
  const protectedRoutes: Array<[string, string]> = [
    ['get', '/api/films/votes/mine'],
    ['post', `/api/films/${ids.film}/vote`],
    ['post', `/api/films/${ids.film}/rate`],
    ['post', `/api/films/${ids.film}/review`],
    ['post', '/api/films'],
    ['patch', '/api/users/me'],
    ['post', '/api/users/me/role'],
    ['get', '/api/cima/mine'],
    ['post', `/api/cima/request/${ids.other}`],
    ['post', `/api/cima/accept/${ids.request}`],
    ['post', `/api/cima/decline/${ids.request}`],
    ['get', '/api/notifications'],
    ['patch', '/api/notifications/read-all'],
  ]

  it.each(protectedRoutes)('%s %s requires a token', async (method, url) => {
    const res = await (request(app) as any)[method](url)
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', 'Bearer forged')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('TOKEN_INVALID')
  })

  it('creates a missing profile row on first request, never trusting an unknown role', async () => {
    db.on(/SELECT role FROM profiles/, () => ({ rows: [] }))
    const inserts: unknown[][] = []
    db.on(/INSERT INTO profiles/, (p) => { inserts.push(p); return { rows: [] } })
    // simulate a sign-up that sent role: 'admin' in its metadata
    const { state } = await import('./helpers')
    state.users.tok = { id: ids.me, email: 'new@test.local', user_metadata: { role: 'admin', name: 'New' } }
    const res = await request(app).get('/api/notifications').set('Authorization', 'Bearer tok')
    expect(res.status).toBe(200)
    expect(inserts[0]).toEqual([ids.me, 'New', 'new@test.local', 'viewer'])
  })
})

// ─── Films ────────────────────────────────────────────────────────────────────

describe('films', () => {
  it('lists films with weekKey, votes and laurels', async () => {
    db.on(/FROM\s+films f/, [filmRow()])
    const res = await request(app).get('/api/films')
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({
      id: ids.film, weekKey: '2026-W45', votes: 7, laurels: 1, uploaderRole: 'Director',
      uploader: { name: 'Hana', email: '' },
    })
  })

  it('passes the genre filter as a parameter, not as SQL', async () => {
    db.on(/FROM\s+films f/, [])
    await request(app).get("/api/films?genre=Drama'; DROP TABLE films;--")
    const call = db.called(/FROM\s+films f/)[0]
    expect(call.sql).not.toContain('DROP TABLE')
    expect(call.params).toEqual(["Drama'; DROP TABLE films;--", 100, 0])
  })

  it('returns 400 for a malformed film id without querying the database', async () => {
    const res = await request(app).get('/api/films/not-a-uuid')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_ID')
    expect(db.called(/FROM\s+films/)).toHaveLength(0)
  })

  it('returns 404 for a film that does not exist', async () => {
    const res = await request(app).get(`/api/films/${ids.missing}`)
    expect(res.status).toBe(404)
  })

  describe('upload (POST /api/films)', () => {
    const valid = { title: 'Bread Line', genre: ['Drama'], year: 2026, runtime: 10, videoUrl: 'https://cdn.example.com/b.mp4' }

    it('is only for filmmakers', async () => {
      const headers = signIn('v', { id: ids.me, role: 'viewer' })
      const res = await request(app).post('/api/films').set(headers).send(valid)
      expect(res.status).toBe(403)
      expect(db.called(/INSERT INTO films/)).toHaveLength(0)
    })

    it('creates the film and saves the uploader’s credit', async () => {
      const headers = signIn('f', { id: ids.me, role: 'filmmaker' })
      db.on(/INSERT INTO films/, [{ id: ids.film }])
      db.on(/FROM\s+films f/, [filmRow({ uploader_id: ids.me })])
      const res = await request(app).post('/api/films').set(headers).send({ ...valid, uploaderRole: 'Editor' })
      expect(res.status).toBe(201)
      const insert = db.called(/INSERT INTO films/)[0]
      expect(insert.params[5]).toBe(ids.me) // uploader_id comes from the token
      expect(insert.params[10]).toBe('Editor')
    })

    it('ignores an uploader id sent in the body', async () => {
      const headers = signIn('f', { id: ids.me, role: 'filmmaker' })
      db.on(/INSERT INTO films/, [{ id: ids.film }])
      await request(app).post('/api/films').set(headers).send({ ...valid, uploaderId: ids.other })
      expect(db.called(/INSERT INTO films/)[0].params[5]).toBe(ids.me)
    })

    it.each([
      ['a javascript: URL', { videoUrl: 'javascript:alert(1)' }],
      ['a data: URL', { thumbnailUrl: 'data:text/html,hi' }],
      ['a year before cinema', { year: 1500 }],
      ['an empty title', { title: '   ' }],
      ['too many genres', { genre: Array.from({ length: 30 }, (_, i) => `g${i}`) }],
      ['a negative runtime', { runtime: -4 }],
    ])('rejects %s', async (_label, patch) => {
      const headers = signIn('f', { id: ids.me, role: 'filmmaker' })
      const res = await request(app).post('/api/films').set(headers).send({ ...valid, ...patch })
      expect(res.status).toBe(422)
      expect(db.called(/INSERT INTO films/)).toHaveLength(0)
    })
  })

  describe('voting', () => {
    it('404s for a missing film', async () => {
      const headers = signIn('t', { id: ids.me })
      const res = await request(app).post(`/api/films/${ids.missing}/vote`).set(headers)
      expect(res.status).toBe(404)
      expect(db.called(/INSERT INTO votes/)).toHaveLength(0)
    })

    it('records one vote and returns the new count', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/AS open, uploader_id FROM films/, [{ open: true }])
      db.on(/INSERT INTO votes/, [{ id: 'v1' }])
      db.on(/SELECT COUNT\(\*\)::int AS c FROM votes/, [{ c: 8 }])
      const res = await request(app).post(`/api/films/${ids.film}/vote`).set(headers)
      expect(res.status).toBe(201)
      expect(res.body).toEqual({ ok: true, votes: 8 })
      expect(db.called(/INSERT INTO votes/)[0].params).toEqual([ids.film, ids.me])
    })

    it('refuses a vote for your own film', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/AS open, uploader_id FROM films/, [{ open: true, uploader_id: ids.me }])
      const res = await request(app).post(`/api/films/${ids.film}/vote`).set(headers)
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('OWN_FILM')
      expect(db.called(/INSERT INTO votes/)).toHaveLength(0)
    })

    it('refuses votes for films from earlier weeks', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/AS open, uploader_id FROM films/, [{ open: false }])
      const res = await request(app).post(`/api/films/${ids.film}/vote`).set(headers)
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('VOTING_CLOSED')
      expect(db.called(/INSERT INTO votes/)).toHaveLength(0)
    })

    it('returns 409 for a second vote in the same week', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/AS open, uploader_id FROM films/, [{ open: true }])
      db.on(/INSERT INTO votes/, () => ({ rows: [], rowCount: 0 }))
      const res = await request(app).post(`/api/films/${ids.film}/vote`).set(headers)
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('ALREADY_VOTED')
    })

    it('reports this week’s vote for the signed-in user only', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/SELECT film_id FROM votes WHERE user_id/, (p) => ({ rows: p[0] === ids.me ? [{ film_id: ids.film }] : [] }))
      const res = await request(app).get('/api/films/votes/mine').set(headers)
      expect(res.body).toEqual({ filmId: ids.film })
    })
  })

  describe('ratings and notes', () => {
    it('rating a missing film returns 404 and writes nothing', async () => {
      const headers = signIn('t', { id: ids.me })
      const res = await request(app).post(`/api/films/${ids.missing}/rate`).set(headers).send({ rating: 4 })
      expect(res.status).toBe(404)
      expect(db.called(/INSERT INTO ratings/)).toHaveLength(0)
    })

    it.each([[0], [6], [3.5], ['5']])('rejects rating %p', async (rating) => {
      const headers = signIn('t', { id: ids.me })
      const res = await request(app).post(`/api/films/${ids.film}/rate`).set(headers).send({ rating })
      expect(res.status).toBe(422)
    })

    it('accepts a short note and notifies the filmmaker', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/SELECT uploader_id, title FROM films/, [{ uploader_id: ids.other, title: 'Salt and Iron' }])
      db.on(/INSERT INTO reviews/, [{ id: 'r1', film_id: ids.film, user_id: ids.me, rating: 5, body: 'Wow', created_at: 'now' }])
      db.on(/SELECT name FROM profiles/, [{ name: 'Yehia' }])
      db.on(/SELECT id, name, role, avatar_url FROM profiles/, [{ id: ids.me, name: 'Yehia', role: 'viewer', avatar_url: null }])
      const res = await request(app).post(`/api/films/${ids.film}/review`).set(headers).send({ rating: 5, body: 'Wow' })
      expect(res.status).toBe(201)
      expect(res.body.user).toMatchObject({ id: ids.me, email: '' })
      const notif = db.called(/INSERT INTO notifications/)[0]
      expect(notif.params.slice(0, 2)).toEqual([ids.other, 'review'])
    })

    it('does not notify you about your own film', async () => {
      const headers = signIn('t', { id: ids.me })
      db.on(/SELECT uploader_id, title FROM films/, [{ uploader_id: ids.me, title: 'Mine' }])
      db.on(/INSERT INTO reviews/, [{ id: 'r1', film_id: ids.film, user_id: ids.me, rating: 4, body: 'ok!', created_at: 'now' }])
      db.on(/SELECT id, name, role, avatar_url FROM profiles/, [{ id: ids.me, name: 'Yehia', role: 'filmmaker', avatar_url: null }])
      await request(app).post(`/api/films/${ids.film}/review`).set(headers).send({ rating: 4, body: 'ok!' })
      expect(db.called(/INSERT INTO notifications/)).toHaveLength(0)
    })

    it('rejects a one-character note', async () => {
      const headers = signIn('t', { id: ids.me })
      const res = await request(app).post(`/api/films/${ids.film}/review`).set(headers).send({ rating: 4, body: 'k' })
      expect(res.status).toBe(422)
    })
  })

  describe('film of the week', () => {
    it('returns this week’s stored winner', async () => {
      db.on(/SELECT film_id FROM featured_films/, [{ film_id: ids.film }])
      db.on(/FROM\s+films f/, [filmRow({ is_film_of_the_week: true })])
      const res = await request(app).get('/api/films/featured/week')
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: ids.film, isFilmOfTheWeek: true })
      expect(db.called(/INSERT INTO featured_films/)).toHaveLength(0)
    })

    it('picks last week’s most-voted film and stores it', async () => {
      let stored: string | null = null
      db.on(/SELECT film_id FROM featured_films/, () => ({ rows: stored ? [{ film_id: stored }] : [] }))
      db.on(/FROM\s+votes\s+WHERE\s+week_start = date_trunc\('week', now\(\) AT TIME ZONE 'UTC'\)::date - 7/, [{ film_id: ids.film }])
      db.on(/INSERT INTO featured_films/, (p) => { stored = p[0] as string; return { rows: [] } })
      db.on(/FROM\s+films f/, [filmRow()])
      const res = await request(app).get('/api/films/featured/week')
      expect(res.status).toBe(200)
      expect(stored).toBe(ids.film)
      const pick = db.called(/GROUP\s+BY film_id/)[0]
      expect(pick.sql).toMatch(/ORDER\s+BY COUNT\(\*\) DESC/)
    })

    it('returns 404 when nobody voted last week', async () => {
      const res = await request(app).get('/api/films/featured/week')
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NO_WINNER')
    })
  })
})

// ─── Users ────────────────────────────────────────────────────────────────────

describe('users', () => {
  const profile = { id: ids.other, name: 'Hana', email: 'hana@private.test', role: 'filmmaker', looking_for_collaborators: true, created_at: 'x' }

  it('hides the email on someone else’s profile', async () => {
    db.on(/SELECT \* FROM profiles WHERE id/, [profile])
    db.on(/COUNT\(\*\)::int AS c/, [{ c: 0 }])
    const res = await request(app).get(`/api/users/${ids.other}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBeUndefined()
    expect(res.body.openToCollab).toBe(true)
  })

  it('shows the email on your own profile', async () => {
    const headers = signIn('t', { id: ids.other })
    db.on(/SELECT \* FROM profiles WHERE id/, [profile])
    db.on(/COUNT\(\*\)::int AS c/, [{ c: 0 }])
    const res = await request(app).get(`/api/users/${ids.other}`).set(headers)
    expect(res.body.email).toBe('hana@private.test')
  })

  it('returns 400 for a malformed user id', async () => {
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(400)
  })

  it('updates only the signed-in user', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/UPDATE profiles SET/, [{ ...profile, id: ids.me, bio: 'Hi' }])
    db.on(/COUNT\(\*\)::int AS c/, [{ c: 0 }])
    const res = await request(app).patch('/api/users/me').set(headers).send({ bio: 'Hi', crewRoles: ['Editor'] })
    expect(res.status).toBe(200)
    expect(db.called(/UPDATE profiles SET/)[0].params.at(-1)).toBe(ids.me)
  })

  it.each([
    ['a javascript: avatar', { avatarUrl: 'javascript:alert(1)' }],
    ['a 1-letter name', { name: 'A' }],
    ['a 600-character bio', { bio: 'x'.repeat(600) }],
    ['a non-boolean collab flag', { lookingForCollaborators: 'yes' }],
  ])('rejects %s', async (_label, body) => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).patch('/api/users/me').set(headers).send(body)
    expect(res.status).toBe(422)
    expect(db.called(/UPDATE profiles/)).toHaveLength(0)
  })

  it('only allows filmmaker or viewer as a role', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post('/api/users/me/role').set(headers).send({ role: 'admin' })
    expect(res.status).toBe(422)
  })
})

// ─── Crew ─────────────────────────────────────────────────────────────────────

describe('crew', () => {
  it('never sends crew members’ or requesters’ emails', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/FROM\s+cima_members cm/, [{ id: 'm1', joined_at: 'x', uid: ids.other, name: 'Hana', role: 'filmmaker', crew_roles: ['Camera'] }])
    db.on(/FROM\s+cima_requests cr/, [])
    const res = await request(app).get('/api/cima/mine').set(headers)
    expect(res.status).toBe(200)
    expect(res.body.members[0].user).toMatchObject({ id: ids.other, email: '', crewRoles: ['Camera'] })
    for (const call of db.called(/cima_/)) expect(call.sql).not.toMatch(/p\.email/)
  })

  it('rejects a request to yourself', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post(`/api/cima/request/${ids.me}`).set(headers)
    expect(res.status).toBe(400)
  })

  it('rejects a malformed user id', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post('/api/cima/request/abc').set(headers)
    expect(res.status).toBe(400)
  })

  it('404s for a user that does not exist', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post(`/api/cima/request/${ids.missing}`).set(headers)
    expect(res.status).toBe(404)
  })

  it('409s when you are already on each other’s crew', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/SELECT id FROM profiles WHERE id/, [{ id: ids.other }])
    db.on(/SELECT 1 FROM cima_members/, [{ '?column?': 1 }])
    const res = await request(app).post(`/api/cima/request/${ids.other}`).set(headers)
    expect(res.status).toBe(409)
  })

  it('409s for a request that is still pending', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/SELECT id FROM profiles WHERE id/, [{ id: ids.other }])
    db.on(/SELECT status FROM cima_requests/, [{ status: 'pending' }])
    const res = await request(app).post(`/api/cima/request/${ids.other}`).set(headers)
    expect(res.status).toBe(409)
  })

  it('sends a request and notifies the other person', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/SELECT id FROM profiles WHERE id/, [{ id: ids.other }])
    db.on(/INSERT INTO cima_requests/, [{ id: ids.request }])
    db.on(/SELECT name FROM profiles/, [{ name: 'Yehia' }])
    const res = await request(app).post(`/api/cima/request/${ids.other}`).set(headers)
    expect(res.status).toBe(201)
    expect(db.called(/INSERT INTO notifications/)[0].params.slice(0, 3)).toEqual([ids.other, 'cima_request', 'Yehia sent you a call sheet'])
  })

  it('accepting adds both people to each other’s crew', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/SELECT \* FROM cima_requests/, [{ id: ids.request, from_user_id: ids.other, to_user_id: ids.me, status: 'pending' }])
    db.on(/UPDATE cima_requests SET status = 'accepted'/, () => ({ rows: [], rowCount: 1 }))
    const res = await request(app).post(`/api/cima/accept/${ids.request}`).set(headers)
    expect(res.status).toBe(200)
    const insert = db.called(/INSERT INTO cima_members/)[0]
    expect(insert.sql).toMatch(/\(\$1,\$2\), \(\$2,\$1\)/)
    expect(insert.params).toEqual([ids.me, ids.other])
  })

  it('only accepts pending requests addressed to you', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post(`/api/cima/accept/${ids.request}`).set(headers)
    expect(res.status).toBe(404)
    const lookup = db.called(/SELECT \* FROM cima_requests/)[0]
    expect(lookup.sql).toMatch(/to_user_id = \$2 AND status = 'pending'/)
    expect(lookup.params).toEqual([ids.request, ids.me])
    expect(db.called(/INSERT INTO cima_members/)).toHaveLength(0)
  })

  it('only declines pending requests addressed to you', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).post(`/api/cima/decline/${ids.request}`).set(headers)
    expect(res.status).toBe(404)
    expect(db.called(/UPDATE cima_requests/)[0].sql).toMatch(/to_user_id = \$2 AND status = 'pending'/)
  })
})

// ─── Discover & notifications ─────────────────────────────────────────────────

describe('discover', () => {
  it('escapes LIKE wildcards in search filters', async () => {
    await request(app).get('/api/discover/filmmakers?city=100%25_')
    expect(db.called(/FROM\s+profiles p/)[0].params).toEqual(['%100\\%\\_%'])
  })

  it('returns crew roles and no emails', async () => {
    db.on(/FROM\s+profiles p/, [{ id: ids.other, name: 'Hana', email: 'hana@private.test', role: 'filmmaker', crew_roles: ['Editor'], looking_for_collaborators: true, films_count: 2, cima_count: 1 }])
    const res = await request(app).get('/api/discover/filmmakers')
    expect(res.body[0]).toMatchObject({ crewRoles: ['Editor'], openToCollab: true, email: '' })
  })
})

describe('notifications', () => {
  it('lists only the signed-in user’s notifications', async () => {
    const headers = signIn('t', { id: ids.me })
    db.on(/FROM\s+notifications n/, [])
    await request(app).get('/api/notifications').set(headers)
    expect(db.called(/FROM\s+notifications n/)[0].params).toEqual([ids.me])
  })

  it('marks one as read only when it belongs to you', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).patch(`/api/notifications/${ids.request}/read`).set(headers)
    expect(res.status).toBe(200)
    const call = db.called(/UPDATE notifications SET is_read/)[0]
    expect(call.sql).toMatch(/user_id = \$2/)
    expect(call.params).toEqual([ids.request, ids.me])
  })

  it('rejects a malformed notification id', async () => {
    const headers = signIn('t', { id: ids.me })
    const res = await request(app).patch('/api/notifications/xyz/read').set(headers)
    expect(res.status).toBe(400)
  })
})
