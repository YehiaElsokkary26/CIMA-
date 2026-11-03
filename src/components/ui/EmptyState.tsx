import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

// An empty slate: stripes, an icon, and a line telling people what to do next.
export default function EmptyState({ icon: Icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-12 px-6 text-center', className)}>
      <div className="w-full max-w-[220px] border-[1.5px] border-foreground">
        <div className="clap h-3" aria-hidden="true" />
        <div className="flex items-center justify-center py-5 bg-card">
          <Icon size={28} strokeWidth={1.75} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="k-display text-[22px] uppercase">{title}</h3>
        {subtitle && <p className="text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
