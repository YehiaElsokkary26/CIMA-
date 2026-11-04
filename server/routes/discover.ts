import { Router, Response, NextFunction } from 'express'
import { query } from '../db'

const router = Router()

// ---- GET /api/discover/filmmakers -------------------------------------------
router.get('/filmmakers', async (req, res: Response, next: NextFunction) => {
  const q = (k: string) => (typeof req.query[k] === 'string' ? (req.query[k] as string).slice(0, 100) : '')
  const genre = q('genre')
  const city = q('city')
  const school = q('school')

  try {
    let sql = `
      SELECT p.*,
             COUNT(DISTINCT f.id)::int   AS films_count,
             COUNT(DISTINCT cm.id)::int  AS cima_count
      FROM   profiles p
      LEFT   JOIN films f         ON f.uploader_id = p.id
      LEFT   JOIN cima_members cm ON cm.owner_id   = p.id
      WHERE  p.role = 'filmmaker'
    `
    const params: unknown[] = []

    // Escape LIKE wildcards so a search for "100%" doesn't match everything.
    const like = (v: string) => `%${v.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

    if (city) {
      params.push(like(city))
      sql += ` AND p.city ILIKE $${params.length}`
    }
    if (school) {
      params.push(like(school))
      sql += ` AND p.school ILIKE $${params.length}`
    }
    if (genre) {
      params.push(genre)
      sql += ` AND p.top_genre ILIKE $${params.length}`
    }

    sql += ` GROUP BY p.id ORDER BY p.looking_for_collaborators DESC, p.created_at DESC LIMIT 200`

    const result = await query(sql, params)
    res.json(result.rows.map((p) => ({
      id:                      p.id,
      name:                    p.name,
      email:                   '',
      role:                    p.role,
      bio:                     p.bio ?? undefined,
      school:                  p.school ?? undefined,
      city:                    p.city ?? undefined,
      avatarUrl:               p.avatar_url ?? undefined,
      topGenre:                p.top_genre ?? undefined,
      favoriteGenres:          p.favorite_genres ?? [],
      crewRoles:               p.crew_roles ?? [],
      lookingForCollaborators: !!p.looking_for_collaborators,
      openToCollab:            !!p.looking_for_collaborators,
      filmsCount:              p.films_count,
      cimaCount:               p.cima_count,
      createdAt:               p.created_at,
    })))
  } catch (err) { next(err) }
})

export default router
