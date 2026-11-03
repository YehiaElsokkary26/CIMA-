import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Users } from 'lucide-react'
import { useAcceptCimaRequest, useCima, useDeclineCimaRequest } from '@/hooks/useCima'
import { formatTimeAgo } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { CimaMember, CimaRequest } from '@/types'
import { Band, PageTitle } from '@/components/klaket/primitives'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import { CallSheetSkeleton } from '@/components/ui/Skeleton'

// Shown when the server is unreachable, so the screen can still be explored.
const SAMPLE: { members: CimaMember[]; requests: CimaRequest[] } = {
  members: [
    { id: 'c1', user: { id: 'u10', name: 'Hana Bakkali', email: '', role: 'filmmaker', bio: 'Cinematographer, Cairo.', school: 'Cairo Film Institute', crewRoles: ['Camera'], createdAt: '' }, joinedAt: '2024-01-01' },
    { id: 'c2', user: { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker', bio: 'Editor & colorist.', school: 'ISAC Rabat', crewRoles: ['Edit', 'Color'], createdAt: '' }, joinedAt: '2024-02-01' },
    { id: 'c3', user: { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker', bio: 'Sound designer.', school: 'ESAV Marrakech', crewRoles: ['Sound'], createdAt: '' }, joinedAt: '2024-03-01' },
  ],
  requests: [
    {
      id: 'req1', fromUserId: 'u20', toUserId: 'me', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString(),
      from: { id: 'u20', name: 'Yasmine Korbi', email: '', role: 'filmmaker', bio: 'Documentary filmmaker, Tunis. Looking to collaborate on North African narratives.', school: 'EDAC Tunis', createdAt: '' },
    },
    {
      id: 'req2', fromUserId: 'u21', toUserId: 'me', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString(),
      from: { id: 'u21', name: 'Tariq Amrani', email: '', role: 'filmmaker', bio: 'Experimental video artist. Berlin-based.', school: 'HFF München', createdAt: '' },
    },
  ],
}

export default function CrewPage() {
  const { data, isError } = useCima()
  const accept = useAcceptCimaRequest()
  const decline = useDeclineCimaRequest()
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})

  // Once the server has failed, stay on the sample data instead of flashing
  // back to skeletons every time the query retries (e.g. on window focus).
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    if (isError) setOffline(true)
  }, [isError])

  const crew = data ?? (offline || isError ? SAMPLE : null)
  const pending = crew?.requests.filter((r) => !answers[r.id]).length ?? 0

  const answer = (req: CimaRequest, yes: boolean) => {
    setAnswers((a) => ({ ...a, [req.id]: yes ? 'yes' : 'no' }))
    const name = req.from?.name ?? 'They'
    ;(yes ? accept : decline).mutate(req.id, {
      onError: () => {
        // Keep the answer on screen when offline; it's still clear what was chosen.
      },
    })
    toast.success(yes ? `Signed on. ${name} is in your crew.` : `Declined. ${name} has been told.`)
  }

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 pt-2 pb-4">
        <PageTitle en="CREW" ar="الطاقم" sub="People you make films with, and call sheets waiting for your answer." />
      </div>

      {/* Your crew */}
      <section aria-label="Your crew" className="max-w-4xl mx-auto px-4 pb-4 flex flex-col gap-2">
        <span className="k-label text-[10.5px] font-semibold">
          Your crew · {crew?.members.length ?? 0}
        </span>
        {!crew ? (
          <div className="skeleton h-[96px]" aria-hidden="true" />
        ) : crew.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No crew yet"
            subtitle="Send a call sheet from any film or profile to start one."
            action={<Link to="/discover" className="k-label text-[11px] font-semibold underline underline-offset-4">Find filmmakers →</Link>}
            className="py-6"
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {crew.members.map((m) => (
              <Link
                key={m.id}
                to={`/profile/${m.user.id}`}
                className="press border-[1.5px] border-foreground bg-card p-2 flex flex-col gap-1.5 min-w-0 hover:-translate-y-px transition-transform"
              >
                <Avatar name={m.user.name} src={m.user.avatarUrl ?? m.user.avatar} size="md" />
                <b className="text-[12.5px] leading-tight truncate">{m.user.name}</b>
                <span className="k-label text-[9px] text-muted-foreground truncate">
                  {m.user.crewRoles?.join(' · ') || m.user.school || 'Crew'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Band left={`Call sheets · ${pending} waiting`} right="Newest first" />

      <section aria-label="Call sheets" className="max-w-4xl mx-auto px-4 py-4 grid gap-3.5 sm:grid-cols-2">
        {!crew ? (
          Array.from({ length: 2 }).map((_, i) => <CallSheetSkeleton key={i} />)
        ) : crew.requests.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState icon={Inbox} title="No call sheets" subtitle="When someone asks you to join a shoot, it shows up here." />
          </div>
        ) : (
          crew.requests.map((req, i) => {
            const a = answers[req.id]
            const from = req.from
            return (
              <article key={req.id} className="border-[1.5px] border-foreground bg-field flex flex-col">
                <div className="flex items-center justify-between px-2.5 py-2 bg-solid text-solid-foreground">
                  <span className="font-black text-[14px]" style={{ fontStretch: '120%' }}>CALL SHEET</span>
                  <span className="k-label text-[10px]">
                    No. {String(crew.requests.length - i).padStart(3, '0')} · {formatTimeAgo(req.createdAt)}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-2.5 border-b-[1.5px] border-foreground">
                  <Avatar name={from?.name ?? '?'} src={from?.avatarUrl ?? from?.avatar} size="md" />
                  <div className="min-w-0">
                    <Link to={`/profile/${req.fromUserId}`} className="font-bold text-[16px] leading-tight hover:text-hot">
                      {from?.name ?? 'Unknown filmmaker'}
                    </Link>
                    <p className="text-[13px] text-muted-foreground">wants you on their crew</p>
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="slate-cell border-e-[1.5px] border-foreground">
                    School<b>{from?.school ?? '—'}</b>
                  </div>
                  <div className="slate-cell">
                    Sent<b>{new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</b>
                  </div>
                </div>
                {from?.bio && (
                  <p className="px-2.5 py-2 text-[13.5px] border-t border-rule">{from.bio}</p>
                )}
                {a ? (
                  <div
                    role="status"
                    className={`mt-auto border-t-[1.5px] border-foreground px-2.5 py-3 k-label text-[11px] font-semibold ${
                      a === 'yes' ? 'bg-k-teal text-k-paper' : 'bg-muted'
                    }`}
                  >
                    {a === 'yes' ? `✓ Signed on with ${from?.name ?? 'them'}.` : 'Declined.'}
                  </div>
                ) : (
                  <div className="mt-auto grid grid-cols-2 border-t-[1.5px] border-foreground">
                    <button
                      type="button"
                      onClick={() => answer(req, false)}
                      className="min-h-[46px] font-extrabold text-[13px] border-e-[1.5px] border-foreground hover:bg-foreground/5 press"
                    >
                      DECLINE
                    </button>
                    <button
                      type="button"
                      onClick={() => answer(req, true)}
                      className="min-h-[46px] font-extrabold text-[13px] bg-k-red text-k-paper hover:brightness-110 press"
                    >
                      SIGN ON
                    </button>
                  </div>
                )}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
