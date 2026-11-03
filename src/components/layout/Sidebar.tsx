import { NavLink, useLocation } from 'react-router-dom'
import { Bell, LogOut, Moon, Settings, Sun, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Wordmark } from '@/components/klaket/primitives'
import Avatar from '@/components/ui/Avatar'
import { mainNav } from './navLinks'

// Desktop navigation: a vertical slate down the left edge.
export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const { logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useUIStore()

  const links = [
    ...mainNav(user?.role === 'filmmaker'),
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile/me', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full border-e-[1.5px] border-foreground bg-background">
      <div className="px-5 pt-6 pb-5 border-b-[1.5px] border-foreground">
        <Wordmark size="md" />
      </div>

      <nav aria-label="Main" className="flex flex-col flex-1 py-3">
        {links.map((link) => {
          const active = location.pathname.startsWith(link.to)
          const Icon = link.icon
          const isUpload = 'isUpload' in link && link.isUpload
          return (
            <NavLink
              key={link.to}
              to={link.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-5 min-h-[46px] k-label text-[11.5px] font-semibold border-y border-transparent',
                isUpload
                  ? 'mx-4 my-2 px-3 bg-k-red text-k-paper hover:brightness-110'
                  : active
                    ? 'bg-solid text-solid-foreground'
                    : 'hover:bg-foreground/5',
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {isUpload ? 'Upload a film' : link.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t-[1.5px] border-foreground p-4 flex flex-col gap-2">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl ?? user.avatar} size="sm" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold truncate">{user.name}</p>
              <p className="k-label text-[9.5px] text-muted-foreground">{user.role}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-2.5 min-h-[40px] k-label text-[10.5px] hover:text-hot"
        >
          {isDarkMode ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          {isDarkMode ? 'Newsprint theme' : 'Screening room theme'}
        </button>
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2.5 min-h-[40px] k-label text-[10.5px] hover:text-hot"
        >
          <LogOut size={15} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
