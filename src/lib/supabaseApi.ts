import { supabase } from './supabase'
import type { Film, User, Review } from '@/types'
import { getCurrentWeekKey } from './votingUtils'

// ─── Row → type mappers ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any, emailOverride?: string): User {
  return {
    id: row.id,
    name: row.name ?? '',
    email: emailOverride ?? row.email ?? '',
    role: row.role ?? 'viewer',
    avatar: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    school: row.school ?? undefined,
    city: row.city ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFilm(row: any): Film {
  const uploaderRow = row.profiles ?? null
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    thumbnailUrl: row.thumbnail_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    trailerUrl: row.trailer_url ?? undefined,
    aspectRatio: row.aspect_ratio ?? undefined,
    genre: row.genre ?? [],
    runtime: row.runtime ?? undefined,
    year: row.year,
    uploaderId: row.filmmaker_id,
    uploader: uploaderRow ? mapProfile(uploaderRow) : undefined,
    isFilmOfTheWeek: row.is_film_of_the_week ?? false,
    votes: row.votes ?? 0,
    weekKey: row.week_key ?? undefined,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): Review {
  const profileRow = row.profiles ?? null
  return {
    id: row.id,
    filmId: row.film_id,
    userId: row.user_id,
    user: profileRow ? mapProfile(profileRow) : undefined,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  }
}

const FILM_SELECT = '*, profiles!filmmaker_id(id, name, role, avatar_url, bio, school, city, created_at)'
const REVIEW_SELECT = '*, profiles!user_id(id, name, role, avatar_url, bio, created_at)'

// ─── Film functions ───────────────────────────────────────────────────────────

export async function getFilms(): Promise<Film[]> {
  const { data, error } = await supabase
    .from('films')
    .select(FILM_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapFilm)
}

export async function getFilmById(id: string): Promise<Film | null> {
  const { data, error } = await supabase
    .from('films')
    .select(FILM_SELECT)
    .eq('id', id)
    .single()
  if (error) return null
  return mapFilm(data)
}

export async function getFilmOfTheWeek(): Promise<Film | null> {
  const { data, error } = await supabase
    .from('films')
    .select(FILM_SELECT)
    .eq('is_film_of_the_week', true)
    .maybeSingle()
  if (error || !data) return null
  return mapFilm(data)
}

export async function insertFilm(film: {
  title: string
  description: string
  genre: string[]
  runtime?: number
  year: number
  thumbnailUrl?: string
  videoUrl?: string
  trailerUrl?: string
  aspectRatio?: string
  uploaderId: string
  uploaderName: string
  weekKey: string
}): Promise<Film> {
  const { data, error } = await supabase
    .from('films')
    .insert({
      title: film.title,
      description: film.description,
      genre: film.genre,
      runtime: film.runtime ?? null,
      year: film.year,
      thumbnail_url: film.thumbnailUrl ?? null,
      video_url: film.videoUrl ?? null,
      trailer_url: film.trailerUrl ?? null,
      aspect_ratio: film.aspectRatio ?? null,
      filmmaker_id: film.uploaderId,
      filmmaker_name: film.uploaderName,
      week_key: film.weekKey,
      votes: 0,
      is_film_of_the_week: false,
    })
    .select(FILM_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return mapFilm(data)
}

export async function deleteFilm(id: string): Promise<void> {
  const { error } = await supabase.from('films').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Vote functions ───────────────────────────────────────────────────────────

export async function getUserVoteFromDB(userId: string, weekKey: string): Promise<string | null> {
  const { data } = await supabase
    .from('votes')
    .select('film_id')
    .eq('user_id', userId)
    .eq('week_key', weekKey)
    .limit(1)
    .maybeSingle()
  return data?.film_id ?? null
}

export async function castVote(filmId: string, userId: string): Promise<void> {
  const weekKey = getCurrentWeekKey()
  const { error: insertError } = await supabase
    .from('votes')
    .insert({ user_id: userId, film_id: filmId, week_key: weekKey })
  if (insertError) throw new Error(insertError.message)

  // Fetch current vote count then increment (RPC would be cleaner but this works without custom SQL)
  const { data: filmData } = await supabase
    .from('films')
    .select('votes')
    .eq('id', filmId)
    .single()
  const currentVotes = (filmData?.votes as number) ?? 0
  await supabase.from('films').update({ votes: currentVotes + 1 }).eq('id', filmId)
}

// ─── Review functions ─────────────────────────────────────────────────────────

export async function getReviews(filmId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('film_id', filmId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapReview)
}

export async function insertReview(review: {
  filmId: string
  userId: string
  rating: number
  body: string
}): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      film_id: review.filmId,
      user_id: review.userId,
      rating: review.rating,
      body: review.body,
    })
    .select(REVIEW_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return mapReview(data)
}

// ─── Profile functions ────────────────────────────────────────────────────────

export async function getProfile(userId: string, emailOverride?: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapProfile(data, emailOverride)
}

export async function createProfile(profile: {
  id: string
  name: string
}): Promise<void> {
  await supabase.from('profiles').insert({ id: profile.id, name: profile.name })
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  await supabase.from('profiles').update({ role }).eq('id', userId)
}

// ─── Storage upload ───────────────────────────────────────────────────────────

export async function uploadFile(bucket: string, file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}
