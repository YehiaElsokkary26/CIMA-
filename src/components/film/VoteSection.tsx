import { Film as FilmIcon, ArrowUp } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useMyVoteThisWeek, useVoteFilm } from '@/hooks/useFilms'
import type { Film } from '@/types'

interface VoteSectionProps {
  film: Film
}

export default function VoteSection({ film }: VoteSectionProps) {
  const user = useAuthStore((s) => s.user)
  const { data: myVote, isLoading: isCheckingVote } = useMyVoteThisWeek()
  const voteFilm = useVoteFilm()

  const votedFilmId = myVote?.filmId ?? null
  const votedThisFilm = votedFilmId === film.id
  const votedOtherFilm = votedFilmId !== null && votedFilmId !== film.id
  const canVote = !votedFilmId && !!user && !isCheckingVote

  const handleVote = () => {
    if (!user || !canVote) return
    voteFilm.mutate(film.id)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
      {/* Info row */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <FilmIcon size={18} className="shrink-0 mt-0.5 text-accent" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Vote Film of the Week
            </p>
            <p className="font-sans text-xs mt-0.5 text-muted-foreground">
              Cast your vote. Top film wins Friday.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 ml-4">
          <span className="font-display text-4xl leading-none text-foreground">
            {(film.votes ?? 0).toLocaleString()}
          </span>
          <p className="font-mono text-[10px] mt-0.5 text-muted-foreground">
            votes this week
          </p>
        </div>
      </div>

      {votedOtherFilm && (
        <p className="font-sans text-xs px-4 pb-2 text-muted-foreground">
          You voted for another film this week.
        </p>
      )}

      <Button
        variant={votedThisFilm ? 'destructive' : 'primary'}
        size="lg"
        pulse={canVote}
        disabled={!canVote || voteFilm.isPending}
        onClick={handleVote}
        className="w-full"
      >
        <ArrowUp size={13} strokeWidth={2.5} />
        {votedThisFilm ? 'Voted ✓ This Week' : 'Vote for This Film'}
      </Button>
    </div>
  )
}
