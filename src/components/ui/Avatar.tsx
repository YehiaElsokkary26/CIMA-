import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-14 h-14 text-[16px]',
  xl: 'w-20 h-20 text-[22px]',
}

const TINTS = ['#C42320', '#1A6A65', '#3B342B', '#B0731A']

function tintFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return TINTS[Math.abs(h) % TINTS.length]
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden shrink-0 border-[1.5px] border-foreground',
        sizes[size],
        className,
      )}
      style={src ? undefined : { background: tintFor(name), color: '#F1E8D3' }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-extrabold" aria-hidden="true">{getInitials(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </div>
  )
}
