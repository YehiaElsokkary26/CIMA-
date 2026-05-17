import { Camera, Eye } from 'lucide-react'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const isFilmmaker = role === 'filmmaker'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-widest border',
        isFilmmaker
          ? 'bg-film-badge text-film-badge-foreground border-film-badge/50'
          : 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {isFilmmaker ? <Camera size={11} /> : <Eye size={11} />}
      {role}
    </span>
  )
}
