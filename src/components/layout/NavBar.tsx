import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, X, Sun, Moon } from 'lucide-react'
import { CimaIconMark } from './CimaLogo'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export default function NavBar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`)
      closeSearch()
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 h-12 border-b border-border/30 shrink-0"
      style={{
        background: '#161413',
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
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, filmmakers..."
            className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-primary py-0.5"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </form>
      ) : (
        <>
          {/* Desktop search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 items-center gap-2 border-b border-border/60 focus-within:border-primary transition-colors max-w-xs mx-auto"
          >
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search films, filmmakers..."
              className="flex-1 bg-transparent font-sans text-xs text-foreground placeholder:text-muted-foreground/40 outline-none py-1"
            />
          </form>

          {/* Spacer on mobile to push icons right */}
          <div className="flex-1 md:hidden" />
        </>
      )}

      {/* Right actions */}
      {!searchOpen && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Search icon — mobile only */}
          <button
            onClick={openSearch}
            className="md:hidden icon-lift w-8 h-8 flex items-center justify-center rounded-none text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search size={16} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="icon-lift w-8 h-8 flex items-center justify-center rounded-none text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="icon-lift w-8 h-8 flex items-center justify-center rounded-none text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={16} />
          </button>

          {/* Profile avatar */}
          <button
            onClick={() => navigate('/profile/me')}
            className="icon-lift w-7 h-7 flex items-center justify-center font-mono font-bold text-[11px] transition-all"
            style={{ background: '#8B6B5C', color: '#E8DDCB' }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </button>
        </div>
      )}
    </header>
  )
}
