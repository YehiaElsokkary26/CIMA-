import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, MessageSquare, Play, Share2 } from 'lucide-react'
import { useAddReview, useFilm, useFilmReviews, useMyVoteThisWeek, useVoteFilm } from '@/hooks/useFilms'
import { useRating } from '@/hooks/useRating'
import { useSendCimaRequest } from '@/hooks/useCima'
import { rollFor, splitTimecodedNote, timecode } from '@/lib/klaket'
import { formatTimeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { FilmStill } from '@/components/klaket/FilmCards'
import { Clap, SectionHeader, Slate } from '@/components/klaket/primitives'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'

function tcToSeconds(tc: string): number {
  const [h, m, s] = tc.split(':').map((n) => parseInt(n, 10) || 0)
  return h * 3600 + m * 60 + s
}

export default function FilmDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: film, isPending: isLoading, isError, refetch } = useFilm(id)
  const { data: reviews } = useFilmReviews(id)
  const addReview = useAddReview(id)
  const sendCrewRequest = useSendCimaRequest()
  const { data: myVote, isLoading: checkingVote } = useMyVoteThisWeek()
  const vote = useVoteFilm()
  const rating = useRating(id, undefined)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [saved, setSaved] = useState(false)
  const [crewStatus, setCrewStatus] = useState<'none' | 'pending'>('none')
  const [draft, setDraft] = useState('')
  const [pinToTime, setPinToTime] = useState(true)

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/home'))

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Loading film">
        <Loader2 size={24} className="animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (isError || !film) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-4">
        <button type="button" onClick={goBack} aria-label="Back" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <EmptyState
          icon={AlertCircle}
          title="Couldn’t load this film"
          subtitle="Something went wrong reaching the server."
          action={<Button variant="solid" size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    )
  }

  const notes = reviews ?? []
  const src = film.videoUrl ?? film.trailerUrl
  const isOwn = user?.id === film.uploaderId
  const duration = mediaDuration || (film.runtime ?? 0) * 60

  const votedFilmId = myVote?.filmId ?? null
  const votedThis = votedFilmId === film.id
  const votedOther = votedFilmId !== null && !votedThis
  const canVote = !!user && !votedFilmId && !checkingVote

  const startPlayback = () => {
    if (!src) {
      toast.info('This film hasn’t been uploaded in full yet.')
      return
    }
    setPlaying(true)
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}))
  }

  const seek = (tc: string) => {
    const secs = tcToSeconds(tc)
    setNow(secs)
    if (!playing) startPlayback()
    requestAnimationFrame(() => {
      if (videoRef.current) videoRef.current.currentTime = secs
    })
  }

  const share = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied.')
    } catch {
      toast.info(url)
    }
  }

  const askToCrew = () => {
    if (!film.uploader?.id || crewStatus !== 'none') return
    setCrewStatus('pending')
    sendCrewRequest.mutate(film.uploader.id, {
      onSuccess: () => toast.success(`Call sheet sent to ${film.uploader?.name}.`),
      onError: () => {
        setCrewStatus('none')
        toast.error('Couldn’t send the call sheet. Try again.')
      },
    })
  }

  const castVote = () => {
    if (!canVote) return
    vote.mutate(film.id, { onSuccess: () => toast.success('Vote locked. The envelope opens when the week ends.') })
  }

  const postNote = async () => {
    const text = draft.trim()
    if (!text) return
    const body = pinToTime && playing ? `[${timecode(now)}] ${text}` : text
    try {
      await addReview.mutateAsync({ rating: rating.selected || 4, body })
      setDraft('')
      toast.success('Note posted.')
    } catch {
      // The hook shows the error toast; keep the draft so nothing is lost.
    }
  }

  const progress = duration ? Math.min(100, (now / duration) * 100) : 0
  const marks = notes
    .map((n) => splitTimecodedNote(n.body).tc)
    .filter((tc): tc is string => !!tc && !!duration)
    .map((tc) => Math.min(100, (tcToSeconds(tc) / duration) * 100))

  return (
    <div className="min-h-full">
      {/* Player */}
      <section aria-label="Player" className="bg-k-ink text-k-paper">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button type="button" onClick={goBack} aria-label="Back" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-k-paper press">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <span className="k-label text-[10.5px] text-k-mustard truncate px-2">
              {film.isFilmOfTheWeek ? '★ Film of the week' : film.genre?.[0] ?? 'Short film'}
            </span>
            <button type="button" onClick={share} aria-label="Copy link to this film" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-k-paper press">
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="relative aspect-video max-h-[60vh] w-full bg-black">
            {playing && src ? (
              <video
                ref={videoRef}
                src={src}
                controls
                playsInline
                className="absolute inset-0 w-full h-full"
                onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setMediaDuration(e.currentTarget.duration || 0)}
              />
            ) : (
              <>
                <FilmStill film={film} className="absolute inset-0" />
                <button
                  type="button"
                  onClick={startPlayback}
                  aria-label={`Play ${film.title}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] rounded-full bg-k-paper border-2 border-k-ink flex items-center justify-center press"
                >
                  <Play size={26} fill="#15120E" stroke="#15120E" className="ms-1" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <div className="px-3 pt-2 pb-3 flex flex-col gap-1.5">
            <div className="relative h-1.5 bg-k-smoke" aria-hidden="true">
              <div className="absolute inset-y-0 left-0 bg-k-mustard" style={{ width: `${progress}%` }} />
              {marks.map((p, i) => (
                <span key={i} className="absolute -top-[3px] w-0.5 h-3 bg-k-coral" style={{ left: `${p}%` }} />
              ))}
            </div>
            <div className="flex justify-between k-label text-[10.5px]">
              <span>{timecode(now)}</span>
              <span className="text-k-sand">{duration ? timecode(duration) : '—'}</span>
            </div>
          </div>
        </div>
      </section>

      <Clap className="h-2.5 border-b-[1.5px] border-foreground" />
      <div className="border-b-[1.5px] border-foreground">
        <Slate
          className="max-w-5xl mx-auto"
          cells={[
            { label: 'Scene', value: film.genre?.join(' · ') || 'Short' },
            { label: 'Length', value: film.runtime ? `${film.runtime} min` : '—' },
            { label: 'Roll', value: rollFor(film) },
            { label: film.uploaderRole ? 'Credit' : 'Year', value: film.uploaderRole ?? film.year },
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
        <div>
          <section className="py-4 flex flex-col gap-3">
            <h1 className="k-display text-[30px] sm:text-[40px] uppercase">{film.title}</h1>
            {film.description && <p className="text-[15px] leading-relaxed max-w-[65ch]">{film.description}</p>}
            <div className="flex gap-2">
              <Button variant="solid" className="flex-1" onClick={startPlayback}>
                ▶ Play{film.runtime ? ` ${film.runtime} min` : ''}
              </Button>
              <Button
                variant={saved ? 'accent' : 'outline'}
                className="flex-1"
                aria-pressed={saved}
                onClick={() => {
                  setSaved((s) => !s)
                  toast.success(saved ? 'Removed from your watchlist.' : 'Saved to your watchlist.')
                }}
              >
                {saved ? 'Saved ✓' : 'Save'}
              </Button>
            </div>
          </section>

          {/* Credits */}
          <section aria-label="Credits" className="bg-k-red text-k-paper border-[1.5px] border-foreground p-3.5 flex flex-col gap-2">
            <span className="k-label text-[10px] text-k-mustard">Credits</span>
            <div className="flex items-center gap-3">
              {film.uploader && <Avatar name={film.uploader.name} src={film.uploader.avatarUrl} size="md" className="border-k-paper" />}
              <p className="k-label text-[11px] leading-relaxed min-w-0">
                {film.uploaderRole ?? 'Directed by'}{' '}
                {film.uploader ? (
                  <Link to={`/profile/${film.uploader.id}`} className="font-semibold underline underline-offset-2">
                    {film.uploader.name}
                  </Link>
                ) : (
                  'Unknown'
                )}
                {film.uploader?.school ? ` · ${film.uploader.school}` : ''} · {film.year}
              </p>
            </div>
            {!isOwn && film.uploader && (
              <button
                type="button"
                onClick={askToCrew}
                disabled={crewStatus !== 'none'}
                className="press self-start mt-1 min-h-[40px] px-3 bg-k-ink text-k-paper k-label text-[10.5px] font-semibold disabled:opacity-70"
              >
                {crewStatus === 'pending' ? 'Call sheet sent ✓' : `Send ${film.uploader.name.split(' ')[0]} a call sheet`}
              </button>
            )}
          </section>

          {/* Vote + rating */}
          <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border-[1.5px] border-foreground bg-k-mustard text-k-ink p-3 flex flex-col gap-1">
              <span className="k-label text-[10px] font-semibold">This week’s vote</span>
              <span className="font-black text-[18px]" style={{ fontStretch: '115%' }}>
                {(film.votes ?? 0).toLocaleString()} VOTES
              </span>
              {votedThis ? (
                <span className="k-label text-[10.5px] font-semibold min-h-[40px] flex items-center">✓ You circled this film</span>
              ) : votedOther ? (
                <Link to="/vote" className="k-label text-[10.5px] underline underline-offset-2 min-h-[40px] flex items-center">
                  You voted for another film this week →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={castVote}
                  disabled={!canVote || vote.isPending}
                  className="press self-start min-h-[40px] px-3 bg-k-ink text-k-paper k-label text-[10.5px] font-semibold disabled:opacity-60"
                >
                  {vote.isPending ? 'Locking…' : 'Circle this film'}
                </button>
              )}
            </div>
            <div className="border-[1.5px] border-foreground bg-card p-3 flex flex-col gap-1">
              <span className="k-label text-[10px] font-semibold">
                Rate it{film.rating ? ` · avg ★ ${film.rating.toFixed(1)} (${film.ratingCount ?? 0})` : ''}
              </span>
              <StarRating
                value={rating.displayRating}
                interactive
                onHover={(v) => rating.setHovered(v)}
                onSelect={(v) => {
                  rating.setHovered(null)
                  rating.submit(v)
                }}
                size="md"
                className="-ms-2.5"
              />
              <span className="text-[12px] text-muted-foreground">Your stars are sent with your next note.</span>
            </div>
          </section>
        </div>

        {/* Notes on the cut */}
        <section aria-label="Notes on the cut" className="pt-6 pb-4 flex flex-col gap-3 lg:pt-4">
          <SectionHeader title="NOTES ON THE CUT" meta={`${notes.length} notes`} />
          {notes.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No notes yet" subtitle="Be the first to say what works in this cut." className="py-6" />
          ) : (
            <ul className="flex flex-col">
              {notes.map((n) => {
                const { tc, text } = splitTimecodedNote(n.body)
                return (
                  <li key={n.id} className="flex flex-col gap-1.5 py-3 border-b border-rule">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tc && (
                        <button
                          type="button"
                          onClick={() => seek(tc)}
                          aria-label={`Jump to ${tc}`}
                          className="k-label text-[11px] font-semibold bg-k-ink text-k-mustard px-1.5 min-h-[26px] press"
                        >
                          {tc}
                        </button>
                      )}
                      <b className="text-[13.5px]">{n.user?.name ?? 'Someone'}</b>
                      <span className="text-[12px] text-muted-foreground">★ {n.rating} · {formatTimeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[14.5px] leading-relaxed">{text}</p>
                  </li>
                )
              })}
            </ul>
          )}

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              postNote()
            }}
          >
            <label htmlFor="note" className="k-label text-[10.5px] font-semibold text-muted-foreground">
              {playing ? `Add a note at ${timecode(now)}` : 'Add a note'}
            </label>
            <div className="flex">
              <input
                id="note"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What works in this shot?"
                className="input-k border-e-0"
              />
              <button
                type="submit"
                disabled={!draft.trim() || addReview.isPending}
                className="min-w-[72px] bg-solid text-solid-foreground font-extrabold text-[13px] disabled:opacity-50 press"
              >
                {addReview.isPending ? '…' : 'POST'}
              </button>
            </div>
            {playing && (
              <label className="flex items-center gap-2 text-[13px] text-muted-foreground min-h-[32px]">
                <input type="checkbox" checked={pinToTime} onChange={(e) => setPinToTime(e.target.checked)} className="w-4 h-4 accent-[#C42320]" />
                Pin this note to {timecode(now)}
              </label>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
