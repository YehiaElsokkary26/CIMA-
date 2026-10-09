import { formatTimeAgo } from '@/lib/utils'
import type { Review } from '@/types'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'

interface ReviewCardProps {
  review: Review
  index?: number
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-4 space-y-3 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={review.user?.name ?? 'Anonymous'}
            src={review.user?.avatarUrl}
            size="sm"
          />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              {review.user?.name ?? 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      <div className="text-sm text-foreground/80 leading-relaxed">
        {review.body}
      </div>
    </div>
  )
}
