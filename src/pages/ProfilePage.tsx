import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Bookmark, Film as FilmIcon, GraduationCap, Handshake, Loader2, LogOut, MapPin, Pencil, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { Film } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useFilmsByUser, useProfile, useSavedFilms } from '@/hooks/useFilms'
import { useAcceptCimaRequest, useCima, useCrewStatus, useSendCimaRequest } from '@/hooks/useCima'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import Still from '@/components/klaket/Still'
import { Clap, Slate } from '@/components/klaket/primitives'
import { FilmStill } from '@/components/klaket/FilmCards'
import RoleBadge from '@/components/profile/RoleBadge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type Tab = 'Films' | 'Saved' | 'Crew'

export default function ProfilePage() {
  const { id = 'me' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { updateRole, updateProfile, logout } = useAuth()
  const isOwn = id === 'me' || id === currentUser?.id
  const profileId = isOwn ? currentUser?.id : id

  const { data: fetchedProfile, isPending: profileLoading, isError: profileError, refetch } = useProfile(isOwn ? undefined : profileId)
  const { data: fetchedFilms, isPending: filmsLoading } = useFilmsByUser(profileId)
  const { data: crewData } = useCima()
  // Watchlists are private: only your own profile shows one.
  const { data: savedFilms, isPending: savedLoading } = useSavedFilms(isOwn)
  const sendRequest = useSendCimaRequest()
  const acceptRequest = useAcceptCimaRequest()
  const crewStatus = useCrewStatus(isOwn ? undefined : profileId, currentUser?.id)

  const [tab, setTab] = useState<Tab>('Films')
  // Each profile opens on its films (Saved only exists on your own).
  useEffect(() => setTab('Films'), [profileId])
  const [confirmLogout, setConfirmLogout] = useState(false)

  const profile = isOwn ? currentUser : fetchedProfile
  const films = fetchedFilms ?? []
  const crew = isOwn ? (crewData?.members ?? []) : []
  const laurels = films.filter((f) => (f.laurels ?? 0) > 0 || f.isFilmOfTheWeek)

  if (!isOwn && profileLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Loading profile">
        <Loader2 size={24} className="animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (!isOwn && (profileError || !profile)) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn’t load this profile"
        subtitle="Something went wrong reaching the server."
        action={<Button variant="solid" size="sm" onClick={() => refetch()}>Retry</Button>}
        className="py-24"
      />
    )
  }

  if (!profile) return null

  const isFilmmaker = profile.role === 'filmmaker'
  const openToCollab = profile.openToCollab ?? profile.lookingForCollaborators ?? false

  const ask = () => {
    if (!profileId || sendRequest.isPending || acceptRequest.isPending) return
    if (crewStatus.status === 'received' && crewStatus.requestId) {
      acceptRequest.mutate(crewStatus.requestId, {
        onSuccess: () => toast.success(`Signed on. ${profile.name} is in your crew.`),
        onError: () => toast.error('Couldn’t accept the call sheet. Try again.'),
      })
      return
    }
    if (crewStatus.status !== 'none') return
    sendRequest.mutate(profileId, {
      onSuccess: () => toast.success(`Call sheet sent to ${profile.name}.`),
      onError: () => toast.error('Couldn’t send the call sheet. Try again.'),
    })
  }
  const canAsk = !crewStatus.isPending && !sendRequest.isPending && !acceptRequest.isPending &&
    (crewStatus.status === 'none' || crewStatus.status === 'received')

  return (
    <div className="min-h-full">
      {/* Poster header: their banner photo, or the illustrated portrait */}
      <section className="relative overflow-hidden bg-k-teal text-k-paper border-b-[1.5px] border-foreground">
        {profile.bannerUrl ? (
          <>
            <img src={profile.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="halftone absolute inset-0 opacity-30 mix-blend-multiply" aria-hidden="true" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(21,18,14,.85) 20%, rgba(21,18,14,.15) 75%)' }} aria-hidden="true" />
          </>
        ) : (
          <>
            <div className="absolute inset-y-0 end-0 w-[62%] sm:w-[40%]" aria-hidden="true">
              <Still kind="portrait" className="absolute inset-0" />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #1A6A65 38%, rgba(26,106,101,0) 78%)' }} aria-hidden="true" />
          </>
        )}
        <div className="relative max-w-5xl mx-auto px-4 pt-4 pb-5 min-h-[290px] flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex gap-1.5 flex-wrap">
              <RoleBadge role={profile.role} />
              {openToCollab && (
                <span className="inline-flex items-center gap-1 k-label text-[10px] font-semibold px-2 py-[3px] bg-k-mustard text-k-ink">
                  <Handshake size={11} aria-hidden="true" /> Open to crew
                </span>
              )}
            </div>
            {isOwn && (
              <div className="flex gap-1.5">
                <Link to="/profile/me/edit" className="inline-flex items-center gap-1.5 k-label text-[10.5px] bg-k-ink text-k-paper px-2.5 min-h-[36px] press">
                  <Pencil size={13} aria-hidden="true" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  aria-label="Sign out"
                  className="w-9 h-9 flex items-center justify-center bg-k-ink text-k-paper press"
                >
                  <LogOut size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" />
          <Avatar name={profile.name} src={profile.avatarUrl} size="lg" className="border-k-paper" />
          <h1 className="k-display text-[32px] sm:text-[44px] uppercase max-w-[14ch]">{profile.name}</h1>
          {profile.bio && <p className="text-[14px] max-w-[34ch] sm:max-w-[48ch]">{profile.bio}</p>}
          {(profile.city || profile.school) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 k-label text-[10px]">
              {profile.city && <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden="true" />{profile.city}</span>}
              {profile.school && <span className="inline-flex items-center gap-1"><GraduationCap size={11} aria-hidden="true" />{profile.school}</span>}
            </div>
          )}
        </div>
      </section>

      <Clap className="h-2.5 border-b-[1.5px] border-foreground" />
      <div className="border-b-[1.5px] border-foreground">
        <Slate
          className="max-w-5xl mx-auto"
          cells={[
            { label: 'Films', value: films.length },
            { label: 'Laurels', value: films.reduce((n, f) => n + (f.laurels ?? (f.isFilmOfTheWeek ? 1 : 0)), 0) },
            { label: 'Crew', value: isOwn ? crew.length : profile.cimaCount ?? 0 },
            { label: 'Notes', value: profile.reviewsCount ?? 0 },
          ]}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Actions */}
        <div className="flex flex-col gap-2 py-4">
          {!isOwn && (
            <button
              type="button"
              onClick={ask}
              disabled={!canAsk}
              className="press min-h-[48px] bg-k-red text-k-paper font-extrabold text-[14px] disabled:bg-k-teal"
              style={{ fontStretch: '110%' }}
            >
              {crewStatus.status === 'crew'
                ? '✓ IN YOUR CREW'
                : crewStatus.status === 'sent'
                  ? 'CALL SHEET SENT ✓'
                  : crewStatus.status === 'received'
                    ? 'ACCEPT THEIR CALL SHEET'
                    : 'SEND CALL SHEET'}
            </button>
          )}
          {isOwn && isFilmmaker && (
            <button
              type="button"
              role="switch"
              aria-checked={openToCollab}
              onClick={() => updateProfile.mutate({ lookingForCollaborators: !openToCollab })}
              disabled={updateProfile.isPending}
              className={cn(
                'press flex items-center justify-between gap-3 min-h-[52px] px-3 border-[1.5px] border-foreground text-start disabled:opacity-60',
                openToCollab ? 'bg-k-mustard text-k-ink' : 'bg-field',
              )}
            >
              <span className="flex flex-col">
                <b className="text-[14px]">Open to crew</b>
                <span className="text-[12px] opacity-80">Show up in Discover for people looking for a crew</span>
              </span>
              <span aria-hidden="true" className="w-[46px] h-[26px] border-[1.5px] border-k-ink relative shrink-0 bg-k-paper">
                <span className={cn('absolute top-[2px] w-[19px] h-[19px] bg-k-ink transition-all', openToCollab ? 'left-[23px]' : 'left-[2px]')} />
              </span>
            </button>
          )}
          {isOwn && !isFilmmaker && (
            <button
              type="button"
              onClick={() => updateRole.mutate('filmmaker')}
              disabled={updateRole.isPending}
              className="press flex items-center justify-between min-h-[52px] px-4 bg-k-red text-k-paper font-extrabold text-[14px] disabled:opacity-60"
              style={{ fontStretch: '110%' }}
            >
              <span className="flex items-center gap-2"><FilmIcon size={16} aria-hidden="true" /> BECOME A FILMMAKER</span>
              {updateRole.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <span className="k-label text-[10px] font-normal">Upload your own films</span>}
            </button>
          )}
        </div>

        {laurels.length > 0 && (
          <section aria-label="Laurels" className="flex gap-2 flex-wrap">
            {laurels.map((f) => (
              <Link key={f.id} to={`/film/${f.id}`} className="press border-[1.5px] border-foreground bg-k-mustard text-k-ink px-2.5 py-2 flex flex-col">
                <span className="k-label text-[9px]">★ Film of the week</span>
                <b className="text-[13px]">{f.title}</b>
              </Link>
            ))}
          </section>
        )}

        {(profile.crewRoles?.length || profile.favoriteGenres?.length) ? (
          <section className="mt-4 flex flex-col gap-1.5">
            {!!profile.crewRoles?.length && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="k-label text-[10px] text-muted-foreground w-16">Roles</span>
                {profile.crewRoles.map((r) => <span key={r} className="k-label text-[10px] font-semibold px-1.5 py-0.5 bg-solid text-solid-foreground">{r}</span>)}
              </div>
            )}
            {!!profile.favoriteGenres?.length && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="k-label text-[10px] text-muted-foreground w-16">Scenes</span>
                {profile.favoriteGenres.map((g) => <span key={g} className="k-label text-[10px] font-semibold px-1.5 py-0.5 border border-foreground">{g}</span>)}
              </div>
            )}
          </section>
        ) : null}

        <div role="tablist" aria-label="Profile sections" className={cn('mt-4 grid border-[1.5px] border-foreground sm:max-w-sm', isOwn ? 'grid-cols-3' : 'grid-cols-2')}>
          {((isOwn ? ['Films', 'Saved', 'Crew'] : ['Films', 'Crew']) as Tab[]).map((t) => (
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
            filmsLoading ? (
              <div className="flex flex-col gap-2" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
              </div>
            ) : films.length === 0 ? (
              <EmptyState
                icon={FilmIcon}
                title="No films yet"
                subtitle={isOwn && isFilmmaker ? 'Slate your first film and release it to the week’s vote.' : 'Nothing released yet.'}
                action={
                  isOwn && isFilmmaker ? (
                    <Link to="/upload" className="press inline-flex items-center min-h-[44px] px-4 bg-k-red text-k-paper font-extrabold text-[13px]">
                      UPLOAD A FILM
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <FilmRows films={films} />
            )
          ) : tab === 'Saved' ? (
            savedLoading ? (
              <div className="flex flex-col gap-2" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
              </div>
            ) : !savedFilms?.length ? (
              <EmptyState
                icon={Bookmark}
                title="Nothing saved yet"
                subtitle="Tap Save on a film to keep it here for later. Only you can see this list."
                action={<Link to="/home" className="k-label text-[11px] font-semibold underline underline-offset-4 min-h-[44px] inline-flex items-center">Browse films →</Link>}
              />
            ) : (
              <FilmRows films={savedFilms} />
            )
          ) : !isOwn ? (
            <p className="text-[14px] text-muted-foreground py-6">Crew lists are private. Send a call sheet to work together.</p>
          ) : crew.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No crew yet"
              subtitle="Send call sheets from films and profiles to build one."
              action={<Link to="/discover?tab=people" className="k-label text-[11px] font-semibold underline underline-offset-4 min-h-[44px] inline-flex items-center">Find filmmakers →</Link>}
            />
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {crew.map((m) => (
                <li key={m.id}>
                  <Link to={`/profile/${m.user.id}`} className="press border-[1.5px] border-foreground bg-card p-2.5 flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.user.name} src={m.user.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <b className="block text-[13px] truncate">{m.user.name}</b>
                      <span className="k-label text-[9px] text-muted-foreground">{m.user.crewRoles?.join(' · ') || 'Crew'}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li className="col-span-2 sm:col-span-3">
                <Link to="/crew" className="k-label text-[11px] font-semibold underline underline-offset-4 inline-flex items-center gap-1.5 min-h-[44px]">
                  <Users size={14} aria-hidden="true" /> Manage your crew →
                </Link>
              </li>
            </ul>
          )}
        </section>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Sign out of Klaket?"
          body="You’ll need your email and password to sign back in."
          confirm="SIGN OUT"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            setConfirmLogout(false)
            logout()
            navigate('/welcome')
          }}
        />
      )}
    </div>
  )
}

/** One row per film: still, title, genre and year, runtime. */
function FilmRows({ films }: { films: Film[] }) {
  return (
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
}
