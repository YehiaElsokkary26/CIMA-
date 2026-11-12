import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clapperboard, ImagePlus, Trash2, X } from 'lucide-react'
import { useUploadFilm } from '@/hooks/useFilms'
import { GENRES, cn } from '@/lib/utils'
import { CREW_ROLES } from '@/lib/crewRoles'
import { posterColors, weekNumber } from '@/lib/klaket'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { uploadLimitMB } from '@/lib/storage'
import { Clap } from '@/components/klaket/primitives'
import { FilmStill } from '@/components/klaket/FilmCards'
import Input from '@/components/ui/Input'

const STEPS = ['Slate it', 'Cut it', 'Release'] as const

function fileSize(bytes: number) {
  // Same units as the upload limit (1 MB = 1024 × 1024 bytes), so “52 MB” never passes a 50 MB limit.
  const MB = 1024 * 1024
  return bytes >= 1024 * MB ? `${(bytes / (1024 * MB)).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / MB))} MB`
}

export default function UploadPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const uploadFilm = useUploadFilm()
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState({ value: 0, status: 'Preparing upload…' })

  // 1 · Slate it
  const [title, setTitle] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [runtime, setRuntime] = useState('')
  const [description, setDescription] = useState('')
  const [uploaderRole, setUploaderRole] = useState('')

  const currentYear = new Date().getFullYear()
  const yearValue = Number(year)
  const yearValid = /^\d{4}$/.test(year.trim()) && yearValue >= 1888 && yearValue <= currentYear
  const yearError = !year.trim()
    ? 'Year is required.'
    : !/^\d{4}$/.test(year.trim())
      ? 'Enter a 4-digit year.'
      : !yearValid
        ? `Enter a year between 1888 and ${currentYear}.`
        : undefined

  // 2 · Cut it
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [trailerFile, setTrailerFile] = useState<File | null>(null)
  const [trailerPreview, setTrailerPreview] = useState<string | null>(null)
  const trailerInput = useRef<HTMLInputElement>(null)

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  // Say "too big" when the file is picked, not after a long upload.
  const fitsLimit = (f: File, bucket: string, input: HTMLInputElement) => {
    const mb = uploadLimitMB(bucket)
    if (f.size <= mb * 1024 * 1024) return true
    toast.error(`That file is ${fileSize(f.size)}. The upload limit is ${mb} MB. Export a smaller version and try again.`)
    input.value = ''
    return false
  }

  const pickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !fitsLimit(f, 'films', e.target)) return
    setVideoFile(f)
    // Fill in the runtime from the file if it wasn't typed in.
    if (!runtime) {
      const url = URL.createObjectURL(f)
      const probe = document.createElement('video')
      probe.preload = 'metadata'
      probe.onloadedmetadata = () => {
        if (probe.duration && isFinite(probe.duration)) setRuntime(String(Math.max(1, Math.round(probe.duration / 60))))
        URL.revokeObjectURL(url)
      }
      probe.src = url
    }
  }

  const pickThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setThumbFile(f)
    setThumbPreview(URL.createObjectURL(f))
  }

  const pickTrailer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !fitsLimit(f, 'trailers', e.target)) return
    setTrailerFile(f)
    setTrailerPreview(URL.createObjectURL(f))
  }

  const removeTrailer = () => {
    if (trailerPreview) URL.revokeObjectURL(trailerPreview)
    setTrailerFile(null)
    setTrailerPreview(null)
    if (trailerInput.current) trailerInput.current.value = ''
  }

  const release = async () => {
    if (!user) return
    try {
      const film = await uploadFilm.mutateAsync({
        videoFile,
        thumbFile,
        trailerFile,
        title: title.trim(),
        description,
        genre: genres,
        runtime: runtime ? parseInt(runtime, 10) : undefined,
        year: yearValue,
        uploaderId: user.id,
        uploaderRole: uploaderRole || undefined,
        onProgress: (value, status) => setProgress({ value, status }),
      })
      toast.success(`Released. ${title.trim()} is in the week ${weekNumber()} slate.`)
      navigate('/home', { replace: true, state: { publishedFilmId: film.id } })
    } catch {
      // The hook shows the error toast; stay here so nothing is lost.
    }
  }

  const canNext = step === 0 ? !!title.trim() && genres.length > 0 && yearValid : step === 1 ? !!videoFile : true
  const blocker =
    step === 0
      ? !title.trim()
        ? 'Add a title to continue.'
        : genres.length === 0
          ? 'Pick at least one scene.'
          : yearError ?? ''
      : 'Add your video file to continue.'
  const previewId = title || 'new'
  const c = posterColors(previewId)

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
            disabled={uploadFilm.isPending}
            aria-label={step === 0 ? 'Close' : `Back to ${STEPS[step - 1]}`}
            className="w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press disabled:opacity-50"
          >
            {step === 0 ? <X size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
          </button>
          <span className="k-label text-[11px] font-semibold">New film · Step {step + 1} of {STEPS.length}</span>
          <span className="w-11" />
        </header>

        <ol aria-label="Upload steps" className="grid grid-cols-3 border-[1.5px] border-foreground">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'px-2 py-2 flex flex-col',
                i > 0 && 'border-s-[1.5px] border-foreground',
                i < step && 'bg-solid text-solid-foreground',
                i === step && 'bg-k-red text-k-paper',
              )}
            >
              <span className={cn('k-label text-[9px]', i <= step && 'text-k-mustard')}>
                {String(i + 1).padStart(2, '0')}
                {i < step ? ' ✓' : ''}
              </span>
              <b className="text-[13px]">{s}</b>
            </li>
          ))}
        </ol>

        {/* Live slate preview */}
        <section aria-label="Slate preview" className="bg-k-ink text-k-paper border-[1.5px] border-foreground">
          <Clap variant="fixed" className="h-4 -rotate-2 origin-bottom-left border-b-[1.5px] border-k-ink" />
          <div className="grid grid-cols-3 border-b-[1.5px] border-k-paper">
            <div className="slate-cell border-e-[1.5px] border-k-paper">Scene<b className="text-k-mustard">{genres[0] ?? '—'}</b></div>
            <div className="slate-cell border-e-[1.5px] border-k-paper">Length<b className="text-k-mustard">{runtime ? `${runtime} min` : '—'}</b></div>
            <div className="slate-cell">Roll<b className="text-k-mustard">{user?.school ?? year}</b></div>
          </div>
          <div className="px-3 py-2.5">
            <span className="k-label text-[9px] text-k-sand">Prod. title</span>
            <p className="k-display text-[24px] uppercase break-words">{title || 'Untitled'}</p>
            {uploaderRole && <span className="k-label text-[9.5px] text-k-sand">{uploaderRole} · {user?.name}</span>}
          </div>
        </section>

        {step === 0 && (
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Salt and Iron" required maxLength={80} />
            <fieldset className="flex flex-col gap-2">
              <legend className="k-label text-[10.5px] font-semibold mb-2">
                Scene (genre) <span className="text-hot" aria-hidden="true">*</span>
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={genres.includes(g)}
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      'k-label text-[11px] font-semibold px-3 min-h-[38px] border-[1.5px] border-foreground press',
                      genres.includes(g) ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                error={year && !yearValid ? yearError : undefined}
                required
              />
              <Input label="Runtime (minutes)" type="number" inputMode="numeric" value={runtime} onChange={(e) => setRuntime(e.target.value)} min={1} placeholder="e.g. 12" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="uploader-role" className="k-label text-[10.5px] font-semibold">Your credit on this film</label>
              <select id="uploader-role" value={uploaderRole} onChange={(e) => setUploaderRole(e.target.value)} className="input-k">
                <option value="">Choose a role (optional)</option>
                {CREW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="synopsis" className="k-label text-[10.5px] font-semibold">Synopsis</label>
              <textarea
                id="synopsis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="One or two sentences: who, where, what’s at stake."
                className="input-k py-3 resize-none leading-relaxed"
              />
              <span className="k-label text-[9.5px] text-muted-foreground self-end">{description.length}/600</span>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="k-display text-[26px]">ADD YOUR CUT</h1>
            <label
              htmlFor="video-file"
              className="relative flex flex-col items-center justify-center gap-1.5 min-h-[130px] p-4 text-center border-2 border-dashed border-foreground bg-field cursor-pointer hover:bg-muted focus-within:outline focus-within:outline-2 focus-within:outline-hot"
            >
              <Clapperboard size={28} aria-hidden="true" />
              <b className="text-[15px]">{videoFile ? 'Replace video file' : 'Choose a video file'}</b>
              <span className="k-label text-[10px] text-muted-foreground">MP4, MOV or WebM · up to {uploadLimitMB('films')} MB</span>
              <input id="video-file" type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" onChange={pickVideo} className="sr-only" />
            </label>
            {videoFile && (
              <div className="border-[1.5px] border-foreground bg-card px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <b className="text-[14px] block truncate">{videoFile.name}</b>
                  <span className="k-label text-[9.5px] text-muted-foreground">
                    {fileSize(videoFile.size)}
                    {runtime ? ` · ${runtime} min` : ''}
                  </span>
                </div>
                <span className="k-label text-[10px] font-semibold text-secondary dark:text-k-mustard shrink-0">✓ Ready</span>
              </div>
            )}

            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 items-start">
              <div className="aspect-[4/5] border-[1.5px] border-foreground overflow-hidden">
                {thumbPreview ? (
                  <img src={thumbPreview} alt="Poster frame preview" className="w-full h-full object-cover" />
                ) : (
                  <FilmStill film={{ id: previewId, title }} className="w-full h-full" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <b className="text-[15px]">Poster frame</b>
                <p className="text-[13px] text-muted-foreground">
                  This image becomes your afeesh, the poster card people see in the feed. Without one, Klaket draws an illustrated still.
                </p>
                <label
                  htmlFor="thumb-file"
                  className="press self-start inline-flex items-center gap-2 min-h-[44px] px-3 border-[1.5px] border-foreground k-label text-[10.5px] font-semibold cursor-pointer hover:bg-foreground/5 focus-within:outline focus-within:outline-2 focus-within:outline-hot"
                >
                  <ImagePlus size={15} aria-hidden="true" />
                  {thumbFile ? 'Change image' : 'Add image'}
                  <input id="thumb-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickThumb} className="sr-only" />
                </label>
              </div>
            </div>

            <div className="border-t border-rule pt-4 flex flex-col gap-2">
              <b className="text-[15px]">Trailer (optional)</b>
              <p className="text-[13px] text-muted-foreground">A short clip that plays when people preview your film.</p>
              {trailerFile ? (
                <div className="flex items-center gap-3 border-[1.5px] border-foreground p-2">
                  {trailerPreview && <video src={trailerPreview} muted className="w-24 aspect-video object-cover bg-black" />}
                  <span className="text-[13px] truncate flex-1 min-w-0">{trailerFile.name}</span>
                  <button type="button" onClick={removeTrailer} aria-label="Remove trailer" className="w-11 h-11 flex items-center justify-center hover:text-hot">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="trailer-file"
                  className="press self-start inline-flex items-center gap-2 min-h-[44px] px-3 border-[1.5px] border-foreground k-label text-[10.5px] font-semibold cursor-pointer hover:bg-foreground/5 focus-within:outline focus-within:outline-2 focus-within:outline-hot"
                >
                  Add trailer
                  <input id="trailer-file" ref={trailerInput} type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" onChange={pickTrailer} className="sr-only" />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="k-display text-[26px]">READY TO RELEASE</h1>
            <section aria-label="Poster preview" className="grid grid-cols-[132px_minmax(0,1fr)] border-[1.5px] border-foreground" style={{ background: c.bg, color: c.fg }}>
              <div className="aspect-[4/5] border-e-[1.5px] border-k-ink overflow-hidden">
                {thumbPreview ? (
                  <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FilmStill film={{ id: previewId, title }} className="w-full h-full" />
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 min-w-0">
                <span className="k-label text-[9.5px]" style={{ color: c.title }}>Your afeesh</span>
                <b className="k-display text-[20px] uppercase break-words">{title}</b>
                <span className="k-label text-[9.5px] mt-auto leading-relaxed">
                  {genres.join(' · ')}
                  <br />
                  {uploaderRole || 'Dir.'} {user?.name}
                  {runtime ? ` · ${runtime} min` : ''} · {year}
                </span>
              </div>
            </section>
            <ul className="border-[1.5px] border-foreground bg-field text-[14px]">
              <li className="flex justify-between gap-3 px-3 py-2.5 border-b border-rule"><span>Enters the vote</span><b>Week {weekNumber()}</b></li>
              <li className="flex justify-between gap-3 px-3 py-2.5 border-b border-rule"><span>Video</span><b className="truncate max-w-[60%]">{videoFile?.name}</b></li>
              <li className="flex justify-between gap-3 px-3 py-2.5"><span>Trailer</span><b>{trailerFile ? 'Added' : 'None'}</b></li>
            </ul>
            {uploadFilm.isPending && (
              <div className="flex flex-col gap-1.5" aria-live="polite">
                <div
                  className="h-2.5 border-[1.5px] border-foreground bg-field"
                  role="progressbar"
                  aria-label="Release progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.value}
                >
                  <div className="h-full bg-k-red transition-all" style={{ width: `${progress.value}%` }} />
                </div>
                <span className="k-label text-[10.5px] text-muted-foreground">{progress.status} · {progress.value}%</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-2 pb-4">
          {!canNext && blocker && <span className="k-label text-[10.5px] text-muted-foreground">{blocker}</span>}
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="press flex items-center justify-between min-h-[52px] px-4 bg-k-red text-k-paper font-black text-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontStretch: '115%' }}
            >
              <span>NEXT: {STEPS[step + 1].toUpperCase()}</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={uploadFilm.isPending}
              onClick={release}
              className="press flex items-center justify-between min-h-[56px] px-4 bg-solid text-solid-foreground font-black text-[17px] disabled:opacity-60"
              style={{ fontStretch: '120%' }}
            >
              <span>{uploadFilm.isPending ? 'RELEASING…' : 'RELEASE IT'}</span>
              <span className="k-label text-[11px] font-normal text-k-mustard">Rolling · Take 1</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
