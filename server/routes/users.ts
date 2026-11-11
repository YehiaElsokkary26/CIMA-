import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth'
import { validate, validUuid, updateUserSchema, roleChangeSchema } from '../lib/validators'
import { notFound } from '../lib/errors'
import { listFilms } from '../lib/films'

const router = Router()

export function mapUser(u: any, counts?: { films: number; cima: number; reviews: number }, includeEmail = false) {
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
  const [films, crew, reviews] = await Promise.all([
    query('SELECT COUNT(*)::int AS c FROM films        WHERE uploader_id = $1', [userId]),
    query('SELECT COUNT(*)::int AS c FROM cima_members WHERE owner_id    = $1', [userId]),
    query('SELECT COUNT(*)::int AS c FROM reviews      WHERE user_id     = $1', [userId]),
  ])
  return {
    films:   films.rows[0].c,
    cima:    crew.rows[0].c,
    reviews: reviews.rows[0].c,
  }
}

// ---- GET /api/users/:id ------------------------------------------------------
// Public profile. The email is only included when you are looking at your own
// profile (checked from the verified token, never from the request).
router.get('/:id', validUuid('id'), optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.params.id])
    if (!result.rowCount) throw notFound('User')
    const counts = await getUserCounts(req.params.id as string)
    res.json(mapUser(result.rows[0], counts, req.userId === req.params.id))
  } catch (err) { next(err) }
})

// ---- GET /api/users/:id/films -----------------------------------------------
router.get('/:id/films', validUuid('id'), async (req, res: Response, next: NextFunction) => {
  try {
    res.json(await listFilms({ uploaderId: req.params.id as string }))
  } catch (err) { next(err) }
})

// ---- PATCH /api/users/me ----------------------------------------------------
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
         -- Sending an empty top genre clears it; leaving it out keeps it.
         top_genre                 = CASE WHEN $5::text IS NULL THEN top_genre ELSE NULLIF($5, '') END,
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

// ---- POST /api/users/me/role  (the only way to change role) -----------------
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
