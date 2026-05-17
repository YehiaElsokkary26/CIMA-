import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit2, MapPin, GraduationCap, Film } from 'lucide-react'
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
  const currentUser = useAuthStore((s) => s.user)
  const isOwn = id === 'me' || id === currentUser?.id
  const [cimaStatus, setCimaStatus] = useState<'none' | 'pending' | 'member'>('none')

  const profile = isOwn && currentUser ? currentUser : MOCK_PROFILE
  const films = MOCK_FILMS
  const cimaMembers = MOCK_CIMA_MEMBERS

  return (
    <div className="min-h-full">
      {/* Profile header */}
      <div className="relative">
        {/* Background */}
        <div className="h-32 bg-gradient-to-br from-secondary via-accent/40 to-background" />

        {/* Avatar + name */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <Avatar name={profile.name} size="xl" className="border-4 border-background shadow-film" />
            {isOwn ? (
              <Button variant="outline" size="sm">
                <Edit2 size={13} />
                Edit Profile
              </Button>
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
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-y border-border mx-4 mb-6 rounded-2xl overflow-hidden bg-card">
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
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Film size={16} className="text-cima-tag" />
              <h2 className="font-display text-xl uppercase tracking-widest text-foreground">Cima</h2>
              <span className="font-mono text-xs text-muted-foreground">— Creative Circle</span>
            </div>
            <div className="bg-card rounded-2xl border border-cima-tag/20 p-4">
              <div className="flex flex-wrap gap-2">
                {cimaMembers.map((m) => (
                  <CimaMemberChip key={m.id} user={m.user} />
                ))}
              </div>
              {isOwn && (
                <Link to="/cima" className="block mt-3">
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
            <h2 className="font-display text-xl uppercase tracking-widest text-foreground mb-4">Films</h2>
            {films.length === 0 ? (
              <EmptyState icon={Film} title="No films yet" subtitle="Roll camera." />
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
    </div>
  )
}
