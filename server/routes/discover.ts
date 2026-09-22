import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { validateQuery, discoverFilmmakersQuerySchema } from '../lib/validators'

const router = Router()

// ---- GET /api/discover/filmmakers -------------------------------------------
router.get('/filmmakers', validateQuery(discoverFilmmakersQuerySchema), async (req, res: Response, next: NextFunction) => {
  const { genre, city, school, page, limit } = req.query as any

  try {
    const where: string[] = [`p.role = 'filmmaker'`]
    const params: any[] = []

    if (city) {
      where.push(`LOWER(p.city) LIKE LOWER($${params.length + 1})`)
      params.push(`%${city}%`)
    }
    if (school) {
      where.push(`LOWER(p.school) LIKE LOWER($${params.length + 1})`)
      params.push(`%${school}%`)
    }
    if (genre) {
      where.push(`p.top_genre ILIKE $${params.length + 1}`)
      params.push(genre)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM profiles p ${whereSql}`, params)
    const total = countRes.rows[0]?.total ?? 0

    const dataParams = [...params, limit, (page - 1) * limit]
    const result = await query(
      `SELECT p.*,
              COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'published')::int AS films_count,
              COUNT(DISTINCT cm.id)::int  AS cima_count
       FROM   profiles p
       LEFT   JOIN films f         ON f.filmmaker_id = p.id
       LEFT   JOIN cima_members cm ON cm.owner_id     = p.id
       ${whereSql}
       GROUP BY p.id
       ORDER BY p.looking_for_collaborators DESC, p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    )

    res.json({
      data: result.rows.map((p) => ({
        id:                      p.id,
        name:                    p.name,
        role:                    p.role,
        bio:                     p.bio,
        school:                  p.school,
        city:                    p.city,
        avatarUrl:               p.avatar_url,
        bannerUrl:               p.banner_url,
        topGenre:                p.top_genre,
        favoriteGenres:          p.favorite_genres ?? [],
        crewRoles:               p.crew_roles ?? [],
        lookingForCollaborators: !!p.looking_for_collaborators,
        filmsCount:              p.films_count,
        cimaCount:               p.cima_count,
        createdAt:               p.created_at,
      })),
      pagination: { page, hasMore: page * limit < total, total },
    })
  } catch (err) { next(err) }
})

export default router
