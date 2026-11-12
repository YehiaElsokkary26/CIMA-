import { describe, it, expect, beforeAll } from 'vitest'
import { api, sql, filmmaker, viewer, makeFilm, wipe } from './helpers'

// Paging, search and the voting rule (frontend audit, step 4).
beforeAll(wipe)

describe('film list paging', () => {
  it('pages through every film exactly once, newest first', async () => {
    await wipe()
    const fm = await filmmaker()
    for (let i = 1; i <= 7; i++) await makeFilm(fm, { title: `Reel ${i}` })
    // Same timestamp for all: the id tiebreak must still keep pages stable.
    await sql(`UPDATE films SET created_at = '2026-11-02T10:00:00Z'`)

    const seen: string[] = []
    for (let offset = 0; ; offset += 3) {
      const page = (await api().get(`/api/films?limit=3&offset=${offset}`).expect(200)).body
      seen.push(...page.map((f: any) => f.id))
      if (page.length < 3) break
    }
    expect(seen).toHaveLength(7)
    expect(new Set(seen).size).toBe(7)
  })

  it('caps the page size and clamps bad values', async () => {
    const fm = await filmmaker()
    for (let i = 0; i < 3; i++) await makeFilm(fm)
    expect((await api().get('/api/films?limit=1').expect(200)).body).toHaveLength(1)
    expect((await api().get('/api/films?limit=0').expect(200)).body).toHaveLength(1)
    expect((await api().get('/api/films?limit=abc&offset=-5').expect(200)).body.length).toBeGreaterThan(0)
    const huge = (await api().get('/api/films?limit=100000').expect(200)).body
    expect(huge.length).toBeLessThanOrEqual(100)
  })

  it('sorts by votes and by how discussed a film is', async () => {
    await wipe()
    const fm = await filmmaker()
    const quiet = await makeFilm(fm, { title: 'Quiet' })
    const loud = await makeFilm(fm, { title: 'Loud' })
    const people = await Promise.all([viewer(), viewer()])
    for (const p of people) {
      await api().post(`/api/films/${loud.id}/vote`).set(p.auth).expect(201)
      await api().post(`/api/films/${loud.id}/rate`).set(p.auth).send({ rating: 3 }).expect(200)
    }
    for (const sort of ['votes', 'discussed']) {
      const list = (await api().get(`/api/films?sort=${sort}`)).body
      expect(list.map((f: any) => f.id)).toEqual([loud.id, quiet.id])
    }
  })
})

describe('search', () => {
  it('finds by title, logline, genre or filmmaker, case-insensitively', async () => {
    await wipe()
    const fm = await filmmaker('Nadia Searchable')
    const a = await makeFilm(fm, { title: 'Tram at Midnight', genre: ['Drama'] })
    const b = await makeFilm(fm, { title: 'Untitled', description: 'A koshary seller in Alexandria', genre: ['Comedy'] })
    const other = await filmmaker('Someone Else')
    const c = await makeFilm(other, { title: 'Desert Light', genre: ['Neo-Noir'] })

    const ids = async (q: string) => (await api().get(`/api/films?q=${encodeURIComponent(q)}`)).body.map((f: any) => f.id).sort()
    expect(await ids('tram')).toEqual([a.id])
    expect(await ids('KOSHARY')).toEqual([b.id])
    expect(await ids('noir')).toEqual([c.id])
    expect(await ids('nadia')).toEqual([a.id, b.id].sort())
    expect(await ids('%')).toEqual([])
    expect(await ids('nothing like this')).toEqual([])
  })
})

describe('voting rule: only this week’s films', () => {
  it('lists this week’s ballot and refuses votes for older films', async () => {
    await wipe()
    const fm = await filmmaker()
    const fresh = await makeFilm(fm, { title: 'Fresh' })
    const old = await makeFilm(fm, { title: 'Old' })
    await sql(`UPDATE films SET created_at = now() - interval '14 days' WHERE id = $1`, [old.id])

    const ballot = (await api().get('/api/films?week=current')).body
    expect(ballot.map((f: any) => f.id)).toEqual([fresh.id])

    const v = await viewer()
    const refused = await api().post(`/api/films/${old.id}/vote`).set(v.auth)
    expect(refused.status).toBe(409)
    expect(refused.body.code).toBe('VOTING_CLOSED')
    expect(await sql('SELECT 1 FROM votes WHERE user_id = $1', [v.id])).toHaveLength(0)

    // The refusal doesn't use up their vote.
    await api().post(`/api/films/${fresh.id}/vote`).set(v.auth).expect(201)
  })

  it('filmmakers can’t vote for their own film', async () => {
    const fm = await filmmaker()
    const own = await makeFilm(fm)
    const res = await api().post(`/api/films/${own.id}/vote`).set(fm.auth)
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('OWN_FILM')
    // Their weekly vote is still free for someone else's film.
    const other = await makeFilm(await filmmaker())
    await api().post(`/api/films/${other.id}/vote`).set(fm.auth).expect(201)
  })
})
