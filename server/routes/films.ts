import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth'
import { isFilmmaker } from '../middleware/role'
import { validate, validUuid, rateFilmSchema, addReviewSchema, createFilmSchema, updateFilmSchema, updateReviewSchema } from '../lib/validators'
import { removeOwnedFiles } from '../lib/storage'
import { notFound, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'
import { VOTE_WEEK_SQL, getFilm, getOrPickFilmOfTheWeek, listFilms, type FilmSort } from '../lib/films'

const router = Router()

// Binary files (video/thumbnail/trailer) are uploaded straight from the
// browser to Supabase Storage. This router only ever receives their URLs.

// ---- GET /api/films/featured/week  (before /:id) ----------------------------
// Film of the week = last week's most-voted film. 404 until there is one.
router.get('/featured/week', async (_req, res: Response, next: NextFunction) => {
  try {
    const filmId = await getOrPickFilmOfTheWeek()
    if (!filmId) throw new AppError('No film of the week yet', 404, 'NO_WINNER')
    const film = await getFilm(filmId)
    if (!film) throw new AppError('No film of the week yet', 404, 'NO_WINNER')
    // `votes` counts this week; the win was decided by last week's votes,
    // so report those, plus the next two films from the same ballot.
    const ballot = await query<{ id: string; title: string; votes: number }>(
      `SELECT f.id, f.title, COUNT(*)::int AS votes
       FROM   votes v JOIN films f ON f.id = v.film_id
       WHERE  v.week_start = ${VOTE_WEEK_SQL} - 7
       GROUP  BY f.id, f.title
       ORDER  BY COUNT(*) DESC, MIN(v.created_at) ASC
       LIMIT  3`
    )
    const winningVotes = ballot.rows.find((r) => r.id === filmId)?.votes ?? 0
    const runnerUps = ballot.rows.filter((r) => r.id !== filmId).slice(0, 2)
    res.json({ ...film, winningVotes, runnerUps })
  } catch (err) { next(err) }
})

// ---- GET /api/films/votes/mine  (before /:id) -------------------------------
router.get('/votes/mine', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT film_id FROM votes WHERE user_id = $1 AND week_start = ${VOTE_WEEK_SQL}`,
      [req.userId]
    )
    res.json({ filmId: result.rows[0]?.film_id ?? null })
  } catch (err) { next(err) }
})

// ---- GET /api/films/saved  (your watchlist; before /:id) --------------------
router.get('/saved', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await listFilms({ savedBy: req.userId }))
  } catch (err) { next(err) }
})

// ---- GET /api/films ---------------------------------------------------------
// Query: genre, sort (newest | top | discussed | votes), q (search),
// week=current (this week's ballot), limit (1-100, default 100), offset.
// Always a plain array; a page shorter than `limit` is the last one.
const SORTS: FilmSort[] = ['newest', 'top', 'discussed', 'votes']
router.get('/', async (req, res: Response, next: NextFunction) => {
  const str = (k: string, max: number) => (typeof req.query[k] === 'string' ? (req.query[k] as string).trim().slice(0, max) : '')
  const num = (k: string) => {
    const n = Number(req.query[k])
    return Number.isFinite(n) ? n : undefined
  }
  const sort = SORTS.includes(req.query.sort as FilmSort) ? (req.query.sort as FilmSort) : 'newest'
  try {
    res.json(await listFilms({
      genre: str('genre', 50) || undefined,
      sort,
      q: str('q', 100) || undefined,
      thisWeek: req.query.week === 'current',
      limit: num('limit'),
      offset: num('offset'),
    }))
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id -----------------------------------------------------
router.get('/:id', validUuid('id'), optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const film = await getFilm(req.params.id as string)
    if (!film) throw notFound('Film')
    // Signed-in viewers also get their own stars and whether they saved it.
    let myRating: number | undefined
    let isSaved: boolean | undefined
    if (req.userId) {
      const mine = await query<{ rating: number | null; saved: boolean }>(
        `SELECT (SELECT rating FROM ratings WHERE film_id = $1 AND user_id = $2) AS rating,
                EXISTS (SELECT 1 FROM saved_films WHERE film_id = $1 AND user_id = $2) AS saved`,
        [film.id, req.userId]
      )
      myRating = mine.rows[0]?.rating ?? undefined
      isSaved = !!mine.rows[0]?.saved
    }
    res.json({ ...film, myRating, isSaved })
  } catch (err) { next(err) }
})

// ---- POST /api/films  (filmmakers only; body carries Storage URLs) ----------
router.post('/', authMiddleware, isFilmmaker, validate(createFilmSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, description, genre, runtime, year, thumbnailUrl, videoUrl, trailerUrl, aspectRatio, uploaderRole } = req.body
  try {
    const result = await query(
      `INSERT INTO films (title, description, genre, runtime_min, release_year, uploader_id, video_url, thumbnail_url, trailer_url, aspect_ratio, uploader_role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        title, description ?? null, genre, runtime ?? null, year ?? null, req.userId,
        videoUrl ?? null, thumbnailUrl ?? null, trailerUrl ?? null, aspectRatio ?? null, uploaderRole ?? null,
      ]
    )
    res.status(201).json(await getFilm(result.rows[0].id))
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/vote  (one vote per user per week) -----------------
router.post('/:id/vote', validUuid('id'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Each week's vote is between the films released that week (Monday to
    // Sunday, UTC), the same slate the Vote page shows.
    const filmRes = await query<{ open: boolean }>(
      `SELECT (created_at AT TIME ZONE 'UTC')::date >= ${VOTE_WEEK_SQL} AS open FROM films WHERE id = $1`,
      [req.params.id]
    )
    if (!filmRes.rowCount) throw notFound('Film')
    if (!filmRes.rows[0].open) {
      throw new AppError('Voting is only open for films released this week', 409, 'VOTING_CLOSED')
    }

    const result = await query(
      `INSERT INTO votes (film_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, week_start) DO NOTHING
       RETURNING id`,
      [req.params.id, req.userId]
    )
    if (!result.rowCount) throw new AppError('You already voted for a film this week', 409, 'ALREADY_VOTED')

    const countRes = await query(
      `SELECT COUNT(*)::int AS c FROM votes WHERE film_id = $1 AND week_start = ${VOTE_WEEK_SQL}`,
      [req.params.id]
    )
    res.status(201).json({ ok: true, votes: countRes.rows[0].c })
  } catch (err) { next(err) }
})

// ---- PUT / DELETE /api/films/:id/save  (watchlist; both are safe to repeat) --
router.put('/:id/save', validUuid('id'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filmRes = await query('SELECT id FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    await query(
      `INSERT INTO saved_films (user_id, film_id) VALUES ($1, $2)
       ON CONFLICT (user_id, film_id) DO NOTHING`,
      [req.userId, req.params.id]
    )
    res.json({ saved: true })
  } catch (err) { next(err) }
})

router.delete('/:id/save', validUuid('id'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM saved_films WHERE user_id = $1 AND film_id = $2', [req.userId, req.params.id])
    res.json({ saved: false })
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/rate -----------------------------------------------
router.post('/:id/rate', validUuid('id'), authMiddleware, validate(rateFilmSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating } = req.body
  try {
    const filmRes = await query('SELECT uploader_id, title FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    const film = filmRes.rows[0]

    await query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [req.params.id, req.userId, rating]
    )

    if (film.uploader_id !== req.userId) {
      const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
      await createNotification({
        userId:     film.uploader_id,
        type:       'rating',
        message:    `${fromRes.rows[0]?.name ?? 'Someone'} rated "${film.title}" ${rating} star${rating !== 1 ? 's' : ''}`,
        fromUserId: req.userId,
        filmId:     req.params.id as string,
      })
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id/reviews ---------------------------------------------
router.get('/:id/reviews', validUuid('id'), async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT rv.*,
              p.name       AS user_name,
              p.role       AS user_role,
              p.avatar_url AS user_avatar
       FROM   reviews rv
       JOIN   profiles p ON p.id = rv.user_id
       WHERE  rv.film_id = $1
       ORDER  BY rv.created_at DESC`,
      [req.params.id]
    )
    res.json(result.rows.map((r) => ({
      id:        r.id,
      filmId:    r.film_id,
      userId:    r.user_id,
      rating:    r.rating,
      body:      r.body,
      createdAt: r.created_at,
      user: {
        id:        r.user_id,
        name:      r.user_name,
        role:      r.user_role,
        avatarUrl: r.user_avatar ?? undefined,
        email:     '',
        createdAt: '',
      },
    })))
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/review ---------------------------------------------
router.post('/:id/review', validUuid('id'), authMiddleware, validate(addReviewSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating, body } = req.body
  try {
    const filmRes = await query('SELECT uploader_id, title FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    const film = filmRes.rows[0]

    // A note can come without stars; only then does it leave the rating alone.
    const result = await query(
      `INSERT INTO reviews (film_id, user_id, rating, body)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [req.params.id, req.userId, rating ?? null, body]
    )
    const rv = result.rows[0]

    if (rating) {
      await query(
        `INSERT INTO ratings (film_id, user_id, rating)
         VALUES ($1,$2,$3)
         ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
        [req.params.id, req.userId, rating]
      )
    }

    if (film.uploader_id !== req.userId) {
      const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
      await createNotification({
        userId:     film.uploader_id,
        type:       'review',
        message:    `${fromRes.rows[0]?.name ?? 'Someone'} left a note on "${film.title}"`,
        fromUserId: req.userId,
        filmId:     req.params.id as string,
      })
    }

    const userRes = await query('SELECT id, name, role, avatar_url FROM profiles WHERE id = $1', [req.userId])
    const u = userRes.rows[0]

    res.status(201).json({
      id: rv.id, filmId: rv.film_id, userId: rv.user_id,
      rating: rv.rating, body: rv.body, createdAt: rv.created_at,
      user: { id: u.id, name: u.name, role: u.role, avatarUrl: u.avatar_url ?? undefined, email: '', createdAt: '' },
    })
  } catch (err) { next(err) }
})

// ---- PATCH /api/films/:id  (uploader edits the details) ---------------------
router.patch('/:id', validUuid('id'), authMiddleware, validate(updateFilmSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, description, genre, runtime, year, uploaderRole } = req.body
  try {
    const own = await query('SELECT uploader_id FROM films WHERE id = $1', [req.params.id])
    if (!own.rowCount) throw notFound('Film')
    if (own.rows[0].uploader_id !== req.userId) throw new AppError('Only the filmmaker can edit this film', 403, 'FORBIDDEN')

    // undefined = leave as is; null = clear (runtime and year only).
    await query(
      `UPDATE films SET
         title         = COALESCE($1, title),
         description   = CASE WHEN $2::text IS NULL THEN description ELSE NULLIF($2, '') END,
         genre         = COALESCE($3, genre),
         runtime_min   = CASE WHEN $4::boolean THEN $5::int ELSE runtime_min END,
         release_year  = CASE WHEN $6::boolean THEN $7::int ELSE release_year END,
         uploader_role = CASE WHEN $8::text IS NULL THEN uploader_role ELSE NULLIF($8, '') END,
         updated_at    = NOW()
       WHERE id = $9`,
      [
        title ?? null, description ?? null, genre ?? null,
        runtime !== undefined, runtime ?? null,
        year !== undefined, year ?? null,
        uploaderRole ?? null, req.params.id,
      ]
    )
    res.json(await getFilm(req.params.id as string))
  } catch (err) { next(err) }
})

// ---- DELETE /api/films/:id  (uploader removes the film and its files) -------
router.delete('/:id', validUuid('id'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `DELETE FROM films WHERE id = $1 AND uploader_id = $2
       RETURNING video_url, thumbnail_url, trailer_url`,
      [req.params.id, req.userId]
    )
    if (!result.rowCount) {
      const exists = await query('SELECT 1 FROM films WHERE id = $1', [req.params.id])
      if (exists.rowCount) throw new AppError('Only the filmmaker can delete this film', 403, 'FORBIDDEN')
      throw notFound('Film')
    }
    // Votes, ratings, notes and saves go with the row (ON DELETE CASCADE).
    const f = result.rows[0]
    const filesRemoved = await removeOwnedFiles(req.userId!, [f.video_url, f.thumbnail_url, f.trailer_url])
    res.json({ ok: true, filesRemoved })
  } catch (err) { next(err) }
})

// ---- PATCH / DELETE /api/films/:id/reviews/:reviewId  (author only) ---------
router.patch('/:id/reviews/:reviewId', validUuid('id', 'reviewId'), authMiddleware, validate(updateReviewSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { body, rating } = req.body
  try {
    const result = await query(
      `UPDATE reviews SET
         body       = $1,
         rating     = CASE WHEN $2::boolean THEN $3::smallint ELSE rating END,
         updated_at = NOW()
       WHERE id = $4 AND film_id = $5 AND user_id = $6
       RETURNING id, film_id, user_id, rating, body, created_at`,
      [body, rating !== undefined, rating ?? null, req.params.reviewId, req.params.id, req.userId]
    )
    if (!result.rowCount) throw notFound('Note')
    if (rating) {
      await query(
        `INSERT INTO ratings (film_id, user_id, rating) VALUES ($1,$2,$3)
         ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
        [req.params.id, req.userId, rating]
      )
    }
    const rv = result.rows[0]
    res.json({ id: rv.id, filmId: rv.film_id, userId: rv.user_id, rating: rv.rating, body: rv.body, createdAt: rv.created_at })
  } catch (err) { next(err) }
})

router.delete('/:id/reviews/:reviewId', validUuid('id', 'reviewId'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Your stars stay: they are a separate rating you can change on the film.
    const result = await query(
      'DELETE FROM reviews WHERE id = $1 AND film_id = $2 AND user_id = $3 RETURNING id',
      [req.params.reviewId, req.params.id, req.userId]
    )
    if (!result.rowCount) throw notFound('Note')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
