import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Upload, Image, Check, ArrowLeft, ArrowRight, X, Clapperboard } from 'lucide-react'
import { useUploadFilm } from '@/hooks/useFilms'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { GENRES } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

const STEPS = ['Film File', 'Details', 'Trailer', 'Publish']

export default function UploadPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)

  // Step 0 state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const thumbInput = useRef<HTMLInputElement>(null)

  // Step 1 state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [runtime, setRuntime] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  // Step 2 state — trailer
  const [trailerFile, setTrailerFile] = useState<File | null>(null)
  const [trailerPreview, setTrailerPreview] = useState<string | null>(null)
  const trailerInput = useRef<HTMLInputElement>(null)

  const uploadFilm = useUploadFilm()

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setVideoFile(file)
  }

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const handleTrailerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTrailerFile(file)
    setTrailerPreview(URL.createObjectURL(file))
  }

  const removeTrailer = () => {
    if (trailerPreview) URL.revokeObjectURL(trailerPreview)
    setTrailerFile(null)
    setTrailerPreview(null)
    if (trailerInput.current) trailerInput.current.value = ''
  }

  const handlePublish = async () => {
    if (!user) return
    try {
      await uploadFilm.mutateAsync({
        videoFile,
        thumbFile,
        trailerFile,
        title,
        description,
        genre: selectedGenres,
        runtime: runtime ? parseInt(runtime, 10) : undefined,
        year: parseInt(year, 10),
        uploaderId: user.id,
        uploaderName: user.name,
      })
      toast.success('Your film is live. 🎬')
      navigate('/home', { replace: true })
    } catch {
      // Error toast is shown by the mutation's onError handler
    }
  }

  return (
    <div className="min-h-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="icon-lift">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h1 className="font-display text-3xl uppercase tracking-widest text-foreground">
          Upload Film
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] transition-colors ${
                  i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`font-mono text-xs uppercase tracking-wider ${
                  i === step ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 0: Film File ──────────────────────────────── */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div
              onClick={() => videoInput.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                videoFile ? 'border-primary bg-primary/5' : 'border-border hover:border-secondary'
              }`}
            >
              <input
                ref={videoInput}
                type="file"
                accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleVideoSelect}
              />
              {videoFile ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <Film size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans font-semibold text-sm text-foreground">{videoFile.name}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setVideoFile(null) }} className="icon-lift">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Upload size={24} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl uppercase tracking-wider text-foreground">
                      Tap to Select Your Film
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      MP4, MOV, WebM · max 2 GB
                    </p>
                  </div>
                </>
              )}
            </div>

            <div
              onClick={() => thumbInput.current?.click()}
              className="border border-dashed border-border rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:border-secondary transition-colors"
            >
              <input
                ref={thumbInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbSelect}
              />
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-16 h-12 object-cover rounded-xl" />
              ) : (
                <div className="w-16 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Image size={18} className="text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-sans text-sm font-medium text-foreground">
                  {thumbPreview ? 'Change Poster' : 'Add Poster / Thumbnail'}
                </p>
                <p className="font-mono text-xs text-muted-foreground">PNG, JPG · 16:9 recommended</p>
              </div>
            </div>

            <Button size="lg" className="w-full" disabled={!videoFile} onClick={() => setStep(1)}>
              Next <ArrowRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* ── Step 1: Details ───────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <Input
              label="Film Title"
              placeholder="ENTER TITLE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Short Description
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {description.length}/280
                </span>
              </div>
              <textarea
                placeholder="What's your film about?"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                rows={3}
                className="w-full bg-input text-foreground border border-border rounded-xl px-4 py-2.5 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <Input
                label="Runtime (min)"
                type="number"
                placeholder="12"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Rule 3: genre pills min 44px — py-2.5 + text ≈ 44px ✓ */}
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    style={{ minHeight: 44 }}
                    className={`font-mono text-xs px-3 py-2.5 rounded-full border transition-colors ${
                      selectedGenres.includes(g)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-secondary'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button className="flex-1" disabled={!title} onClick={() => setStep(2)}>
                Next <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Trailer (optional) ────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Section header */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-foreground">
                  Add a Trailer
                </span>
                <span className="font-mono text-xs" style={{ color: '#4E4A46' }}>
                  (optional)
                </span>
              </div>
              <p className="font-sans text-sm mt-1 text-muted-foreground">
                Your trailer plays when people hover over your film. Keep it under 2 minutes.
              </p>
            </div>

            {trailerFile ? (
              /* Trailer selected — preview + controls */
              <div className="space-y-3">
                <video
                  src={trailerPreview ?? undefined}
                  controls
                  className="w-full rounded-xl"
                  style={{ maxHeight: 160, background: '#161413' }}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-foreground truncate max-w-[200px]">
                      {trailerFile.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {(trailerFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={removeTrailer}
                    className="font-mono text-xs transition-opacity hover:opacity-70"
                    style={{ color: '#A32626' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Upload zone */
              <div
                onClick={() => trailerInput.current?.click()}
                className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-secondary"
                style={{ borderColor: 'rgba(163,38,38,0.5)' }}
              >
                <input
                  ref={trailerInput}
                  type="file"
                  accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleTrailerSelect}
                />
                <Clapperboard size={28} style={{ color: '#B28A52' }} />
                <div className="text-center">
                  <p className="font-mono text-sm uppercase tracking-wider" style={{ color: '#E8DDCB' }}>
                    Upload your trailer
                  </p>
                  <p className="font-mono text-xs mt-1" style={{ color: '#4E4A46' }}>
                    MP4, MOV or WEBM · Max 500MB · Under 2 min recommended
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Next <ArrowRight size={16} />
              </Button>
            </div>

            {/* Rule 3: Skip button min 44px touch target */}
            <button
              onClick={() => setStep(3)}
              className="w-full text-center font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-70 py-3"
              style={{ color: 'rgba(232,221,203,0.45)', minHeight: 44 }}
            >
              Skip This Step →
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Publish preview ───────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-muted to-card flex items-center justify-center">
                  <Film size={36} className="text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {selectedGenres.map((g) => <Badge key={g} variant="film">{g}</Badge>)}
                </div>
                <h2 className="font-display text-3xl uppercase tracking-widest text-foreground">
                  {title || 'UNTITLED'}
                </h2>
                <div className="flex gap-3">
                  {year && <span className="font-mono text-xs text-muted-foreground">{year}</span>}
                  {runtime && (
                    <span className="font-mono text-xs text-muted-foreground">{runtime} min</span>
                  )}
                </div>
                {description && (
                  <p className="font-sans text-sm text-muted-foreground">{description}</p>
                )}
                {trailerFile && (
                  <p className="font-mono text-[10px]" style={{ color: '#B28A52' }}>
                    Trailer: {trailerFile.name}
                  </p>
                )}
                {user && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-mono">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{user.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft size={16} /> Edit
              </Button>
              <Button
                className="flex-1"
                pulse
                onClick={handlePublish}
                disabled={uploadFilm.isPending}
              >
                <Film size={15} />
                {uploadFilm.isPending ? 'Publishing…' : 'Publish Film'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
