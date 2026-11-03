import { forwardRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/store/searchStore'

// Global film search. Typing jumps to Home, where results replace the feed.
const SearchField = forwardRef<HTMLInputElement, { className?: string; id?: string; onClose?: () => void }>(
  ({ className, id = 'global-search', onClose }, ref) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { query, setQuery } = useSearchStore()

    const change = (value: string) => {
      setQuery(value)
      if (value && location.pathname !== '/home') navigate('/home')
    }

    return (
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim() && location.pathname !== '/home') navigate('/home')
        }}
        className={cn('flex items-center gap-2 border-[1.5px] border-foreground bg-field px-2.5 min-h-[44px]', className)}
      >
        <label htmlFor={id} className="sr-only">Search films</label>
        <Search size={16} aria-hidden="true" className="shrink-0" />
        <input
          ref={ref}
          id={id}
          type="search"
          value={query}
          onChange={(e) => change(e.target.value)}
          placeholder="Search films, scenes, filmmakers"
          className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-muted-foreground"
        />
        {(query || onClose) && (
          <button
            type="button"
            onClick={() => {
              change('')
              onClose?.()
            }}
            aria-label={onClose ? 'Close search' : 'Clear search'}
            className="w-8 h-8 -me-1 flex items-center justify-center hover:text-hot shrink-0"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </form>
    )
  },
)

SearchField.displayName = 'SearchField'
export default SearchField
