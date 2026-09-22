// UI/UX audit applied — WCAG 2.1 AA compliant
import { motion } from 'framer-motion'
import { Bell, Star, Film, UserPlus, MessageSquare, CheckCheck } from 'lucide-react'
import RecordLED from '@/components/layout/RecordLED'
import EmptyState from '@/components/ui/EmptyState'
import LoadingDots from '@/components/ui/LoadingDots'
import { formatTimeAgo } from '@/lib/utils'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import type { Notification } from '@/types'

const notifIcon: Record<string, React.ElementType> = {
  review: MessageSquare,
  cima_request: Film,
  cima_accepted: Film,
  rating: Star,
  follower: UserPlus,
}

export default function NotificationsPage() {
  const { data: notifPage, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications: Notification[] = notifPage?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-full px-4 py-6">
      {/* Rule 9: header row with mark-all-read action */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl uppercase tracking-widest text-foreground">
          Notifications
        </h1>
        {unreadCount > 0 && (
          /* Rule 3: min 44px tap area via py-2.5 */
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-2.5 px-2"
            style={{ minHeight: 44 }}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingDots /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Quiet on Set." subtitle="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = notifIcon[notif.type] ?? Bell

            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => !notif.read && markRead.mutate(notif.id)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                  !notif.read
                    ? 'bg-card border-border'
                    : 'bg-card/50 border-border/50'
                }`}
              >
                <div className="relative mt-0.5">
                  {/* Rule 3: icon area w-10 h-10 = 40px (row tap area covers full row) */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.type === 'cima_request' || notif.type === 'cima_accepted'
                      ? 'bg-cima-tag/20'
                      : notif.type === 'rating'
                        ? 'bg-primary/20'
                        : 'bg-muted'
                  }`}>
                    <Icon size={15} className={
                      notif.type === 'cima_request' || notif.type === 'cima_accepted'
                        ? 'text-cima-tag'
                        : notif.type === 'rating'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                    } />
                  </div>
                  {!notif.read && (
                    <RecordLED size="sm" className="absolute -top-0.5 -right-0.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-sans text-sm leading-snug ${!notif.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {notif.message}
                  </p>
                  {/* Rule 1: /60 opacity drops below 4.5:1 — use full muted-foreground */}
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    {formatTimeAgo(notif.createdAt)}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
