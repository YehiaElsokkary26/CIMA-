import { Link } from 'react-router-dom'
import type { User } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface CimaMemberChipProps {
  user: User
}

export default function CimaMemberChip({ user }: CimaMemberChipProps) {
  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cima-tag/30 bg-cima-tag/10 text-cima-tag hover:bg-cima-tag/20 transition-colors"
    >
      <Avatar name={user.name} src={user.avatar} size="xs" />
      <span className="font-mono text-xs">{user.name}</span>
    </Link>
  )
}
