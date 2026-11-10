import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth'
import { isFilmmaker } from '../middleware/role'
import { validate, validUuid, rateFilmSchema, addReviewSchema, createFilmSchema } from '../lib/validators'
import { notFound, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'
import { VOTE_WEEK_SQL, getFilm, getOrPickFilmOfTheWeek, listFilms } from '../lib/films'

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

// ---- GET /api/films ---------------------------------------------------------
router.get('/', async (req, res: Response, next: NextFunction) => {
  const genre = typeof req.query.genre === 'string' ? req.query.genre.slice(0, 50) : undefined
  const sort = req.query.sort === 'top' ? 'top' : 'newest'
  try {
    res.json(await listFilms({ genre, sort }))
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id -----------------------------------------------------
router.get('/:id', validUuid('id'), optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const film = await getFilm(req.params.id as string)
    if (!film) throw notFound('Film')
    // Signed-in viewers also get their own stars back.
    let myRating: number | undefined
    if (req.userId) {
      const mine = await query<{ rating: number }>(
        'SELECT rating FROM ratings WHERE film_id = $1 AND user_id = $2',
        [film.id, req.userId]
      )
      myRating = mine.rows[0]?.rating
    }
    res.json({ ...film, myRating })
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
    const filmRes = await query('SELECT id FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')

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

export default router
