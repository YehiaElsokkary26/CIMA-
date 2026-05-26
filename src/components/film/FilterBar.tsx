import { cn } from '@/lib/utils'

const GENRES = ['All', 'Drama', 'Documentary', 'Experimental', 'Horror', 'Sci-Fi', 'Comedy', 'Short']
export type SortOption = 'Latest' | 'Top Rated' | 'Most Discussed'

interface FilterBarProps {
  activeGenre: string
  onGenreChange: (genre: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export default function FilterBar({
  activeGenre,
  onGenreChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-0 px-4 py-2 border-b border-border/40">
      {/* Scrollable genre chips */}
      <div className="flex-1 scroll-x flex items-center gap-1.5 pb-0.5">
        {GENRES.map((genre) => {
          const active = genre === activeGenre
          return (
            <button
              key={genre}
              onClick={() => onGenreChange(genre)}
              className={cn(
                'shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1 rounded-none transition-all duration-150',
                active
                  ? 'text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
              )}
              style={active ? { background: '#A32626' } : undefined}
            >
              {genre}
            </button>
          )
        })}
      </div>

      {/* Sort — desktop only */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0 ml-3 pl-3 border-l border-border/40">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Sort
        </span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={cn(
              'appearance-none bg-transparent font-mono text-[10px] uppercase tracking-wider',
              'text-foreground cursor-pointer pr-4 py-0.5 outline-none',
              'border-b border-primary rounded-none'
            )}
          >
            <option value="Latest">Latest</option>
            <option value="Top Rated">Top Rated</option>
            <option value="Most Discussed">Most Discussed</option>
          </select>
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[9px]"
            style={{ color: '#A32626' }}
          >
            ▾
          </span>
        </div>
      </div>
    </div>
  )
}
