/**
 * Shared film queries. Every endpoint that returns films goes through
 * listFilms / getFilm so the API always returns the same shape
 * (votes this week, laurels, weekKey, uploader).
 */
import { query } from '../db'

/** Monday of the current voting week, in the database's time zone. */
export const VOTE_WEEK_SQL = `date_trunc('week', CURRENT_DATE)::date`

const FILM_SELECT = `
  SELECT f.*,
         p.name        AS uploader_name,
         p.role        AS uploader_account_role,
         p.school      AS uploader_school,
         p.bio         AS uploader_bio,
         p.avatar_url  AS uploader_avatar,
         p.created_at  AS uploader_created_at,
         to_char(f.created_at, 'IYYY-"W"IW')                                        AS week_key,
         ROUND(AVG(r.rating)::numeric, 1)::float                                     AS avg_rating,
         COUNT(DISTINCT r.id)::int                                                   AS rating_count,
         COUNT(DISTINCT v.id) FILTER (WHERE v.week_start = ${VOTE_WEEK_SQL})::int    AS votes,
         COUNT(DISTINCT ff_all.id)::int                                              AS laurels,
         BOOL_OR(ff_all.week_start = ${VOTE_WEEK_SQL})                               AS is_film_of_the_week
  FROM   films f
  JOIN   profiles p ON p.id = f.uploader_id
  LEFT   JOIN ratings r         ON r.film_id = f.id
  LEFT   JOIN votes   v         ON v.film_id = f.id
  LEFT   JOIN featured_films ff_all ON ff_all.film_id = f.id
`

export function mapFilm(f: any) {
  if (!f) return null
  return {
    id:              f.id,
    title:           f.title,
    description:     f.description ?? undefined,
    thumbnailUrl:    f.thumbnail_url ?? undefined,
    videoUrl:        f.video_url ?? undefined,
    trailerUrl:      f.trailer_url ?? undefined,
    aspectRatio:     f.aspect_ratio ?? undefined,
    uploaderRole:    f.uploader_role ?? undefined,
    genre:           f.genre ?? [],
    runtime:         f.runtime_min ?? undefined,
    year:            f.release_year ?? undefined,
    rating:          f.avg_rating ?? undefined,
    ratingCount:     f.rating_count ?? 0,
    votes:           f.votes ?? 0,
    laurels:         f.laurels ?? 0,
    isFilmOfTheWeek: !!f.is_film_of_the_week,
    weekKey:         f.week_key ?? undefined,
    uploaderId:      f.uploader_id,
    uploader: f.uploader_name !== undefined && f.uploader_name !== null ? {
      id:        f.uploader_id,
      name:      f.uploader_name,
      role:      f.uploader_account_role,
      school:    f.uploader_school ?? undefined,
      bio:       f.uploader_bio ?? undefined,
      avatarUrl: f.uploader_avatar ?? undefined,
      email:     '',
      createdAt: f.uploader_created_at,
    } : undefined,
    createdAt: f.created_at,
  }
}

export async function listFilms(opts: { genre?: string; sort?: string; uploaderId?: string } = {}) {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.genre) {
    params.push(opts.genre)
    where.push(`$${params.length} = ANY(f.genre)`)
  }
  if (opts.uploaderId) {
    params.push(opts.uploaderId)
    where.push(`f.uploader_id = $${params.length}`)
  }
  let sql = FILM_SELECT
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`
  sql += ' GROUP BY f.id, p.id'
  sql += opts.sort === 'top'
    ? ' ORDER BY avg_rating DESC NULLS LAST, f.created_at DESC'
    : ' ORDER BY f.created_at DESC'
  const result = await query(sql, params)
  return result.rows.map(mapFilm)
}

export async function getFilm(id: string) {
  const result = await query(`${FILM_SELECT} WHERE f.id = $1 GROUP BY f.id, p.id`, [id])
  return mapFilm(result.rows[0] ?? null)
}

/**
 * Film of the week = the most-voted film of the previous voting week.
 * The winner is written to featured_films the first time anyone asks for it
 * this week, so it stays fixed for the whole week and earns a laurel.
 * Ties go to the film that got its first vote earliest.
 */
export async function getOrPickFilmOfTheWeek(): Promise<string | null> {
  const existing = await query<{ film_id: string }>(
    `SELECT film_id FROM featured_films WHERE week_start = ${VOTE_WEEK_SQL} LIMIT 1`
  )
  if (existing.rowCount) return existing.rows[0].film_id

  const winner = await query<{ film_id: string }>(
    `SELECT film_id
     FROM   votes
     WHERE  week_start = ${VOTE_WEEK_SQL} - 7
     GROUP  BY film_id
     ORDER  BY COUNT(*) DESC, MIN(created_at) ASC
     LIMIT  1`
  )
  if (!winner.rowCount) return null

  const filmId = winner.rows[0].film_id
  await query(
    `INSERT INTO featured_films (film_id, week_start)
     VALUES ($1, ${VOTE_WEEK_SQL})
     ON CONFLICT (week_start) DO NOTHING`,
    [filmId]
  )
  // Another request may have inserted first; read back whatever won.
  const final = await query<{ film_id: string }>(
    `SELECT film_id FROM featured_films WHERE week_start = ${VOTE_WEEK_SQL} LIMIT 1`
  )
  return final.rows[0]?.film_id ?? filmId
}
