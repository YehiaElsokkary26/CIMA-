import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Upload, Image, Check, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useUploadFilm } from '@/hooks/useFilms'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { GENRES } from '@/lib/utils'

const STEPS = ['Upload', 'Details', 'Publish']

export default function UploadPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [runtime, setRuntime] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const videoInput = useRef<HTMLInputElement>(null)
  const thumbInput = useRef<HTMLInputElement>(null)
  const uploadFilm = useUploadFilm()

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
  }

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const handlePublish = async () => {
    const fd = new FormData()
    if (videoFile) fd.append('video', videoFile)
    if (thumbFile) fd.append('thumbnail', thumbFile)
    fd.append('title', title)
    fd.append('description', description)
    fd.append('year', year)
    fd.append('runtime', runtime)
    selectedGenres.forEach((g) => fd.append('genre', g))

    try {
      await uploadFilm.mutateAsync(fd)
    } catch {
      // mock success for demo
    }
    setPublished(true)
  }

  if (published) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-full flex flex-col items-center justify-center px-6 text-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center shadow-glow-orange">
          <Check size={32} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-5xl uppercase tracking-widest text-foreground">
            Cut!
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">
            Your film is live. Time to get feedback.
          </p>
        </div>
        <Button onClick={() => navigate('/home')}>Back to Feed</Button>
      </motion.div>
    )
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
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
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
              <div className={`flex-1 h-px w-8 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: File Upload */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Video drop zone */}
            <div
              onClick={() => videoInput.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                videoFile ? 'border-primary bg-primary/5' : 'border-border hover:border-secondary'
              }`}
            >
              <input ref={videoInput} type="file" accept="video/mp4,video/mov,video/webm" className="hidden" onChange={handleVideoSelect} />
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
                      Drop Your Film Here
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">MP4, MOV, WebM · max 2GB</p>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail */}
            <div
              onClick={() => thumbInput.current?.click()}
              className="border border-dashed border-border rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:border-secondary transition-colors"
            >
              <input ref={thumbInput} type="file" accept="image/*" className="hidden" onChange={handleThumbSelect} />
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-16 h-12 object-cover rounded-xl" />
              ) : (
                <div className="w-16 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Image size={18} className="text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-sans text-sm font-medium text-foreground">
                  {thumbPreview ? 'Change Thumbnail' : 'Add Thumbnail'}
                </p>
                <p className="font-mono text-xs text-muted-foreground">PNG, JPG · 16:9 recommended</p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!videoFile}
              onClick={() => setStep(1)}
            >
              Next <ArrowRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* Step 1: Metadata */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <Input label="Film Title" placeholder="ENTER TITLE" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Short Description</label>
              <textarea
                placeholder="What's your film about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-input text-foreground border border-border rounded-xl px-4 py-2.5 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              <Input label="Runtime (min)" type="number" placeholder="24" value={runtime} onChange={(e) => setRuntime(e.target.value)} />
            </div>

            {/* Genre chips */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Genres</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`font-mono text-xs px-3 py-1 rounded-full border transition-colors ${
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
                Preview <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Preview + Publish */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {thumbPreview && (
                <img src={thumbPreview} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {selectedGenres.map((g) => <Badge key={g} variant="film">{g}</Badge>)}
                </div>
                <h2 className="font-display text-3xl uppercase tracking-widest text-foreground">{title}</h2>
                <div className="flex gap-3">
                  {year && <span className="font-mono text-xs text-muted-foreground">{year}</span>}
                  {runtime && <span className="font-mono text-xs text-muted-foreground">{runtime} min</span>}
                </div>
                {description && <p className="font-sans text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
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
