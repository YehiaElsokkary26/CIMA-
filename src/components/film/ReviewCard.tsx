import { formatTimeAgo } from '@/lib/utils'
import type { Review } from '@/types'
import Avatar from '@/components/ui/Avatar'
import StarRating from '@/components/ui/StarRating'
import { cardColorFor } from '@/lib/cardColors'

interface ReviewCardProps {
  review: Review
  index?: number
}

export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const color = cardColorFor(index)

  return (
    <div
      className="p-4 space-y-3"
      style={{ background: color.bg, color: color.fg, borderRadius: 20 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar
            name={review.user?.name ?? 'Anonymous'}
            src={review.user?.avatar}
            size="sm"
          />
          <div>
            <p className="font-sans text-sm font-medium leading-none">
              {review.user?.name ?? 'Anonymous'}
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ opacity: 0.7 }}>
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      <div className="font-sans text-sm leading-relaxed">
        {review.body}
      </div>
    </div>
  )
}
