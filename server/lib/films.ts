/**
 * Shared film queries. Every endpoint that returns films goes through
 * listFilms / getFilm so the API always returns the same shape
 * (votes this week, laurels, weekKey, uploader).
 */
import { query } from '../db'

/** Monday of the current voting week, in UTC (the same week the app shows). */
export const VOTE_WEEK_SQL = `date_trunc('week', now() AT TIME ZONE 'UTC')::date`

const FILM_SELECT = `
  SELECT f.*,
         p.name        AS uploader_name,
         p.role        AS uploader_account_role,
         p.school      AS uploader_school,
         p.bio         AS uploader_bio,
         p.avatar_url  AS uploader_avatar,
         p.created_at  AS uploader_created_at,
         to_char(f.created_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS week_key,
         r.avg_rating, r.rating_count, v.votes, ff.laurels, ff.is_film_of_the_week
  FROM   films f
  JOIN   profiles p ON p.id = f.uploader_id
  -- Each count is taken on its own (one index lookup per film). Joining the
  -- tables together first multiplied rows: 30 ratings x 1,500 votes = 45,000.
  LEFT   JOIN LATERAL (
           SELECT ROUND(AVG(rating)::numeric, 1)::float AS avg_rating, COUNT(*)::int AS rating_count
           FROM ratings WHERE film_id = f.id) r ON true
  LEFT   JOIN LATERAL (
           SELECT COUNT(*)::int AS votes
           FROM votes WHERE film_id = f.id AND week_start = ${VOTE_WEEK_SQL}) v ON true
  LEFT   JOIN LATERAL (
           SELECT COUNT(*)::int AS laurels, BOOL_OR(week_start = ${VOTE_WEEK_SQL}) AS is_film_of_the_week
           FROM featured_films WHERE film_id = f.id) ff ON true
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

export async function listFilms(opts: { genre?: string; sort?: string; uploaderId?: string; savedBy?: string } = {}) {
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
  let savedRef = ''
  if (opts.savedBy) {
    params.push(opts.savedBy)
    savedRef = `$${params.length}`
  }
  let sql = FILM_SELECT
  // A watchlist: only films this person saved, most recently saved first.
  if (savedRef) sql += ` JOIN saved_films s ON s.film_id = f.id AND s.user_id = ${savedRef}`
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`

  sql += savedRef
    ? ' ORDER BY s.created_at DESC'
    : opts.sort === 'top'
      ? ' ORDER BY avg_rating DESC NULLS LAST, f.created_at DESC'
      : ' ORDER BY f.created_at DESC'
  const result = await query(sql, params)
  return result.rows.map(mapFilm)
}

export async function getFilm(id: string) {
  const result = await query(`${FILM_SELECT} WHERE f.id = $1`, [id])
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
