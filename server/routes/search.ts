import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { validateQuery, searchQuerySchema } from '../lib/validators'

const router = Router()

// ---- GET /api/search?q=&type=films|filmmakers --------------------------------
router.get('/', validateQuery(searchQuerySchema), async (req, res: Response, next: NextFunction) => {
  const { q, type } = req.query as any
  const like = `%${q}%`

  try {
    if (type === 'filmmakers') {
      const result = await query(
        `SELECT id, name, role, bio, school, city, avatar_url, top_genre
         FROM   profiles
         WHERE  role = 'filmmaker' AND (name ILIKE $1 OR school ILIKE $1 OR city ILIKE $1)
         ORDER BY name ASC
         LIMIT 20`,
        [like]
      )
      res.json({
        data: result.rows.map((p) => ({
          id: p.id, name: p.name, role: p.role, bio: p.bio, school: p.school,
          city: p.city, avatarUrl: p.avatar_url, topGenre: p.top_genre, email: '', createdAt: '',
        })),
      })
      return
    }

    const result = await query(
      `SELECT f.id, f.title, f.thumbnail_url, f.genre, f.runtime, f.year, f.created_at,
              p.id AS filmmaker_id, p.name AS filmmaker_name
       FROM   films f
       JOIN   profiles p ON p.id = f.filmmaker_id
       WHERE  f.status = 'published' AND (f.title ILIKE $1 OR f.description ILIKE $1)
       ORDER BY f.created_at DESC
       LIMIT 20`,
      [like]
    )
    res.json({
      data: result.rows.map((f) => ({
        id: f.id, title: f.title, thumbnailUrl: f.thumbnail_url, genre: f.genre,
        runtime: f.runtime, year: f.year, createdAt: f.created_at,
        filmmakerId: f.filmmaker_id, uploaderId: f.filmmaker_id,
        filmmaker: { id: f.filmmaker_id, name: f.filmmaker_name, email: '', role: 'filmmaker', createdAt: '' },
      })),
    })
  } catch (err) { next(err) }
})

export default router
