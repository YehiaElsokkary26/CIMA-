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

const starSizes = { sm: 12, md: 16, lg: 24 }

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

  if (!interactive) {
    return (
      <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={px}
            className={i + 1 <= value ? 'text-k-mustard' : 'text-rule'}
            fill={i + 1 <= value ? 'currentColor' : 'none'}
            stroke={i + 1 <= value ? '#15120E' : 'currentColor'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)} role="radiogroup" aria-label="Your rating">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= value
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i + 1 === value}
            aria-label={`${i + 1} star${i ? 's' : ''}`}
            onClick={() => onSelect?.(i + 1)}
            onMouseEnter={() => onHover?.(i + 1)}
            onMouseLeave={() => onHover?.(null)}
            className="w-11 h-11 flex items-center justify-center press"
          >
            <Star
              size={px}
              className={filled ? 'text-k-mustard' : 'text-muted-foreground'}
              fill={filled ? 'currentColor' : 'none'}
              stroke={filled ? '#15120E' : 'currentColor'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
