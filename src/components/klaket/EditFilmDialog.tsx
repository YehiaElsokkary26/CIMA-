import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { GENRES, cn } from '@/lib/utils'
import { useUpdateFilm } from '@/hooks/useFilms'
import { toast } from '@/store/toastStore'
import type { Film } from '@/types'
import { FormError } from './AuthFrame'
import Input from '@/components/ui/Input'

const THIS_YEAR = new Date().getFullYear()

/** Edit a film's details. The video and images stay as uploaded. */
export default function EditFilmDialog({ film, onClose }: { film: Film; onClose: () => void }) {
  const update = useUpdateFilm(film.id)
  const id = useId()
  const firstRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(film.title)
  const [description, setDescription] = useState(film.description ?? '')
  const [genres, setGenres] = useState<string[]>(film.genre ?? [])
  const [runtime, setRuntime] = useState(film.runtime ? String(film.runtime) : '')
  const [year, setYear] = useState(film.year ? String(film.year) : '')
  const [credit, setCredit] = useState(film.uploaderRole ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !update.isPending && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, update.isPending])

  const toggleGenre = (g: string) => setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const runtimeNum = runtime.trim() ? parseInt(runtime, 10) : null
    const yearNum = year.trim() ? parseInt(year, 10) : null
    if (!title.trim()) return setError('Give the film a title.')
    if (!genres.length) return setError('Pick at least one genre.')
    if (runtimeNum !== null && (!(runtimeNum > 0) || runtimeNum > 600)) return setError('Length should be between 1 and 600 minutes.')
    if (yearNum !== null && (!(yearNum >= 1888) || yearNum > THIS_YEAR + 1)) return setError(`Year should be between 1888 and ${THIS_YEAR + 1}.`)
    try {
      await update.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        genre: genres,
        runtime: runtimeNum,
        year: yearNum,
        uploaderRole: credit.trim(),
      })
      toast.success('Film details saved.')
      onClose()
    } catch {
      // The hook shows the error toast; keep the form open.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60" onClick={() => !update.isPending && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        noValidate
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-[1.5px] border-foreground bg-background"
      >
        <div className="clap h-3" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 id={`${id}-title`} className="k-display text-[24px]">EDIT DETAILS</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3.5">
          {error && <FormError message={error} />}
          <Input ref={firstRef} label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
          <label className="flex flex-col gap-1.5">
            <span className="k-label text-[10.5px] font-semibold">Logline</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className="input-k py-3 resize-none leading-relaxed" />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="k-label text-[10.5px] font-semibold mb-1">Genre</legend>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const on = genres.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleGenre(g)}
                    className={cn('press min-h-[36px] px-2.5 border-[1.5px] border-foreground k-label text-[10.5px] font-semibold', on ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5')}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Length (min)" inputMode="numeric" value={runtime} onChange={(e) => setRuntime(e.target.value.replace(/\D/g, ''))} placeholder="—" />
            <Input label="Year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="—" />
          </div>
          <Input label="Your credit" value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={100} placeholder="e.g. Directed by" />
          <p className="text-[12.5px] text-muted-foreground">To change the video or poster, delete the film and upload it again.</p>
        </div>
        <div className="grid grid-cols-2 border-t-[1.5px] border-foreground">
          <button type="button" onClick={onClose} disabled={update.isPending} className="min-h-[50px] font-extrabold text-[13px] border-e-[1.5px] border-foreground hover:bg-foreground/5">
            CANCEL
          </button>
          <button type="submit" disabled={update.isPending} className="min-h-[50px] font-extrabold text-[13px] bg-solid text-solid-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {update.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            SAVE
          </button>
        </div>
      </form>
    </div>
  )
}
