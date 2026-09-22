import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { notFound } from '../lib/errors'

const router = Router()

// ---- GET /api/watchlist -------------------------------------------------------
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT w.id, w.created_at, f.id AS film_id, f.title, f.thumbnail_url, f.genre, f.runtime, f.year
       FROM   watchlist w
       JOIN   films f ON f.id = w.film_id
       WHERE  w.user_id = $1
       ORDER  BY w.created_at DESC`,
      [req.userId]
    )
    res.json({
      data: result.rows.map((w) => ({
        id: w.id, addedAt: w.created_at,
        film: { id: w.film_id, title: w.title, thumbnailUrl: w.thumbnail_url, genre: w.genre, runtime: w.runtime, year: w.year },
      })),
    })
  } catch (err) { next(err) }
})

// ---- POST /api/watchlist/:filmId ----------------------------------------------
router.post('/:filmId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filmRes = await query('SELECT id FROM films WHERE id = $1', [req.params.filmId])
    if (!filmRes.rowCount) throw notFound('Film')
    await query(
      `INSERT INTO watchlist (user_id, film_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.userId, req.params.filmId]
    )
    res.status(201).json({ ok: true })
  } catch (err) { next(err) }
})

// ---- DELETE /api/watchlist/:filmId ---------------------------------------------
router.delete('/:filmId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM watchlist WHERE user_id = $1 AND film_id = $2', [req.userId, req.params.filmId])
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
