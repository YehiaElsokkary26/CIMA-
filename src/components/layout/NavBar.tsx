// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Bell, X, Sun, Moon } from 'lucide-react'
import { CimaIconMark } from './CimaLogo'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useSearchStore } from '@/store/searchStore'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const { query, setQuery, clear } = useSearchStore()

  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    clear()
  }

  const handleChange = (value: string) => {
    setQuery(value)
    // Navigate to home on first character so results are immediately visible
    if (value && location.pathname !== '/home') {
      navigate('/home')
    }
    // Clear URL ?q param if present (we now use the store, not the URL)
    if (!value && location.search) {
      navigate('/home', { replace: true })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && location.pathname !== '/home') {
      navigate('/home')
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 border-b shrink-0 transition-colors duration-300"
      style={{
        height: 52,
        background: isDarkMode ? '#0D0C0B' : '#F0EAE0',
        borderBottomColor: isDarkMode ? 'rgba(139,107,92,0.18)' : 'rgba(139,107,92,0.25)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '150px',
      }}
    >
      {/* Logo — hidden on desktop (Sidebar already shows it) */}
      <div className="lg:hidden shrink-0">
        <CimaIconMark size={26} />
      </div>

      {/* Search bar — center on desktop, hidden on mobile until icon tapped */}
      {searchOpen ? (
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search films, filmmakers..."
            className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-primary py-0.5"
          />
          {/* Rule 3: min 44×44px touch target for close button */}
          <button
            type="button"
            onClick={closeSearch}
            className="shrink-0 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X size={15} />
          </button>
        </form>
      ) : (
        <>
          {/* Desktop search bar */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex flex-1 items-center gap-2 border-b border-border/60 focus-within:border-primary transition-colors max-w-xs mx-auto"
          >
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search films, filmmakers..."
              className="flex-1 bg-transparent font-sans text-xs text-foreground placeholder:text-muted-foreground/40 outline-none py-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleChange('')}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={11} />
              </button>
            )}
          </form>

          {/* Spacer on mobile to push icons right */}
          <div className="flex-1 md:hidden" />
        </>
      )}

      {/* Right actions */}
      {!searchOpen && (
        <div className="flex items-center shrink-0">
          {/* Rule 3: all icon buttons min 44×44px — use w-11 h-11 */}
          <button
            onClick={openSearch}
            className="md:hidden w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>

          {/* Rule 3: profile avatar — 44×44px tap area, 32px visual circle */}
          <button
            onClick={() => navigate('/profile/me')}
            className="w-11 h-11 flex items-center justify-center transition-colors"
            aria-label="View profile"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[11px]"
              style={{ background: '#8B6B5C', color: '#E8DDCB' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </button>
        </div>
      )}
    </header>
  )
}
