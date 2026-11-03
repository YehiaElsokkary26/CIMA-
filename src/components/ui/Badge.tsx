import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  /** film: ink tag · crew: teal tag · live: mustard · default: outline */
  variant?: 'film' | 'crew' | 'live' | 'default'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 k-label text-[9.5px] font-semibold px-1.5 py-[2px]',
        variant === 'film' && 'bg-k-ink text-k-paper',
        variant === 'crew' && 'bg-k-teal text-k-paper',
        variant === 'live' && 'bg-k-mustard text-k-ink',
        variant === 'default' && 'border border-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
