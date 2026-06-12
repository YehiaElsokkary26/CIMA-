import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import type { UserRole } from '@/types'

const ALL_GENRES = ['Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi', 'Thriller', 'Horror', 'Comedy', 'Animation']
const ALL_CREW_ROLES = ['Director', 'Producer', 'Assistant Director', 'Cinematographer', 'Editor', 'Sound Designer', 'Production Designer', 'Screenwriter']

export default function EditProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [school, setSchool] = useState(user?.school ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'viewer')
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user?.favoriteGenres ?? [])
  const [crewRoles, setCrewRoles] = useState<string[]>(user?.crewRoles ?? [])

  const toggleGenre = (g: string) =>
    setFavoriteGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const toggleCrewRole = (r: string) =>
    setCrewRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])

  const handleSave = () => {
    updateUser({ name: name.trim() || user?.name, bio, school, city, role, favoriteGenres, crewRoles })
    navigate('/profile/me')
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 border-b"
        style={{ height: 52, background: 'hsl(var(--background))', borderColor: 'rgba(139,107,92,0.2)' }}
      >
        <button
          onClick={() => navigate('/profile/me')}
          className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl uppercase tracking-widest text-foreground flex-1">Edit Profile</h1>
        <Button size="sm" onClick={handleSave}>
          <Check size={13} /> Save
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-6 space-y-6"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-input text-foreground border border-border rounded-xl px-4 py-3 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community about your work…"
            rows={4}
            className="w-full bg-input text-foreground border border-border rounded-xl px-4 py-3 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* School + City */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">School</label>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Film school"
              className="w-full bg-input text-foreground border border-border rounded-xl px-3 py-3 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="w-full bg-input text-foreground border border-border rounded-xl px-3 py-3 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Role</label>
          <div className="flex gap-3">
            {(['viewer', 'filmmaker'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-3 rounded-xl border font-mono text-xs uppercase tracking-wider transition-colors"
                style={
                  role === r
                    ? { background: '#A32626', color: '#E8DDCB', borderColor: '#A32626' }
                    : { background: 'transparent', color: '#8B6B5C', borderColor: 'rgba(139,107,92,0.3)' }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Favourite Genres */}
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Favourite Genres</label>
          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((g) => {
              const active = favoriteGenres.includes(g)
              return (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="font-mono text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    active
                      ? { background: '#A32626', color: '#E8DDCB', borderColor: '#A32626' }
                      : { background: 'transparent', color: '#8B6B5C', borderColor: 'rgba(139,107,92,0.3)' }
                  }
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        {/* Crew Roles */}
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Crew Roles
          </label>
          <p className="font-sans text-xs text-muted-foreground">
            Roles you've held on film sets — used for collaboration discovery.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_CREW_ROLES.map((r) => {
              const active = crewRoles.includes(r)
              return (
                <button
                  key={r}
                  onClick={() => toggleCrewRole(r)}
                  className="font-mono text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    active
                      ? { background: '#B28A52', color: '#161413', borderColor: '#B28A52', fontWeight: 700 }
                      : { background: 'transparent', color: '#8B6B5C', borderColor: 'rgba(139,107,92,0.3)' }
                  }
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
