import { describe, it, expect, beforeAll } from 'vitest'
import { api, sql, newUser, filmmaker, viewer, makeFilm, wipe } from './helpers'
import { getCurrentWeekKey } from '../../src/lib/votingUtils'

const THIS_WEEK = `date_trunc('week', now() AT TIME ZONE 'UTC')::date`
const LAST_WEEK = `${THIS_WEEK} - 7`

beforeAll(wipe)

describe('sign-up trigger (handle_new_user)', () => {
  it('creates a profile with the chosen role', async () => {
    const u = await filmmaker('Nour Said')
    const [p] = await sql('SELECT name, role, email FROM profiles WHERE id = $1', [u.id])
    expect(p).toMatchObject({ name: 'Nour Said', role: 'filmmaker', email: u.email })
  })

  it('never lets sign-up metadata grant an unknown role', async () => {
    const u = await newUser({ name: 'Mallory', role: 'admin' })
    const [p] = await sql('SELECT role FROM profiles WHERE id = $1', [u.id])
    expect(p.role).toBe('viewer')
  })

  it('falls back to the email name and caps long names', async () => {
    const blank = await newUser({ name: '   ' }, 'karim.f@klaket.test')
    const long = await newUser({ name: 'x'.repeat(500) })
    const rows = await sql('SELECT id, name FROM profiles WHERE id = ANY($1)', [[blank.id, long.id]])
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.name]))
    expect(byId[blank.id]).toBe('karim.f')
    expect(byId[long.id]).toHaveLength(100)
  })
})

describe('films', () => {
  it('filmmakers can post, viewers cannot', async () => {
    const fm = await filmmaker()
    const v = await viewer()
    const film = await makeFilm(fm, { title: 'Koshary at Dawn', runtime: 12, year: 2026, aspectRatio: '16:9' })
    expect(film).toMatchObject({ title: 'Koshary at Dawn', runtime: 12, year: 2026, votes: 0, laurels: 0, uploaderId: fm.id })
    expect(film.uploader.name).toBe('Hana Bakkali')
    expect(film.uploader.email).toBe('')

    const res = await api().post('/api/films').set(v.auth).send({ title: 'Nope' })
    expect(res.status).toBe(403)
  })

  it('weekKey from SQL matches the frontend week key', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    expect(film.weekKey).toMatch(/^\d{4}-W\d{2}$/)
    expect(film.weekKey).toBe(getCurrentWeekKey())
  })

  it('lists, filters by genre and sorts by rating', async () => {
    const fm = await filmmaker()
    const a = await makeFilm(fm, { title: 'Doc A', genre: ['Documentary'] })
    const b = await makeFilm(fm, { title: 'Doc B', genre: ['Documentary'] })
    const v1 = await viewer()
    const v2 = await viewer()
    await api().post(`/api/films/${a.id}/rate`).set(v1.auth).send({ rating: 2 }).expect(200)
    await api().post(`/api/films/${b.id}/rate`).set(v1.auth).send({ rating: 5 }).expect(200)
    await api().post(`/api/films/${b.id}/rate`).set(v2.auth).send({ rating: 4 }).expect(200)

    const docs = (await api().get('/api/films?genre=Documentary&sort=top')).body
    expect(docs.map((f: any) => f.title)).toEqual(['Doc B', 'Doc A'])
    expect(docs[0]).toMatchObject({ rating: 4.5, ratingCount: 2 })
  })

  it('counts stay right when a film has several ratings, votes and laurels', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm, { title: 'Join Check' })
    const people = await Promise.all([viewer(), viewer(), viewer()])
    for (const [i, p] of people.entries()) {
      await api().post(`/api/films/${film.id}/rate`).set(p.auth).send({ rating: i + 3 }).expect(200)
      await api().post(`/api/films/${film.id}/vote`).set(p.auth).expect(201)
    }
    await sql(`INSERT INTO featured_films (film_id, week_start) VALUES ($1, ${THIS_WEEK} - 14), ($1, ${THIS_WEEK} - 21)`, [film.id])
    const res = await api().get(`/api/films/${film.id}`).expect(200)
    expect(res.body).toMatchObject({ rating: 4, ratingCount: 3, votes: 3, laurels: 2, isFilmOfTheWeek: false })
  })

  it('rejects bad ids and unknown films', async () => {
    await api().get('/api/films/not-a-uuid').expect(400)
    await api().get('/api/films/99999999-9999-4999-8999-999999999999').expect(404)
  })
})

describe('weekly vote', () => {
  it('one vote per person per week, shown in votes/mine', async () => {
    const fm = await filmmaker()
    const a = await makeFilm(fm)
    const b = await makeFilm(fm)
    const v = await viewer()
    const first = await api().post(`/api/films/${a.id}/vote`).set(v.auth)
    expect(first.status).toBe(201)
    expect(first.body).toEqual({ ok: true, votes: 1 })
    const again = await api().post(`/api/films/${b.id}/vote`).set(v.auth)
    expect(again.status).toBe(409)
    expect(again.body.code).toBe('ALREADY_VOTED')
    const mine = await api().get('/api/films/votes/mine').set(v.auth).expect(200)
    expect(mine.body.filmId).toBe(a.id)
  })

  it('holds under concurrent double-clicks', async () => {
    const fm = await filmmaker()
    const films = await Promise.all([1, 2, 3, 4, 5].map(() => makeFilm(fm)))
    const v = await viewer()
    const results = await Promise.all(films.map((f) => api().post(`/api/films/${f.id}/vote`).set(v.auth)))
    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(4)
    const rows = await sql('SELECT COUNT(*)::int AS c FROM votes WHERE user_id = $1', [v.id])
    expect(rows[0].c).toBe(1)
  })

  it('needs sign-in', async () => {
    const fm = await filmmaker()
    const f = await makeFilm(fm)
    await api().post(`/api/films/${f.id}/vote`).expect(401)
  })
})

describe('film of the week', () => {
  it('picks last week’s most-voted film once, even under concurrent requests', async () => {
    await sql('TRUNCATE featured_films')
    await sql(`DELETE FROM votes WHERE week_start = ${LAST_WEEK}`)
    const fm = await filmmaker()
    const winner = await makeFilm(fm, { title: 'Winner' })
    const runnerUp = await makeFilm(fm, { title: 'Runner-up' })
    const voters = await Promise.all([viewer(), viewer(), viewer()])
    await sql(
      `INSERT INTO votes (film_id, user_id, week_start) VALUES ($1,$3,${LAST_WEEK}), ($1,$4,${LAST_WEEK}), ($2,$5,${LAST_WEEK})`,
      [winner.id, runnerUp.id, voters[0].id, voters[1].id, voters[2].id],
    )

    const results = await Promise.all([1, 2, 3, 4, 5].map(() => api().get('/api/films/featured/week')))
    for (const r of results) {
      expect(r.status).toBe(200)
      expect(r.body.id).toBe(winner.id)
    }
    expect(results[0].body).toMatchObject({ isFilmOfTheWeek: true, laurels: 1 })
    const rows = await sql(`SELECT COUNT(*)::int AS c FROM featured_films WHERE week_start = ${THIS_WEEK}`)
    expect(rows[0].c).toBe(1)
  })

  it('says so when nobody voted last week', async () => {
    await sql('TRUNCATE featured_films')
    await sql(`DELETE FROM votes WHERE week_start = ${LAST_WEEK}`)
    const res = await api().get('/api/films/featured/week')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NO_WINNER')
  })
})

describe('reviews, ratings and notifications', () => {
  it('a review notifies the filmmaker, who alone can mark it read', async () => {
    const fm = await filmmaker('Lina Director')
    const film = await makeFilm(fm, { title: 'Rooftop' })
    const v = await viewer('Sara Critic')

    const rv = await api().post(`/api/films/${film.id}/review`).set(v.auth).send({ rating: 4, body: 'Great framing' })
    expect(rv.status).toBe(201)
    expect(rv.body).toMatchObject({ rating: 4, body: 'Great framing', user: { name: 'Sara Critic', email: '' } })

    const list = await api().get(`/api/films/${film.id}/reviews`).expect(200)
    expect(list.body).toHaveLength(1)

    const notes = (await api().get('/api/notifications').set(fm.auth).expect(200)).body
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ type: 'review', read: false, filmId: film.id, message: 'Sara Critic left a note on "Rooftop"' })

    await api().patch(`/api/notifications/${notes[0].id}/read`).set(v.auth).expect(200)
    expect((await sql('SELECT is_read FROM notifications WHERE id = $1', [notes[0].id]))[0].is_read).toBe(false)

    await api().patch(`/api/notifications/${notes[0].id}/read`).set(fm.auth).expect(200)
    expect((await sql('SELECT is_read FROM notifications WHERE id = $1', [notes[0].id]))[0].is_read).toBe(true)
  })

  it('re-rating updates the one rating row; rating your own film sends nothing', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    await api().post(`/api/films/${film.id}/rate`).set(fm.auth).send({ rating: 5 }).expect(200)
    await api().post(`/api/films/${film.id}/rate`).set(fm.auth).send({ rating: 3 }).expect(200)
    expect(await sql('SELECT rating FROM ratings WHERE film_id = $1', [film.id])).toEqual([{ rating: 3 }])
    expect(await sql('SELECT 1 FROM notifications WHERE user_id = $1', [fm.id])).toHaveLength(0)
  })

  it('rejects out-of-range ratings', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    await api().post(`/api/films/${film.id}/rate`).set(fm.auth).send({ rating: 6 }).expect(422)
    await api().post(`/api/films/${film.id}/review`).set(fm.auth).send({ rating: 0, body: "hm" }).expect(422)
  })
})

describe('crew (cima)', () => {
  it('request → accept makes a mutual crew, with notifications both ways', async () => {
    const a = await filmmaker('Ahmed A')
    const b = await filmmaker('Bassma B')

    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth)
    expect(sent.status).toBe(201)
    await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(409)

    const inbox = (await api().get('/api/cima/mine').set(b.auth).expect(200)).body
    expect(inbox.requests).toHaveLength(1)
    expect(inbox.requests[0].from.name).toBe('Ahmed A')
    expect(JSON.stringify(inbox)).not.toContain(a.email)

    await api().post(`/api/cima/accept/${sent.body.id}`).set(a.auth).expect(404)
    await api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth).expect(200)
    await api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth).expect(404)

    const aCrew = (await api().get('/api/cima/mine').set(a.auth)).body.members
    const bCrew = (await api().get('/api/cima/mine').set(b.auth)).body.members
    expect(aCrew.map((m: any) => m.user.id)).toEqual([b.id])
    expect(bCrew.map((m: any) => m.user.id)).toEqual([a.id])

    await api().post(`/api/cima/request/${a.id}`).set(b.auth).expect(409)

    const types = await sql('SELECT type, user_id FROM notifications WHERE user_id = ANY($1) ORDER BY created_at', [[a.id, b.id]])
    expect(types).toEqual([{ type: 'cima_request', user_id: b.id }, { type: 'cima_accepted', user_id: a.id }])
  })

  it('declined requests can be sent again; you cannot ask yourself', async () => {
    const a = await filmmaker()
    const b = await filmmaker()
    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
    await api().post(`/api/cima/decline/${sent.body.id}`).set(b.auth).expect(200)
    await api().post(`/api/cima/decline/${sent.body.id}`).set(b.auth).expect(404)
    await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
    await api().post(`/api/cima/request/${a.id}`).set(a.auth).expect(400)
  })

  it('concurrent double-accept adds the crew once and notifies once', async () => {
    const a = await filmmaker()
    const b = await filmmaker()
    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
    const results = await Promise.all([1, 2, 3].map(() => api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth)))
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
    const members = await sql('SELECT COUNT(*)::int AS c FROM cima_members WHERE owner_id = ANY($1)', [[a.id, b.id]])
    expect(members[0].c).toBe(2)
    const accepted = await sql(`SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND type = 'cima_accepted'`, [a.id])
    expect(accepted[0].c).toBe(1)
  })
})

describe('users and discover', () => {
  it('email is only shown to its owner', async () => {
    const u = await filmmaker()
    const other = await viewer()
    expect((await api().get(`/api/users/${u.id}`)).body.email).toBeUndefined()
    expect((await api().get(`/api/users/${u.id}`).set(other.auth)).body.email).toBeUndefined()
    expect((await api().get(`/api/users/${u.id}`).set(u.auth)).body.email).toBe(u.email)
  })

  it('PATCH /me validates and saves', async () => {
    const u = await filmmaker()
    await api().patch('/api/users/me').set(u.auth).send({ avatarUrl: "javascript:alert(1)" }).expect(422)
    await api().patch('/api/users/me').set(u.auth).send({ city: 'Cairo', school: 'AUC', crewRoles: ['DP'], lookingForCollaborators: true }).expect(200)
    const [p] = await sql('SELECT city, school, looking_for_collaborators FROM profiles WHERE id = $1', [u.id])
    expect(p).toEqual({ city: 'Cairo', school: 'AUC', looking_for_collaborators: true })
  })

  it('switching role works and is limited to filmmaker/viewer', async () => {
    const u = await viewer()
    await api().post('/api/users/me/role').set(u.auth).send({ role: "admin" }).expect(422)
    await api().post('/api/users/me/role').set(u.auth).send({ role: 'filmmaker' }).expect(200)
    await makeFilm(u)
  })

  it('discover lists filmmakers only, and % is matched literally', async () => {
    const fm = await filmmaker('Discoverable')
    await api().patch('/api/users/me').set(fm.auth).send({ city: 'Alexandria' }).expect(200)
    const v = await viewer('Hidden Viewer')
    const all = (await api().get('/api/discover/filmmakers?city=alexandria').expect(200)).body
    expect(all.map((p: any) => p.id)).toContain(fm.id)
    expect(all.map((p: any) => p.id)).not.toContain(v.id)
    expect(JSON.stringify(all)).not.toContain(fm.email)
    const pct = (await api().get('/api/discover/filmmakers?city=%25').expect(200)).body
    expect(pct).toHaveLength(0)
  })

  it('deleting an account removes its films and their votes', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()
    await api().post(`/api/films/${film.id}/vote`).set(v.auth).expect(201)
    await sql('DELETE FROM auth.users WHERE id = $1', [fm.id])
    await api().get(`/api/films/${film.id}`).expect(404)
    expect(await sql('SELECT 1 FROM votes WHERE film_id = $1', [film.id])).toHaveLength(0)
  })
})
