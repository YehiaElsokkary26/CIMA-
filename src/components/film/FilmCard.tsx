import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Pencil, Play, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'
import VideoPreviewCard from './VideoPreviewCard'
import { getWeeklyVoteLeaderboard } from '@/lib/mockData'

interface FilmCardProps {
  film: Film
  index?: number
  className?: string
  isOwner?: boolean
  compact?: boolean // accepted for API compatibility
}

export default function FilmCard({ film, index = 0, className, isOwner = false }: FilmCardProps) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const isLeading = useMemo(() => {
    const leader = getWeeklyVoteLeaderboard()[0]
    return leader?.id === film.id
  }, [film.id])

  const hasVideo = !!(film.trailerUrl ?? film.videoUrl)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4), ease: 'easeOut' }}
      className={cn(className)}
    >
      <div
        className="card-grain relative overflow-hidden cursor-pointer"
        style={{ background: '#161413', border: '1px solid rgba(139,107,92,0.2)' }}
      >
        <Link to={`/film/${film.id}`} className="block" tabIndex={-1}>
          {/* ── Poster / video area ─────────────────────────────── */}
          <VideoPreviewCard
            trailerSrc={film.trailerUrl}
            videoSrc={film.videoUrl}
            posterSrc={film.thumbnailUrl}
            aspectRatio={film.aspectRatio ?? '4:5'}
            onHoverChange={setIsHovered}
          >
            {/* Bottom gradient so overlays read on bright posters */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '50%',
                background:
                  'linear-gradient(to top, rgba(22,20,19,0.7) 0%, transparent 100%)',
              }}
            />

            {/* Genre badge — top left */}
            {film.genre?.[0] && (
              <div className="absolute top-2.5 left-2.5 z-10">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5"
                  style={{ background: '#A32626', color: '#E8DDCB' }}
                >
                  {film.genre[0]}
                </span>
              </div>
            )}

            {/* Trailer/Preview badge — top right, on hover */}
            {hasVideo && (
              <div
                className={cn(
                  'absolute top-2.5 right-2.5 z-10 transition-all duration-200',
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
                )}
              >
                <span
                  className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5"
                  style={{
                    background: film.trailerUrl ? '#A32626' : '#4E4A46',
                    color: '#E8DDCB',
                  }}
                >
                  <Play size={8} fill="currentColor" />
                  {film.trailerUrl ? 'Trailer' : 'Preview'}
                </span>
              </div>
            )}

            {/* Edit button — owners only, on hover */}
            {isOwner && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/upload?edit=${film.id}`)
                }}
                className={cn(
                  'absolute top-8 right-2.5 z-20 w-6 h-6 flex items-center justify-center transition-all duration-200',
                  isHovered ? 'opacity-100' : 'opacity-0',
                )}
                style={{ background: 'rgba(22,20,19,0.85)' }}
                aria-label="Edit film"
              >
                <Pencil size={11} style={{ color: '#E8DDCB' }} />
              </button>
            )}

            {/* FOTW badge */}
            {film.isFilmOfTheWeek && (
              <div className="absolute bottom-2.5 left-2.5 z-10">
                <span
                  className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5"
                  style={{ background: '#A32626', color: '#E8DDCB' }}
                >
                  🏆 FOTW
                </span>
              </div>
            )}
          </VideoPreviewCard>

          {/* ── Below-poster content strip (Pinterest style) ───── */}
          <div style={{ background: '#161413', padding: '10px 12px 12px' }}>
            <h3
              className="font-display text-sm leading-tight line-clamp-2"
              style={{ color: '#E8DDCB' }}
            >
              {film.title}
            </h3>
            {/* Rule 1: uploader name — muted cream, not muted-gold (#B28A52) which fails on dark bg */}
            <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(232,221,203,0.6)' }}>
              {film.uploader?.name ?? 'Unknown'}
            </p>

            {/* Bottom row: vote pill */}
            <div className="flex items-center justify-between mt-2">
              {/* Rule 1: genre pill — cream text on very dark tinted bg ✓ */}
              <span
                className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                style={{ background: 'rgba(178,138,82,0.12)', color: 'rgba(232,221,203,0.55)' }}
              >
                {film.genre?.[0]}
              </span>

              {/* Rule 1: vote badge — leading uses #161413 on gold ✓; non-leading uses cream on dark ✓ */}
              <span
                className="flex items-center gap-0.5 font-mono text-[9px] px-2 py-0.5"
                style={
                  isLeading
                    ? { background: '#B28A52', color: '#161413' }
                    : { background: 'rgba(78,74,70,0.18)', color: 'rgba(232,221,203,0.55)' }
                }
              >
                <ArrowUp size={8} strokeWidth={2.5} />
                {(film.votes ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
