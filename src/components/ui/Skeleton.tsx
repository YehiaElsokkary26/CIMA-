import { cn } from '@/lib/utils'

/** Generic shimmer block */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Matches a notification row */
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-rule" aria-hidden="true">
      <div className="skeleton w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-2.5 w-24" />
      </div>
    </div>
  )
}

/** Matches a call sheet card */
export function CallSheetSkeleton() {
  return (
    <div className="border-[1.5px] border-rule" aria-hidden="true">
      <div className="skeleton h-9" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}
