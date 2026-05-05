import { NavLink, useLocation } from 'react-router-dom'
import { Zap, Search, Plus, Film, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import CimaLogo from './CimaLogo'

const baseLinks = [
  { to: '/home', icon: Zap, label: 'Home' },
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/cima', icon: Film, label: 'Cima' },
  { to: '/notifications', icon: Film, label: 'Notifications' },
  { to: '/profile/me', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isFilmmaker = user?.role === 'filmmaker'
  const location = useLocation()

  const links = isFilmmaker
    ? [
        ...baseLinks.slice(0, 2),
        { to: '/upload', icon: Plus, label: 'Upload', isUpload: true },
        ...baseLinks.slice(2),
      ]
    : baseLinks

  return (
    <aside className="hidden lg:flex flex-col w-20 xl:w-56 bg-card border-r border-border h-full shrink-0">
      <div className="p-4 xl:px-6 pt-8 flex items-center gap-3">
        <CimaLogo size={36} animate={!!user} />
        <span className="hidden xl:block font-display text-2xl text-foreground tracking-widest">
          CIMA
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-2 xl:px-4 mt-6 flex-1">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to)
          const Icon = link.icon
          const isUpload = 'isUpload' in link && link.isUpload

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                isUpload
                  ? 'bg-primary text-primary-foreground shadow-glow-orange mt-2'
                  : isActive
                    ? 'bg-muted text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden xl:block font-mono text-xs uppercase tracking-wider">
                {link.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-mono text-xs text-secondary-foreground font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden xl:block">
              <p className="font-sans text-xs font-medium text-foreground truncate max-w-[100px]">
                {user.name}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground uppercase">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
