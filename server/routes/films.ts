import { Router, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { query } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { isFilmmaker } from '../middleware/role'
import { validate, rateFilmSchema, addReviewSchema } from '../lib/validators'
import { notFound, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'

const router = Router()

// ---- Multer upload config ---------------------------------------------------
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename:    (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_, file, cb) => {
    const allowed = /\.(mp4|mov|webm|jpg|jpeg|png|gif|webp)$/i
    cb(null, allowed.test(file.originalname))
  },
})

// ---- helpers ----------------------------------------------------------------

async function filmWithMeta(id: string) {
  const res = await query(
    `SELECT f.*,
            u.name        AS uploader_name,
            u.role        AS uploader_role,
            u.school      AS uploader_school,
            u.bio         AS uploader_bio,
            u.avatar_url  AS uploader_avatar,
            u.created_at  AS uploader_created_at,
            ROUND(AVG(r.rating)::numeric, 1)::float AS avg_rating,
            COUNT(r.id)::int                         AS rating_count
     FROM   films f
     JOIN   users u ON u.id = f.uploader_id
     LEFT JOIN ratings r ON r.film_id = f.id
     WHERE  f.id = $1
     GROUP  BY f.id, u.id`,
    [id]
  )
  return res.rows[0] ?? null
}

function mapFilm(f: any) {
  if (!f) return null
  return {
    id:          f.id,
    title:       f.title,
    description: f.description,
    thumbnailUrl: f.thumbnail_url,
    videoUrl:    f.video_url,
    genre:       f.genre ?? [],
    runtime:     f.runtime_min,
    year:        f.release_year,
    rating:      f.avg_rating    ?? undefined,
    ratingCount: f.rating_count  ?? 0,
    uploaderId:  f.uploader_id,
    uploader: f.uploader_name ? {
      id:        f.uploader_id,
      name:      f.uploader_name,
      role:      f.uploader_role,
      school:    f.uploader_school,
      bio:       f.uploader_bio,
      avatarUrl: f.uploader_avatar,
      email:     '',
      createdAt: f.uploader_created_at,
    } : undefined,
    createdAt: f.created_at,
  }
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
    // fallback: highest avg rating film this week
    if (!filmId) {
      const fallback = await query(
        `SELECT f.id FROM films f
         LEFT JOIN ratings r ON r.film_id = f.id
         GROUP BY f.id ORDER BY AVG(r.rating) DESC NULLS LAST, f.created_at DESC LIMIT 1`
      )
      filmId = fallback.rows[0]?.id
    }
    if (!filmId) { res.status(404).json({ message: 'No featured film' }); return }

    const film = await filmWithMeta(filmId)
    res.json(mapFilm(film))
  } catch (err) { next(err) }
})

// ---- GET /api/films ---------------------------------------------------------
router.get('/', async (req, res: Response, next: NextFunction) => {
  const { genre, sort = 'newest' } = req.query as Record<string, string>
  try {
    let sql = `
      SELECT f.*,
             u.name       AS uploader_name,
             u.role       AS uploader_role,
             u.school     AS uploader_school,
             u.avatar_url AS uploader_avatar,
             u.created_at AS uploader_created_at,
             ROUND(AVG(r.rating)::numeric, 1)::float AS avg_rating,
             COUNT(r.id)::int                         AS rating_count
      FROM   films f
      JOIN   users u ON u.id = f.uploader_id
      LEFT   JOIN ratings r ON r.film_id = f.id
    `
    const params: any[] = []

    if (genre) {
      sql += ` WHERE $${params.length + 1} = ANY(f.genre)`
      params.push(genre)
    }

    sql += ` GROUP BY f.id, u.id`

    if (sort === 'top') sql += ' ORDER BY avg_rating DESC NULLS LAST, f.created_at DESC'
    else                 sql += ' ORDER BY f.created_at DESC'

    const result = await query(sql, params)
    res.json(result.rows.map(mapFilm))
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id -----------------------------------------------------
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const film = await filmWithMeta(req.params.id)
    if (!film) throw notFound('Film')
    res.json(mapFilm(film))
  } catch (err) { next(err) }
})

// ---- POST /api/films  (filmmaker upload) ------------------------------------
router.post(
  '/',
  authMiddleware,
  isFilmmaker,
  upload.fields([
    { name: 'video',     maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, description, year, runtime } = req.body
    const genre = req.body.genre
      ? (Array.isArray(req.body.genre) ? req.body.genre : [req.body.genre])
      : []

    if (!title) { next(new AppError('title is required', 400)); return }

    try {
      const files = req.files as { [k: string]: Express.Multer.File[] }
      const videoUrl     = files.video?.[0]     ? `/uploads/${files.video[0].filename}`     : null
      const thumbnailUrl = files.thumbnail?.[0] ? `/uploads/${files.thumbnail[0].filename}` : null

      const result = await query(
        `INSERT INTO films (title, description, genre, runtime_min, release_year, uploader_id, video_url, thumbnail_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [title, description, genre, runtime ? parseInt(runtime) : null, year ? parseInt(year) : null, req.userId, videoUrl, thumbnailUrl]
      )
      const film = await filmWithMeta(result.rows[0].id)
      res.status(201).json(mapFilm(film))
    } catch (err) { next(err) }
  }
)

// ---- POST /api/films/:id/rate -----------------------------------------------
router.post('/:id/rate', authMiddleware, validate(rateFilmSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating } = req.body
  try {
    // Upsert rating
    await query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [req.params.id, req.userId, rating]
    )

    // Notify film uploader (if not rating own film)
    const filmRes = await query('SELECT uploader_id, title FROM films WHERE id = $1', [req.params.id])
    const film = filmRes.rows[0]
    if (film && film.uploader_id !== req.userId) {
      const fromRes = await query('SELECT name FROM users WHERE id = $1', [req.userId])
      const from = fromRes.rows[0]
      await createNotification({
        userId:     film.uploader_id,
        type:       'rating',
        message:    `${from?.name ?? 'Someone'} rated "${film.title}" ${rating} star${rating !== 1 ? 's' : ''}`,
        fromUserId: req.userId,
        filmId:     req.params.id,
      })
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- GET /api/films/:id/reviews ---------------------------------------------
router.get('/:id/reviews', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT rv.*,
              u.name       AS user_name,
              u.role       AS user_role,
              u.avatar_url AS user_avatar
       FROM   reviews rv
       JOIN   users u ON u.id = rv.user_id
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
        avatarUrl: r.user_avatar,
        email:     '',
        createdAt: '',
      },
    })))
  } catch (err) { next(err) }
})

// ---- POST /api/films/:id/review ---------------------------------------------
router.post('/:id/review', authMiddleware, validate(addReviewSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating, body } = req.body
  try {
    // Check film exists
    const filmRes = await query('SELECT uploader_id, title FROM films WHERE id = $1', [req.params.id])
    if (!filmRes.rowCount) throw notFound('Film')
    const film = filmRes.rows[0]

    const result = await query(
      `INSERT INTO reviews (film_id, user_id, rating, body)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [req.params.id, req.userId, rating, body]
    )
    const rv = result.rows[0]

    // Also upsert rating
    await query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
      [req.params.id, req.userId, rating]
    )

    // Notify uploader
    if (film.uploader_id !== req.userId) {
      const fromRes = await query('SELECT name FROM users WHERE id = $1', [req.userId])
      await createNotification({
        userId:     film.uploader_id,
        type:       'review',
        message:    `${fromRes.rows[0]?.name ?? 'Someone'} reviewed "${film.title}"`,
        fromUserId: req.userId,
        filmId:     req.params.id,
      })
    }

    const userRes = await query('SELECT id, name, role, avatar_url FROM users WHERE id = $1', [req.userId])
    const u = userRes.rows[0]

    res.status(201).json({
      id: rv.id, filmId: rv.film_id, userId: rv.user_id,
      rating: rv.rating, body: rv.body, createdAt: rv.created_at,
      user: { id: u.id, name: u.name, role: u.role, avatarUrl: u.avatar_url, email: '', createdAt: '' },
    })
  } catch (err) { next(err) }
})

export default router
