// UI/UX audit applied — WCAG 2.1 AA compliant
import { NavLink, useLocation } from 'react-router-dom'
import { House, Compass, Plus, Film, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const baseLinks = [
  { to: '/home', icon: House, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border tab-bar z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to)
          const Icon = link.icon
          const isUpload = 'isUpload' in link && link.isUpload

          if (isUpload) {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                aria-label={link.label}
                className="flex items-center justify-center rounded-2xl bg-primary p-3 -mt-5 shadow-lg shadow-primary/30 transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                <Icon size={22} className="text-primary-foreground" strokeWidth={2.5} />
              </NavLink>
            )
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              aria-label={link.label}
              className={cn(
                'flex flex-col items-center gap-0.5 transition-all duration-150 active:scale-90 active:opacity-70',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="text-[10px] font-medium">{link.label}</span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
