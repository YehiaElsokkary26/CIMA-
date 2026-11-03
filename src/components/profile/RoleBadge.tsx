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
        'inline-flex items-center gap-1.5 px-2 py-[3px] k-label text-[10px] font-semibold',
        isFilmmaker ? 'bg-k-red text-k-paper' : 'border-[1.5px] border-foreground',
        className,
      )}
    >
      {isFilmmaker ? <Camera size={11} aria-hidden="true" /> : <Eye size={11} aria-hidden="true" />}
      {isFilmmaker ? 'Filmmaker' : 'Viewer'}
    </span>
  )
}
