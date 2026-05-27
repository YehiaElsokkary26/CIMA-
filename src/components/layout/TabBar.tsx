import { NavLink, useLocation } from 'react-router-dom'
import { Zap, Search, Plus, Film, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const baseLinks = [
  { to: '/home', icon: Zap, label: 'Home' },
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/cima', icon: Film, label: 'Cima' },
  { to: '/profile/me', icon: User, label: 'Profile' },
]

export default function TabBar() {
  const user = useAuthStore((s) => s.user)
  const isFilmmaker = user?.role === 'filmmaker'
  const location = useLocation()

  const links = isFilmmaker
    ? [
        baseLinks[0],
        baseLinks[1],
        { to: '/upload', icon: Plus, label: 'Upload', isUpload: true },
        baseLinks[2],
        baseLinks[3],
      ]
    : baseLinks

  return (
    <nav
      className="tab-bar fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to)
          const Icon = link.icon
          const isUpload = 'isUpload' in link && link.isUpload

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                isUpload
                  ? 'bg-primary shadow-glow-orange -translate-y-2 px-4 py-2'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
              )}
            >
              <Icon
                size={isUpload ? 22 : 20}
                className={cn(isUpload && 'text-primary-foreground')}
                strokeWidth={isActive && !isUpload ? 2.5 : 2}
              />
              <span
                className={cn(
                  'font-mono text-[10px] uppercase tracking-wider',
                  isUpload ? 'text-primary-foreground' : ''
                )}
              >
                {link.label}
              </span>
              {/* Rule 9: active indicator dot — cinema-red pip below label */}
              {isActive && !isUpload && (
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: '#A32626' }}
                  aria-hidden="true"
                />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
