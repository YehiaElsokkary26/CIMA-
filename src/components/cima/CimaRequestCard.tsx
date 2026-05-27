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
      className="bg-card rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user?.name ?? '?'} src={user?.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-sm text-foreground">{user?.name ?? 'Unknown'}</p>
          {user?.school && (
            <p className="font-mono text-xs text-muted-foreground">{user.school}</p>
          )}
          {user?.bio && (
            <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
          )}
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            {formatTimeAgo(request.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAccept(request.id)}
          disabled={isPending}
          className="flex-1"
        >
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDecline(request.id)}
          disabled={isPending}
          className="flex-1 border border-border"
        >
          Decline
        </Button>
      </div>
    </motion.div>
  )
}
