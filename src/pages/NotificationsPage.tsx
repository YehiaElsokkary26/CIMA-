import { motion } from 'framer-motion'
import { Bell, Star, Film, UserPlus, MessageSquare } from 'lucide-react'
import RecordLED from '@/components/layout/RecordLED'
import EmptyState from '@/components/ui/EmptyState'
import { formatTimeAgo } from '@/lib/utils'
import type { Notification } from '@/types'

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'me', type: 'review', message: 'Hana Bakkali left a review on STATIC', fromUser: { id: 'u10', name: 'Hana Bakkali', email: '', role: 'viewer', createdAt: '' }, filmId: '4', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'n2', userId: 'me', type: 'cima_request', message: 'Yasmine Korbi wants to join your Cima', fromUser: { id: 'u20', name: 'Yasmine Korbi', email: '', role: 'filmmaker', createdAt: '' }, read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', userId: 'me', type: 'rating', message: 'Mehdi Laroui rated STATIC 5 stars', fromUser: { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker', createdAt: '' }, filmId: '4', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n4', userId: 'me', type: 'cima_accepted', message: 'Omar Hadid accepted your Cima request', fromUser: { id: 'u4', name: 'Omar Hadid', email: '', role: 'filmmaker', createdAt: '' }, read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n5', userId: 'me', type: 'follower', message: 'Sofia Tazi is now following your work', fromUser: { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker', createdAt: '' }, read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
]

const notifIcon: Record<string, React.ElementType> = {
  review: MessageSquare,
  cima_request: Film,
  cima_accepted: Film,
  rating: Star,
  follower: UserPlus,
}

export default function NotificationsPage() {
  const notifications = MOCK_NOTIFICATIONS

  return (
    <div className="min-h-full px-4 py-6">
      <h1 className="font-display text-4xl uppercase tracking-widest text-foreground mb-6">
        Notifications
      </h1>

      {notifications.length === 0 ? (
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
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                  !notif.read
                    ? 'bg-card border-border'
                    : 'bg-card/50 border-border/50'
                }`}
              >
                <div className="relative mt-0.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
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
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
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
