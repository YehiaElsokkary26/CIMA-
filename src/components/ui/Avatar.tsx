// UI/UX audit applied — WCAG 2.1 AA compliant
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

export default function Avatar({ src, name, size = 'md', className, style }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border',
        sizes[size],
        className
      )}
      style={style}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-mono font-bold text-secondary-foreground">{getInitials(name)}</span>
      )}
    </div>
  )
}
