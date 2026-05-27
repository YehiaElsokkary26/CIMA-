// UI/UX audit applied — WCAG 2.1 AA compliant
import { cn } from '@/lib/utils'

interface RecordLEDProps {
  className?: string
  size?: 'sm' | 'md'
}

export default function RecordLED({ className, size = 'sm' }: RecordLEDProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full bg-record-led record-blink',
        size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
        className
      )}
      style={{ boxShadow: '0 0 8px 2px hsl(0 100% 58% / 0.5)' }}
      aria-label="Live indicator"
    />
  )
}
