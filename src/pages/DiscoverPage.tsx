// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, GraduationCap, Users, Film as FilmIcon, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Masonry from 'react-masonry-css'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/profile/RoleBadge'
import CimaButton from '@/components/cima/CimaButton'
import FilmCard from '@/components/film/FilmCard'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useFilms, useFilmmakers } from '@/hooks/useFilms'
import { useSendCimaRequest } from '@/hooks/useCima'
import { useAuthStore } from '@/store/authStore'

const GENRE_FILTERS = ['All', 'Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi']

const MASONRY_COLS = { default: 3, 1024: 3, 640: 2, 480: 1 }

type TabMode = 'filmmakers' | 'films'

export default function DiscoverPage() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isFilmmaker = role === 'filmmaker'

  const [tab, setTab] = useState<TabMode>('filmmakers')
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [cimaStates, setCimaStates] = useState<Record<string, 'none' | 'pending' | 'member'>>({})

  const { data: films, isLoading: filmsLoading, isError: filmsError, refetch: refetchFilms } = useFilms()
  const { data: filmmakers, isLoading: filmmakersLoading, isError: filmmakersError, refetch: refetchFilmmakers } = useFilmmakers()
  const sendCimaRequest = useSendCimaRequest()

  const allFilms = films ?? []
  const allFilmmakers = filmmakers ?? []

  const filteredFilmmakers = allFilmmakers.filter((f) => {
    const q = query.toLowerCase()
    const matchQuery = !query || f.name.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q) || f.school?.toLowerCase().includes(q)
    const matchGenre = activeGenre === 'All' || f.topGenre === activeGenre
    return matchQuery && matchGenre
  })

  const filteredFilms = useMemo(() => {
    if (!query && activeGenre === 'All') return allFilms
    return allFilms.filter((f) => {
      const q = query.toLowerCase()
      const matchQuery = !query ||
        f.title.toLowerCase().includes(q) ||
        (f.uploader?.name ?? '').toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q)
      const matchGenre = activeGenre === 'All' || f.genre.some((g) => g.toLowerCase() === activeGenre.toLowerCase())
      return matchQuery && matchGenre
    })
  }, [allFilms, query, activeGenre])

  const featured = allFilmmakers.filter((f) => f.lookingForCollaborators)

  const handleCima = (userId: string) => {
    setCimaStates((prev) => ({ ...prev, [userId]: 'pending' }))
    sendCimaRequest.mutate(userId, {
      onError: () => setCimaStates((prev) => ({ ...prev, [userId]: 'none' })),
    })
  }

  const placeholder = tab === 'films'
    ? 'Search films, genres, filmmakers…'
    : 'Search filmmakers, schools, cities…'

  return (
    <motion.div
      className="min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="font-display text-4xl uppercase tracking-widest text-foreground">Discover</h1>

        {/* Tab toggle — Filmmakers / Films */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl">
          {(['filmmakers', 'films'] as TabMode[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setQuery(''); setActiveGenre('All') }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider py-2 rounded-lg transition-colors ${
                tab === t
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'filmmakers' ? <Users size={11} /> : <FilmIcon size={11} />}
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex items-center bg-input border border-border rounded-2xl px-4 py-3 gap-2">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
        </div>

        {/* Genre filters — shared between both tabs */}
        <div className="scroll-x flex gap-2 pb-1">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              style={{ minHeight: 44 }}
              className={`shrink-0 text-xs px-3 py-2.5 rounded-full transition-colors ${
                activeGenre === g
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

      </div>

      <div className="px-4 space-y-8 pb-8">

        {/* ── Films tab ───────────────────────────────────────────── */}
        {tab === 'films' && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {query
                ? `${filteredFilms.length} result${filteredFilms.length !== 1 ? 's' : ''}`
                : activeGenre === 'All' ? 'All Films' : activeGenre}
            </h2>

            {filmsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : filmsError ? (
              <EmptyState
                icon={FilmIcon}
                title="Couldn't load films."
                subtitle="Something went wrong reaching the server."
                action={
                  <Button variant="ghost" size="sm" onClick={() => refetchFilms()}>
                    Retry
                  </Button>
                }
              />
            ) : filteredFilms.length === 0 ? (
              <EmptyState
                icon={FilmIcon}
                title="No films found."
                subtitle="Try a different title, genre, or filmmaker name."
              />
            ) : (
              <Masonry
                breakpointCols={MASONRY_COLS}
                className="cima-masonry-grid"
                columnClassName="cima-masonry-column"
              >
                {filteredFilms.map((film, i) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    index={i}
                    isOwner={isFilmmaker && film.uploaderId === user?.id}
                  />
                ))}
              </Masonry>
            )}
          </section>
        )}

        {/* ── Filmmakers tab ──────────────────────────────────────── */}
        {tab === 'filmmakers' && (
          <>
            {/* Featured spotlight — only when no query */}
            {!query && featured.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-1.5">
                  <Filter size={16} className="text-primary" /> Open to Collab
                </h2>
                <div className="scroll-x flex gap-3 pb-2">
                  {featured.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="shrink-0 w-48 p-4 space-y-3 rounded-2xl bg-card border border-border"
                    >
                      <Avatar name={f.name} size="md" />
                      <div>
                        <p className="font-semibold text-sm text-foreground line-clamp-1">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.topGenre}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full inline-block bg-primary/15 text-primary">
                        Collab Open
                      </span>
                      <CimaButton
                        status={cimaStates[f.id] ?? 'none'}
                        onClick={() => handleCima(f.id)}
                        className="w-full text-xs py-1.5 justify-center"
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* All filmmakers list */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-1.5">
                <Users size={16} className="text-primary" />
                {query
                  ? `${filteredFilmmakers.length} result${filteredFilmmakers.length !== 1 ? 's' : ''}`
                  : 'All Filmmakers'}
              </h2>

              {filmmakersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : filmmakersError ? (
                <EmptyState
                  icon={Users}
                  title="Couldn't load filmmakers."
                  subtitle="Something went wrong reaching the server."
                  action={
                    <Button variant="ghost" size="sm" onClick={() => refetchFilmmakers()}>
                      Retry
                    </Button>
                  }
                />
              ) : filteredFilmmakers.length === 0 ? (
                <EmptyState icon={Users} title="No Results" subtitle="Try a different search or filter." />
              ) : (
                <div className="space-y-3">
                  {filteredFilmmakers.map((filmmaker, i) => (
                    <motion.div
                      key={filmmaker.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl bg-card border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <Link to={`/profile/${filmmaker.id}`}>
                          <Avatar name={filmmaker.name} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/profile/${filmmaker.id}`}>
                              <span className="font-semibold text-sm text-foreground hover:underline transition-colors">
                                {filmmaker.name}
                              </span>
                            </Link>
                            <RoleBadge role={filmmaker.role} />
                            {filmmaker.lookingForCollaborators && (
                              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                Collab Open
                              </span>
                            )}
                          </div>
                          {filmmaker.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{filmmaker.bio}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {filmmaker.city && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin size={9} /> {filmmaker.city}
                              </span>
                            )}
                            {filmmaker.school && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <GraduationCap size={9} /> {filmmaker.school}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {filmmaker.filmsCount} films
                            </span>
                          </div>
                        </div>
                        <CimaButton
                          status={cimaStates[filmmaker.id] ?? 'none'}
                          onClick={() => handleCima(filmmaker.id)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </motion.div>
  )
}
