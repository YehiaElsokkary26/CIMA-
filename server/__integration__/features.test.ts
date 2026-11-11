import { describe, it, expect, beforeAll } from 'vitest'
import { api, sql, asRole, filmmaker, viewer, makeFilm, wipe } from './helpers'

// Watchlist, notification badge and top genre (frontend audit, step 2).
beforeAll(wipe)

describe('watchlist', () => {
  it('save, list newest first, unsave; repeating either is harmless', async () => {
    const fm = await filmmaker()
    const a = await makeFilm(fm, { title: 'Saved First' })
    const b = await makeFilm(fm, { title: 'Saved Second' })
    const v = await viewer()

    expect((await api().get(`/api/films/${a.id}`).set(v.auth)).body.isSaved).toBe(false)
    await api().put(`/api/films/${a.id}/save`).set(v.auth).expect(200)
    await api().put(`/api/films/${a.id}/save`).set(v.auth).expect(200)
    await api().put(`/api/films/${b.id}/save`).set(v.auth).expect(200)

    const list = (await api().get('/api/films/saved').set(v.auth).expect(200)).body
    expect(list.map((f: any) => f.title)).toEqual(['Saved Second', 'Saved First'])
    expect((await api().get(`/api/films/${a.id}`).set(v.auth)).body.isSaved).toBe(true)

    await api().delete(`/api/films/${a.id}/save`).set(v.auth).expect(200)
    await api().delete(`/api/films/${a.id}/save`).set(v.auth).expect(200)
    const after = (await api().get('/api/films/saved').set(v.auth)).body
    expect(after.map((f: any) => f.id)).toEqual([b.id])
  })

  it('is private to its owner', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()
    const other = await viewer()
    await api().put(`/api/films/${film.id}/save`).set(v.auth).expect(200)

    expect((await api().get('/api/films/saved').set(other.auth)).body).toEqual([])
    expect((await api().get(`/api/films/${film.id}`).set(other.auth)).body.isSaved).toBe(false)
    expect((await api().get(`/api/films/${film.id}`)).body.isSaved).toBeUndefined()
    await api().get('/api/films/saved').expect(401)
    await expect(asRole('authenticated', v.id, 'SELECT * FROM public.saved_films')).rejects.toMatchObject({ code: '42501' })
  })

  it('rejects unknown films and disappears when the film is deleted', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const v = await viewer()
    await api().put('/api/films/99999999-9999-4999-8999-999999999999/save').set(v.auth).expect(404)
    await api().put(`/api/films/${film.id}/save`).set(v.auth).expect(200)
    await sql('DELETE FROM films WHERE id = $1', [film.id])
    expect((await api().get('/api/films/saved').set(v.auth)).body).toEqual([])
  })
})

describe('notification badge', () => {
  it('counts unread, drops when one is opened, zero after mark-all', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const [v1, v2, v3] = await Promise.all([viewer(), viewer(), viewer()])
    for (const v of [v1, v2, v3]) {
      await api().post(`/api/films/${film.id}/review`).set(v.auth).send({ body: 'Nice cut' }).expect(201)
    }

    const count = async () => (await api().get('/api/notifications/unread-count').set(fm.auth).expect(200)).body.count
    expect(await count()).toBe(3)

    const [first] = (await api().get('/api/notifications').set(fm.auth)).body
    await api().patch(`/api/notifications/${first.id}/read`).set(fm.auth).expect(200)
    expect(await count()).toBe(2)

    // Someone else's count is unaffected and can't be read.
    expect((await api().get('/api/notifications/unread-count').set(v1.auth)).body.count).toBe(0)
    await api().get('/api/notifications/unread-count').expect(401)

    await api().patch('/api/notifications/read-all').set(fm.auth).expect(200)
    expect(await count()).toBe(0)
  })
})

describe('top genre', () => {
  it('can be set, found in Discover, and cleared', async () => {
    const fm = await filmmaker('Genre Person')
    await api().patch('/api/users/me').set(fm.auth).send({ topGenre: 'Neo-Noir' }).expect(200)

    const found = (await api().get('/api/discover/filmmakers?genre=neo-noir')).body
    expect(found.map((p: any) => p.id)).toContain(fm.id)
    expect(found.find((p: any) => p.id === fm.id).topGenre).toBe('Neo-Noir')

    // Leaving it out keeps it; an empty string clears it.
    await api().patch('/api/users/me').set(fm.auth).send({ city: 'Giza' }).expect(200)
    expect((await sql('SELECT top_genre FROM profiles WHERE id = $1', [fm.id]))[0].top_genre).toBe('Neo-Noir')
    const cleared = await api().patch('/api/users/me').set(fm.auth).send({ topGenre: '' }).expect(200)
    expect(cleared.body.topGenre).toBeUndefined()
    expect((await sql('SELECT top_genre FROM profiles WHERE id = $1', [fm.id]))[0].top_genre).toBeNull()
  })
})
