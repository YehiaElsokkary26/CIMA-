import { cn } from '@/lib/utils'

interface CimaLogoProps {
  size?: number
  className?: string
  animate?: boolean
}

/* Inline SVG logo — no external asset required */
export default function CimaLogo({ size = 40, className, animate = false }: CimaLogoProps) {
  const radius = Math.round(size * 0.2)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('logo shrink-0', animate && 'animate-logo-flicker', className)}
      style={{ borderRadius: radius }}
      aria-label="Cima"
    >
      {/* Background */}
      <rect width="100" height="100" rx={radius} fill="hsl(310 44% 21%)" />

      {/* Film reel sprockets top */}
      <rect x="8"  y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="20" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="32" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="44" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="56" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="68" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="80" y="6" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />

      {/* Film reel sprockets bottom */}
      <rect x="8"  y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="20" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="32" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="44" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="56" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="68" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />
      <rect x="80" y="84" width="6" height="10" rx="2" fill="hsl(27 86% 65%)" />

      {/* Film strip borders */}
      <rect x="4" y="4" width="92" height="18" rx="3" fill="none" stroke="hsl(27 86% 65% / 0.3)" strokeWidth="1" />
      <rect x="4" y="78" width="92" height="18" rx="3" fill="none" stroke="hsl(27 86% 65% / 0.3)" strokeWidth="1" />

      {/* "C" letterform — bold cinematic */}
      <text
        x="50"
        y="70"
        textAnchor="middle"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="52"
        fontWeight="400"
        fill="hsl(3 43% 82%)"
        letterSpacing="2"
      >
        C
      </text>
    </svg>
  )
}
