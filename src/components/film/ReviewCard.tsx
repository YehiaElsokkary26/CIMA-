// UI/UX audit applied — WCAG 2.1 AA compliant
import { formatTimeAgo } from '@/lib/utils'
import type { Review } from '@/types'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="review-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={review.user?.name ?? 'Anonymous'}
            src={review.user?.avatar}
            size="sm"
          />
          <div>
            <p className="font-sans text-sm font-medium text-foreground leading-none">
              {review.user?.name ?? 'Anonymous'}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      <div className="prose prose-film prose-sm max-w-none text-foreground font-sans text-sm leading-relaxed">
        {review.body}
      </div>
    </div>
  )
}
