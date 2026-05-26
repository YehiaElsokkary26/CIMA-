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
 * Renders "cima" in Special Elite with the 'i' always in Cinema Red (#A32626).
 * variant='auto' inherits color from parent via currentColor.
 * variant='dark'  → Paper Cream text (for use on dark/ink-black surfaces).
 * variant='light' → Ink Black text (for use on cream/light surfaces).
 * variant='red'   → Paper Cream text (for use on Cinema Red / Burgundy bg).
 */
export default function CimaLogo({
  variant = 'auto',
  size = 24,
  animate = false,
  className,
}: CimaLogoProps) {
  const letterColor =
    variant === 'dark' || variant === 'red'
      ? '#E8DDCB'
      : variant === 'light'
        ? '#161413'
        : 'currentColor'

  return (
    <span
      className={cn('font-display leading-none tracking-tight select-none shrink-0', className)}
      style={{ fontSize: size }}
      aria-label="cima"
    >
      <span style={{ color: letterColor }}>c</span>
      <span
        style={{ color: '#A32626' }}
        className={cn(animate && 'animate-logo-flicker inline-block')}
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
        border: '1.5px solid #A32626',
      }}
      aria-label="cima"
    >
      <span
        className="font-display leading-none"
        style={{ fontSize: Math.round(size * 0.55), color: '#A32626' }}
      >
        i
      </span>
    </span>
  )
}
