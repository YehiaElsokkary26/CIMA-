import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Film as FilmIcon, Search } from 'lucide-react'
import { useFeaturedFilm, useFilms, useMyVoteThisWeek } from '@/hooks/useFilms'
import { useRecommendations } from '@/hooks/useRecommendations'
import { getCurrentWeekKey, getWeekCountdown } from '@/lib/votingUtils'
import { timecode, weekNumber } from '@/lib/klaket'
import { GENRES, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useSearchStore } from '@/store/searchStore'
import type { Film } from '@/types'
import { Band, SectionHeader } from '@/components/klaket/primitives'
import {
  FilmStill,
  PosterCard,
  PosterCardSkeleton,
  SlateFilmCard,
  SlateFilmCardSkeleton,
} from '@/components/klaket/FilmCards'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

type SortOption = 'Latest' | 'Top rated' | 'Most discussed'
const SORTS: SortOption[] = ['Latest', 'Top rated', 'Most discussed']
const PAGE_SIZE = 8
const POSTER_GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isFilmmaker = useAuthStore((s) => s.role) === 'filmmaker'
  const { query: searchQuery, clear: clearSearch } = useSearchStore()

  const routeState = location.state as { publishedFilmId?: unknown } | null
  const publishedFilmId = typeof routeState?.publishedFilmId === 'string' ? routeState.publishedFilmId : undefined
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState<SortOption>('Latest')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const { data: serverFilms, isPending: isLoading, isError, refetch } = useFilms()
  const { data: featured } = useFeaturedFilm()
  const { data: myVote } = useMyVoteThisWeek()

  const allFilms: Film[] = useMemo(() => serverFilms ?? [], [serverFilms])
  const recommendations = useRecommendations(user, allFilms, 4, myVote?.filmId)
  const week = weekNumber()

  // Search: exact title → title starts with → title contains → genre → filmmaker → anything else
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const scored: Array<{ film: Film; score: number }> = []
    for (const film of allFilms) {
      const title = film.title.toLowerCase()
      const name = (film.uploader?.name ?? '').toLowerCase()
      const desc = (film.description ?? '').toLowerCase()
      const genres = film.genre.map((g) => g.toLowerCase())
      let score = 0
      if (title === q) score = 100
      else if (title.startsWith(q)) score = 80
      else if (title.includes(q)) score = 60
      else if (genres.some((g) => g.startsWith(q))) score = 40
      else if (name.startsWith(q)) score = 30
      else if (name.includes(q) || genres.some((g) => g.includes(q)) || desc.includes(q)) score = 10
      if (score) scored.push({ film, score })
    }
    return scored.sort((a, b) => b.score - a.score).map((s) => s.film)
  }, [allFilms, searchQuery])

  // This week's slate: films entered this week, most votes first.
  const slate = useMemo(() => {
    const wk = getCurrentWeekKey()
    const others = allFilms.filter((f) => f.id !== featured?.id)
    const thisWeek = others.filter((f) => f.weekKey === wk)
    return [...(thisWeek.length ? thisWeek : others)].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
  }, [allFilms, featured?.id])

  const filtered = useMemo(() => {
    const byGenre =
      genre === 'All' ? allFilms : allFilms.filter((f) => f.genre.some((g) => g.toLowerCase() === genre.toLowerCase()))
    const sorted = [...byGenre]
    if (sort === 'Top rated') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sort === 'Most discussed') sorted.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
    else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted
  }, [allFilms, genre, sort])

  const genres = useMemo(() => {
    const present = new Set(allFilms.flatMap((f) => f.genre))
    return ['All', ...GENRES.filter((g) => present.has(g))]
  }, [allFilms])

  // After publishing, scroll to the new film in "All films" and ring it for a moment.
  useEffect(() => {
    if (!publishedFilmId) return
    if (searchQuery) {
      clearSearch()
      return
    }
    if (!allFilms.some((f) => f.id === publishedFilmId)) return
    setGenre('All')
    setSort('Latest')
    const frame = requestAnimationFrame(() => {
      document.getElementById(`published-film-${publishedFilmId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedId(publishedFilmId)
      navigate(location.pathname, { replace: true, state: null })
    })
    return () => cancelAnimationFrame(frame)
  }, [publishedFilmId, allFilms, searchQuery, clearSearch, navigate, location.pathname])

  useEffect(() => {
    if (!highlightedId) return
    const t = window.setTimeout(() => setHighlightedId(null), 3500)
    return () => window.clearTimeout(t)
  }, [highlightedId])

  const weekBand = <Band left={`Week ${week}`} right={`Voting closes in ${getWeekCountdown()}`} />

  /* ─── Search mode ────────────────────────────────────────────────────── */
  if (searchQuery) {
    return (
      <div className="min-h-full">
        <Band tone="solid" left={`Results for “${searchQuery}”`} right={`${searchResults.length} films`} />
        <div className="max-w-6xl mx-auto px-4 py-4">
          {isLoading ? (
            <div className={POSTER_GRID}>{Array.from({ length: 4 }).map((_, i) => <PosterCardSkeleton key={i} />)}</div>
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No films found"
              subtitle={`Nothing matches “${searchQuery}”. Try a title, a scene (genre) or a filmmaker’s name.`}
              action={<Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>}
            />
          ) : (
            <div className={POSTER_GRID}>{searchResults.map((f) => <PosterCard key={f.id} film={f} />)}</div>
          )}
        </div>
      </div>
    )
  }

  /* ─── Couldn't reach the server ──────────────────────────────────────── */
  if (isError) {
    return (
      <div className="min-h-full">
        {weekBand}
        <EmptyState
          icon={AlertCircle}
          title="Couldn’t load films"
          subtitle="Something went wrong reaching the server. Check your connection and try again."
          action={<Button variant="solid" size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    )
  }

  /* ─── Nothing uploaded yet ───────────────────────────────────────────── */
  if (!isLoading && allFilms.length === 0) {
    return (
      <div className="min-h-full">
        {weekBand}
        <EmptyState
          icon={FilmIcon}
          title="Empty slate"
          subtitle="No films yet. Be the first to put one in front of the community."
          action={
            isFilmmaker ? (
              <Link to="/upload" className="press inline-flex items-center min-h-[48px] px-4 bg-k-red text-k-paper font-extrabold text-[14px]">
                UPLOAD YOUR FILM
              </Link>
            ) : undefined
          }
        />
      </div>
    )
  }

  const highlightIndex = highlightedId ? filtered.findIndex((f) => f.id === highlightedId) + 1 : 0
  const shown = filtered.slice(0, Math.max(visible, highlightIndex))

  return (
    <div className="min-h-full">
      {weekBand}

      <div className="max-w-6xl mx-auto px-4 pt-4 lg:pt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        {isLoading ? (
          <div className="skeleton h-[480px]" aria-hidden="true" />
        ) : featured ? (
          <FilmOfTheWeekPoster film={featured} />
        ) : (
          <NoWinnerYet />
        )}

        <section aria-label="This week’s slate" className="flex flex-col gap-3">
          <SectionHeader title="THIS WEEK’S SLATE" action={{ to: '/vote', label: `Vote · ${slate.length} films` }} />
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SlateFilmCardSkeleton key={i} />)
            : slate.slice(0, 4).map((f) => <SlateFilmCard key={f.id} film={f} />)}
          {slate.length > 4 && (
            <Link
              to="/vote"
              className="press k-label text-[11px] font-semibold text-center min-h-[44px] flex items-center justify-center border-[1.5px] border-foreground hover:bg-foreground/5"
            >
              See all {slate.length} films on the contact sheet →
            </Link>
          )}
        </section>
      </div>

      {!isLoading && recommendations.films.length > 0 && (
        <section aria-label="Picked for you" className="max-w-6xl mx-auto px-4 mt-10 flex flex-col gap-3">
          <SectionHeader title="PICKED FOR YOU" />
          <div className="flex flex-wrap items-center gap-1.5">
            {recommendations.interestGenres.length > 0 ? (
              <>
                <span className="k-label text-[10px] text-muted-foreground">Because you like</span>
                {recommendations.interestGenres.slice(0, 5).map((g) => (
                  <span key={g} className="k-label text-[10px] font-semibold px-1.5 py-0.5 bg-k-mustard text-k-ink">{g}</span>
                ))}
              </>
            ) : (
              <span className="k-label text-[10px] text-muted-foreground">{recommendations.reason}</span>
            )}
          </div>
          <div className={POSTER_GRID}>{recommendations.films.map((f) => <PosterCard key={f.id} film={f} />)}</div>
          {!recommendations.hasPreferences && (
            <Link to="/profile/me/edit" className="k-label text-[10.5px] underline underline-offset-4 self-start min-h-[32px] flex items-center">
              Pick your favourite scenes for better picks →
            </Link>
          )}
        </section>
      )}

      <section aria-label="All films" className="max-w-6xl mx-auto px-4 mt-10 flex flex-col gap-3">
        <SectionHeader title="ALL FILMS" meta={`${filtered.length} films`} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="scroll-x flex gap-1.5 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by scene (genre)">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={genre === g}
                onClick={() => {
                  setGenre(g)
                  setVisible(PAGE_SIZE)
                }}
                className={cn(
                  'shrink-0 k-label text-[11px] font-semibold px-3 min-h-[36px] border-[1.5px] border-foreground press',
                  genre === g ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex border-[1.5px] border-foreground self-start shrink-0" role="group" aria-label="Sort">
            {SORTS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
                className={cn('k-label text-[10px] font-semibold px-2.5 min-h-[36px]', sort === s ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={POSTER_GRID}>{Array.from({ length: 8 }).map((_, i) => <PosterCardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FilmIcon} title={`No ${genre} yet`} subtitle="Try another scene, or upload the first one." />
        ) : (
          <>
            <div className={POSTER_GRID}>
              {shown.map((f) => (
                <PosterCard key={f.id} film={f} domId={`published-film-${f.id}`} highlighted={highlightedId === f.id} />
              ))}
            </div>
            {shown.length < filtered.length && (
              <button
                type="button"
                onClick={() => setVisible(shown.length + PAGE_SIZE)}
                className="press mt-2 min-h-[48px] border-[1.5px] border-foreground k-label text-[11px] font-semibold hover:bg-foreground/5"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/* ─── Film of the week as an Egyptian-style poster ──────────────────────── */

function FilmOfTheWeekPoster({ film }: { film: Film }) {
  return (
    <section aria-label="Film of the week" className="flex flex-col">
      <div className="bg-k-red text-k-paper border-[1.5px] border-foreground overflow-hidden">
        <div className="flex justify-between gap-2 px-3 py-2.5 k-label text-[10.5px]">
          <span className="font-semibold">★ Film of the week</span>
          <span>{(film.votes ?? 0).toLocaleString()} votes</span>
        </div>
        <FilmStill film={film} className="mx-3 h-[250px] sm:h-[300px] border-[1.5px] border-k-ink" />
        <div className="px-3 pt-3 pb-1">
          <span lang="ar" className="k-poster block text-[26px] text-k-mustard">فيلم الأسبوع</span>
          <h2 className="k-display text-[30px] sm:text-[38px] uppercase">{film.title}</h2>
          {film.description && <p className="text-[13.5px] mt-2 line-clamp-2 opacity-90 max-w-[50ch]">{film.description}</p>}
        </div>
        <div className="grid grid-cols-3 border-t-[1.5px] border-k-paper mt-3">
          <div className="slate-cell border-e-[1.5px] border-k-paper">Directed by<b>{film.uploader?.name ?? '—'}</b></div>
          <div className="slate-cell border-e-[1.5px] border-k-paper">School<b>{film.uploader?.school ?? '—'}</b></div>
          <div className="slate-cell">Runtime<b>{film.runtime ? `${film.runtime} min` : '—'}</b></div>
        </div>
      </div>
      <Link
        to={`/film/${film.id}`}
        className="press mt-2.5 flex items-center justify-between min-h-[50px] px-4 bg-solid text-solid-foreground font-extrabold text-[15px]"
        style={{ fontStretch: '110%' }}
      >
        <span>WATCH THE WINNER</span>
        <span className="k-label text-[11px] font-normal">▶ {film.runtime ? timecode(film.runtime * 60) : 'Play'}</span>
      </Link>
    </section>
  )
}

function NoWinnerYet() {
  return (
    <section aria-label="Film of the week" className="border-[1.5px] border-foreground bg-k-red text-k-paper flex flex-col">
      <div className="clap-fixed h-3" aria-hidden="true" />
      <div className="p-4 flex flex-col gap-2">
        <span className="k-label text-[10.5px] font-semibold">★ Film of the week</span>
        <span lang="ar" className="k-poster text-[30px] text-k-mustard">لسه ما فيش فايز</span>
        <h2 className="k-display text-[26px] uppercase">No winner yet</h2>
        <p className="text-[14px] max-w-[40ch]">The first winner is announced when this week’s vote closes. Circle your pick before then.</p>
        <Link to="/vote" className="press self-start mt-1 inline-flex items-center min-h-[44px] px-4 bg-k-ink text-k-paper font-extrabold text-[13px]">
          GO TO THE VOTE →
        </Link>
      </div>
    </section>
  )
}
