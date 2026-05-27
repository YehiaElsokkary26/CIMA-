import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, Clock, Calendar, ChevronDown, Send } from 'lucide-react'
import { useFilm, useFilmReviews, useAddReview } from '@/hooks/useFilms'
import { useRating } from '@/hooks/useRating'
import { useSendCimaRequest } from '@/hooks/useCima'
import ReviewCard from '@/components/film/ReviewCard'
import VoteSection from '@/components/film/VoteSection'
import StarRating from '@/components/ui/StarRating'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import CimaButton from '@/components/cima/CimaButton'
import LoadingDots from '@/components/ui/LoadingDots'
import EmptyState from '@/components/ui/EmptyState'
import { Film, MessageSquare } from 'lucide-react'
import { formatRuntime, formatTimeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const MOCK_FILM = {
  id: '4', title: 'STATIC', description: 'A radio technician picks up a signal from 1986. What begins as a technical glitch spirals into a haunting encounter with a voice that knows too much. Shot entirely on location in a decommissioned broadcasting tower in rural Morocco, STATIC is a lo-fi meditation on memory, loss, and the frequencies we leave behind.', genre: ['Sci-Fi', 'Experimental'], runtime: 31, year: 2023, rating: 4.8, ratingCount: 67, thumbnailUrl: 'https://images.unsplash.com/photo-1585676623595-e7cb4792a3e0?w=900&q=80', uploaderId: 'u4',
  uploader: { id: 'u4', name: 'Omar Hadid', role: 'filmmaker' as const, email: '', bio: 'Documentary and experimental filmmaker based in Casablanca. Obsessed with sound design and found footage.', school: 'ESAV Marrakech', createdAt: '' },
  createdAt: '2023-12-20',
}

const MOCK_REVIEWS = [
  { id: 'r1', filmId: '4', userId: 'u10', rating: 5, body: 'One of the most atmospheric short films I\'ve seen this year. The sound design is extraordinary — every crackle and hiss feels intentional. The ending left me genuinely unsettled.', createdAt: '2024-01-15', user: { id: 'u10', name: 'Hana Bakkali', email: '', role: 'viewer' as const, createdAt: '' } },
  { id: 'r2', filmId: '4', userId: 'u11', rating: 4, body: 'The visual language is confident and assured. Hadid knows exactly when to hold a shot. My only critique is the pacing in the middle act drags slightly — but the final ten minutes are worth every second.', createdAt: '2024-02-03', user: { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker' as const, createdAt: '' } },
  { id: 'r3', filmId: '4', userId: 'u12', rating: 5, body: 'Shot on 16mm if I\'m not mistaken. The grain alone makes this worth watching. A genuinely original voice emerging from North African cinema.', createdAt: '2024-03-08', user: { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker' as const, createdAt: '' } },
]

export default function FilmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewBody, setReviewBody] = useState('')
  const [cimaStatus, setCimaStatus] = useState<'none' | 'pending' | 'member'>('none')

  const { data: film } = useFilm(id ?? '')
  const { data: reviews } = useFilmReviews(id ?? '')
  const addReview = useAddReview(id ?? '')
  const sendCimaRequest = useSendCimaRequest()

  const displayFilm = film ?? MOCK_FILM
  const displayReviews = reviews ?? MOCK_REVIEWS

  const rating = useRating(id ?? '', displayFilm.rating)

  const handleAddToRating = (val: number) => {
    rating.setHovered(null)
    rating.submit(val)
  }

  const handleCima = () => {
    if (cimaStatus === 'none' && displayFilm.uploader?.id) {
      sendCimaRequest.mutate(displayFilm.uploader.id)
      setCimaStatus('pending')
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewBody.trim()) return
    await addReview.mutateAsync({ rating: rating.selected || 3, body: reviewBody })
    setReviewBody('')
    setShowReviewForm(false)
  }

  return (
    <div className="min-h-full">
      {/* Poster Header */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative"
      >
        <div className="relative aspect-video w-full overflow-hidden">
          {displayFilm.thumbnailUrl ? (
            <img
              src={displayFilm.thumbnailUrl}
              alt={displayFilm.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Back button — Rule 3: min 44×44px touch target (w-11 h-11 = 44px) */}
          <Link
            to="/home"
            className="absolute top-4 left-4 w-11 h-11 bg-background/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-border"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </Link>

          {/* Play button */}
          <button className="absolute inset-0 flex items-center justify-center group">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow-orange group-hover:scale-110 transition-transform duration-200">
              <Play size={22} fill="currentColor" className="text-primary-foreground ml-1" />
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="px-4 pt-4 space-y-5"
      >
        {/* Title + genres */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {displayFilm.genre?.map((g) => <Badge key={g} variant="film">{g}</Badge>)}
          </div>
          <h1 className="font-display text-4xl uppercase tracking-widest text-foreground leading-none">
            {displayFilm.title}
          </h1>

          {/* Metadata strip */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {displayFilm.runtime && (
              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> {formatRuntime(displayFilm.runtime)}
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={11} /> {displayFilm.year}
            </span>
            {displayFilm.ratingCount && (
              <span className="font-mono text-xs text-muted-foreground">
                {displayFilm.ratingCount} ratings
              </span>
            )}
          </div>
        </div>

        {/* Aggregate rating */}
        <div className="flex items-center gap-3">
          <span className="font-display text-5xl text-primary">
            {displayFilm.rating?.toFixed(1)}
          </span>
          <div>
            <StarRating value={Math.round(displayFilm.rating ?? 0)} size="md" />
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {displayFilm.ratingCount} ratings
            </p>
          </div>
        </div>

        {/* Vote section */}
        <VoteSection film={displayFilm as import('@/types').Film} />

        {/* Filmmaker chip */}
        {displayFilm.uploader && (
          <Link
            to={`/profile/${displayFilm.uploader.id}`}
            className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border interactive-lift"
          >
            <Avatar name={displayFilm.uploader.name} size="sm" />
            <div>
              <p className="font-sans text-sm font-medium text-foreground">{displayFilm.uploader.name}</p>
              {displayFilm.uploader.school && (
                <p className="font-mono text-xs text-muted-foreground">{displayFilm.uploader.school}</p>
              )}
            </div>
            <ChevronDown size={14} className="text-muted-foreground ml-auto -rotate-90" />
          </Link>
        )}

        {/* Description */}
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">{displayFilm.description}</p>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {user?.id !== displayFilm.uploaderId && (
            <CimaButton status={cimaStatus} onClick={handleCima} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="flex items-center gap-2"
          >
            <MessageSquare size={14} />
            Write a Review
          </Button>
        </div>

        {/* Rate this film */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Rate this film</p>
          <StarRating
            value={rating.displayRating}
            interactive
            onHover={(v) => rating.setHovered(v)}
            onSelect={handleAddToRating}
            size="lg"
          />
        </div>

        {/* Review form */}
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-card rounded-2xl border border-border p-4 space-y-3"
          >
            {/* Rule 7: label explicitly associated with textarea for accessibility */}
            <label htmlFor="review-body" className="font-mono text-xs text-muted-foreground uppercase tracking-wider block">
              Your Review
            </label>
            <textarea
              id="review-body"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="What did you think about this film?"
              rows={4}
              className="w-full bg-input text-foreground border border-border rounded-xl p-3 text-sm font-sans resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmitReview} disabled={addReview.isPending}>
                <Send size={13} />
                Publish
              </Button>
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        <div className="space-y-3 pb-8">
          <h2 className="font-display text-2xl uppercase tracking-widest text-foreground">
            Reviews
          </h2>
          {displayReviews.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No Reviews Yet" subtitle="Be the first critic on set." />
          ) : (
            displayReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>
      </motion.div>
    </div>
  )
}
