import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film as FilmIcon } from 'lucide-react'
import { useFilms, useFeaturedFilm } from '@/hooks/useFilms'
import { getFilms, getFilmOfTheWeek } from '@/lib/mockData'
import { getCurrentWeekKey, getWeekCountdown } from '@/lib/votingUtils'
import { timecode, weekNumber } from '@/lib/klaket'
import { GENRES, cn } from '@/lib/utils'
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

type SortOption = 'Latest' | 'Top rated' | 'Most discussed'
const SORTS: SortOption[] = ['Latest', 'Top rated', 'Most discussed']
const PAGE_SIZE = 8

export default function HomePage() {
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState<SortOption>('Latest')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const { data: serverFilms, isLoading } = useFilms()
  const { data: serverFeatured } = useFeaturedFilm()

  const allFilms: Film[] = serverFilms ?? getFilms()
  const featured: Film | undefined = serverFeatured ?? getFilmOfTheWeek()
  const week = weekNumber()

  // This week's slate: films entered this week, most votes first.
  const slate = useMemo(() => {
    const wk = getCurrentWeekKey()
    const thisWeek = allFilms.filter((f) => f.weekKey === wk && f.id !== featured?.id)
    const pool = thisWeek.length ? thisWeek : allFilms.filter((f) => f.id !== featured?.id)
    return [...pool].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
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

  return (
    <div className="min-h-full">
      <Band left={`Week ${week}`} right={`Voting closes in ${getWeekCountdown()}`} />

      <div className="max-w-6xl mx-auto px-4 pt-4 lg:pt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        {/* Film of the week */}
        {featured ? <FilmOfTheWeekPoster film={featured} /> : <div className="skeleton h-[480px]" aria-hidden="true" />}

        {/* This week's slate */}
        <section aria-label="This week’s slate" className="flex flex-col gap-3">
          <SectionHeader
            title="THIS WEEK’S SLATE"
            action={{ to: '/vote', label: `Vote · ${slate.length} films` }}
          />
          {isLoading && !serverFilms && slate.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <SlateFilmCardSkeleton key={i} />)
          ) : slate.length === 0 ? (
            <EmptyState icon={FilmIcon} title="Empty slate" subtitle="No films entered this week yet. Be the first to upload." />
          ) : (
            slate.slice(0, 4).map((f) => <SlateFilmCard key={f.id} film={f} />)
          )}
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

      {/* All films */}
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
                className={cn(
                  'k-label text-[10px] font-semibold px-2.5 min-h-[36px]',
                  sort === s ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading && !serverFilms && allFilms.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <PosterCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FilmIcon} title={`No ${genre} yet`} subtitle="Try another scene, or upload the first one." />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.slice(0, visible).map((f) => (
                <PosterCard key={f.id} film={f} />
              ))}
            </div>
            {visible < filtered.length && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="press mt-2 min-h-[48px] border-[1.5px] border-foreground k-label text-[11px] font-semibold hover:bg-foreground/5"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visible)} more
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
          {film.description && (
            <p className="text-[13.5px] mt-2 line-clamp-2 opacity-90 max-w-[50ch]">{film.description}</p>
          )}
        </div>
        <div className="grid grid-cols-3 border-t-[1.5px] border-k-paper mt-3">
          <div className="slate-cell border-e-[1.5px] border-k-paper">
            Directed by<b>{film.uploader?.name ?? '—'}</b>
          </div>
          <div className="slate-cell border-e-[1.5px] border-k-paper">
            School<b>{film.uploader?.school ?? '—'}</b>
          </div>
          <div className="slate-cell">
            Runtime<b>{film.runtime ? `${film.runtime} min` : '—'}</b>
          </div>
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
