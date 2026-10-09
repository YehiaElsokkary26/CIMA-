// UI/UX audit applied — WCAG 2.1 AA compliant
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Users, Inbox, AlertCircle } from 'lucide-react'
import { useCima, useAcceptCimaRequest, useDeclineCimaRequest } from '@/hooks/useCima'
import CimaRequestCard from '@/components/cima/CimaRequestCard'
import CimaMemberChip from '@/components/cima/CimaMemberChip'
import EmptyState from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Link } from 'react-router-dom'
import AvatarCluster from '@/components/ui/AvatarCluster'
import Button from '@/components/ui/Button'

export default function CimaHubPage() {
  const { data, isLoading, isError, refetch } = useCima()
  const accept = useAcceptCimaRequest()
  const decline = useDeclineCimaRequest()

  const displayData = data ?? { members: [], requests: [] }

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
            <div key={i} className="rounded-2xl p-4 bg-card border border-border">
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

      {isError && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load your Cima."
          subtitle="Something went wrong reaching the server."
          action={
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {/* Incoming requests */}
      {!isError && <>
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
            <div className="mb-4">
              <AvatarCluster
                people={displayData.members.map((m) => ({ name: m.user.name, avatar: m.user.avatarUrl }))}
                max={6}
                size={32}
                ringColor="hsl(var(--card))"
              />
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
      </>}
    </div>
  )
}
