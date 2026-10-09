import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth'
import { validate, updateUserSchema, roleChangeSchema } from '../lib/validators'
import { notFound } from '../lib/errors'

const router = Router()

function mapUser(u: any, counts?: { films: number; cima: number; reviews: number }, includeEmail = false) {
  return {
    id:                      u.id,
    name:                    u.name,
    ...(includeEmail ? { email: u.email } : {}),
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
    openToCollab:            !!u.looking_for_collaborators,
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

// ---- GET /api/users/:id ------------------------------------------------------
// Public profile view — email is included only when the caller is looking
// at their own profile (checked via optionalAuth, never trusted from the
// client). Everyone else only ever sees the public fields.
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id])
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.params.id as string)
    res.json(mapUser(result.rows[0], counts, req.userId === req.params.id))
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
      videoUrl: f.video_url, trailerUrl: f.trailer_url ?? undefined, aspectRatio: f.aspect_ratio ?? undefined,
      genre: f.genre, runtime: f.runtime_min, year: f.release_year,
      rating: f.avg_rating, ratingCount: f.rating_count,
      uploaderId: f.uploader_id, description: f.description, createdAt: f.created_at,
    })))
  } catch (err) { next(err) }
})

// ---- PATCH /api/users/me ----------------------------------------------------
// Note: this route must be defined BEFORE /:id to avoid "me" being treated as an ID
router.patch('/me', authMiddleware, validate(updateUserSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const {
    name, bio, school, city, topGenre, lookingForCollaborators,
    avatarUrl, bannerUrl, favoriteGenres, crewRoles,
  } = req.body
  try {
    const result = await query(
      `UPDATE profiles SET
         name                      = COALESCE($1, name),
         bio                       = COALESCE($2, bio),
         school                    = COALESCE($3, school),
         city                      = COALESCE($4, city),
         top_genre                 = COALESCE($5, top_genre),
         looking_for_collaborators = COALESCE($6, looking_for_collaborators),
         avatar_url                = COALESCE($7, avatar_url),
         banner_url                = COALESCE($8, banner_url),
         favorite_genres           = COALESCE($9, favorite_genres),
         crew_roles                = COALESCE($10, crew_roles),
         updated_at                = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name ?? null, bio ?? null, school ?? null, city ?? null, topGenre ?? null,
        lookingForCollaborators ?? null, avatarUrl ?? null, bannerUrl ?? null,
        favoriteGenres ?? null, crewRoles ?? null, req.userId,
      ]
    )
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.userId!)
    res.json(mapUser(result.rows[0], counts, true))
  } catch (err) { next(err) }
})

// ---- POST /api/users/me/role  (the ONLY way to change role) ----------------
router.post('/me/role', authMiddleware, validate(roleChangeSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE profiles SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [req.body.role, req.userId]
    )
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.userId!)
    res.json(mapUser(result.rows[0], counts, true))
  } catch (err) { next(err) }
})

export default router
