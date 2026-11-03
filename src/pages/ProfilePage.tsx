import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Film as FilmIcon, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFilms } from '@/hooks/useFilms'
import { useSendCimaRequest } from '@/hooks/useCima'
import { getFilms, getUserById } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { Film, User } from '@/types'
import Still from '@/components/klaket/Still'
import { Clap, Slate } from '@/components/klaket/primitives'
import { FilmStill } from '@/components/klaket/FilmCards'
import RoleBadge from '@/components/profile/RoleBadge'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'

const SAMPLE_PROFILE: User = {
  id: 'u4',
  name: 'Omar Hadid',
  email: '',
  role: 'filmmaker',
  bio: 'Documentary and experimental filmmaker based in Casablanca. Obsessed with sound design and found footage.',
  school: 'ESAV Marrakech',
  city: 'Casablanca',
  topGenre: 'Experimental',
  filmsCount: 4,
  cimaCount: 7,
  reviewsCount: 23,
  lookingForCollaborators: true,
  createdAt: '2023-06-01',
}

const SAMPLE_CREW: User[] = [
  { id: 'u10', name: 'Hana Bakkali', email: '', role: 'filmmaker', school: 'Cairo Film Institute', crewRoles: ['Camera'], createdAt: '' },
  { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker', school: 'ISAC Rabat', crewRoles: ['Edit'], createdAt: '' },
  { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker', school: 'ESAV Marrakech', crewRoles: ['Sound'], createdAt: '' },
]

type Tab = 'Films' | 'Crew'

export default function ProfilePage() {
  const { id = 'me' } = useParams<{ id: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const isOwn = id === 'me' || id === currentUser?.id
  const profile: User = (isOwn ? currentUser : getUserById(id)) ?? SAMPLE_PROFILE

  const { data: serverFilms } = useFilms()
  const sendRequest = useSendCimaRequest()
  const [tab, setTab] = useState<Tab>(profile.role === 'filmmaker' ? 'Films' : 'Crew')
  const [asked, setAsked] = useState(false)

  const films: Film[] = useMemo(
    () => (serverFilms ?? getFilms()).filter((f) => f.uploaderId === profile.id),
    [serverFilms, profile.id],
  )
  const laurels = films.filter((f) => f.isFilmOfTheWeek)

  const ask = () => {
    sendRequest.mutate(profile.id)
    setAsked(true)
    toast.success(`Call sheet sent to ${profile.name}.`)
  }

  return (
    <div className="min-h-full">
      {/* Poster header */}
      <section className="relative overflow-hidden bg-k-teal text-k-paper border-b-[1.5px] border-foreground">
        <div className="absolute inset-y-0 end-0 w-[62%] sm:w-[40%]" aria-hidden="true">
          <Still kind="portrait" className="absolute inset-0" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, #1A6A65 38%, rgba(26,106,101,0) 78%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-4 pb-5 min-h-[280px] flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <RoleBadge role={profile.role} />
            {isOwn && (
              <Link to="/settings" className="k-label text-[10.5px] bg-k-ink text-k-paper px-2 py-1.5 press">
                Settings
              </Link>
            )}
          </div>
          <div className="flex-1" />
          <Avatar name={profile.name} src={profile.avatarUrl ?? profile.avatar} size="lg" className="border-k-paper" />
          <h1 className="k-display text-[32px] sm:text-[44px] uppercase max-w-[14ch]">{profile.name}</h1>
          {profile.bio && <p className="text-[14px] max-w-[34ch] sm:max-w-[48ch]">{profile.bio}</p>}
        </div>
      </section>

      <Clap className="h-2.5 border-b-[1.5px] border-foreground" />
      <div className="border-b-[1.5px] border-foreground">
        <Slate
          className="max-w-5xl mx-auto"
          cells={[
            { label: 'Films', value: films.length || profile.filmsCount || 0 },
            { label: 'Laurels', value: laurels.length },
            { label: 'Crew', value: profile.cimaCount ?? SAMPLE_CREW.length },
            { label: 'Roll', value: profile.school ?? profile.city ?? '—' },
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {!isOwn && (
          <div className="flex gap-2 py-4">
            <button
              type="button"
              onClick={ask}
              disabled={asked}
              className="press flex-1 min-h-[48px] bg-k-red text-k-paper font-extrabold text-[14px] disabled:bg-k-teal"
              style={{ fontStretch: '110%' }}
            >
              {asked ? 'CALL SHEET SENT ✓' : 'SEND CALL SHEET'}
            </button>
          </div>
        )}

        {laurels.length > 0 && (
          <section aria-label="Laurels" className={cn('flex gap-2 flex-wrap', isOwn && 'pt-4')}>
            {laurels.map((f) => (
              <Link key={f.id} to={`/film/${f.id}`} className="press border-[1.5px] border-foreground bg-k-mustard text-k-ink px-2.5 py-2 flex flex-col">
                <span className="k-label text-[9px]">★ Film of the week</span>
                <b className="text-[13px]">{f.title}</b>
              </Link>
            ))}
          </section>
        )}

        <div role="tablist" aria-label="Profile sections" className="mt-4 grid grid-cols-2 border-[1.5px] border-foreground sm:max-w-sm">
          {(['Films', 'Crew'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('min-h-[44px] k-label text-[11px] font-semibold', tab === t ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5')}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="py-3">
          {tab === 'Films' ? (
            films.length === 0 ? (
              <EmptyState
                icon={FilmIcon}
                title="No films yet"
                subtitle={isOwn && profile.role === 'filmmaker' ? 'Slate your first film and release it to the week’s vote.' : 'Nothing released yet.'}
                action={
                  isOwn && profile.role === 'filmmaker' ? (
                    <Link to="/upload" className="press inline-flex items-center min-h-[44px] px-4 bg-k-red text-k-paper font-extrabold text-[13px]">
                      UPLOAD A FILM
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="flex flex-col">
                {films.map((f) => (
                  <li key={f.id}>
                    <Link
                      to={`/film/${f.id}`}
                      className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 items-center py-2.5 border-b border-rule hover:bg-foreground/5"
                    >
                      <FilmStill film={f} className="w-16 h-16 border-[1.5px] border-foreground" />
                      <span className="min-w-0 flex flex-col gap-0.5">
                        <b className="text-[15px] leading-tight truncate">{f.title}</b>
                        <span className="k-label text-[9.5px] text-muted-foreground truncate">
                          {f.genre.join(' · ')} · {f.year}
                          {f.isFilmOfTheWeek ? ' · Film of the week' : ''}
                        </span>
                      </span>
                      <span className="k-label text-[10px]">{f.runtime ? `${f.runtime}m` : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_CREW.map((m) => (
                <li key={m.id}>
                  <Link to={`/profile/${m.id}`} className="press border-[1.5px] border-foreground bg-card p-2.5 flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} size="sm" />
                    <span className="min-w-0">
                      <b className="block text-[13px] truncate">{m.name}</b>
                      <span className="k-label text-[9px] text-muted-foreground">{m.crewRoles?.join(' · ')}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {isOwn && (
                <li className="col-span-2 sm:col-span-3">
                  <Link to="/crew" className="k-label text-[11px] font-semibold underline underline-offset-4 inline-flex items-center gap-1.5 min-h-[44px]">
                    <Users size={14} aria-hidden="true" /> Manage your crew →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
