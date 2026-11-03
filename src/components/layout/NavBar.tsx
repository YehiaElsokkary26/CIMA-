import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useSearchStore } from '@/store/searchStore'
import { Wordmark } from '@/components/klaket/primitives'
import Avatar from '@/components/ui/Avatar'
import SearchField from './SearchField'

// Mobile header: wordmark, then search / theme / notifications / profile.
// Search opens as a full-width row under the wordmark.
export default function NavBar() {
  const user = useAuthStore((s) => s.user)
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const query = useSearchStore((s) => s.query)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const showSearch = open || !!query

  const iconBtn =
    'w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press hover:bg-foreground/5'

  return (
    <header className="lg:hidden shrink-0 flex flex-col gap-3 px-4 pt-4 pb-3 bg-background safe-area-top">
      <div className="flex items-center justify-between gap-2">
        <Link to="/home" aria-label="Klaket home" className="min-w-0 shrink">
          <Wordmark size="sm" arClassName="text-hot hidden min-[390px]:inline" />
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className={iconBtn}
            aria-label="Search films"
            aria-expanded={showSearch}
          >
            <Search size={18} aria-hidden="true" />
          </button>
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
            <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} size="md" />
          </Link>
        </div>
      </div>
      {showSearch && <SearchField ref={inputRef} id="mobile-search" onClose={() => setOpen(false)} />}
    </header>
  )
}
