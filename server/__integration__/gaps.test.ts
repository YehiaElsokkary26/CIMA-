import { describe, it, expect, beforeAll } from 'vitest'
import { api, sql, filmmaker, viewer, makeFilm, wipe } from './helpers'

// The five "looks like it works but doesn't" fixes from the frontend audit.
const LAST_WEEK = `date_trunc('week', now() AT TIME ZONE 'UTC')::date - 7`

beforeAll(wipe)

describe('star ratings are saved and come back', () => {
  it('GET /films/:id returns your own stars only to you', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()
    const other = await viewer()

    expect((await api().get(`/api/films/${film.id}`).set(v.auth)).body.myRating).toBeUndefined()
    await api().post(`/api/films/${film.id}/rate`).set(v.auth).send({ rating: 2 }).expect(200)
    await api().post(`/api/films/${film.id}/rate`).set(v.auth).send({ rating: 5 }).expect(200)

    const mine = (await api().get(`/api/films/${film.id}`).set(v.auth)).body
    expect(mine).toMatchObject({ myRating: 5, rating: 5, ratingCount: 1 })
    expect((await api().get(`/api/films/${film.id}`).set(other.auth)).body.myRating).toBeUndefined()
    expect((await api().get(`/api/films/${film.id}`)).body.myRating).toBeUndefined()
  })
})

describe('notes without stars', () => {
  it('posts a note with no rating and leaves the film’s rating alone', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()

    const res = await api().post(`/api/films/${film.id}/review`).set(v.auth).send({ body: 'Lovely sound design' })
    expect(res.status).toBe(201)
    expect(res.body.rating).toBeNull()

    const after = (await api().get(`/api/films/${film.id}`)).body
    expect(after.ratingCount).toBe(0)
    expect(after.rating).toBeUndefined()

    const notes = (await api().get(`/api/films/${film.id}/reviews`)).body
    expect(notes[0]).toMatchObject({ body: 'Lovely sound design', rating: null })
  })

  it('still records stars when a note includes them', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()
    await api().post(`/api/films/${film.id}/review`).set(v.auth).send({ rating: 3, body: 'Good pacing' }).expect(201)
    expect((await api().get(`/api/films/${film.id}`).set(v.auth)).body).toMatchObject({ myRating: 3, ratingCount: 1 })
  })
})

describe('role chosen at onboarding is enforced by the server', () => {
  it('a viewer who picks filmmaker can upload straight away', async () => {
    const u = await viewer()
    await api().post('/api/films').set(u.auth).send({ title: 'Too early' }).expect(403)
    await api().post('/api/users/me/role').set(u.auth).send({ role: 'filmmaker' }).expect(200)
    await makeFilm(u, { title: 'My first short' })
  })
})

describe('film of the week shows the votes that won', () => {
  it('returns last week’s tally and the real runners-up', async () => {
    await sql('TRUNCATE featured_films')
    await sql(`DELETE FROM votes WHERE week_start = ${LAST_WEEK}`)
    const fm = await filmmaker()
    const [first, second, third, fourth] = await Promise.all(['First', 'Second', 'Third', 'Fourth'].map((t) => makeFilm(fm, { title: t })))
    const voters = await Promise.all(Array.from({ length: 6 }, () => viewer()))
    const tally: [string, number][] = [[first.id, 3], [second.id, 2], [third.id, 1]]
    let i = 0
    for (const [filmId, n] of tally) {
      for (let k = 0; k < n; k++) {
        await sql(`INSERT INTO votes (film_id, user_id, week_start) VALUES ($1, $2, ${LAST_WEEK})`, [filmId, voters[i++].id])
      }
    }
    // A vote this week must not change last week's result.
    await api().post(`/api/films/${fourth.id}/vote`).set(voters[0].auth).expect(201)

    const res = await api().get('/api/films/featured/week').expect(200)
    expect(res.body).toMatchObject({ id: first.id, winningVotes: 3, votes: 0 })
    expect(res.body.runnerUps).toEqual([
      { id: second.id, title: 'Second', votes: 2 },
      { id: third.id, title: 'Third', votes: 1 },
    ])
  })
})

describe('crew status for call sheet buttons', () => {
  it('lists call sheets you sent until they are answered', async () => {
    const a = await filmmaker()
    const b = await filmmaker()
    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)

    const aView = (await api().get('/api/cima/mine').set(a.auth)).body
    expect(aView.sent).toEqual([expect.objectContaining({ id: sent.body.id, toUserId: b.id })])
    expect(aView.requests).toEqual([])

    const bView = (await api().get('/api/cima/mine').set(b.auth)).body
    expect(bView.sent).toEqual([])
    expect(bView.requests[0]).toMatchObject({ id: sent.body.id, fromUserId: a.id })

    await api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth).expect(200)
    const after = (await api().get('/api/cima/mine').set(a.auth)).body
    expect(after.sent).toEqual([])
    expect(after.members.map((m: any) => m.user.id)).toEqual([b.id])
  })
})
