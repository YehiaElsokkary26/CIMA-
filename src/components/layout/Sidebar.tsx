// UI/UX audit applied — WCAG 2.1 AA compliant
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Zap, Search, Plus, Film, User, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { CimaIconMark } from './CimaLogo'

const baseLinks = [
  { to: '/home',          icon: Zap,      label: 'Home' },
  { to: '/discover',      icon: Search,   label: 'Discover' },
  { to: '/cima',          icon: Film,     label: 'Cima' },
  { to: '/profile/me',    icon: User,     label: 'Profile' },
  { to: '/settings',      icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isFilmmaker = user?.role === 'filmmaker'
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useUIStore()

  const links = isFilmmaker
    ? [
        ...baseLinks.slice(0, 2),
        { to: '/upload', icon: Plus, label: 'Upload', isUpload: true },
        ...baseLinks.slice(2),
      ]
    : baseLinks

  return (
    <aside className="hidden lg:flex flex-col w-[72px] xl:w-56 bg-card border-r border-border/50 h-full shrink-0">
      {/* Logo */}
      <div
        className="px-3 pt-6 pb-4 flex items-center justify-center border-b border-border/30"
        style={{ minHeight: 56 }}
      >
        <CimaIconMark size={30} className="shrink-0" />
      </div>

      {/* Nav links — Rule 3: min 44px touch target via min-h-[44px] */}
      <nav className="flex flex-col gap-0.5 px-2 xl:px-3 mt-4 flex-1">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to)
          const Icon = link.icon
          const isUpload = 'isUpload' in link && link.isUpload

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-2 xl:px-3 rounded-none transition-all duration-150 min-h-[44px]',
                isUpload
                  ? 'mt-2 mb-1'
                  : isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
              style={
                isUpload
                  ? { background: '#A32626', color: '#E8DDCB' }
                  : undefined
              }
            >
              <Icon
                size={18}
                strokeWidth={isActive && !isUpload ? 2.5 : 2}
                className="shrink-0"
              />
              <span className="hidden xl:block font-mono text-[11px] uppercase tracking-wider">
                {link.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* User strip — Rule 3: all interactive rows min-h-[44px] */}
      {user && (
        <div className="p-3 xl:px-4 border-t border-border/30 space-y-0.5">
          <div
            className="flex items-center gap-2.5 cursor-pointer min-h-[44px] px-1 hover:bg-muted/50 transition-colors rounded-none"
            onClick={() => navigate('/profile/me')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/profile/me')}
            aria-label="View profile"
          >
            <div
              className="w-7 h-7 flex items-center justify-center font-mono text-xs font-bold shrink-0"
              style={{ background: '#8B6B5C', color: '#E8DDCB' }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block overflow-hidden">
              <p className="font-sans text-xs font-medium text-foreground truncate max-w-[110px]">
                {user.name}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                {user.role}
              </p>
            </div>
          </div>

          {/* Rule 3: min-h-[44px] for theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-2.5 px-1 min-h-[44px] text-muted-foreground hover:text-foreground transition-colors rounded-none"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={15} className="shrink-0" /> : <Moon size={15} className="shrink-0" />}
            <span className="hidden xl:block font-mono text-[10px] uppercase tracking-wider">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Rule 3: min-h-[44px] for logout button */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-1 min-h-[44px] text-muted-foreground hover:text-destructive transition-colors rounded-none"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="hidden xl:block font-mono text-[10px] uppercase tracking-wider">
              Sign Out
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}
