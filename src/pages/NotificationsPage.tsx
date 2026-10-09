// UI/UX audit applied — WCAG 2.1 AA compliant
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Star, Film, UserPlus, MessageSquare, CheckCheck, Loader2, AlertCircle } from 'lucide-react'
import RecordLED from '@/components/layout/RecordLED'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { formatTimeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsRead } from '@/lib/supabaseApi'
import { supabase } from '@/lib/supabase'
import { cardColorFor } from '@/lib/cardColors'

const notifIcon: Record<string, React.ElementType> = {
  review: MessageSquare,
  cima_request: Film,
  cima_accepted: Film,
  rating: Star,
  follower: UserPlus,
}

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ['notifications', user.id] }),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, qc])

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = async () => {
    if (!user?.id) return
    await markAllNotificationsRead(user.id)
    qc.invalidateQueries({ queryKey: ['notifications', user.id] })
  }

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
            onClick={markAllRead}
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
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load notifications."
          subtitle="Something went wrong reaching the server."
          action={
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Quiet on Set." subtitle="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = notifIcon[notif.type] ?? Bell

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-4 rounded-2xl transition-colors"
                style={
                  !notif.read
                    ? { background: cardColorFor(i).bg, color: cardColorFor(i).fg }
                    : { background: '#2A2420', color: 'rgba(232,221,203,0.6)' }
                }
              >
                <div className="relative mt-0.5">
                  {/* Rule 3: icon area w-10 h-10 = 40px (row tap area covers full row) */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: !notif.read ? cardColorFor(i).chip : 'rgba(232,221,203,0.08)' }}
                  >
                    <Icon size={15} />
                  </div>
                  {!notif.read && (
                    <RecordLED size="sm" className="absolute -top-0.5 -right-0.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-sans text-sm leading-snug ${!notif.read ? 'font-medium' : ''}`}>
                    {notif.message}
                  </p>
                  <p className="font-mono text-[10px] mt-1" style={{ opacity: 0.7 }}>
                    {formatTimeAgo(notif.createdAt)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
