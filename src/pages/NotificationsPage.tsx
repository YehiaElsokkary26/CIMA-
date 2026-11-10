import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Bell, MessageSquare, Star, UserPlus, Users } from 'lucide-react'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications'
import { useFeaturedFilm } from '@/hooks/useFilms'
import { weekNumber } from '@/lib/klaket'
import { formatTimeAgo } from '@/lib/utils'
import type { Notification } from '@/types'
import { Clap } from '@/components/klaket/primitives'
import { FilmStill } from '@/components/klaket/FilmCards'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { NotificationSkeleton } from '@/components/ui/Skeleton'

const KIND: Record<Notification['type'], { icon: React.ElementType; bg: string; fg: string; href: (n: Notification) => string }> = {
  review:        { icon: MessageSquare, bg: '#15120E', fg: '#F1B51C', href: (n) => (n.filmId ? `/film/${n.filmId}` : '/home') },
  rating:        { icon: Star,          bg: '#F1B51C', fg: '#15120E', href: (n) => (n.filmId ? `/film/${n.filmId}` : '/home') },
  cima_request:  { icon: Users,         bg: '#C42320', fg: '#F1E8D3', href: () => '/crew' },
  cima_accepted: { icon: Users,         bg: '#1A6A65', fg: '#F1E8D3', href: () => '/crew' },
  follower:      { icon: UserPlus,      bg: '#F7F0E0', fg: '#15120E', href: (n) => (n.fromUser ? `/profile/${n.fromUser.id}` : '/profile/me') },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { data: winner } = useFeaturedFilm()
  // Live updates come from useLiveNotifications in the app shell.
  const { data, isPending: isLoading, isError, refetch } = useNotifications()
  const markAll = useMarkAllRead()
  const markRead = useMarkRead()

  const items: Notification[] = data ?? []
  const unread = items.filter((n) => !n.read).length

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 pt-4 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
            aria-label="Back"
            className="w-11 h-11 shrink-0 flex items-center justify-center border-[1.5px] border-foreground press"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <h1 className="k-display text-[22px] sm:text-[28px] flex-1">NOTIFICATIONS</h1>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="k-label text-[10px] font-semibold min-h-[44px] px-2.5 border-[1.5px] border-foreground hover:bg-foreground/5"
            >
              Mark all read
            </button>
          )}
        </header>

        {winner && (
          <Link to="/reveal" className="press flex flex-col border-[1.5px] border-foreground bg-k-red text-k-paper">
            <Clap variant="live" className="h-2.5" />
            <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 p-2.5">
              <FilmStill film={winner} className="h-[84px] border-[1.5px] border-k-ink" />
              <div className="flex flex-col justify-center gap-0.5 min-w-0">
                <span className="k-label text-[10px] text-k-mustard font-semibold">★ Week {weekNumber()} · Film of the week</span>
                <b className="text-[17px] leading-tight">The envelope is ready. Watch the reveal.</b>
                <span className="k-label text-[10px]">Tap to open →</span>
              </div>
            </div>
          </Link>
        )}

        <section aria-label="All notifications" className="flex flex-col">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <NotificationSkeleton key={i} />)
          ) : isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn’t load notifications"
              subtitle="Something went wrong reaching the server."
              action={<Button variant="solid" size="sm" onClick={() => refetch()}>Retry</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState icon={Bell} title="Quiet on set" subtitle="Notes on your films, call sheets and votes will show up here." />
          ) : (
            <ul>
              {items.map((n) => {
                const k = KIND[n.type] ?? KIND.review
                const Icon = k.icon
                return (
                  <li key={n.id}>
                    <Link to={k.href(n)} onClick={() => !n.read && markRead.mutate(n.id)} className="grid grid-cols-[40px_minmax(0,1fr)_10px] gap-3 items-start py-3 border-b border-rule hover:bg-foreground/5">
                      <span className="w-10 h-10 flex items-center justify-center border-[1.5px] border-foreground" style={{ background: k.bg, color: k.fg }}>
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className={n.read ? 'text-[14.5px] text-muted-foreground' : 'text-[14.5px] font-semibold'}>{n.message}</span>
                        <span className="k-label text-[9.5px] text-muted-foreground">{formatTimeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read ? <span className="w-2.5 h-2.5 rounded-full bg-hot mt-1.5" aria-label="Unread" /> : <span />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
