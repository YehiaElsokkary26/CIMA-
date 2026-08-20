import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireOwner } from '../middleware/ownership'
import { validateBody, validateQuery, updateProfileSchema, roleChangeSchema, paginationSchema } from '../lib/validators'
import { notFound } from '../lib/errors'

const router = Router()

function mapProfile(u: any, counts?: { films: number; cima: number; reviews: number }) {
  return {
    id:                      u.id,
    name:                    u.name,
    email:                   u.email,
    role:                    u.role,
    bio:                     u.bio         ?? undefined,
    school:                  u.school      ?? undefined,
    city:                    u.city        ?? undefined,
    avatarUrl:               u.avatar_url  ?? undefined,
    bannerUrl:               u.banner_url  ?? undefined,
    topGenre:                u.top_genre   ?? undefined,
    favoriteGenres:          u.favorite_genres ?? [],
    crewRoles:               u.crew_roles      ?? [],
    lookingForCollaborators: !!u.looking_for_collaborators,
    filmsCount:              counts?.films   ?? 0,
    cimaCount:               counts?.cima    ?? 0,
    reviewsCount:            counts?.reviews ?? 0,
    createdAt:               u.created_at,
  }
}

async function getProfileCounts(userId: string) {
  const [films, cima, reviews] = await Promise.all([
    query('SELECT COUNT(*)::int AS c FROM films        WHERE filmmaker_id = $1 AND status = $2', [userId, 'published']),
    query('SELECT COUNT(*)::int AS c FROM cima_members WHERE owner_id     = $1', [userId]),
    query('SELECT COUNT(*)::int AS c FROM reviews      WHERE user_id      = $1', [userId]),
  ])
  return {
    films:   films.rows[0].c,
    cima:    cima.rows[0].c,
    reviews: reviews.rows[0].c,
  }
}

// ---- GET /api/profiles/:id ---------------------------------------------------
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id])
    if (!result.rowCount) throw notFound('Profile')
    const counts = await getProfileCounts(req.params.id)
    res.json(mapProfile(result.rows[0], counts))
  } catch (err) { next(err) }
})

// ---- GET /api/profiles/:id/films ---------------------------------------------
router.get('/:id/films', validateQuery(paginationSchema), async (req, res: Response, next: NextFunction) => {
  const { page, limit } = req.query as any
  try {
    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM films WHERE filmmaker_id = $1 AND status = 'published'`,
      [req.params.id]
    )
    const total = countRes.rows[0]?.total ?? 0

    const result = await query(
      `SELECT f.*,
              ROUND(AVG(r.rating)::numeric, 1)::float AS avg_rating,
              COUNT(r.id)::int AS rating_count
       FROM   films f
       LEFT   JOIN ratings r ON r.film_id = f.id
       WHERE  f.filmmaker_id = $1 AND f.status = 'published'
       GROUP  BY f.id
       ORDER  BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, (page - 1) * limit]
    )
    res.json({
      data: result.rows.map((f) => ({
        id: f.id, title: f.title, thumbnailUrl: f.thumbnail_url, videoUrl: f.video_url,
        trailerUrl: f.trailer_url, aspectRatio: f.aspect_ratio,
        genre: f.genre, runtime: f.runtime, year: f.year,
        rating: f.avg_rating, ratingCount: f.rating_count,
        filmmakerId: f.filmmaker_id, uploaderId: f.filmmaker_id,
        description: f.description, createdAt: f.created_at,
      })),
      pagination: { page, hasMore: page * limit < total, total },
    })
  } catch (err) { next(err) }
})

// ---- PATCH /api/profiles/:id --------------------------------------------------
// role is deliberately excluded from updateProfileSchema — see POST /:id/role.
router.patch('/:id', requireAuth, requireOwner('profiles', 'id'), validateBody(updateProfileSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const b = req.body
  try {
    const result = await query(
      `UPDATE profiles SET
         name                      = COALESCE($1, name),
         bio                       = COALESCE($2, bio),
         school                    = COALESCE($3, school),
         city                      = COALESCE($4, city),
         top_genre                 = COALESCE($5, top_genre),
         looking_for_collaborators = COALESCE($6, looking_for_collaborators),
         favorite_genres           = COALESCE($7, favorite_genres),
         crew_roles                = COALESCE($8, crew_roles),
         avatar_url                = COALESCE($9, avatar_url),
         banner_url                = COALESCE($10, banner_url)
       WHERE id = $11
       RETURNING *`,
      [
        b.name ?? null, b.bio ?? null, b.school ?? null, b.city ?? null, b.topGenre ?? null,
        b.lookingForCollaborators ?? null, b.favoriteGenres ?? null, b.crewRoles ?? null,
        b.avatarUrl ?? null, b.bannerUrl ?? null, req.params.id,
      ]
    )
    if (!result.rowCount) throw notFound('Profile')
    const counts = await getProfileCounts(req.params.id)
    res.json(mapProfile(result.rows[0], counts))
  } catch (err) { next(err) }
})

// ---- POST /api/profiles/:id/role  (the ONLY way to change role — server-validated) --
router.post('/:id/role', requireAuth, requireOwner('profiles', 'id'), validateBody(roleChangeSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE profiles SET role = $1 WHERE id = $2 RETURNING *`,
      [req.body.role, req.params.id]
    )
    if (!result.rowCount) throw notFound('Profile')
    const counts = await getProfileCounts(req.params.id)
    res.json(mapProfile(result.rows[0], counts))
  } catch (err) { next(err) }
})

export default router
