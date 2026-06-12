// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Sparkles, Layers, Search, X, Star } from 'lucide-react'
import Masonry from 'react-masonry-css'
import { useFilms, useFeaturedFilm } from '@/hooks/useFilms'
import FilmCard from '@/components/film/FilmCard'
import Button from '@/components/ui/Button'
import FilmOfTheWeek from '@/components/film/FilmOfTheWeek'
import FilterBar from '@/components/film/FilterBar'
import EmptyState from '@/components/ui/EmptyState'
import { FilmCardSkeleton, HeroSkeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { useSearchStore } from '@/store/searchStore'
import { getFilms as getMockFilms, getFilmOfTheWeek as getMockFOTW } from '@/lib/mockData'
import { useRecommendations } from '@/hooks/useRecommendations'
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

function SectionLabel({ children, icon: Icon }: { children: string; icon?: React.ElementType }) {
  return (
    <div className="section-label mt-6 mb-2">
      <div className="section-label-bar" />
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-primary" />}
        <span className="section-label-text">{children}</span>
      </div>
      <div className="section-label-rule" />
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isFilmmaker = role === 'filmmaker'
  const { query: searchQuery, clear: clearSearch } = useSearchStore()

  const [activeGenre, setActiveGenre] = useState('All')
  const [sortBy, setSortBy] = useState<SortOption>('Latest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { data: serverFilms, isLoading } = useFilms()
  const { data: serverFeatured } = useFeaturedFilm()

  const allFilms: Film[] = (serverFilms && serverFilms.length > 0) ? serverFilms : getMockFilms()
  const displayFeatured: Film = serverFeatured ?? getMockFOTW()

  // Relevance-ranked search: exact title match → starts with → other field match
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    const scored = allFilms.reduce<Array<{ film: Film; score: number }>>((acc, film) => {
      const title = film.title.toLowerCase()
      const uploaderName = (film.uploader?.name ?? '').toLowerCase()
      const desc = (film.description ?? '').toLowerCase()
      const genres = film.genre.map((g) => g.toLowerCase())

      if (title === q) return [...acc, { film, score: 100 }]
      if (title.startsWith(q)) return [...acc, { film, score: 80 }]
      if (title.includes(q)) return [...acc, { film, score: 60 }]
      if (genres.some((g) => g.startsWith(q))) return [...acc, { film, score: 40 }]
      if (uploaderName.startsWith(q)) return [...acc, { film, score: 30 }]
      if (uploaderName.includes(q) || genres.some((g) => g.includes(q)) || desc.includes(q))
        return [...acc, { film, score: 10 }]
      return acc
    }, [])

    return scored.sort((a, b) => b.score - a.score).map((s) => s.film)
  }, [allFilms, searchQuery])

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

  const recommendations = useRecommendations(user, allFilms, 6)

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
    <motion.div
      className="min-h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <FilterBar
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* ── Search results mode ─────────────────────────────────── */}
      {searchQuery ? (
        <div className="px-4 pb-28 lg:pb-8">
          {/* Search header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mt-5 mb-1"
          >
            <div className="flex items-center gap-2">
              <Search size={13} className="text-primary" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Results for
              </span>
              <span className="font-display text-sm uppercase tracking-widest text-foreground">
                "{searchQuery}"
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          </motion.div>

          <div className="section-label mb-4">
            <div className="section-label-bar" />
            <span className="section-label-text">
              {searchResults.length} Film{searchResults.length !== 1 ? 's' : ''} Found
            </span>
            <div className="section-label-rule" />
          </div>

          {searchResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No films found."
              subtitle={`Nothing matches "${searchQuery}" — try a title, genre, or filmmaker name.`}
              action={
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear Search
                </Button>
              }
            />
          ) : (
            <Masonry
              breakpointCols={MASONRY_COLS}
              className="cima-masonry-grid"
              columnClassName="cima-masonry-column"
            >
              {searchResults.map((film, i) => (
                <FilmCard
                  key={film.id}
                  film={film}
                  index={i}
                  isOwner={isFilmmaker && film.uploaderId === user?.id}
                />
              ))}
            </Masonry>
          )}
        </div>
      ) : (
        /* ── Normal feed mode ───────────────────────────────────── */
        <>
          {isLoading ? <HeroSkeleton /> : displayFeatured && <FilmOfTheWeek film={displayFeatured} />}

          {isLoading ? (
            <div className="px-4 pb-28 lg:pb-8">
              <SectionLabel icon={TrendingUp}>Top Projects released this week</SectionLabel>
              <Masonry
                breakpointCols={MASONRY_COLS}
                className="cima-masonry-grid"
                columnClassName="cima-masonry-column"
              >
                {Array.from({ length: 4 }).map((_, i) => <FilmCardSkeleton key={i} />)}
              </Masonry>
              <SectionLabel icon={Sparkles}>New Uploads</SectionLabel>
              <Masonry
                breakpointCols={MASONRY_COLS}
                className="cima-masonry-grid"
                columnClassName="cima-masonry-column"
              >
                {Array.from({ length: 4 }).map((_, i) => <FilmCardSkeleton key={i} />)}
              </Masonry>
            </div>
          ) : allFilms.length === 0 ? (
            <EmptyState
              icon={FilmIcon}
              title="No films yet."
              subtitle="Be the first to upload a short film."
              action={isFilmmaker ? (
                <button onClick={() => navigate('/upload')} className="btn-cima mt-2">Upload Your Film</button>
              ) : undefined}
            />
          ) : (
            <div className="px-4 pb-28 lg:pb-8">

              {/* ── Recommended for You ──────────────────────────── */}
              {recommendations.films.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SectionLabel icon={Star}>Recommended for You</SectionLabel>

                  {recommendations.interestGenres.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        Because you like
                      </span>
                      {recommendations.interestGenres.slice(0, 5).map((g) => (
                        <span
                          key={g}
                          className="genre-pill text-accent bg-accent/10 border border-accent/20"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
                      {recommendations.reason}
                    </p>
                  )}

                  <Masonry
                    breakpointCols={MASONRY_COLS}
                    className="cima-masonry-grid"
                    columnClassName="cima-masonry-column"
                  >
                    {recommendations.films.map((film, i) => (
                      <FilmCard
                        key={film.id}
                        film={film}
                        index={i}
                        isOwner={isFilmmaker && film.uploaderId === user?.id}
                      />
                    ))}
                  </Masonry>

                  {!recommendations.hasPreferences && (
                    <p className="font-mono text-[10px] text-muted-foreground text-center mt-3 pb-1 uppercase tracking-wider">
                      Set favourite genres in your profile for personalised picks →
                    </p>
                  )}
                </motion.section>
              )}

              <SectionLabel icon={TrendingUp}>Top Projects released this week</SectionLabel>
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

              <SectionLabel icon={Sparkles}>New Uploads</SectionLabel>
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

              <SectionLabel icon={Layers}>
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
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="w-full mt-8"
                    >
                      Load More Films
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Filmmaker FAB — mobile */}
      {isFilmmaker && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22, delay: 0.4 }}
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
    </motion.div>
  )
}
