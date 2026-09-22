import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import { requireOwner } from '../middleware/ownership'
import {
  validateBody, validateQuery,
  createFilmSchema, updateFilmSchema, rateFilmSchema, addReviewSchema,
  filmListQuerySchema, paginationSchema,
} from '../lib/validators'
import { notFound, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'
import { getCurrentWeekKey } from '../lib/week'

const router = Router()

// ---- helpers ----------------------------------------------------------------

const FILM_SELECT = `
  SELECT f.*,
         p.name        AS filmmaker_name,
         p.role        AS filmmaker_role,
         p.school      AS filmmaker_school,
         p.bio         AS filmmaker_bio,
         p.avatar_url  AS filmmaker_avatar,
         p.created_at  AS filmmaker_created_at,
         ROUND(AVG(r.rating)::numeric, 1)::float AS avg_rating,
         COUNT(DISTINCT r.id)::int                AS rating_count,
         COUNT(DISTINCT v.id)::int                AS vote_count
  FROM   films f
  JOIN   profiles p ON p.id = f.filmmaker_id
  LEFT   JOIN ratings r ON r.film_id = f.id
  LEFT   JOIN votes v   ON v.film_id = f.id AND v.week_key = $__weekKey__
`

async function filmWithMeta(id: string) {
  const weekKey = getCurrentWeekKey()
  const sql = FILM_SELECT.replace('$__weekKey__', '$2') + ` WHERE f.id = $1 GROUP BY f.id, p.id`
  const res = await query(sql, [id, weekKey])
  return res.rows[0] ?? null
}

async function isFeaturedThisWeek(filmId: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM featured_films WHERE film_id = $1 AND week_start = date_trunc('week', CURRENT_DATE)::date`,
    [filmId]
  )
  return !!res.rowCount
}

function mapFilm(f: any, featured = false) {
  if (!f) return null
  const base = {
    id:           f.id,
    title:        f.title,
    description:  f.description,
    thumbnailUrl: f.thumbnail_url,
    videoUrl:     f.video_url,
    trailerUrl:   f.trailer_url,
    aspectRatio:  f.aspect_ratio,
    genre:        f.genre ?? [],
    runtime:      f.runtime,
    year:         f.year,
    status:       f.status,
    rating:       f.avg_rating    ?? undefined,
    ratingCount:  f.rating_count  ?? 0,
    votes:        f.vote_count    ?? 0,
    isFilmOfTheWeek: featured,
    filmmakerId:  f.filmmaker_id,
    uploaderId:   f.filmmaker_id, // legacy alias for older frontend field name
    createdAt: f.created_at,
  }

  const filmmaker = f.filmmaker_name ? {
    id:        f.filmmaker_id,
    name:      f.filmmaker_name,
    role:      f.filmmaker_role,
    school:    f.filmmaker_school,
    bio:       f.filmmaker_bio,
    avatarUrl: f.filmmaker_avatar,
    email:     '',
    createdAt: f.filmmaker_created_at,
  } : undefined

  return { ...base, filmmaker, uploader: filmmaker } // uploader is a legacy alias
}

// ---- GET /api/films/featured/week  (must be before /:id) -------------------
router.get('/featured/week', async (_req, res: Response, next: NextFunction) => {
  try {
    const featRes = await query(
      `SELECT ff.film_id FROM featured_films ff
       WHERE ff.week_start = date_trunc('week', CURRENT_DATE)::date
       ORDER BY ff.created_at DESC LIMIT 1`
    )

    let filmId = featRes.rows[0]?.film_id
    if (!filmId) {
      // Fall back to this week's vote leader, then best-rated overall.
      const weekKey = getCurrentWeekKey()
      const voteLeader = await query(
        `SELECT film_id FROM votes WHERE week_key = $1
         GROUP BY film_id ORDER BY COUNT(*) DESC LIMIT 1`,
        [weekKey]
      )
      filmId = voteLeader.rows[0]?.film_id
      if (!filmId) {
        const fallback = await query(
          `SELECT f.id FROM films f
           LEFT JOIN ratings r ON r.film_id = f.id
           WHERE f.status = 'published'
           GROUP BY f.id ORDER BY AVG(r.rating) DESC NULLS LAST, f.created_at DESC LIMIT 1`
        )
        filmId = fallback.rows[0]?.id
      }
    }
    if (!filmId) { throw notFound('Featured film') }

    const film = await filmWithMeta(filmId)
    if (!film) { throw notFound('Featured film') }
    res.json(mapFilm(film, await isFeaturedThisWeek(filmId)))
  } catch (err) { next(err) }
})

// ---- GET /api/films/votes/mine  (must be before /:id) -----------------------
router.get('/votes/mine', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const weekKey = getCurrentWeekKey()
    const result = await query('SELECT film_id FROM votes WHERE user_id = $1 AND week_key = $2', [req.userId, weekKey])
    res.json({ filmId: result.rows[0]?.film_id ?? null, weekKey })
  } catch (err) { next(err) }
})

// ---- GET /api/films ---------------------------------------------------------
router.get('/', validateQuery(filmListQuerySchema), async (req, res: Response, next: NextFunction) => {
  const { genre, sort, q, filmmakerId, page, limit } = req.query as any
  try {
    const weekKey = getCurrentWeekKey()
    let sql = FILM_SELECT.replace('$__weekKey__', '$1') + ` WHERE f.status = 'published'`
    const params: any[] = [weekKey]

    if (genre) {
      sql += ` AND $${params.length + 1} = ANY(f.genre)`
      params.push(genre)
    }
    if (filmmakerId) {
      sql += ` AND f.filmmaker_id = $${params.length + 1}`
      params.push(filmmakerId)
    }
    if (q) {
      sql += ` AND (f.title ILIKE $${params.length + 1} OR f.description ILIKE $${params.length + 1})`
      params.push(`%${q}%`)
    }

    sql += ` GROUP BY f.id, p.id`

    if (sort === 'top')          sql += ' ORDER BY avg_rating DESC NULLS LAST, f.created_at DESC'
    else if (sort === 'trending') sql += ' ORDER BY vote_count DESC, f.created_at DESC'
    else                          sql += ' ORDER BY f.created_at DESC'

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM films f WHERE f.status = 'published'` +
      (genre ? ` AND $1 = ANY(f.genre)` : '') ,
      genre ? [genre] : []
    )
    const total = countRes.rows[0]?.total ?? 0

    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, (page - 1) * limit)

    const result = await query(sql, params)
    const featuredRes = await query(
      `SELECT film_id FROM featured_films WHERE week_start = date_trunc('week', CURRENT_DATE)::date`
    )
    const featuredIds = new Set(featuredRes.rows.map((r: any) => r.film_id))

    res.json({
      data: result.rows.map((f) => mapFilm(f, featuredIds.has(f.id))),
      pagination: { page, hasMore: page * limit < total, total },
    })
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id -----------------------------------------------------
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const film = await filmWithMeta(req.params.id)
    if (!film) throw notFound('Film')
    res.json(mapFilm(film, await isFeaturedThisWeek(req.params.id)))
  } catch (err) { next(err) }
})

// ---- POST /api/films  (filmmaker upload — metadata only; media already in Supabase Storage) --
router.post(
  '/',
  requireAuth,
  requireRole('filmmaker'),
  validateBody(createFilmSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, description, genre, runtime, year, thumbnailUrl, videoUrl, trailerUrl, aspectRatio } = req.body
    try {
      const result = await query(
        `INSERT INTO films (title, description, genre, runtime, year, filmmaker_id, video_url, thumbnail_url, trailer_url, aspect_ratio, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published')
         RETURNING id`,
        [title, description, genre, runtime ?? null, year ?? null, req.userId, videoUrl ?? null, thumbnailUrl ?? null, trailerUrl ?? null, aspectRatio ?? null]
      )
      const film = await filmWithMeta(result.rows[0].id)
      res.status(201).json(mapFilm(film, false))
    } catch (err) { next(err) }
  }
)

// ---- PATCH /api/films/:id ----------------------------------------------------
router.patch(
  '/:id',
  requireAuth,
  requireOwner('films', 'filmmaker_id'),
  validateBody(updateFilmSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const b = req.body
    try {
      const result = await query(
        `UPDATE films SET
           title         = COALESCE($1, title),
           description   = COALESCE($2, description),
           genre         = COALESCE($3, genre),
           runtime       = COALESCE($4, runtime),
           year          = COALESCE($5, year),
           thumbnail_url = COALESCE($6, thumbnail_url),
           video_url     = COALESCE($7, video_url),
           trailer_url   = COALESCE($8, trailer_url),
           aspect_ratio  = COALESCE($9, aspect_ratio),
           status        = COALESCE($10, status)
         WHERE id = $11
         RETURNING id`,
        [b.title ?? null, b.description ?? null, b.genre ?? null, b.runtime ?? null, b.year ?? null,
         b.thumbnailUrl ?? null, b.videoUrl ?? null, b.trailerUrl ?? null, b.aspectRatio ?? null, b.status ?? null,
         req.params.id]
      )
      if (!result.rowCount) throw notFound('Film')
      const film = await filmWithMeta(req.params.id)
      res.json(mapFilm(film, await isFeaturedThisWeek(req.params.id)))
    } catch (err) { next(err) }
  }
)

// ---- DELETE /api/films/:id ---------------------------------------------------
router.delete('/:id', requireAuth, requireOwner('films', 'filmmaker_id'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM films WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/vote  (weekly film-of-the-week vote) --------------
router.post('/:id/vote', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filmRes = await query('SELECT id FROM films WHERE id = $1 AND status = $2', [req.params.id, 'published'])
    if (!filmRes.rowCount) throw notFound('Film')

    const weekKey = getCurrentWeekKey()
    const existing = await query('SELECT film_id FROM votes WHERE user_id = $1 AND week_key = $2', [req.userId, weekKey])
    if (existing.rowCount) {
      const code = existing.rows[0].film_id === req.params.id ? 'ALREADY_VOTED_THIS_FILM' : 'ALREADY_VOTED_OTHER_FILM'
      throw new AppError('You already voted this week', 409, code)
    }

    await query('INSERT INTO votes (film_id, user_id, week_key) VALUES ($1,$2,$3)', [req.params.id, req.userId, weekKey])
    const countRes = await query('SELECT COUNT(*)::int AS c FROM votes WHERE film_id = $1 AND week_key = $2', [req.params.id, weekKey])
    res.status(201).json({ ok: true, votes: countRes.rows[0].c })
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/rating ----------------------------------------------
router.post('/:id/rating', requireAuth, validateBody(rateFilmSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating } = req.body
  try {
    const filmRes = await query('SELECT filmmaker_id, title FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    const film = filmRes.rows[0]

    await query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [req.params.id, req.userId, rating]
    )

    if (film.filmmaker_id !== req.userId) {
      const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
      await createNotification({
        userId:     film.filmmaker_id,
        type:       'rating',
        message:    `${fromRes.rows[0]?.name ?? 'Someone'} rated "${film.title}" ${rating} star${rating !== 1 ? 's' : ''}`,
        fromUserId: req.userId,
        filmId:     req.params.id,
      })
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id/reviews ---------------------------------------------
router.get('/:id/reviews', validateQuery(paginationSchema), async (req, res: Response, next: NextFunction) => {
  const { page, limit } = req.query as any
  try {
    const countRes = await query('SELECT COUNT(*)::int AS total FROM reviews WHERE film_id = $1', [req.params.id])
    const total = countRes.rows[0]?.total ?? 0

    const result = await query(
      `SELECT rv.*,
              p.name       AS user_name,
              p.role       AS user_role,
              p.avatar_url AS user_avatar
       FROM   reviews rv
       JOIN   profiles p ON p.id = rv.user_id
       WHERE  rv.film_id = $1
       ORDER  BY rv.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, (page - 1) * limit]
    )
    res.json({
      data: result.rows.map((r) => ({
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
          avatarUrl: r.user_avatar,
          email:     '',
          createdAt: '',
        },
      })),
      pagination: { page, hasMore: page * limit < total, total },
    })
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/reviews ---------------------------------------------
router.post('/:id/reviews', requireAuth, validateBody(addReviewSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating, body } = req.body
  try {
    const filmRes = await query('SELECT filmmaker_id, title FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    const film = filmRes.rows[0]

    const result = await query(
      `INSERT INTO reviews (film_id, user_id, rating, body)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, body = $4, updated_at = NOW()
       RETURNING *`,
      [req.params.id, req.userId, rating, body]
    )
    const rv = result.rows[0]

    await query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [req.params.id, req.userId, rating]
    )

    if (film.filmmaker_id !== req.userId) {
      const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
      await createNotification({
        userId:     film.filmmaker_id,
        type:       'review',
        message:    `${fromRes.rows[0]?.name ?? 'Someone'} reviewed "${film.title}"`,
        fromUserId: req.userId,
        filmId:     req.params.id,
      })
    }

    const userRes = await query('SELECT id, name, role, avatar_url FROM profiles WHERE id = $1', [req.userId])
    const u = userRes.rows[0]

    res.status(201).json({
      id: rv.id, filmId: rv.film_id, userId: rv.user_id,
      rating: rv.rating, body: rv.body, createdAt: rv.created_at,
      user: { id: u.id, name: u.name, role: u.role, avatarUrl: u.avatar_url, email: '', createdAt: '' },
    })
  } catch (err) { next(err) }
})

export default router
