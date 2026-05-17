import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { validate, updateUserSchema } from '../lib/validators'
import { notFound } from '../lib/errors'

const router = Router()

function mapUser(u: any, counts?: { films: number; cima: number; reviews: number }) {
  return {
    id:                      u.id,
    name:                    u.name,
    email:                   u.email,
    role:                    u.role,
    bio:                     u.bio         ?? undefined,
    school:                  u.school      ?? undefined,
    city:                    u.city        ?? undefined,
    avatarUrl:               u.avatar_url  ?? undefined,
    topGenre:                u.top_genre   ?? undefined,
    lookingForCollaborators: !!u.looking_for_collaborators,
    filmsCount:              counts?.films   ?? 0,
    cimaCount:               counts?.cima    ?? 0,
    reviewsCount:            counts?.reviews ?? 0,
    createdAt:               u.created_at,
  }
}

async function getUserCounts(userId: string) {
  const [films, cima, reviews] = await Promise.all([
    query('SELECT COUNT(*)::int AS c FROM films        WHERE uploader_id = $1', [userId]),
    query('SELECT COUNT(*)::int AS c FROM cima_members WHERE owner_id    = $1', [userId]),
    query('SELECT COUNT(*)::int AS c FROM reviews      WHERE user_id     = $1', [userId]),
  ])
  return {
    films:   films.rows[0].c,
    cima:    cima.rows[0].c,
    reviews: reviews.rows[0].c,
  }
}

// ---- GET /api/users/:id -----------------------------------------------------
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id])
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.params.id)
    res.json(mapUser(result.rows[0], counts))
  } catch (err) { next(err) }
})

// ---- GET /api/users/:id/films -----------------------------------------------
router.get('/:id/films', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT f.*,
              ROUND(AVG(r.rating)::numeric, 1)::float AS avg_rating,
              COUNT(r.id)::int AS rating_count
       FROM   films f
       LEFT   JOIN ratings r ON r.film_id = f.id
       WHERE  f.uploader_id = $1
       GROUP  BY f.id
       ORDER  BY f.created_at DESC`,
      [req.params.id]
    )
    res.json(result.rows.map((f) => ({
      id: f.id, title: f.title, thumbnailUrl: f.thumbnail_url,
      genre: f.genre, runtime: f.runtime_min, year: f.release_year,
      rating: f.avg_rating, ratingCount: f.rating_count,
      uploaderId: f.uploader_id, description: f.description, createdAt: f.created_at,
    })))
  } catch (err) { next(err) }
})

// ---- PATCH /api/users/me ----------------------------------------------------
// Note: this route must be defined BEFORE /:id to avoid "me" being treated as an ID
router.patch('/me', authMiddleware, validate(updateUserSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, bio, school, city, top_genre, looking_for_collaborators, role } = req.body
  try {
    const result = await query(
      `UPDATE profiles SET
         name                      = COALESCE($1, name),
         bio                       = COALESCE($2, bio),
         school                    = COALESCE($3, school),
         city                      = COALESCE($4, city),
         top_genre                 = COALESCE($5, top_genre),
         looking_for_collaborators = COALESCE($6, looking_for_collaborators),
         role                      = COALESCE($7, role),
         updated_at                = NOW()
       WHERE id = $8
       RETURNING *`,
      [name ?? null, bio ?? null, school ?? null, city ?? null, top_genre ?? null, looking_for_collaborators ?? null, role ?? null, req.userId]
    )
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.userId!)
    res.json(mapUser(result.rows[0], counts))
  } catch (err) { next(err) }
})

export default router
