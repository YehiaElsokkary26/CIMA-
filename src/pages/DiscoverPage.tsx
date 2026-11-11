import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Film as FilmIcon, Search, Users } from 'lucide-react'
import { useFilmmakers, useFilmPages } from '@/hooks/useFilms'
import { useDebounced } from '@/hooks/useDebounced'
import { crewStatusFor, useAcceptCimaRequest, useCima, useSendCimaRequest } from '@/hooks/useCima'
import { GENRES, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import type { User } from '@/types'
import { Band, PageTitle } from '@/components/klaket/primitives'
import { PosterCard, PosterCardSkeleton } from '@/components/klaket/FilmCards'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { CallSheetSkeleton } from '@/components/ui/Skeleton'

type Tab = 'films' | 'people'

export default function DiscoverPage() {
  const me = useAuthStore((s) => s.user)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'people' ? 'people' : 'films')
  const [scene, setScene] = useState('All')

  // Films are searched and filtered on the server, a page at a time.
  const filmQuery = useDebounced(query.trim(), 300)
  const films = useFilmPages(
    { q: filmQuery || undefined, genre: tab === 'films' && scene !== 'All' ? scene : undefined },
    24,
  )
  const people = useFilmmakers()
  const sendRequest = useSendCimaRequest()
  const acceptRequest = useAcceptCimaRequest()
  const { data: crewData } = useCima()
  const busy = sendRequest.isPending || acceptRequest.isPending

  const filmResults = useMemo(() => films.data?.pages.flat() ?? [], [films.data])
  const allPeople = useMemo(() => (people.data ?? []).filter((p) => p.id !== me?.id), [people.data, me?.id])

  const scenes = useMemo(() => {
    if (tab === 'films') return ['All', ...GENRES]
    const src = allPeople.map((p) => p.topGenre ?? '')
    return ['All', ...Array.from(new Set(src.filter(Boolean))).slice(0, 10)]
  }, [allPeople, tab])

  const q = query.trim().toLowerCase()

  const peopleResults = allPeople.filter((p) => {
    const hay = [p.name, p.city, p.school, p.bio, p.topGenre, ...(p.crewRoles ?? [])].join(' ').toLowerCase()
    return (!q || hay.includes(q)) && (scene === 'All' || p.topGenre === scene)
  })
  const openToCrew = peopleResults.filter((p) => p.lookingForCollaborators || p.openToCollab)

  const switchTab = (t: Tab) => {
    setTab(t)
    setScene('All')
    setParams(t === 'people' ? { tab: 'people' } : {}, { replace: true })
  }

  const ask = (p: User) => {
    if (busy) return
    const { status, requestId } = crewStatusFor(crewData, p.id, me?.id)
    if (status === 'received' && requestId) {
      acceptRequest.mutate(requestId, {
        onSuccess: () => toast.success(`Signed on. ${p.name} is in your crew.`),
        onError: () => toast.error('Couldn’t accept the call sheet. Try again.'),
      })
      return
    }
    if (status !== 'none') return
    sendRequest.mutate(p.id, {
      onSuccess: () => toast.success(`Call sheet sent to ${p.name}.`),
      onError: () => toast.error('Couldn’t send the call sheet. Try again.'),
    })
  }

  const crewLabel = (p: User) => {
    const { status } = crewStatusFor(crewData, p.id, me?.id)
    if (status === 'crew') return '✓ IN YOUR CREW'
    if (status === 'sent') return 'CALL SHEET SENT ✓'
    if (status === 'received') return 'ACCEPT THEIR CALL SHEET'
    return 'SEND A CALL SHEET'
  }
  const canAsk = (p: User) => {
    const { status } = crewStatusFor(crewData, p.id, me?.id)
    return !!crewData && !busy && (status === 'none' || status === 'received')
  }

  const active = tab === 'films' ? films : people
  const count = tab === 'films' ? `${filmResults.length}${films.hasNextPage ? '+' : ''}` : peopleResults.length

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
          {tab === 'films' ? 'Search films, directors, schools' : 'Search people, crew roles, schools, cities'}
        </label>
        <div className="flex items-center gap-2 border-[1.5px] border-foreground bg-field px-3 min-h-[48px]">
          <Search size={18} aria-hidden="true" />
          <input
            id="discover-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'films' ? 'Try “documentary” or “Cairo”' : 'Try “editor” or “Tunis”'}
            className="flex-1 bg-transparent outline-none text-[15px] min-w-0 placeholder:text-muted-foreground"
          />
        </div>

        {scenes.length > 1 && (
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
        )}
      </div>

      <Band tone="solid" left={`Scene: ${scene}`} right={`${count} ${tab === 'films' ? 'films' : 'people'}`} />

      <div className="max-w-6xl mx-auto px-4 py-4">
        {active.isError ? (
          <EmptyState
            icon={AlertCircle}
            title={tab === 'films' ? 'Couldn’t load films' : 'Couldn’t load filmmakers'}
            subtitle="Something went wrong reaching the server."
            action={<Button variant="solid" size="sm" onClick={() => active.refetch()}>Retry</Button>}
          />
        ) : tab === 'films' ? (
          films.isPending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <PosterCardSkeleton key={i} />)}
            </div>
          ) : filmResults.length === 0 ? (
            <EmptyState icon={FilmIcon} title="No matches" subtitle="Try a different word or scene." />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filmResults.map((f) => <PosterCard key={f.id} film={f} />)}
              </div>
              {films.hasNextPage && (
                <button
                  type="button"
                  onClick={() => films.fetchNextPage()}
                  disabled={films.isFetchingNextPage}
                  className="press min-h-[48px] border-[1.5px] border-foreground k-label text-[11px] font-semibold hover:bg-foreground/5 disabled:opacity-60"
                >
                  {films.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          )
        ) : people.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <CallSheetSkeleton key={i} />)}</div>
        ) : peopleResults.length === 0 ? (
          <EmptyState icon={Users} title="No matches" subtitle="Try a different word or scene." />
        ) : (
          <div className="flex flex-col gap-6">
            {openToCrew.length > 0 && !q && scene === 'All' && (
              <section aria-label="Open to crew" className="flex flex-col gap-2">
                <span className="k-label text-[10.5px] font-semibold">Open to crew right now · {openToCrew.length}</span>
                <div className="scroll-x flex gap-2 -mx-4 px-4 pb-1">
                  {openToCrew.map((p) => (
                    <Link
                      key={p.id}
                      to={`/profile/${p.id}`}
                      className="press shrink-0 w-40 border-[1.5px] border-foreground bg-k-teal text-k-paper p-2.5 flex flex-col gap-1.5"
                    >
                      <Avatar name={p.name} src={p.avatarUrl} size="md" className="border-k-paper" />
                      <b className="text-[13.5px] leading-tight truncate">{p.name}</b>
                      <span className="k-label text-[9px] truncate">{p.crewRoles?.join(' · ') || p.topGenre || 'Filmmaker'}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <ul className="grid gap-3 sm:grid-cols-2">
              {peopleResults.map((p) => (
                <li key={p.id} className="border-[1.5px] border-foreground bg-card flex flex-col">
                  <div className="flex items-start gap-3 p-3">
                    <Link to={`/profile/${p.id}`} aria-label={`${p.name}’s profile`}>
                      <Avatar name={p.name} src={p.avatarUrl} size="lg" />
                    </Link>
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${p.id}`} className="font-bold text-[16px] hover:text-hot">{p.name}</Link>
                        {(p.lookingForCollaborators || p.openToCollab) && <Badge variant="crew">Open to crew</Badge>}
                      </div>
                      {p.bio && <p className="text-[13.5px] text-muted-foreground line-clamp-2">{p.bio}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-t-[1.5px] border-foreground">
                    <div className="slate-cell border-e-[1.5px] border-foreground">Role<b>{p.crewRoles?.[0] ?? '—'}</b></div>
                    <div className="slate-cell border-e-[1.5px] border-foreground">City<b>{p.city ?? '—'}</b></div>
                    <div className="slate-cell">Films<b>{p.filmsCount ?? 0}</b></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => ask(p)}
                    disabled={!canAsk(p)}
                    className="press min-h-[46px] border-t-[1.5px] border-foreground font-extrabold text-[13px] bg-k-red text-k-paper disabled:bg-k-teal hover:brightness-110"
                  >
                    {crewLabel(p)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
