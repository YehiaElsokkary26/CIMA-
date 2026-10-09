// UI/UX audit applied — WCAG 2.1 AA compliant
import { motion } from 'framer-motion'
import type { CimaRequest } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatTimeAgo } from '@/lib/utils'

interface CimaRequestCardProps {
  request: CimaRequest
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  isPending?: boolean
}

export default function CimaRequestCard({
  request,
  onAccept,
  onDecline,
  isPending,
}: CimaRequestCardProps) {
  const user = request.from

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="rounded-2xl p-4 space-y-3 bg-card border border-border"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user?.name ?? '?'} src={user?.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{user?.name ?? 'Unknown'}</p>
          {user?.school && (
            <p className="text-xs text-muted-foreground">{user.school}</p>
          )}
          {user?.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatTimeAgo(request.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAccept(request.id)}
          disabled={isPending}
          className="flex-1 rounded-lg"
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDecline(request.id)}
          disabled={isPending}
          className="flex-1 rounded-lg"
        >
          Decline
        </Button>
      </div>
    </motion.div>
  )
}
