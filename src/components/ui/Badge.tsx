// UI/UX audit applied — WCAG 2.1 AA compliant
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'film' | 'cima' | 'default' | 'muted'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-full',
        {
          'bg-film-badge text-film-badge-foreground': variant === 'film',
          'bg-cima-tag/20 text-cima-tag border border-cima-tag/30': variant === 'cima',
          'bg-muted text-muted-foreground': variant === 'default',
          'bg-muted/50 text-muted-foreground': variant === 'muted',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
