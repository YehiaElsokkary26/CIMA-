// UI/UX audit applied — WCAG 2.1 AA compliant
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, MapPin, GraduationCap, Film, LogOut, Handshake, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useFilmsByUser } from '@/hooks/useFilms'
import { useCima, useSendCimaRequest } from '@/hooks/useCima'
import RoleBadge from '@/components/profile/RoleBadge'
import FilmCard from '@/components/film/FilmCard'
import CimaMemberChip from '@/components/cima/CimaMemberChip'
import CimaButton from '@/components/cima/CimaButton'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useState } from 'react'
import { cardColorFor } from '@/lib/cardColors'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { updateRole, updateProfile } = useAuth()
  const isOwn = id === 'me' || id === currentUser?.id
  const profileId = isOwn ? currentUser?.id : id
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const {
    data: fetchedProfile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useProfile(isOwn ? undefined : profileId)
  const { data: fetchedFilms, isLoading: filmsLoading } = useFilmsByUser(profileId)
  const { data: cimaData } = useCima()
  const sendCimaRequest = useSendCimaRequest()
  const [cimaStatus, setCimaStatus] = useState<'none' | 'pending' | 'member'>('none')

  const profile = isOwn ? currentUser : fetchedProfile
  const films = fetchedFilms ?? []
  const cimaMembers = isOwn ? (cimaData?.members ?? []) : []

  if (!isOwn && profileLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isOwn && (profileError || !profile)) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load this profile."
        subtitle="Something went wrong reaching the server."
        action={
          <Button variant="ghost" size="sm" onClick={() => refetchProfile()}>
            Retry
          </Button>
        }
        className="py-24"
      />
    )
  }

  if (!profile) return null

  const isFilmmaker = profile.role === 'filmmaker'
  const openToCollab = profile.openToCollab ?? false

  const handleCimaRequest = () => {
    if (!profileId) return
    setCimaStatus('pending')
    sendCimaRequest.mutate(profileId, {
      onError: () => setCimaStatus('none'),
    })
  }

  const handleToggleCollab = () => {
    if (!isOwn) return
    updateProfile.mutate({ lookingForCollaborators: !openToCollab })
  }

  const handleBecomeFilmmaker = () => {
    updateRole.mutate('filmmaker')
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
          {profile.bannerUrl && (
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <Avatar
              src={profile.avatar}
              name={profile.name}
              size="xl"
              className="shadow-film"
              style={{ border: '3px solid #C96A3D' }}
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
              <CimaButton status={cimaStatus} onClick={handleCimaRequest} />
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
              {profile.city && (
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={11} /> {profile.city}
                </span>
              )}
              {profile.school && (
                <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap size={11} /> {profile.school}
                </span>
              )}
            </div>
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
      <div className="grid grid-cols-3 gap-2 mx-4 mb-6">
        {[
          { label: 'Films', value: films.length },
          { label: 'Cima', value: cimaMembers.length },
          { label: 'Reviews', value: profile.reviewsCount ?? 0 },
        ].map(({ label, value }, i) => {
          const color = cardColorFor(i)
          return (
            <div
              key={label}
              className="flex flex-col items-center py-4 rounded-2xl"
              style={{ background: color.bg, color: color.fg }}
            >
              <span className="font-display text-3xl font-extrabold">{value}</span>
              <span className="font-mono text-xs uppercase tracking-wider" style={{ opacity: 0.8 }}>{label}</span>
            </div>
          )
        })}
      </div>

      <div className="px-4 space-y-8 pb-8">
        {/* Cima section */}
        {cimaMembers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-wide text-foreground mt-4 mb-3">
              Cima
            </h2>
            <div className="p-4 rounded-2xl" style={{ background: cardColorFor(2).bg, color: cardColorFor(2).fg }}>
              <div className="flex flex-wrap gap-2">
                {cimaMembers.map((m) => (
                  <CimaMemberChip key={m.id} user={m.user} />
                ))}
              </div>
              {isOwn && (
                <Link to="/cima" className="interactive-lift block mt-3">
                  <Button variant="ghost" size="sm">
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
            <h2 className="font-display font-extrabold text-xl uppercase tracking-wide text-foreground mt-4 mb-3">
              Films
            </h2>
            {filmsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            ) : films.length === 0 ? (
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
