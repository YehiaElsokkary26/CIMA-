import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  max?: number
  interactive?: boolean
  onHover?: (val: number | null) => void
  onSelect?: (val: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const starSizes = { sm: 12, md: 16, lg: 22 }

export default function StarRating({
  value,
  max = 5,
  interactive = false,
  onHover,
  onSelect,
  size = 'md',
  className,
}: StarRatingProps) {
  const px = starSizes[size]

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= value
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(i + 1)}
            onMouseEnter={() => onHover?.(i + 1)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
              'transition-transform duration-75',
              interactive && 'cursor-pointer hover:scale-110 active:scale-95',
              !interactive && 'pointer-events-none'
            )}
          >
            <Star
              size={px}
              className={cn(filled ? 'text-rating-star' : 'text-muted-foreground/40')}
              fill={filled ? 'currentColor' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}
