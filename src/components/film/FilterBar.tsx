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
    <div className="flex items-center gap-0 px-4 py-2.5 border-b border-border/30">
      {/* Scrollable genre pill chips */}
      <div className="flex-1 scroll-x flex items-center gap-2 pb-0.5">
        {GENRES.map((genre) => {
          const active = genre === activeGenre
          return (
            <button
              key={genre}
              onClick={() => onGenreChange(genre)}
              className={cn(
                'shrink-0 text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-95',
                active
                  ? 'bg-primary text-primary-foreground font-semibold hover:brightness-110'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:text-foreground',
              )}
            >
              {genre}
            </button>
          )
        })}
      </div>

      {/* Sort — visible at every breakpoint; label text hides on very narrow screens to save room */}
      <div className="flex items-center gap-1.5 shrink-0 ml-3 pl-3 border-l border-border/40">
        <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Sort
        </span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={cn(
              'appearance-none bg-transparent font-mono text-[10px] uppercase tracking-wider',
              'text-foreground cursor-pointer pr-4 py-0.5 outline-none max-w-[84px] sm:max-w-none',
              'border-b border-primary rounded-none transition-opacity hover:opacity-80 active:opacity-60'
            )}
          >
            <option value="Latest">Latest</option>
            <option value="Top Rated">Top Rated</option>
            <option value="Most Discussed">Most Discussed</option>
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-primary text-[9px]">
            ▾
          </span>
        </div>
      </div>
    </div>
  )
}
