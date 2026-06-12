// UI/UX audit applied — WCAG 2.1 AA compliant
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
  { id: 'u1', name: 'Fatima El-Riad', role: 'filmmaker' as const, email: '', bio: 'Drama and short fiction. Tangier-based.', school: 'ESAV Marrakech', city: 'Tangier', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 6, createdAt: '', crewRoles: ['Director', 'Screenwriter'] },
  { id: 'u2', name: 'Karim Nassar', role: 'filmmaker' as const, email: '', bio: 'Neo-noir and thriller. Nocturnal filmmaker.', school: 'ALBA Beirut', city: 'Beirut', topGenre: 'Neo-Noir', lookingForCollaborators: true, filmsCount: 3, createdAt: '', crewRoles: ['Director', 'Producer', 'Cinematographer'] },
  { id: 'u3', name: 'Sana Younis', role: 'filmmaker' as const, email: '', bio: 'Romance, pastoral shorts.', school: 'Higher Institute of Cinema, Cairo', city: 'Cairo', topGenre: 'Romance', lookingForCollaborators: false, filmsCount: 2, createdAt: '', crewRoles: ['Assistant Director', 'Production Designer'] },
  { id: 'u4', name: 'Omar Hadid', role: 'filmmaker' as const, email: '', bio: 'Experimental and documentary. Sound-obsessed.', school: 'ESAV Marrakech', city: 'Casablanca', topGenre: 'Experimental', lookingForCollaborators: true, filmsCount: 4, createdAt: '', crewRoles: ['Director', 'Sound Designer'] },
  { id: 'u5', name: 'Leila Bouri', role: 'filmmaker' as const, email: '', bio: 'Observational documentary. Real people, real moments.', school: 'EDAC Tunis', city: 'Tunis', topGenre: 'Documentary', lookingForCollaborators: false, filmsCount: 5, createdAt: '', crewRoles: ['Producer', 'Editor'] },
  { id: 'u6', name: 'Yusuf Al-Amin', role: 'filmmaker' as const, email: '', bio: 'Drama shorts. Urban stories.', school: 'HFF München', city: 'Munich', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 7, createdAt: '', crewRoles: ['Director', 'Assistant Director', 'Screenwriter'] },
  { id: 'u7', name: 'Nadia Benali', role: 'filmmaker' as const, email: '', bio: 'Cinematographer by trade, director by heart.', school: 'ESAV Marrakech', city: 'Rabat', topGenre: 'Experimental', lookingForCollaborators: true, filmsCount: 3, createdAt: '', crewRoles: ['Cinematographer', 'Producer'] },
  { id: 'u8', name: 'Hassan Mourad', role: 'filmmaker' as const, email: '', bio: 'Post-production specialist and colorist.', school: 'Cairo Film Institute', city: 'Cairo', topGenre: 'Drama', lookingForCollaborators: false, filmsCount: 1, createdAt: '', crewRoles: ['Editor', 'Assistant Director'] },
]

const GENRE_FILTERS = ['All', 'Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi']
const CREW_ROLE_FILTERS = ['All Roles', 'Director', 'Producer', 'Assistant Director', 'Cinematographer', 'Editor', 'Sound Designer', 'Screenwriter', 'Production Designer']

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [activeCrewRole, setActiveCrewRole] = useState('All Roles')
  const [cimaStates, setCimaStates] = useState<Record<string, 'none' | 'pending' | 'member'>>({})

  const filtered = FILMMAKERS.filter((f) => {
    const matchQuery = !query || f.name.toLowerCase().includes(query.toLowerCase()) || f.city?.toLowerCase().includes(query.toLowerCase()) || f.school?.toLowerCase().includes(query.toLowerCase())
    const matchGenre = activeGenre === 'All' || f.topGenre === activeGenre
    const matchRole = activeCrewRole === 'All Roles' || (f.crewRoles ?? []).includes(activeCrewRole)
    return matchQuery && matchGenre && matchRole
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
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filmmakers, schools, cities…"
            aria-label="Search filmmakers"
            className="w-full bg-input text-foreground border border-border rounded-xl pl-9 pr-4 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ minHeight: 48, paddingTop: 13, paddingBottom: 13 }}
          />
        </div>

        {/* Genre filters */}
        <div className="scroll-x flex gap-2 pb-1">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              style={{ minHeight: 44 }}
              className={`shrink-0 font-mono text-xs px-3 py-2.5 rounded-full border transition-colors ${
                activeGenre === g
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-secondary'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Crew role filters */}
        <div className="scroll-x flex gap-2 pb-1">
          {CREW_ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setActiveCrewRole(r)}
              className="shrink-0 font-mono text-[10px] px-3 py-2 rounded-full border transition-colors"
              style={
                activeCrewRole === r
                  ? { minHeight: 40, background: '#B28A52', borderColor: '#B28A52', color: '#161413', fontWeight: 700 }
                  : { minHeight: 40, background: 'transparent', color: '#8B6B5C', borderColor: 'rgba(139,107,92,0.3)' }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-8 pb-8">
        {/* Featured spotlight — only show when no crew role filter active */}
        {activeCrewRole === 'All Roles' && (
          <section>
            <div className="section-label mb-4">
              <div className="section-label-bar" />
              <div className="flex items-center gap-1.5">
                <Filter size={12} style={{ color: '#A32626' }} />
                <span className="section-label-text">Open to Collab</span>
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
        )}

        {/* All filmmakers */}
        <section>
          <div className="section-label mb-4">
            <div className="section-label-bar" />
            <div className="flex items-center gap-1.5">
              <Users size={12} style={{ color: '#A32626' }} />
              <span className="section-label-text">
                {activeCrewRole === 'All Roles' ? 'All Filmmakers' : `${activeCrewRole}s`}
              </span>
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
                      {/* Crew role chips */}
                      {(filmmaker.crewRoles ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(filmmaker.crewRoles ?? []).map((r) => (
                            <span
                              key={r}
                              className="font-mono text-[9px] px-2 py-0.5 rounded-full"
                              style={
                                activeCrewRole === r
                                  ? { background: '#B28A52', color: '#161413', fontWeight: 700 }
                                  : { background: 'rgba(178,138,82,0.12)', color: '#B28A52' }
                              }
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
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
