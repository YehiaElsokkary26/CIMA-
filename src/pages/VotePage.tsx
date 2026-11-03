import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film as FilmIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFilms } from '@/hooks/useFilms'
import { filmsApi } from '@/lib/api'
import { getFilms, voteForFilm } from '@/lib/mockData'
import {
  getCurrentWeekKey,
  getMsUntilNextWeek,
  getUserVoteThisWeek,
  getWeekCountdown,
  setUserVote,
} from '@/lib/votingUtils'
import { timecode, weekNumber } from '@/lib/klaket'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import type { Film } from '@/types'
import { FilmStill } from '@/components/klaket/FilmCards'
import { VoteCircle } from '@/components/klaket/primitives'
import EmptyState from '@/components/ui/EmptyState'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// The week's films laid out as a contact sheet. Tap a frame to circle it,
// then lock the vote. One vote per person per week.
export default function VotePage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const { data: serverFilms } = useFilms()

  const films: Film[] = useMemo(() => {
    const all = serverFilms ?? getFilms()
    const wk = getCurrentWeekKey()
    const thisWeek = all.filter((f) => f.weekKey === wk)
    return (thisWeek.length ? thisWeek : all).slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [serverFilms])

  const [locked, setLocked] = useState<string | null>(() => (user ? getUserVoteThisWeek(user.id) : null))
  const [picked, setPicked] = useState<string | null>(locked)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) setLocked(getUserVoteThisWeek(user.id))
  }, [user])

  const totalVotes = films.reduce((n, f) => n + (f.votes ?? 0), 0)
  const pickedFilm = films.find((f) => f.id === picked)
  const sweep = Math.round((1 - getMsUntilNextWeek() / WEEK_MS) * 360)

  const lockVote = async () => {
    if (!user || !picked || locked) return
    setBusy(true)
    try {
      await filmsApi.vote(picked)
      setUserVote(user.id, picked)
      setLocked(picked)
      qc.invalidateQueries({ queryKey: ['films'] })
      toast.success('Vote locked. The envelope opens when the week ends.')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        toast.error('You already voted this week.')
        setLocked(picked)
      } else if (!status || status >= 500) {
        // No server (or the dev proxy can't reach it): record the vote locally so the demo still works.
        const res = voteForFilm(picked, user.id)
        if (res.success) {
          setLocked(picked)
          toast.success('Vote locked. The envelope opens when the week ends.')
        } else if (res.error === 'already_voted_other_film' || res.error === 'already_voted_this_film') {
          setLocked(getUserVoteThisWeek(user.id))
          toast.error('You already voted this week.')
        } else {
          toast.error('That film is no longer in the vote.')
        }
      } else {
        toast.error('Your vote didn’t go through. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-k-ink text-k-paper">
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-6 flex flex-col gap-4">
        {/* Header with film-leader countdown */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="k-label text-[11px] text-k-mustard font-semibold">Week {weekNumber()} contact sheet</span>
            <h1 className="k-display text-[30px] sm:text-[40px]" style={{ fontStretch: '120%' }}>
              CIRCLE
              <br />
              YOUR PICK
            </h1>
            <span lang="ar" className="k-poster text-[26px] text-k-coral">اختار فيلمك</span>
          </div>
          <div
            role="img"
            aria-label={`Voting closes in ${getWeekCountdown()}`}
            className="relative w-[104px] h-[104px] shrink-0 rounded-full border-2 border-k-paper"
            style={{ background: `conic-gradient(#F1B51C 0 ${sweep}deg, transparent ${sweep}deg)` }}
          >
            <div className="absolute inset-2 rounded-full bg-k-ink border border-k-paper flex flex-col items-center justify-center">
              <span className="k-display text-[24px] leading-none">{getWeekCountdown().split(' ')[0]}</span>
              <span className="k-label text-[9px]">{getWeekCountdown().split(' ')[1] ?? 'left'}</span>
            </div>
            <div className="absolute left-1/2 inset-y-0 w-px bg-k-paper/50" aria-hidden="true" />
            <div className="absolute top-1/2 inset-x-0 h-px bg-k-paper/50" aria-hidden="true" />
          </div>
        </header>

        {/* Contact sheet */}
        {films.length === 0 ? (
          <EmptyState icon={FilmIcon} title="Nothing to vote on" subtitle="No films were entered this week." />
        ) : (
          <section aria-label="This week’s films" className="bg-[#221E18] border border-k-smoke">
            <Sprockets />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3.5 gap-y-5 p-4">
              {films.map((f, i) => {
                const selected = f.id === picked
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!!locked}
                    onClick={() => setPicked(f.id)}
                    aria-pressed={selected}
                    aria-label={`Vote for ${f.title} by ${f.uploader?.name ?? 'unknown'}`}
                    className="relative flex flex-col gap-1 text-start disabled:cursor-default focus-visible:outline-k-mustard"
                  >
                    <FilmStill film={f} className="h-[112px] sm:h-[140px]" />
                    <span className="flex justify-between k-label text-[9.5px]">
                      <span className="text-[#E9842B]">▸ {String(i + 1).padStart(2, '0')}A</span>
                      <span className="text-k-sand">{f.runtime ? timecode(f.runtime * 60).slice(3, 8) : ''}</span>
                    </span>
                    <span className="font-extrabold text-[14px] leading-tight line-clamp-2">{f.title}</span>
                    <span className="text-[11.5px] text-k-sand truncate">{f.uploader?.name ?? 'Unknown'}</span>
                    {selected && <VoteCircle className="-left-2.5 -top-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)]" />}
                  </button>
                )
              })}
            </div>
            <Sprockets />
          </section>
        )}

        {/* Vote bar */}
        <div className="flex flex-col gap-2 lg:max-w-md lg:self-end lg:w-full">
          <span className={cn('k-label text-[11px]', pickedFilm ? 'text-k-mustard' : 'text-k-sand')}>
            {locked
              ? `You voted for ${films.find((f) => f.id === locked)?.title ?? 'a film'} this week.`
              : pickedFilm
                ? `Your pick: ${pickedFilm.title}`
                : 'Tap a frame to circle it. You get one vote a week.'}
          </span>
          <button
            type="button"
            onClick={lockVote}
            disabled={!picked || !!locked || busy || !user}
            className={cn(
              'press flex items-center justify-between min-h-[52px] px-4 font-black text-[16px] text-k-ink disabled:cursor-not-allowed',
              locked ? 'bg-k-paper' : 'bg-k-mustard disabled:opacity-60',
            )}
            style={{ fontStretch: '115%' }}
          >
            <span>{locked ? 'VOTE LOCKED ✓' : busy ? 'LOCKING…' : 'LOCK MY VOTE'}</span>
            <span className="k-label text-[11px] font-normal">
              {films.length} films · {totalVotes.toLocaleString()} votes
            </span>
          </button>
          <Link to="/reveal" className="k-label text-[11px] text-k-sand hover:text-k-mustard self-start py-2">
            Watch the latest winner reveal →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Sprockets() {
  return (
    <div
      aria-hidden="true"
      className="h-3.5 border-y border-k-smoke"
      style={{
        backgroundImage: 'repeating-linear-gradient(90deg, #F1E8D3 0 9px, transparent 9px 20px)',
        backgroundSize: '100% 6px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '6px center',
      }}
    />
  )
}
