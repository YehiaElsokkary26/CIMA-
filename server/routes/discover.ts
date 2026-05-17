import { Router, Response, NextFunction } from 'express'
import { query } from '../db'

const router = Router()

// ---- GET /api/discover/filmmakers -------------------------------------------
router.get('/filmmakers', async (req, res: Response, next: NextFunction) => {
  const { genre, city, school } = req.query as Record<string, string>

  try {
    let sql = `
      SELECT p.*,
             COUNT(DISTINCT f.id)::int   AS films_count,
             COUNT(DISTINCT cm.id)::int  AS cima_count
      FROM   profiles p
      LEFT   JOIN films f        ON f.uploader_id  = p.id
      LEFT   JOIN cima_members cm ON cm.owner_id   = p.id
      WHERE  p.role = 'filmmaker'
    `
    const params: any[] = []

    if (city) {
      sql += ` AND LOWER(p.city) LIKE LOWER($${params.length + 1})`
      params.push(`%${city}%`)
    }
    if (school) {
      sql += ` AND LOWER(p.school) LIKE LOWER($${params.length + 1})`
      params.push(`%${school}%`)
    }
    if (genre) {
      sql += ` AND p.top_genre ILIKE $${params.length + 1}`
      params.push(genre)
    }

    sql += ` GROUP BY p.id ORDER BY p.looking_for_collaborators DESC, p.created_at DESC`

    const result = await query(sql, params)
    res.json(result.rows.map((p) => ({
      id:                      p.id,
      name:                    p.name,
      email:                   p.email,
      role:                    p.role,
      bio:                     p.bio,
      school:                  p.school,
      city:                    p.city,
      avatarUrl:               p.avatar_url,
      topGenre:                p.top_genre,
      lookingForCollaborators: !!p.looking_for_collaborators,
      filmsCount:              p.films_count,
      cimaCount:               p.cima_count,
      createdAt:               p.created_at,
    })))
  } catch (err) { next(err) }
})

export default router
