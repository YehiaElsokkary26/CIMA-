import { useRef } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useFilms, useFeaturedFilm } from '@/hooks/useFilms'
import FilmCard from '@/components/film/FilmCard'
import type { Film } from '@/types'
import FilmOfTheWeek from '@/components/film/FilmOfTheWeek'
import LoadingDots from '@/components/ui/LoadingDots'
import EmptyState from '@/components/ui/EmptyState'
import { Film as FilmIcon } from 'lucide-react'
import CimaLogo from '@/components/layout/CimaLogo'
import { useAuthStore } from '@/store/authStore'

const MOCK_FILMS = [
  {
    id: '1', title: 'SALT AND SHADOW', description: 'A fisherman confronts his past on a foggy Moroccan coast.', genre: ['Drama', 'Short'], runtime: 24, year: 2024, rating: 4.2, ratingCount: 18, thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80', uploaderId: 'u1',
    uploader: { id: 'u1', name: 'Fatima El-Riad', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2024-10-10',
  },
  {
    id: '2', title: 'NEON ELEGY', description: 'A night cab driver witnesses something impossible.', genre: ['Neo-Noir', 'Thriller'], runtime: 18, year: 2024, rating: 4.6, ratingCount: 42, thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80', uploaderId: 'u2',
    uploader: { id: 'u2', name: 'Karim Nassar', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2024-11-01',
  },
  {
    id: '3', title: 'GOLDEN HOUR', description: 'Two strangers meet on the last train out of town.', genre: ['Romance', 'Short'], runtime: 12, year: 2024, rating: 3.9, ratingCount: 11, thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80', uploaderId: 'u3',
    uploader: { id: 'u3', name: 'Sana Younis', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2024-09-15',
  },
  {
    id: '4', title: 'STATIC', description: 'A radio technician picks up a signal from 1986.', genre: ['Sci-Fi', 'Experimental'], runtime: 31, year: 2023, rating: 4.8, ratingCount: 67, thumbnailUrl: 'https://images.unsplash.com/photo-1585676623595-e7cb4792a3e0?w=600&q=80', uploaderId: 'u4',
    uploader: { id: 'u4', name: 'Omar Hadid', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2023-12-20',
  },
  {
    id: '5', title: 'THE WEIGHT OF GRAIN', description: 'A documentary portrait of a Syrian bread baker in exile.', genre: ['Documentary'], runtime: 47, year: 2024, rating: 4.5, ratingCount: 29, thumbnailUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80', uploaderId: 'u5',
    uploader: { id: 'u5', name: 'Leila Bouri', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2024-08-05',
  },
  {
    id: '6', title: 'COPPER CITY', description: 'Graffiti artists race to finish a mural before dawn.', genre: ['Drama', 'Short'], runtime: 15, year: 2024, rating: 4.1, ratingCount: 22, thumbnailUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&q=80', uploaderId: 'u6',
    uploader: { id: 'u6', name: 'Yusuf Al-Amin', role: 'filmmaker' as const, email: '', createdAt: '' },
    createdAt: '2024-07-12',
  },
]

const FEATURED_MOCK = MOCK_FILMS[3]

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { data: films, isLoading, refetch } = useFilms()
  const { data: featured } = useFeaturedFilm()

  const displayFilms = films ?? MOCK_FILMS
  const displayFeatured = featured ?? FEATURED_MOCK

  const trending = displayFilms.slice(0, 4)
  const newUploads = [...displayFilms].reverse().slice(0, 4)
  const topRated = [...displayFilms].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4)

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2 safe-area-top">
        <div className="flex items-center gap-2.5">
          <CimaLogo size={30} animate={!!user} />
          <span className="font-display text-2xl uppercase tracking-widest text-foreground">
            CIMA
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="icon-lift w-8 h-8 flex items-center justify-center rounded-xl bg-muted"
        >
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </header>

      {/* Film of the Week */}
      {displayFeatured && <FilmOfTheWeek film={displayFeatured} />}

      {/* Feed sections */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingDots />
        </div>
      ) : displayFilms.length === 0 ? (
        <EmptyState
          icon={FilmIcon}
          title="No Films Yet"
          subtitle="Roll camera — be the first to upload."
        />
      ) : (
        <>
          <Section title="Trending This Week" films={trending} />
          <Section title="New Uploads" films={newUploads} />
          <Section title="Top Rated" films={topRated} />

          {/* Full feed */}
          <div className="px-4 mb-4">
            <h2 className="font-display text-2xl uppercase tracking-widest text-foreground mb-4">
              All Films
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {displayFilms.map((film, i) => (
                <FilmCard key={film.id} film={film} index={i} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, films }: { title: string; films: Film[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mb-6">
      <h2 className="font-display text-xl uppercase tracking-widest text-foreground px-4 mb-3">
        {title}
      </h2>
      <div ref={scrollRef} className="scroll-x flex gap-3 px-4 pb-2">
        {films.map((film, i) => (
          <div key={film.id} className="w-44 shrink-0">
            <FilmCard film={film} index={i} compact />
          </div>
        ))}
      </div>
    </div>
  )
}
