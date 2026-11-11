import { cn } from '@/lib/utils'

/**
 * Unread count for the bell. "corner" sits on an icon button's top-right;
 * "inline" sits at the end of a sidebar row. Hidden when there is nothing new.
 */
export default function UnreadBadge({ count, variant = 'corner' }: { count: number; variant?: 'corner' | 'inline' }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full bg-k-red text-k-paper text-[11px] font-bold leading-none tabular-nums',
        variant === 'corner' ? 'absolute -top-1.5 -end-1.5 border-[1.5px] border-background' : 'ms-auto',
      )}
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Accessible label for a link that carries the badge. */
export function notificationsLabel(count: number) {
  return count > 0 ? `Notifications, ${count} unread` : 'Notifications'
}
