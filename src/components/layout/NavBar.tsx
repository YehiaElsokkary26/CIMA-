import { Link } from 'react-router-dom'
import { Bell, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Wordmark } from '@/components/klaket/primitives'
import Avatar from '@/components/ui/Avatar'

// Mobile header: wordmark on the left, theme / notifications / profile on the right.
export default function NavBar() {
  const user = useAuthStore((s) => s.user)
  const { isDarkMode, toggleDarkMode } = useUIStore()

  const iconBtn =
    'w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press hover:bg-foreground/5'

  return (
    <header className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-4 pt-4 pb-3 bg-background safe-area-top">
      <Link to="/home" aria-label="Klaket home">
        <Wordmark size="md" />
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          className={iconBtn}
          aria-label={isDarkMode ? 'Switch to newsprint (light) theme' : 'Switch to screening room (dark) theme'}
        >
          {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
        <Link to="/notifications" className={iconBtn} aria-label="Notifications">
          <Bell size={18} aria-hidden="true" />
        </Link>
        <Link to="/profile/me" aria-label="Your profile" className="press">
          <Avatar name={user?.name ?? '?'} src={user?.avatarUrl ?? user?.avatar} size="md" />
        </Link>
      </div>
    </header>
  )
}
