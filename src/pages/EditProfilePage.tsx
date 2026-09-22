import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Camera, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useProfile'
import { uploadToBucket, StorageValidationError } from '@/lib/storage'
import { toast } from '@/store/toastStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

const ALL_GENRES = ['Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi', 'Thriller', 'Horror', 'Comedy', 'Animation']
const ALL_CREW_ROLES = ['Director', 'Producer', 'Assistant Director', 'Cinematographer', 'Editor', 'Sound Designer', 'Production Designer', 'Screenwriter']

export default function EditProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { updateRole } = useAuth()
  const updateProfile = useUpdateProfile(user?.id ?? '')

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [school, setSchool] = useState(user?.school ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user?.favoriteGenres ?? [])
  const [crewRoles, setCrewRoles] = useState<string[]>(user?.crewRoles ?? [])
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl ?? user?.avatar)
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(user?.bannerUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    try {
      const url = await uploadToBucket('avatars', file, user.id)
      setAvatarPreview(url)
    } catch (err) {
      toast.error(err instanceof StorageValidationError ? err.message : 'Could not upload photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setBannerUploading(true)
    try {
      const url = await uploadToBucket('banners', file, user.id)
      setBannerPreview(url)
    } catch (err) {
      toast.error(err instanceof StorageValidationError ? err.message : 'Could not upload banner')
    } finally {
      setBannerUploading(false)
    }
  }

  const toggleGenre = (g: string) =>
    setFavoriteGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const toggleCrewRole = (r: string) =>
    setCrewRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])

  const handleSave = async () => {
    if (!user) return
    await updateProfile.mutateAsync({
      name: name.trim() || user.name,
      bio,
      school,
      city,
      favoriteGenres,
      crewRoles,
      avatarUrl: avatarPreview,
      bannerUrl: bannerPreview,
    })
    navigate('/profile/me')
  }

  const handleRoleChange = (role: 'viewer' | 'filmmaker') => {
    if (role === user?.role) return
    updateRole.mutate(role)
  }

  return (
    <motion.div
      className="min-h-full pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Sticky header */}
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
        <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
        </Button>
      </div>

      {/* Banner + Avatar upload zone */}
      <div className="relative mb-16">
        {/* Banner */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-secondary via-accent/40 to-background">
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/30 hover:bg-black/45 transition-colors cursor-pointer"
            aria-label="Change banner photo"
          >
            {bannerUploading ? <Loader2 size={20} className="text-white/80 animate-spin" /> : <Camera size={20} className="text-white/80" />}
            <span className="font-mono text-[10px] text-white/70 uppercase tracking-wider">
              {bannerUploading ? 'Uploading…' : 'Change Banner'}
            </span>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleBannerChange}
            aria-label="Upload banner image"
          />
        </div>

        {/* Avatar — overlaps bottom of banner */}
        <div className="absolute left-4 -bottom-14">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={name || user?.name || '?'}
              size="xl"
              className="border-4 border-background shadow-film"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/55 transition-colors cursor-pointer"
              aria-label="Change profile photo"
            >
              {avatarUploading ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 pt-4 space-y-6"
      >
        {/* Name */}
        <Input
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community about your work…"
            rows={4}
            className="input-cima w-full resize-none mt-1.5"
            style={{ paddingTop: 8, paddingBottom: 8 }}
          />
        </div>

        {/* School + City */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="School"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Role</label>
          <div className="flex gap-3">
            {(['viewer', 'filmmaker'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                disabled={updateRole.isPending}
                className={`flex-1 py-3 rounded-xl border font-mono text-xs uppercase tracking-wider transition-colors ${
                  user?.role === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-secondary border-secondary/30'
                }`}
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
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-secondary border-secondary/30'
                  }`}
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
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-accent text-card border-accent font-bold'
                      : 'bg-transparent text-secondary border-secondary/30'
                  }`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
