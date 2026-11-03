import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Film as FilmIcon, Search, Users } from 'lucide-react'
import { useFilms } from '@/hooks/useFilms'
import { useSendCimaRequest } from '@/hooks/useCima'
import { getFilms } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { Film, User } from '@/types'
import { Band, PageTitle } from '@/components/klaket/primitives'
import { PosterCard, PosterCardSkeleton } from '@/components/klaket/FilmCards'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

// Filmmaker directory sample (there is no list endpoint wired in yet).
const FILMMAKERS: User[] = [
  { id: 'u1', name: 'Fatima El-Riad', role: 'filmmaker', email: '', bio: 'Drama and short fiction. Tangier-based.', school: 'ESAV Marrakech', city: 'Tangier', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 6, createdAt: '' },
  { id: 'u2', name: 'Karim Nassar', role: 'filmmaker', email: '', bio: 'Neo-noir and thriller. Nocturnal filmmaker.', school: 'ALBA Beirut', city: 'Beirut', topGenre: 'Neo-Noir', lookingForCollaborators: true, filmsCount: 3, createdAt: '' },
  { id: 'u3', name: 'Sana Younis', role: 'filmmaker', email: '', bio: 'Romance, pastoral shorts.', school: 'Higher Institute of Cinema, Cairo', city: 'Cairo', topGenre: 'Romance', lookingForCollaborators: false, filmsCount: 2, createdAt: '' },
  { id: 'u4', name: 'Omar Hadid', role: 'filmmaker', email: '', bio: 'Experimental and documentary. Sound-obsessed.', school: 'ESAV Marrakech', city: 'Casablanca', topGenre: 'Experimental', lookingForCollaborators: true, filmsCount: 4, createdAt: '' },
  { id: 'u5', name: 'Leila Bouri', role: 'filmmaker', email: '', bio: 'Observational documentary. Real people, real moments.', school: 'EDAC Tunis', city: 'Tunis', topGenre: 'Documentary', lookingForCollaborators: false, filmsCount: 5, createdAt: '' },
  { id: 'u6', name: 'Yusuf Al-Amin', role: 'filmmaker', email: '', bio: 'Drama shorts. Urban stories.', school: 'HFF München', city: 'Munich', topGenre: 'Drama', lookingForCollaborators: true, filmsCount: 7, createdAt: '' },
]

type Tab = 'films' | 'people'

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'people' ? 'people' : 'films')
  const [scene, setScene] = useState('All')
  const [asked, setAsked] = useState<Record<string, boolean>>({})

  const { data: serverFilms, isLoading } = useFilms()
  const sendRequest = useSendCimaRequest()
  const films: Film[] = serverFilms ?? getFilms()

  const scenes = useMemo(() => {
    const src = tab === 'films' ? films.flatMap((f) => f.genre) : FILMMAKERS.map((f) => f.topGenre ?? '')
    return ['All', ...Array.from(new Set(src.filter(Boolean))).slice(0, 10)]
  }, [films, tab])

  const q = query.trim().toLowerCase()

  const filmResults = films.filter((f) => {
    const hay = [f.title, f.description, f.uploader?.name, f.uploader?.school, ...f.genre].join(' ').toLowerCase()
    return (!q || hay.includes(q)) && (scene === 'All' || f.genre.includes(scene))
  })

  const peopleResults = FILMMAKERS.filter((p) => {
    const hay = [p.name, p.city, p.school, p.bio, p.topGenre].join(' ').toLowerCase()
    return (!q || hay.includes(q)) && (scene === 'All' || p.topGenre === scene)
  })

  const switchTab = (t: Tab) => {
    setTab(t)
    setScene('All')
    setParams(t === 'people' ? { tab: 'people' } : {}, { replace: true })
  }

  const ask = (p: User) => {
    if (asked[p.id]) return
    sendRequest.mutate(p.id)
    setAsked((a) => ({ ...a, [p.id]: true }))
    toast.success(`Call sheet sent to ${p.name}.`)
  }

  const count = tab === 'films' ? filmResults.length : peopleResults.length

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-3 flex flex-col gap-3">
        <PageTitle en="DISCOVER" ar="اكتشف" />

        <div role="tablist" aria-label="What to discover" className="grid grid-cols-2 border-[1.5px] border-foreground sm:max-w-sm">
          {(['films', 'people'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => switchTab(t)}
              className={cn(
                'min-h-[44px] font-extrabold text-[13px] flex items-center justify-center gap-2',
                tab === t ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
              )}
            >
              {t === 'films' ? <FilmIcon size={15} aria-hidden="true" /> : <Users size={15} aria-hidden="true" />}
              {t === 'films' ? 'FILMS' : 'FILMMAKERS'}
            </button>
          ))}
        </div>

        <label htmlFor="discover-q" className="k-label text-[10px] text-muted-foreground -mb-1.5">
          {tab === 'films' ? 'Search films, directors, schools' : 'Search people, schools, cities'}
        </label>
        <div className="flex items-center gap-2 border-[1.5px] border-foreground bg-field px-3 min-h-[48px]">
          <Search size={18} aria-hidden="true" />
          <input
            id="discover-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'films' ? 'Try “documentary” or “Cairo”' : 'Try “sound” or “Tunis”'}
            className="flex-1 bg-transparent outline-none text-[15px] min-w-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="scroll-x flex gap-1.5 -mx-4 px-4" role="group" aria-label="Filter by scene (genre)">
          {scenes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scene === s}
              onClick={() => setScene(s)}
              className={cn(
                'shrink-0 k-label text-[11px] font-semibold px-3 min-h-[36px] border-[1.5px] border-foreground press',
                scene === s ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Band tone="solid" left={`Scene: ${scene}`} right={`${count} ${tab === 'films' ? 'films' : 'people'}`} />

      <div className="max-w-6xl mx-auto px-4 py-4">
        {tab === 'films' ? (
          isLoading && !serverFilms && films.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <PosterCardSkeleton key={i} />)}
            </div>
          ) : filmResults.length === 0 ? (
            <EmptyState icon={FilmIcon} title="No matches" subtitle="Try a different word or scene." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filmResults.map((f) => <PosterCard key={f.id} film={f} />)}
            </div>
          )
        ) : peopleResults.length === 0 ? (
          <EmptyState icon={Users} title="No matches" subtitle="Try a different word or scene." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {peopleResults.map((p) => (
              <li key={p.id} className="border-[1.5px] border-foreground bg-card flex flex-col">
                <div className="flex items-start gap-3 p-3">
                  <Link to={`/profile/${p.id}`} aria-label={`${p.name}’s profile`}>
                    <Avatar name={p.name} size="lg" />
                  </Link>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/profile/${p.id}`} className="font-bold text-[16px] hover:text-hot">{p.name}</Link>
                      {p.lookingForCollaborators && <Badge variant="crew">Open to crew</Badge>}
                    </div>
                    {p.bio && <p className="text-[13.5px] text-muted-foreground">{p.bio}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 border-t-[1.5px] border-foreground">
                  <div className="slate-cell border-e-[1.5px] border-foreground">Scene<b>{p.topGenre}</b></div>
                  <div className="slate-cell border-e-[1.5px] border-foreground">City<b>{p.city}</b></div>
                  <div className="slate-cell">Films<b>{p.filmsCount}</b></div>
                </div>
                <button
                  type="button"
                  onClick={() => ask(p)}
                  disabled={asked[p.id]}
                  className="press min-h-[46px] border-t-[1.5px] border-foreground font-extrabold text-[13px] bg-k-red text-k-paper disabled:bg-k-teal hover:brightness-110"
                >
                  {asked[p.id] ? 'CALL SHEET SENT ✓' : 'SEND A CALL SHEET'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
