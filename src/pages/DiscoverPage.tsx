import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, GraduationCap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import RoleBadge from '@/components/profile/RoleBadge'
import CimaButton from '@/components/cima/CimaButton'
import EmptyState from '@/components/ui/EmptyState'

const FILMMAKERS = [
  { id: 'u1', name: 'Fatima El-Riad', role: 'filmmaker' as const, email: '', bio: 'Drama and short fiction. Tangier-based.', school: 'ESAV Marrakech', city: 'Tangier', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 6, createdAt: '' },
  { id: 'u2', name: 'Karim Nassar', role: 'filmmaker' as const, email: '', bio: 'Neo-noir and thriller. Nocturnal filmmaker.', school: 'ALBA Beirut', city: 'Beirut', topGenre: 'Neo-Noir', lookingForCollaborators: true, filmsCount: 3, createdAt: '' },
  { id: 'u3', name: 'Sana Younis', role: 'filmmaker' as const, email: '', bio: 'Romance, pastoral shorts.', school: 'Higher Institute of Cinema, Cairo', city: 'Cairo', topGenre: 'Romance', lookingForCollaborators: false, filmsCount: 2, createdAt: '' },
  { id: 'u4', name: 'Omar Hadid', role: 'filmmaker' as const, email: '', bio: 'Experimental and documentary. Sound-obsessed.', school: 'ESAV Marrakech', city: 'Casablanca', topGenre: 'Experimental', lookingForCollaborators: true, filmsCount: 4, createdAt: '' },
  { id: 'u5', name: 'Leila Bouri', role: 'filmmaker' as const, email: '', bio: 'Observational documentary. Real people, real moments.', school: 'EDAC Tunis', city: 'Tunis', topGenre: 'Documentary', lookingForCollaborators: false, filmsCount: 5, createdAt: '' },
  { id: 'u6', name: 'Yusuf Al-Amin', role: 'filmmaker' as const, email: '', bio: 'Drama shorts. Urban stories.', school: 'HFF München', city: 'Munich', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 7, createdAt: '' },
]

const GENRE_FILTERS = ['All', 'Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi']

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [cimaStates, setCimaStates] = useState<Record<string, 'none' | 'pending' | 'member'>>({})

  const filtered = FILMMAKERS.filter((f) => {
    const matchQuery = !query || f.name.toLowerCase().includes(query.toLowerCase()) || f.city?.toLowerCase().includes(query.toLowerCase()) || f.school?.toLowerCase().includes(query.toLowerCase())
    const matchGenre = activeGenre === 'All' || f.topGenre === activeGenre
    return matchQuery && matchGenre
  })

  const featured = FILMMAKERS.filter((f) => f.lookingForCollaborators)

  const handleCima = (userId: string) => {
    setCimaStates((prev) => ({ ...prev, [userId]: prev[userId] === 'none' || !prev[userId] ? 'pending' : prev[userId] }))
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 space-y-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="font-display text-4xl uppercase tracking-widest text-foreground">Discover</h1>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filmmakers, schools, cities…"
            className="w-full bg-input text-foreground border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Genre filters */}
        <div className="scroll-x flex gap-2 pb-1">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`shrink-0 font-mono text-xs px-3 py-1 rounded-full border transition-colors ${
                activeGenre === g
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-secondary'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-8 pb-8">
        {/* Featured spotlight */}
        <section>
          <div className="section-label mb-4">
            <div className="section-label-bar" />
            <div className="flex items-center gap-1.5">
              <Filter size={12} style={{ color: '#A32626' }} />
              <span className="section-label-text">Looking for Collaborators</span>
            </div>
            <div className="section-label-rule" />
          </div>
          <div className="scroll-x flex gap-3 pb-2">
            {featured.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="creator-card shrink-0 w-48 bg-card border border-border p-4 space-y-3"
                style={{ borderColor: 'rgba(139,107,92,0.2)' }}
              >
                <Avatar name={f.name} size="md" />
                <div>
                  <p className="font-sans font-semibold text-sm text-foreground line-clamp-1">{f.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{f.topGenre}</p>
                </div>
                <Badge variant="cima">Collab Open</Badge>
                <CimaButton
                  status={cimaStates[f.id] ?? 'none'}
                  onClick={() => handleCima(f.id)}
                  className="w-full text-xs py-1.5 justify-center"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* All filmmakers */}
        <section>
          <div className="section-label mb-4">
            <div className="section-label-bar" />
            <div className="flex items-center gap-1.5">
              <Users size={12} style={{ color: '#A32626' }} />
              <span className="section-label-text">All Filmmakers</span>
            </div>
            <div className="section-label-rule" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No Results" subtitle="Try a different search or filter." />
          ) : (
            <div className="space-y-3">
              {filtered.map((filmmaker, i) => (
                <motion.div
                  key={filmmaker.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="creator-card bg-card rounded-2xl border p-4"
                  style={{ borderColor: 'rgba(139,107,92,0.2)' }}
                >
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${filmmaker.id}`}>
                      <Avatar name={filmmaker.name} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${filmmaker.id}`}>
                          <span className="font-sans font-semibold text-sm text-foreground hover:text-primary transition-colors">
                            {filmmaker.name}
                          </span>
                        </Link>
                        <RoleBadge role={filmmaker.role} />
                        {filmmaker.lookingForCollaborators && (
                          <Badge variant="cima">Collab Open</Badge>
                        )}
                      </div>
                      {filmmaker.bio && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-1">{filmmaker.bio}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {filmmaker.city && (
                          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin size={9} /> {filmmaker.city}
                          </span>
                        )}
                        {filmmaker.school && (
                          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <GraduationCap size={9} /> {filmmaker.school}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">
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
      </div>
    </div>
  )
}
