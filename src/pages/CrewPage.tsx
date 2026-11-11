import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Inbox, Send, UserMinus, Users } from 'lucide-react'
import { useAcceptCimaRequest, useCancelCimaRequest, useCima, useDeclineCimaRequest, useRemoveCrewMember } from '@/hooks/useCima'
import { formatTimeAgo } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { CimaMember, CimaRequest } from '@/types'
import { Band, PageTitle } from '@/components/klaket/primitives'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { CallSheetSkeleton } from '@/components/ui/Skeleton'

export default function CrewPage() {
  const { data, isPending: isLoading, isError, refetch } = useCima()
  const accept = useAcceptCimaRequest()
  const decline = useDeclineCimaRequest()
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})
  const cancel = useCancelCimaRequest()
  const remove = useRemoveCrewMember()
  const [removing, setRemoving] = useState<CimaMember | null>(null)
  const sent = data?.sent ?? []

  const members = data?.members ?? []
  const requests = (data?.requests ?? []).filter((r) => r.status === 'pending' || answers[r.id])
  const pending = requests.filter((r) => !answers[r.id]).length

  const answer = (req: CimaRequest, yes: boolean) => {
    const name = req.from?.name ?? 'They'
    setAnswers((a) => ({ ...a, [req.id]: yes ? 'yes' : 'no' }))
    ;(yes ? accept : decline).mutate(req.id, {
      onSuccess: () => toast.success(yes ? `Signed on. ${name} is in your crew.` : `Declined ${name}’s call sheet.`),
      onError: () => {
        setAnswers((a) => {
          const next = { ...a }
          delete next[req.id]
          return next
        })
        toast.error('That didn’t go through. Try again.')
      },
    })
  }

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 pt-2 pb-4">
        <PageTitle en="CREW" ar="الطاقم" sub="People you make films with, and call sheets waiting for your answer." />
      </div>

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn’t load your crew"
          subtitle="Something went wrong reaching the server."
          action={<Button variant="solid" size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      ) : (
        <>
          <section aria-label="Your crew" className="max-w-4xl mx-auto px-4 pb-4 flex flex-col gap-2">
            <span className="k-label text-[10.5px] font-semibold">Your crew · {members.length}</span>
            {isLoading ? (
              <div className="skeleton h-[96px]" aria-hidden="true" />
            ) : members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No crew yet"
                subtitle="Send a call sheet from any film or profile to start one."
                action={<Link to="/discover?tab=people" className="k-label text-[11px] font-semibold underline underline-offset-4 min-h-[44px] inline-flex items-center">Find filmmakers →</Link>}
                className="py-6"
              />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {members.map((m) => (
                  <div key={m.id} className="relative min-w-0">
                    <Link
                      to={`/profile/${m.user.id}`}
                      className="press border-[1.5px] border-foreground bg-card p-2 flex flex-col gap-1.5 min-w-0 h-full hover:-translate-y-px transition-transform"
                    >
                      <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" />
                      <b className="text-[12.5px] leading-tight truncate pe-6">{m.user.name}</b>
                      <span className="k-label text-[9px] text-muted-foreground truncate">
                        {m.user.crewRoles?.join(' · ') || m.user.school || 'Crew'}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setRemoving(m)}
                      aria-label={`Remove ${m.user.name} from your crew`}
                      className="absolute top-1 end-1 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-hot hover:bg-hot/10 press"
                    >
                      <UserMinus size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Band left={`Call sheets · ${pending} waiting`} right="Newest first" />

          <section aria-label="Call sheets" className="max-w-4xl mx-auto px-4 py-4 grid gap-3.5 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <CallSheetSkeleton key={i} />)
            ) : requests.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState icon={Inbox} title="No call sheets" subtitle="When someone asks you to join a shoot, it shows up here." />
              </div>
            ) : (
              requests.map((req, i) => {
                const a = answers[req.id]
                const from = req.from
                return (
                  <article key={req.id} className="border-[1.5px] border-foreground bg-field flex flex-col">
                    <div className="flex items-center justify-between px-2.5 py-2 bg-solid text-solid-foreground">
                      <span className="font-black text-[14px]" style={{ fontStretch: '120%' }}>CALL SHEET</span>
                      <span className="k-label text-[10px]">
                        No. {String(requests.length - i).padStart(3, '0')} · {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 border-b-[1.5px] border-foreground">
                      <Avatar name={from?.name ?? '?'} src={from?.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <Link to={`/profile/${req.fromUserId}`} className="font-bold text-[16px] leading-tight hover:text-hot">
                          {from?.name ?? 'Unknown filmmaker'}
                        </Link>
                        <p className="text-[13px] text-muted-foreground">wants you on their crew</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="slate-cell border-e-[1.5px] border-foreground">School<b>{from?.school ?? '—'}</b></div>
                      <div className="slate-cell">Role<b>{from?.crewRoles?.[0] ?? '—'}</b></div>
                    </div>
                    {from?.bio && <p className="px-2.5 py-2 text-[13.5px] border-t border-rule">{from.bio}</p>}
                    {a ? (
                      <div
                        role="status"
                        className={`mt-auto border-t-[1.5px] border-foreground px-2.5 py-3 k-label text-[11px] font-semibold ${a === 'yes' ? 'bg-k-teal text-k-paper' : 'bg-muted'}`}
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

          {sent.length > 0 && (
            <>
              <Band left={`Sent · ${sent.length} waiting`} right="Their answer pending" />
              <section aria-label="Call sheets you sent" className="max-w-4xl mx-auto px-4 py-4">
                <ul className="flex flex-col">
                  {sent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5 border-b border-rule">
                      <Avatar name={r.to?.name ?? '?'} src={r.to?.avatarUrl} size="sm" />
                      <span className="min-w-0 flex-1 flex flex-col">
                        <Link to={`/profile/${r.toUserId}`} className="font-bold text-[14px] truncate hover:text-hot">
                          {r.to?.name ?? 'Unknown filmmaker'}
                        </Link>
                        <span className="k-label text-[9.5px] text-muted-foreground flex items-center gap-1">
                          <Send size={10} aria-hidden="true" /> Sent {formatTimeAgo(r.createdAt)}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={cancel.isPending && cancel.variables === r.id}
                        onClick={() =>
                          cancel.mutate(r.id, {
                            onSuccess: () => toast.success(`Call sheet to ${r.to?.name ?? 'them'} withdrawn.`),
                            onError: () => toast.error('Couldn’t withdraw it. Try again.'),
                          })
                        }
                        className="press shrink-0 min-h-[40px] px-3 border-[1.5px] border-foreground k-label text-[10.5px] font-semibold hover:bg-foreground/5 disabled:opacity-60"
                      >
                        {cancel.isPending && cancel.variables === r.id ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.user.name}?`}
          body="You’ll come off each other’s crew. They won’t be notified, and you can send a new call sheet later."
          confirm="REMOVE"
          busy={remove.isPending}
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            remove.mutate(removing.user.id, {
              onSuccess: () => {
                toast.success(`${removing.user.name} is off your crew.`)
                setRemoving(null)
              },
              onError: () => {
                toast.error('Couldn’t remove them. Try again.')
                setRemoving(null)
              },
            })
          }
        />
      )}
    </div>
  )
}
