import { useState, useEffect } from 'react'
import { Film as FilmIcon, ArrowUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getUserVoteThisWeek, setUserVote, getCurrentWeekKey } from '@/lib/votingUtils'
import { getUserVoteFromDB, castVote } from '@/lib/supabaseApi'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { useQueryClient } from '@tanstack/react-query'
import type { Film } from '@/types'

interface VoteSectionProps {
  film: Film
}

export default function VoteSection({ film }: VoteSectionProps) {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [votes, setVotes] = useState(film.votes ?? 0)
  const [votedFilmId, setVotedFilmId] = useState<string | null>(null)
  const [isCheckingVote, setIsCheckingVote] = useState(true)

  useEffect(() => {
    if (!user) { setIsCheckingVote(false); return }
    // Fast path: localStorage
    const localVote = getUserVoteThisWeek(user.id)
    if (localVote !== null) {
      setVotedFilmId(localVote)
      setIsCheckingVote(false)
      return
    }
    // Slow path: Supabase
    const weekKey = getCurrentWeekKey()
    getUserVoteFromDB(user.id, weekKey).then((filmId) => {
      if (filmId) {
        setVotedFilmId(filmId)
        setUserVote(user.id, filmId) // sync to localStorage
      }
      setIsCheckingVote(false)
    })
  }, [user])

  const votedThisFilm = votedFilmId === film.id
  const votedOtherFilm = votedFilmId !== null && votedFilmId !== film.id
  const canVote = !votedFilmId && !!user && !isCheckingVote

  const handleVote = async () => {
    if (!user || !canVote) return
    // Optimistic update
    setVotes((v) => v + 1)
    setVotedFilmId(film.id)
    setUserVote(user.id, film.id)

    try {
      await castVote(film.id, user.id)
      qc.invalidateQueries({ queryKey: ['films'] })
      qc.invalidateQueries({ queryKey: ['film', film.id] })
      toast.success('Your vote is in. Check back Friday. 🎬')
    } catch (err) {
      // Roll back optimistic update
      setVotes((v) => v - 1)
      setVotedFilmId(null)
      try { localStorage.removeItem(`cima_vote_${user.id}_${getCurrentWeekKey()}`) } catch { /* ignore */ }
      toast.error(err instanceof Error ? err.message : 'Vote failed. Try again.')
    }
  }

  return (
    <div
      className="film-card card-grain relative overflow-hidden"
      style={{ background: '#161413', border: '1px solid rgba(139,107,92,0.25)' }}
    >
      {/* Info row */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <FilmIcon size={18} className="shrink-0 mt-0.5 text-accent" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Vote Film of the Week
            </p>
            <p className="font-sans text-xs mt-0.5 text-muted-foreground/90">
              Cast your vote. Top film wins Friday.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 ml-4">
          <span className="font-display text-4xl leading-none text-foreground">
            {votes.toLocaleString()}
          </span>
          <p className="font-mono text-[10px] mt-0.5 text-muted-foreground">
            votes this week
          </p>
        </div>
      </div>

      {votedOtherFilm && (
        <p className="font-mono text-xs px-4 pb-2 text-muted-foreground">
          You voted for another film this week.
        </p>
      )}

      <Button
        variant={votedThisFilm ? 'destructive' : 'primary'}
        size="lg"
        pulse={canVote}
        disabled={!canVote}
        onClick={handleVote}
        className="w-full"
      >
        <ArrowUp size={13} strokeWidth={2.5} />
        {votedThisFilm ? 'Voted ✓ This Week' : 'Vote for This Film'}
      </Button>
    </div>
  )
}
