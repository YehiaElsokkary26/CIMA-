import { Router, Response, NextFunction } from 'express'
import { query } from '../db'

const router = Router()

// ---- GET /api/discover/filmmakers -------------------------------------------
router.get('/filmmakers', async (req, res: Response, next: NextFunction) => {
  const { genre, city, school } = req.query as Record<string, string>

  try {
    let sql = `
      SELECT u.*,
             COUNT(DISTINCT f.id)::int  AS films_count,
             COUNT(DISTINCT cm.id)::int AS cima_count
      FROM   users u
      LEFT   JOIN films f       ON f.uploader_id = u.id
      LEFT   JOIN cima_members cm ON cm.owner_id = u.id
      WHERE  u.role = 'filmmaker'
    `
    const params: any[] = []

    if (city) {
      sql += ` AND LOWER(u.city) LIKE LOWER($${params.length + 1})`
      params.push(`%${city}%`)
    }
    if (school) {
      sql += ` AND LOWER(u.school) LIKE LOWER($${params.length + 1})`
      params.push(`%${school}%`)
    }
    if (genre) {
      sql += ` AND u.top_genre ILIKE $${params.length + 1}`
      params.push(genre)
    }

    sql += ` GROUP BY u.id ORDER BY u.looking_for_collaborators DESC, u.created_at DESC`

    const result = await query(sql, params)
    res.json(result.rows.map((u) => ({
      id:                      u.id,
      name:                    u.name,
      email:                   u.email,
      role:                    u.role,
      bio:                     u.bio,
      school:                  u.school,
      city:                    u.city,
      avatarUrl:               u.avatar_url,
      topGenre:                u.top_genre,
      lookingForCollaborators: !!u.looking_for_collaborators,
      filmsCount:              u.films_count,
      cimaCount:               u.cima_count,
      createdAt:               u.created_at,
    })))
  } catch (err) { next(err) }
})

export default router
