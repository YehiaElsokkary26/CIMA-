import { useMemo } from 'react'
import type { Film, User } from '@/types'
import { getUserVoteThisWeek } from '@/lib/votingUtils'
import { getFilmById } from '@/lib/mockData'

interface RecommendationResult {
  films: Film[]
  interestGenres: string[]
  hasPreferences: boolean
  reason: string
}

function scoreFilm(film: Film, signals: {
  favoriteGenres: string[]
  topGenre: string | undefined
  ownFilmGenres: string[]
  votedFilmGenres: string[]
  userId: string | undefined
}): number {
  // Never recommend the user's own uploads
  if (film.uploaderId === signals.userId) return -1

  const filmGenres = film.genre.map((g) => g.toLowerCase())
  let score = 0

  // Explicitly saved favourite genres — highest personal signal
  for (const fg of signals.favoriteGenres) {
    if (filmGenres.includes(fg.toLowerCase())) score += 50
  }

  // Their declared top genre
  if (signals.topGenre && filmGenres.includes(signals.topGenre.toLowerCase())) {
    score += 30
  }

  // Genres from the films they've made — filmmaker taste signal
  for (const og of signals.ownFilmGenres) {
    if (filmGenres.includes(og.toLowerCase())) score += 20
  }

  // Genres from the film they voted for this week — revealed preference
  for (const vg of signals.votedFilmGenres) {
    if (filmGenres.includes(vg.toLowerCase())) score += 15
  }

  // Quality bonus — well-rated films score higher within same genre tier
  score += ((film.rating ?? 0) / 5) * 15

  // Community traction bonus
  if ((film.votes ?? 0) > 500) score += 8
  else if ((film.votes ?? 0) > 200) score += 4

  return score
}

export function useRecommendations(
  user: User | null,
  allFilms: Film[],
  limit = 6,
): RecommendationResult {
  return useMemo(() => {
    const empty: RecommendationResult = {
      films: [],
      interestGenres: [],
      hasPreferences: false,
      reason: '',
    }
    if (!user || allFilms.length === 0) return empty

    // ── Build signals ──────────────────────────────────────────────

    const ownFilms = allFilms.filter((f) => f.uploaderId === user.id)
    const ownFilmGenres = [...new Set(ownFilms.flatMap((f) => f.genre))]

    // Voted film this week reveals a real preference signal
    const votedFilmId = getUserVoteThisWeek(user.id)
    const votedFilm = votedFilmId ? getFilmById(votedFilmId) : undefined
    const votedFilmGenres = votedFilm?.genre ?? []

    const favoriteGenres = user.favoriteGenres ?? []
    const topGenre = user.topGenre

    const signals = {
      favoriteGenres,
      topGenre,
      ownFilmGenres,
      votedFilmGenres,
      userId: user.id,
    }

    // All genre sources deduplicated — used for "Because you like" chips
    const interestGenres = [...new Set([
      ...favoriteGenres,
      ...(topGenre ? [topGenre] : []),
      ...ownFilmGenres,
      ...votedFilmGenres,
    ])]

    const hasPreferences =
      favoriteGenres.length > 0 ||
      !!topGenre ||
      ownFilmGenres.length > 0 ||
      votedFilmGenres.length > 0

    // ── Score and rank ─────────────────────────────────────────────

    if (!hasPreferences) {
      // No signals yet — serve top-rated films the user hasn't uploaded
      const fallback = [...allFilms]
        .filter((f) => f.uploaderId !== user.id)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, limit)
      return {
        films: fallback,
        interestGenres: [],
        hasPreferences: false,
        reason: 'Top-rated across the community',
      }
    }

    const ranked = allFilms
      .map((film) => ({ film, score: scoreFilm(film, signals) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ film }) => film)

    // Build a human-readable reason string
    const topGenres = interestGenres.slice(0, 3)
    const reason =
      topGenres.length > 0
        ? `Because you like ${topGenres.join(' · ')}`
        : 'Picked for you'

    return { films: ranked, interestGenres, hasPreferences, reason }
  }, [user, allFilms, limit])
}
