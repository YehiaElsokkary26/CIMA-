// UI/UX audit applied — WCAG 2.1 AA compliant
import { cn } from '@/lib/utils'

// Rule 5: skeleton screens that match the exact layout of loaded content
// Rule 5: skeleton color driven by the --muted token (see .skeleton in index.css)
// Rule 13: no layout shift when content loads — skeletons must match real card dimensions

interface SkeletonProps {
  className?: string
}

/** Generic shimmer block */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />
}

/** Matches FilmCard layout (poster + title strip) */
export function FilmCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-card border border-border"
      aria-hidden="true"
    >
      {/* Poster area — 2:3 aspect ratio matches default film card */}
      <div className="skeleton w-full" style={{ paddingBottom: '150%' }} />
      {/* Title strip */}
      <div className="p-3 bg-card">
        <div className="skeleton h-4 w-3/4 mb-2" />
        <div className="skeleton h-2.5 w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-2.5 w-16" />
          <div className="skeleton h-4 w-10" />
        </div>
      </div>
    </div>
  )
}

/** Matches filmmaker card in Discover list */
export function FilmmakerCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-4 bg-card border border-border"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-2.5 w-48" />
          <div className="skeleton h-2.5 w-24 mt-1" />
        </div>
      </div>
    </div>
  )
}

/** Matches notification row */
export function NotificationSkeleton() {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl border border-border"
      aria-hidden="true"
    >
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-2.5 w-24" />
      </div>
    </div>
  )
}

/** Matches Film of the Week hero area */
export function HeroSkeleton() {
  return (
    <div
      className="relative overflow-hidden mx-4 my-3 skeleton"
      style={{ height: 'clamp(260px, 38vw, 420px)', borderRadius: 20 }}
      aria-hidden="true"
    />
  )
}

/** Profile page header skeleton */
export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton h-32 w-full" />
      <div className="px-4 -mt-8 mb-4">
        <div className="skeleton w-20 h-20 rounded-full border-4 border-background" />
        <div className="mt-4 space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-3 w-64" />
        </div>
      </div>
    </div>
  )
}
