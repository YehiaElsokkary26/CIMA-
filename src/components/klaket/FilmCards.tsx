import { Link } from 'react-router-dom'
import { cn, formatRuntime } from '@/lib/utils'
import { posterColors, rollFor, runtimeLabel, stillKindFor, timecode } from '@/lib/klaket'
import type { Film } from '@/types'
import Still from './Still'
import { Clap, Slate } from './primitives'

/* ─── Film still: the real thumbnail with a halftone screen, or an illustration ─ */

export function FilmStill({ film, className }: { film: Pick<Film, 'id' | 'title' | 'thumbnailUrl'>; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-k-ink', className)}>
      {film.thumbnailUrl ? (
        <>
          <img
            src={film.thumbnailUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'contrast(1.08) saturate(0.85)' }}
          />
          <div className="halftone absolute inset-0 opacity-30 mix-blend-multiply" aria-hidden="true" />
        </>
      ) : (
        <Still kind={stillKindFor(film.id)} className="absolute inset-0" />
      )}
    </div>
  )
}

/* ─── Slate card: horizontal row used in the Home slate ─────────────────── */

export function SlateFilmCard({ film, className }: { film: Film; className?: string }) {
  return (
    <Link
      to={`/film/${film.id}`}
      className={cn(
        'press grid grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)] border-[1.5px] border-foreground bg-card overflow-hidden hover:-translate-y-px transition-transform',
        className,
      )}
    >
      <div className="relative border-e-[1.5px] border-foreground min-h-[132px]">
        <FilmStill film={film} className="absolute inset-0" />
        {film.runtime ? (
          <span className="k-label absolute start-1.5 bottom-1.5 text-[9.5px] bg-k-ink text-k-paper px-1 py-px">
            {timecode(film.runtime * 60).slice(3, 8)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col min-w-0">
        <Clap />
        <Slate
          className="border-b-[1.5px] border-foreground"
          cells={[
            { label: 'Scene', value: film.genre?.[0] ?? 'Short' },
            { label: 'Length', value: runtimeLabel(film.runtime) },
            { label: 'Roll', value: rollFor(film) },
          ]}
        />
        <div className="px-2.5 py-2 flex flex-col gap-0.5 min-w-0">
          <h3 className="font-extrabold text-[16px] leading-tight line-clamp-2" style={{ fontStretch: '105%' }}>
            {film.title}
          </h3>
          <p className="text-[12.5px] text-muted-foreground truncate">
            {film.uploader?.name ?? 'Unknown filmmaker'}
            {film.uploader?.school ? ` · ${film.uploader.school}` : ''}
          </p>
          <p className="k-label text-[10px] text-muted-foreground mt-auto pt-1">
            {(film.votes ?? 0).toLocaleString()} votes
            {film.rating ? ` · ★ ${film.rating.toFixed(1)}` : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}

/* ─── Poster card: vertical afeesh for grids (Discover, Profile) ────────── */

export function PosterCard({ film, className }: { film: Film; className?: string }) {
  const c = posterColors(film.id)
  return (
    <Link
      to={`/film/${film.id}`}
      className={cn('press flex flex-col border-[1.5px] border-foreground hover:-translate-y-0.5 transition-transform', className)}
      style={{ background: c.bg, color: c.fg }}
    >
      <div className="relative m-2 mb-0 border-[1.5px] border-k-ink aspect-[4/5]">
        <FilmStill film={film} className="absolute inset-0" />
        {film.genre?.[0] && (
          <span className="k-label absolute end-1 top-1 text-[9px] bg-k-ink text-k-paper px-1 py-px">
            {film.genre[0]}
          </span>
        )}
        {film.isFilmOfTheWeek && (
          <span className="k-label absolute start-1 top-1 text-[9px] bg-k-mustard text-k-ink px-1 py-px font-semibold">
            ★ FOTW
          </span>
        )}
      </div>
      <div className="px-2 pt-1.5 pb-2 flex flex-col gap-0.5 min-w-0">
        <span className="k-display text-[14px] leading-[1.05] line-clamp-2 uppercase" style={{ fontStretch: '115%' }}>
          {film.title}
        </span>
        <span className="k-label text-[9px] mt-1 truncate">
          {film.uploader?.name ?? 'Unknown'} · {film.runtime ? formatRuntime(film.runtime) : film.year}
        </span>
      </div>
    </Link>
  )
}

/* ─── Skeletons that match the cards ────────────────────────────────────── */

export function SlateFilmCardSkeleton() {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] border-[1.5px] border-rule h-[132px]" aria-hidden="true">
      <div className="skeleton" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  )
}

export function PosterCardSkeleton() {
  return (
    <div className="border-[1.5px] border-rule p-2 flex flex-col gap-2" aria-hidden="true">
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton h-3 w-3/4" />
      <div className="skeleton h-2.5 w-1/2" />
    </div>
  )
}
