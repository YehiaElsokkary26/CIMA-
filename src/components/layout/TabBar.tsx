// UI/UX audit applied — WCAG 2.1 AA compliant
import { NavLink, useLocation } from 'react-router-dom'
import { House, Search, Plus, Film, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const baseLinks = [
  { to: '/home', icon: House, label: 'Home' },
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
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        background: 'hsl(var(--card))',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
      }}
    >
      <div className="flex items-center justify-around px-4 py-3">
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
                className="flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105"
                style={{
                  width: 52,
                  height: 52,
                  background: '#A32626',
                  transform: 'translateY(-8px)',
                  boxShadow: '0 4px 16px rgba(163,38,38,0.45)',
                }}
              >
                <Icon size={24} color="#E8DDCB" strokeWidth={2.5} />
              </NavLink>
            )
          }

          return (
            <NavLink
              key={link.to}
              to={link.to}
              aria-label={link.label}
              className="flex flex-col items-center gap-1 transition-all duration-150"
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-150',
                  isActive ? 'px-4 py-2' : 'w-10 h-10',
                )}
                style={isActive ? { background: '#B28A52' } : undefined}
              >
                <Icon
                  size={22}
                  color={isActive ? '#161413' : '#6B6560'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>
              {isActive && (
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#B28A52' }}>
                  {link.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
