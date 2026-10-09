import { cn } from '@/lib/utils'

interface CimaLogoProps {
  variant?: 'auto' | 'dark' | 'light' | 'red'
  size?: number
  animate?: boolean
  className?: string
}

/**
 * CimaLogo — brand wordmark as JSX text.
 *
 * Renders "cima" in Bebas Neue with the 'i' always in Cinema Red.
 * variant='auto' inherits color from parent via currentColor.
 * variant='dark'  → white text (for use on dark surfaces).
 * variant='light' → background-colored text (for use on light surfaces).
 * variant='red'   → white text (for use on a Cinema Red background).
 */
export default function CimaLogo({
  variant = 'auto',
  size = 24,
  animate = false,
  className,
}: CimaLogoProps) {
  const letterColor =
    variant === 'dark' || variant === 'red'
      ? 'hsl(var(--primary-foreground))'
      : variant === 'light'
        ? 'hsl(var(--background))'
        : 'currentColor'

  return (
    <span
      className={cn('font-display leading-none tracking-tight select-none shrink-0', className)}
      style={{ fontSize: size }}
      aria-label="cima"
    >
      <span style={{ color: letterColor }}>c</span>
      <span
        className={cn('text-primary', animate && 'animate-logo-flicker inline-block')}
      >
        i
      </span>
      <span style={{ color: letterColor }}>ma</span>
    </span>
  )
}

/**
 * CimaIconMark — circular 'i' mark variant.
 * Used in collapsed sidebar or wherever a compact icon is needed.
 */
export function CimaIconMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0',
        className,
      )}
      style={{
        width: size,
        height: size,
        border: '1.5px solid hsl(var(--primary))',
      }}
      aria-label="cima"
    >
      <span
        className="font-display leading-none text-primary"
        style={{ fontSize: Math.round(size * 0.55) }}
      >
        i
      </span>
    </span>
  )
}
