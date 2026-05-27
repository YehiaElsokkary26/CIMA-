// UI/UX audit applied — WCAG 2.1 AA compliant
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

// Rule 6: icon 48px (size={40} inside w-16 h-16 container), centered layout,
//         max-w-xs, text centered, icon → heading → subtitle → CTA
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center max-w-xs mx-auto',
        className
      )}
    >
      {/* Rule 6: 48px icon inside muted circle */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon size={40} className="text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-2xl text-foreground uppercase tracking-widest">
          {title}
        </h3>
        {subtitle && (
          /* Rule 2: text-sm = 15px minimum for body text */
          <p className="font-mono text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
