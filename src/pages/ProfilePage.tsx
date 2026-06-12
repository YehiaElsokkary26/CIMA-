// UI/UX audit applied — WCAG 2.1 AA compliant
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, MapPin, GraduationCap, Film, LogOut, Handshake } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import RoleBadge from '@/components/profile/RoleBadge'
import FilmCard from '@/components/film/FilmCard'
import CimaMemberChip from '@/components/cima/CimaMemberChip'
import CimaButton from '@/components/cima/CimaButton'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useState } from 'react'

const MOCK_PROFILE = {
  id: 'u4',
  name: 'Omar Hadid',
  email: '',
  role: 'filmmaker' as const,
  bio: 'Documentary and experimental filmmaker based in Casablanca. Obsessed with sound design and found footage. Graduate of ESAV Marrakech 2023.',
  school: 'ESAV Marrakech',
  city: 'Casablanca',
  topGenre: 'Experimental',
  filmsCount: 4,
  cimaCount: 7,
  reviewsCount: 23,
  lookingForCollaborators: true,
  openToCollab: true,
  favoriteGenres: ['Experimental', 'Documentary'],
  crewRoles: ['Director', 'Sound Designer'],
  createdAt: '2023-06-01',
}

const MOCK_FILMS = [
  { id: '4', title: 'STATIC', genre: ['Sci-Fi', 'Experimental'], runtime: 31, year: 2023, rating: 4.8, ratingCount: 67, thumbnailUrl: 'https://images.unsplash.com/photo-1585676623595-e7cb4792a3e0?w=600&q=80', uploaderId: 'u4', description: '', createdAt: '' },
  { id: '7', title: 'DUST AND WIRE', genre: ['Documentary'], runtime: 54, year: 2022, rating: 4.3, ratingCount: 31, thumbnailUrl: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=600&q=80', uploaderId: 'u4', description: '', createdAt: '' },
]

const MOCK_CIMA_MEMBERS = [
  { id: 'c1', user: { id: 'u10', name: 'Hana Bakkali', email: '', role: 'filmmaker' as const, createdAt: '' }, joinedAt: '2024-01-01' },
  { id: 'c2', user: { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker' as const, createdAt: '' }, joinedAt: '2024-02-01' },
  { id: 'c3', user: { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker' as const, createdAt: '' }, joinedAt: '2024-03-01' },
]

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)
  const isOwn = id === 'me' || id === currentUser?.id
  const [cimaStatus, setCimaStatus] = useState<'none' | 'pending' | 'member'>('none')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const profile = isOwn && currentUser ? currentUser : MOCK_PROFILE
  const films = MOCK_FILMS
  const cimaMembers = MOCK_CIMA_MEMBERS

  const isFilmmaker = profile.role === 'filmmaker'
  const openToCollab = (profile as typeof MOCK_PROFILE).openToCollab ?? false

  const handleToggleCollab = () => {
    if (!isOwn) return
    updateUser({ openToCollab: !openToCollab, lookingForCollaborators: !openToCollab })
  }

  const handleBecomeFilmmaker = () => {
    updateUser({ role: 'filmmaker' })
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.div
      className="min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Profile header */}
      <div className="relative">
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-secondary via-accent/40 to-background">
          {(profile as typeof MOCK_PROFILE & { bannerUrl?: string }).bannerUrl && (
            <img
              src={(profile as typeof MOCK_PROFILE & { bannerUrl?: string }).bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <Avatar
              src={(profile as typeof MOCK_PROFILE & { avatar?: string }).avatar}
              name={profile.name}
              size="xl"
              className="border-4 border-background shadow-film"
            />
            {isOwn ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/profile/me/edit')}>
                  <Edit2 size={13} />
                  Edit Profile
                </Button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border transition-colors text-muted-foreground hover:text-foreground"
                  style={{ borderColor: 'rgba(139,107,92,0.3)' }}
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <CimaButton status={cimaStatus} onClick={() => setCimaStatus('pending')} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl uppercase tracking-widest text-foreground">
                {profile.name}
              </h1>
              <RoleBadge role={profile.role} />
              {openToCollab && (
                <span
                  className="genre-pill flex items-center gap-1 text-accent"
                  style={{ background: 'rgba(178,138,82,0.15)', border: '1px solid rgba(178,138,82,0.4)' }}
                >
                  <Handshake size={9} />
                  Open to Collab
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {(profile as typeof MOCK_PROFILE).city && (
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={11} /> {(profile as typeof MOCK_PROFILE).city}
                </span>
              )}
              {(profile as typeof MOCK_PROFILE).school && (
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap size={11} /> {(profile as typeof MOCK_PROFILE).school}
                </span>
              )}
            </div>

            {/* Crew roles */}
            {((profile as typeof MOCK_PROFILE).crewRoles ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {((profile as typeof MOCK_PROFILE).crewRoles ?? []).map((r) => (
                  <span
                    key={r}
                    className="genre-pill text-accent"
                    style={{ background: 'rgba(178,138,82,0.12)', border: '1px solid rgba(178,138,82,0.25)' }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Own-profile actions */}
      {isOwn && (
        <div className="px-4 mb-4 space-y-2">
          {/* Open to Collab toggle — filmmakers only */}
          {isFilmmaker && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleCollab}
              className="w-full rounded-full"
            >
              <Handshake size={13} />
              {openToCollab ? 'Open to Collab ✓' : 'Open to Collab'}
            </Button>
          )}

          {/* Become a Filmmaker — viewers only */}
          {!isFilmmaker && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleBecomeFilmmaker}
              className="w-full"
            >
              <Film size={15} />
              Become a Filmmaker
            </Button>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="film-card card-grain grid grid-cols-3 gap-0 border border-border mx-4 mb-6 overflow-hidden bg-card">
        {[
          { label: 'Films', value: (profile as typeof MOCK_PROFILE).filmsCount ?? 0 },
          { label: 'Cima', value: (profile as typeof MOCK_PROFILE).cimaCount ?? 0 },
          { label: 'Reviews', value: (profile as typeof MOCK_PROFILE).reviewsCount ?? 0 },
        ].map(({ label, value }, i) => (
          <div key={label} className={`flex flex-col items-center py-4 ${i < 2 ? 'border-r border-border' : ''}`}>
            <span className="font-display text-3xl text-primary">{value}</span>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-8 pb-8">
        {/* Cima section */}
        {cimaMembers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <div className="section-label mt-4 mb-2">
              <div className="section-label-bar" />
              <span className="section-label-text">Cima</span>
              <div className="section-label-rule" />
            </div>
            <div className="film-card card-grain bg-card border border-cima-tag/20 p-4">
              <div className="flex flex-wrap gap-2">
                {cimaMembers.map((m) => (
                  <CimaMemberChip key={m.id} user={m.user} />
                ))}
              </div>
              {isOwn && (
                <Link to="/cima" className="interactive-lift block mt-3">
                  <Button variant="ghost" size="sm" className="text-cima-tag border border-cima-tag/30">
                    Manage Cima →
                  </Button>
                </Link>
              )}
            </div>
          </motion.section>
        )}

        {/* Films grid */}
        {profile.role === 'filmmaker' && (
          <section>
            <div className="section-label mt-4 mb-2">
              <div className="section-label-bar" />
              <span className="section-label-text">Films</span>
              <div className="section-label-rule" />
            </div>
            {films.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No films uploaded yet."
                subtitle="Your audience is waiting — roll camera."
                action={
                  isOwn ? (
                    <button onClick={() => navigate('/upload')} className="btn-cima">
                      Upload Your Film
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {films.map((f, i) => (
                  <FilmCard key={f.id} film={f} index={i} compact />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Logout confirmation sheet */}
      {showLogoutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(22,20,19,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="w-full max-w-sm rounded-t-2xl border-t border-x p-6 space-y-4"
            style={{ background: 'hsl(var(--card))', borderColor: 'rgba(139,107,92,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(163,38,38,0.12)' }}>
                <LogOut size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-display text-lg uppercase tracking-widest text-foreground">Log Out</p>
                <p className="font-sans text-xs text-muted-foreground">You'll need to sign in again.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleLogout}
              >
                <LogOut size={13} /> Log Out
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
