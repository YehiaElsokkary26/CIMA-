import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Masonry from 'react-masonry-css'
import { useFilms, useFeaturedFilm } from '@/hooks/useFilms'
import FilmCard from '@/components/film/FilmCard'
import FilmOfTheWeek from '@/components/film/FilmOfTheWeek'
import FilterBar from '@/components/film/FilterBar'
import EmptyState from '@/components/ui/EmptyState'
import { FilmCardSkeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { getFilms, getFilmOfTheWeek } from '@/lib/mockData'
import type { Film } from '@/types'
import type { SortOption } from '@/components/film/FilterBar'
import { Film as FilmIcon } from 'lucide-react'

const MASONRY_COLS = {
  default: 4,
  1280: 4,
  1024: 3,
  640: 2,
  480: 1,
}

const PAGE_SIZE = 8

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="section-label">
      <div className="section-label-bar" />
      <span className="section-label-text">{children}</span>
      <div className="section-label-rule" />
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isFilmmaker = role === 'filmmaker'

  const [activeGenre, setActiveGenre] = useState('All')
  const [sortBy, setSortBy] = useState<SortOption>('Latest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { data: serverFilms, isLoading } = useFilms()
  const { data: serverFeatured } = useFeaturedFilm()

  const allFilms: Film[] = serverFilms ?? getFilms()
  const displayFeatured: Film = serverFeatured ?? getFilmOfTheWeek()

  const filteredFilms = useMemo(() => {
    const byGenre =
      activeGenre === 'All'
        ? allFilms
        : allFilms.filter((f) => f.genre.some((g) => g.toLowerCase() === activeGenre.toLowerCase()))
    switch (sortBy) {
      case 'Top Rated':
        return [...byGenre].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      case 'Most Discussed':
        return [...byGenre].sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
      default:
        return [...byGenre].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    }
  }, [allFilms, activeGenre, sortBy])

  const trending = useMemo(
    () => [...allFilms].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)).slice(0, 4),
    [allFilms],
  )

  const newUploads = useMemo(
    () =>
      [...allFilms]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [allFilms],
  )

  const visibleFilms = filteredFilms.slice(0, visibleCount)
  const hasMore = visibleCount < filteredFilms.length

  return (
    <div className="min-h-full relative">
      <FilterBar
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {displayFeatured && <FilmOfTheWeek film={displayFeatured} />}

      {isLoading ? (
        /* Rule 5: skeleton grid matches real FilmCard layout — no layout shift */
        <div className="px-4 pb-28 lg:pb-8">
          <div className="section-label">
            <div className="section-label-bar" />
            <span className="section-label-text">Trending This Week</span>
            <div className="section-label-rule" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 8 }).map((_, i) => <FilmCardSkeleton key={i} />)}
          </div>
        </div>
      ) : allFilms.length === 0 ? (
        <EmptyState icon={FilmIcon} title="No Films Yet" subtitle="Roll camera — be the first to upload." />
      ) : (
        <div className="px-4 pb-28 lg:pb-8">
          {/* Trending */}
          <SectionLabel>Trending This Week</SectionLabel>
          <Masonry
            breakpointCols={MASONRY_COLS}
            className="cima-masonry-grid"
            columnClassName="cima-masonry-column"
          >
            {trending.map((film, i) => (
              <FilmCard
                key={film.id}
                film={film}
                index={i}
                isOwner={isFilmmaker && film.uploaderId === user?.id}
              />
            ))}
          </Masonry>

          {/* New uploads */}
          <SectionLabel>New Uploads</SectionLabel>
          <Masonry
            breakpointCols={MASONRY_COLS}
            className="cima-masonry-grid"
            columnClassName="cima-masonry-column"
          >
            {newUploads.map((film, i) => (
              <FilmCard
                key={film.id}
                film={film}
                index={i}
                isOwner={isFilmmaker && film.uploaderId === user?.id}
              />
            ))}
          </Masonry>

          {/* All / filtered films */}
          <SectionLabel>
            {activeGenre === 'All' ? 'All Films' : activeGenre}
          </SectionLabel>

          {filteredFilms.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground px-4 py-8 text-center uppercase tracking-widest">
              No {activeGenre} films yet.
            </p>
          ) : (
            <>
              <Masonry
                breakpointCols={MASONRY_COLS}
                className="cima-masonry-grid"
                columnClassName="cima-masonry-column"
              >
                {visibleFilms.map((film, i) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    index={i}
                    isOwner={isFilmmaker && film.uploaderId === user?.id}
                  />
                ))}
              </Masonry>

              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full mt-6 py-3 font-mono text-xs uppercase tracking-widest transition-opacity hover:opacity-75"
                  style={{
                    border: '1px solid rgba(139,107,92,0.3)',
                    color: '#A32626',
                    background: 'transparent',
                  }}
                >
                  Load More Films
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Filmmaker FAB — mobile */}
      {isFilmmaker && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22, delay: 0.4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/upload')}
          className="fixed bottom-24 right-4 z-30 flex items-center justify-center cta-pulse lg:hidden"
          style={{
            width: 52,
            height: 52,
            background: '#A32626',
            boxShadow: '0 0 24px 4px rgba(163,38,38,0.4)',
          }}
          aria-label="Upload a film"
        >
          <Plus size={24} color="#E8DDCB" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  )
}
