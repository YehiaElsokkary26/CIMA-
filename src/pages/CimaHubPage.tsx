// UI/UX audit applied — WCAG 2.1 AA compliant
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Users, Inbox } from 'lucide-react'
import { useCima, useAcceptCimaRequest, useDeclineCimaRequest } from '@/hooks/useCima'
import CimaRequestCard from '@/components/cima/CimaRequestCard'
import CimaMemberChip from '@/components/cima/CimaMemberChip'
import EmptyState from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'

const MOCK_DATA = {
  members: [
    { id: 'c1', user: { id: 'u10', name: 'Hana Bakkali', email: '', role: 'filmmaker' as const, bio: 'Cinematographer, Cairo.', school: 'Cairo Film Institute', createdAt: '' }, joinedAt: '2024-01-01' },
    { id: 'c2', user: { id: 'u11', name: 'Mehdi Laroui', email: '', role: 'filmmaker' as const, bio: 'Editor & colorist.', school: 'ISAC Rabat', createdAt: '' }, joinedAt: '2024-02-01' },
    { id: 'c3', user: { id: 'u12', name: 'Sofia Tazi', email: '', role: 'filmmaker' as const, bio: 'Sound designer.', school: 'ESAV Marrakech', createdAt: '' }, joinedAt: '2024-03-01' },
  ],
  requests: [
    {
      id: 'req1', fromUserId: 'u20', toUserId: 'me', status: 'pending' as const, createdAt: new Date(Date.now() - 3600000).toISOString(),
      from: { id: 'u20', name: 'Yasmine Korbi', email: '', role: 'filmmaker' as const, bio: 'Documentary filmmaker, Tunis. Looking to collaborate on North African narratives.', school: 'EDAC Tunis', createdAt: '' },
    },
    {
      id: 'req2', fromUserId: 'u21', toUserId: 'me', status: 'pending' as const, createdAt: new Date(Date.now() - 7200000).toISOString(),
      from: { id: 'u21', name: 'Tariq Amrani', email: '', role: 'filmmaker' as const, bio: 'Experimental video artist. Berlin-based.', school: 'HFF München', createdAt: '' },
    },
  ],
}

export default function CimaHubPage() {
  const { data, isLoading } = useCima()
  const accept = useAcceptCimaRequest()
  const decline = useDeclineCimaRequest()

  const displayData = data ?? MOCK_DATA

  return (
    <div className="min-h-full px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Film size={20} className="text-cima-tag" />
          <h1 className="font-display text-4xl uppercase tracking-widest text-foreground">Cima</h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Your creative circle. — Arabic: سيما (cinema)
        </p>
      </div>

      {/* Rule 5: skeleton placeholders match real content layout */}
      {isLoading && (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ border: '1px solid rgba(139,107,92,0.15)', background: 'var(--card, #1E1A16)' }}>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incoming requests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Inbox size={15} className="text-muted-foreground" />
          <h2 className="font-display text-xl uppercase tracking-widest text-foreground">
            Requests
          </h2>
          {displayData.requests.length > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-mono text-[10px]">
              {displayData.requests.length}
            </span>
          )}
        </div>

        {displayData.requests.length === 0 ? (
          <EmptyState icon={Inbox} title="No Requests" subtitle="Your inbox is clear." className="py-8" />
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {displayData.requests.map((req) => (
                <CimaRequestCard
                  key={req.id}
                  request={req}
                  onAccept={(id) => accept.mutate(id)}
                  onDecline={(id) => decline.mutate(id)}
                  isPending={accept.isPending || decline.isPending}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>

      {/* Current members */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} className="text-muted-foreground" />
          <h2 className="font-display text-xl uppercase tracking-widest text-foreground">
            Your Crew
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {displayData.members.length} members
          </span>
        </div>

        {displayData.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Your crew is empty"
            subtitle="Start adding filmmakers."
            action={<Link to="/discover" className="font-mono text-xs text-primary underline underline-offset-4">Discover filmmakers →</Link>}
            className="py-8"
          />
        ) : (
          <div className="bg-card rounded-2xl border border-cima-tag/20 p-4">
            {/* Avatar strip */}
            <div className="flex -space-x-2 mb-4">
              {displayData.members.slice(0, 6).map((m) => (
                <Avatar key={m.id} name={m.user.name} src={undefined} size="sm" className="border-2 border-background" />
              ))}
              {displayData.members.length > 6 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="font-mono text-[10px] text-muted-foreground">+{displayData.members.length - 6}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {displayData.members.map((m) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <CimaMemberChip user={m.user} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Discover */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl uppercase tracking-widest text-foreground">
            Discover Filmmakers
          </h2>
          <Link to="/discover" className="font-mono text-xs text-primary underline underline-offset-4">
            See All
          </Link>
        </div>
        <p className="font-sans text-sm text-muted-foreground">
          Head to the Discover page to find filmmakers to add to your Cima.
        </p>
      </section>
    </div>
  )
}
