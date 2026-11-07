import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ImagePlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { uploadFile } from '@/lib/storage'
import { CREW_ROLES } from '@/lib/crewRoles'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import Still from '@/components/klaket/Still'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

const ALL_GENRES = ['Drama', 'Documentary', 'Experimental', 'Neo-Noir', 'Romance', 'Sci-Fi', 'Thriller', 'Horror', 'Comedy', 'Animation']

function Chips({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string
  hint: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="k-label text-[10.5px] font-semibold mb-1">{legend}</legend>
      <p className="text-[13px] text-muted-foreground -mt-1">{hint}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(
                'k-label text-[11px] font-semibold px-3 min-h-[38px] border-[1.5px] border-foreground press',
                on ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { updateProfile } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [school, setSchool] = useState(user?.school ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user?.favoriteGenres ?? [])
  const [crewRoles, setCrewRoles] = useState<string[]>(user?.crewRoles ?? [])
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl)
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(user?.bannerUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

  const pickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(await readFile(file))
  }

  const pickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(await readFile(file))
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      let avatarUrl = user.avatarUrl
      let bannerUrl = user.bannerUrl
      if (avatarFile) avatarUrl = await uploadFile('avatars', avatarFile, `${user.id}/${Date.now()}-${avatarFile.name}`)
      if (bannerFile) bannerUrl = await uploadFile('banners', bannerFile, `${user.id}/${Date.now()}-${bannerFile.name}`)
      await updateProfile.mutateAsync({
        name: name.trim() || user.name,
        bio,
        school,
        city,
        favoriteGenres,
        crewRoles,
        avatarUrl,
        bannerUrl,
      })
      navigate('/profile/me')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save your profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-background border-b-[1.5px] border-foreground">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile/me')}
            aria-label="Back to your profile"
            className="w-11 h-11 shrink-0 flex items-center justify-center border-[1.5px] border-foreground press"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <h1 className="k-display text-[22px] flex-1">EDIT PROFILE</h1>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="press min-h-[44px] px-4 bg-k-red text-k-paper font-extrabold text-[13px] inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {saving ? 'SAVING…' : 'SAVE'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-10 flex flex-col gap-6">
        {/* Banner + photo */}
        <section aria-label="Photos" className="flex flex-col">
          <div className="relative h-36 border-[1.5px] border-foreground overflow-hidden bg-k-teal">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
            ) : (
              <Still kind="portrait" />
            )}
            <button
              type="button"
              onClick={() => bannerInput.current?.click()}
              className="press absolute end-2 bottom-2 inline-flex items-center gap-1.5 min-h-[40px] px-2.5 bg-k-ink text-k-paper k-label text-[10px] font-semibold"
            >
              <ImagePlus size={14} aria-hidden="true" /> {bannerPreview ? 'Change banner' : 'Add banner'}
            </button>
            <input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickBanner} className="sr-only" aria-label="Upload banner image" />
          </div>
          <div className="flex items-end gap-3 -mt-8 ms-3">
            <div className="relative">
              <Avatar name={name || user?.name || '?'} src={avatarPreview} size="xl" className="border-[3px] border-background" />
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                aria-label="Change profile photo"
                className="press absolute -end-1 -bottom-1 w-9 h-9 flex items-center justify-center bg-k-red text-k-paper border-2 border-background"
              >
                <Camera size={15} aria-hidden="true" />
              </button>
              <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickAvatar} className="sr-only" aria-label="Upload profile photo" />
            </div>
          </div>
        </section>

        <Input label="Name on your credits" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="k-label text-[10.5px] font-semibold">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="What kind of films do you make? What are you working on?"
            className="input-k py-3 resize-none leading-relaxed"
          />
          <span className="k-label text-[9.5px] text-muted-foreground self-end">{bio.length}/280</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="School or collective" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Cairo Film Institute" />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Alexandria" />
        </div>

        <Chips
          legend="Crew roles"
          hint="What you do on set. People searching for crew see these."
          options={CREW_ROLES}
          selected={crewRoles}
          onToggle={toggle(setCrewRoles)}
        />
        <Chips
          legend="Favourite scenes (genres)"
          hint="Used to pick films for you on Home."
          options={ALL_GENRES}
          selected={favoriteGenres}
          onToggle={toggle(setFavoriteGenres)}
        />
      </div>
    </div>
  )
}
