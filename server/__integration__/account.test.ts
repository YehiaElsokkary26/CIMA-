import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { api, sql, filmmaker, viewer, makeFilm, wipe } from './helpers'
import { storage } from './setup'

// Account features (frontend audit, step 3): delete account, edit/delete
// films and notes, and crew management.
const PUBLIC = 'https://proj.supabase.co/storage/v1/object/public'

beforeAll(wipe)
beforeEach(() => storage.reset())

describe('delete account', () => {
  it('needs the confirmation word', async () => {
    const u = await viewer()
    await api().delete('/api/users/me').set(u.auth).send({}).expect(422)
    await api().delete('/api/users/me').set(u.auth).send({ confirm: 'delete' }).expect(422)
    await api().delete('/api/users/me').send({ confirm: 'DELETE' }).expect(401)
    expect(await sql('SELECT 1 FROM profiles WHERE id = $1', [u.id])).toHaveLength(1)
  })

  it('removes the account, everything that hangs off it, and only its own files', async () => {
    const me = await filmmaker('Leaving')
    const other = await filmmaker('Staying')
    const film = await makeFilm(me)
    const theirFilm = await makeFilm(other)
    await api().post(`/api/films/${theirFilm.id}/review`).set(me.auth).send({ rating: 4, body: 'Bye note' }).expect(201)
    await api().post(`/api/films/${theirFilm.id}/vote`).set(me.auth).expect(201)
    const sent = await api().post(`/api/cima/request/${other.id}`).set(me.auth).expect(201)
    await api().post(`/api/cima/accept/${sent.body.id}`).set(other.auth).expect(200)

    storage.put('films', `${me.id}/cut.mp4`)
    storage.put('avatars', `${me.id}/me.png`)
    storage.put('avatars', `${other.id}/them.png`)

    const res = await api().delete('/api/users/me').set(me.auth).send({ confirm: 'DELETE' }).expect(200)
    expect(res.body).toEqual({ ok: true, filesRemoved: 2 })

    expect(await sql('SELECT 1 FROM profiles WHERE id = $1', [me.id])).toHaveLength(0)
    expect(await sql('SELECT 1 FROM films WHERE id = $1', [film.id])).toHaveLength(0)
    expect(await sql('SELECT 1 FROM reviews WHERE user_id = $1', [me.id])).toHaveLength(0)
    expect(await sql('SELECT 1 FROM votes WHERE user_id = $1', [me.id])).toHaveLength(0)
    expect(await sql('SELECT 1 FROM cima_members WHERE owner_id = $1 OR member_id = $1', [me.id])).toHaveLength(0)
    expect(storage.files.get('avatars')?.has(`${other.id}/them.png`)).toBe(true)
    await api().get(`/api/films/${theirFilm.id}`).expect(200)
  })
})

describe('edit and delete your films', () => {
  it('only the uploader can edit; fields can be changed or cleared', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm, { title: 'Old Title', runtime: 12, year: 2025, description: 'Old' })
    const v = await viewer()

    await api().patch(`/api/films/${film.id}`).set(v.auth).send({ title: 'Hijack' }).expect(403)
    await api().patch(`/api/films/${film.id}`).set(fm.auth).send({}).expect(422)
    await api().patch(`/api/films/${film.id}`).set(fm.auth).send({ genre: [] }).expect(422)

    const res = await api().patch(`/api/films/${film.id}`).set(fm.auth)
      .send({ title: 'New Title', genre: ['Comedy'], runtime: null, description: '' }).expect(200)
    expect(res.body).toMatchObject({ title: 'New Title', genre: ['Comedy'], year: 2025 })
    expect(res.body.runtime).toBeUndefined()
    expect(res.body.description).toBeUndefined()
  })

  it('delete removes the film, its votes and saves, and only the uploader’s files', async () => {
    const fm = await filmmaker()
    const someoneElse = await filmmaker()
    const film = await makeFilm(fm, {
      videoUrl: `${PUBLIC}/films/${fm.id}/cut.mp4`,
      thumbnailUrl: `${PUBLIC}/thumbnails/${fm.id}/poster.png`,
      // A URL pointing at someone else's file must never be deleted.
      trailerUrl: `${PUBLIC}/trailers/${someoneElse.id}/theirs.mp4`,
    })
    storage.put('films', `${fm.id}/cut.mp4`)
    storage.put('thumbnails', `${fm.id}/poster.png`)
    storage.put('trailers', `${someoneElse.id}/theirs.mp4`)
    const v = await viewer()
    await api().post(`/api/films/${film.id}/vote`).set(v.auth).expect(201)
    await api().put(`/api/films/${film.id}/save`).set(v.auth).expect(200)

    await api().delete(`/api/films/${film.id}`).set(v.auth).expect(403)
    const res = await api().delete(`/api/films/${film.id}`).set(fm.auth).expect(200)
    expect(res.body.filesRemoved).toBe(2)
    expect(storage.files.get('trailers')?.has(`${someoneElse.id}/theirs.mp4`)).toBe(true)

    await api().get(`/api/films/${film.id}`).expect(404)
    expect(await sql('SELECT 1 FROM votes WHERE film_id = $1', [film.id])).toHaveLength(0)
    expect((await api().get('/api/films/saved').set(v.auth)).body).toEqual([])
    await api().delete(`/api/films/${film.id}`).set(fm.auth).expect(404)
  })
})

describe('edit and delete your notes', () => {
  it('author can edit text and stars, and delete; others cannot', async () => {
    const fm = await filmmaker()
    const film = await makeFilm(fm)
    const author = await viewer()
    const other = await viewer()
    const note = (await api().post(`/api/films/${film.id}/review`).set(author.auth).send({ body: 'First take' }).expect(201)).body

    await api().patch(`/api/films/${film.id}/reviews/${note.id}`).set(other.auth).send({ body: 'Vandal' }).expect(404)
    const edited = await api().patch(`/api/films/${film.id}/reviews/${note.id}`).set(author.auth).send({ body: 'Second take', rating: 4 }).expect(200)
    expect(edited.body).toMatchObject({ body: 'Second take', rating: 4 })
    expect((await api().get(`/api/films/${film.id}`).set(author.auth)).body.myRating).toBe(4)

    const cleared = await api().patch(`/api/films/${film.id}/reviews/${note.id}`).set(author.auth).send({ body: 'Third take', rating: null }).expect(200)
    expect(cleared.body.rating).toBeNull()

    await api().delete(`/api/films/${film.id}/reviews/${note.id}`).set(other.auth).expect(404)
    await api().delete(`/api/films/${film.id}/reviews/${note.id}`).set(author.auth).expect(200)
    expect((await api().get(`/api/films/${film.id}/reviews`)).body).toEqual([])
    // Stars are a separate rating and stay.
    expect((await api().get(`/api/films/${film.id}`).set(author.auth)).body.myRating).toBe(4)
  })
})

describe('crew management', () => {
  it('sent call sheets show who they went to and can be cancelled', async () => {
    const a = await filmmaker('Sender')
    const b = await filmmaker('Receiver')
    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)

    const mine = (await api().get('/api/cima/mine').set(a.auth)).body
    expect(mine.sent[0]).toMatchObject({ id: sent.body.id, toUserId: b.id, to: { id: b.id, name: 'Receiver' } })
    expect(JSON.stringify(mine.sent)).not.toContain(b.email)

    await api().post(`/api/cima/cancel/${sent.body.id}`).set(b.auth).expect(404)
    await api().post(`/api/cima/cancel/${sent.body.id}`).set(a.auth).expect(200)
    await api().post(`/api/cima/cancel/${sent.body.id}`).set(a.auth).expect(404)

    expect((await api().get('/api/cima/mine').set(a.auth)).body.sent).toEqual([])
    expect((await api().get('/api/cima/mine').set(b.auth)).body.requests).toEqual([])
    expect(await sql(`SELECT 1 FROM notifications WHERE user_id = $1 AND type = 'cima_request'`, [b.id])).toHaveLength(0)
    await api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth).expect(404)

    // And it can be sent again later.
    await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
  })

  it('removing someone takes you off each other’s crew; you can ask again', async () => {
    const a = await filmmaker()
    const b = await filmmaker()
    const sent = await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
    await api().post(`/api/cima/accept/${sent.body.id}`).set(b.auth).expect(200)

    await api().delete(`/api/cima/members/${a.id}`).set(b.auth).expect(200)
    expect((await api().get('/api/cima/mine').set(a.auth)).body.members).toEqual([])
    expect((await api().get('/api/cima/mine').set(b.auth)).body.members).toEqual([])
    await api().delete(`/api/cima/members/${a.id}`).set(b.auth).expect(404)

    await api().post(`/api/cima/request/${b.id}`).set(a.auth).expect(201)
  })
})
