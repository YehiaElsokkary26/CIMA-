import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Pencil, Play, ArrowUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'
import VideoPreviewCard from './VideoPreviewCard'
import { getWeeklyVoteLeaderboard } from '@/lib/mockData'

interface FilmCardProps {
  film: Film
  index?: number
  className?: string
  isOwner?: boolean
  compact?: boolean
}

export default function FilmCard({ film, index = 0, className, isOwner = false }: FilmCardProps) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const isLeading = useMemo(() => {
    const leader = getWeeklyVoteLeaderboard()[0]
    return leader?.id === film.id
  }, [film.id])

  const hasVideo = !!(film.trailerUrl ?? film.videoUrl)
  const uploaderName = film.uploader?.name ?? 'Unknown'
  const avatarLetter = uploaderName.charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.45), ease: [0.22, 1, 0.36, 1] }}
      className={cn('film-card card-grain', className)}
      style={{ background: '#161413', border: '1px solid rgba(139,107,92,0.18)' }}
    >
      <Link to={`/film/${film.id}`} className="block" tabIndex={-1}>
        {/* Poster / video area */}
        <VideoPreviewCard
          trailerSrc={film.trailerUrl}
          videoSrc={film.videoUrl}
          posterSrc={film.thumbnailUrl}
          aspectRatio={film.aspectRatio ?? '4:5'}
          onHoverChange={setIsHovered}
        >
          {/* Deep bottom gradient for better text legibility */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '65%',
              background: 'linear-gradient(to top, rgba(22,20,19,0.85) 0%, rgba(22,20,19,0.3) 50%, transparent 100%)',
            }}
          />

          {/* Genre badge — top left, pill style */}
          {film.genre?.[0] && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span
                className="genre-pill"
                style={{ background: 'rgba(163,38,38,0.9)', color: '#E8DDCB', backdropFilter: 'blur(4px)' }}
              >
                {film.genre[0]}
              </span>
            </div>
          )}

          {/* Trailer badge — top right, on hover */}
          {hasVideo && (
            <div
              className={cn(
                'absolute top-2.5 right-2.5 z-10 transition-all duration-200',
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
              )}
            >
              <span
                className="genre-pill flex items-center gap-1"
                style={{
                  background: film.trailerUrl ? 'rgba(163,38,38,0.9)' : 'rgba(78,74,70,0.85)',
                  color: '#E8DDCB',
                  backdropFilter: 'blur(4px)',
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
                'absolute top-9 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200',
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
              )}
              style={{ background: 'rgba(22,20,19,0.85)', backdropFilter: 'blur(4px)' }}
              aria-label="Edit film"
            >
              <Pencil size={11} style={{ color: '#E8DDCB' }} />
            </button>
          )}

          {/* FOTW badge — bottom left */}
          {film.isFilmOfTheWeek && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <span
                className="genre-pill flex items-center gap-1"
                style={{ background: '#A32626', color: '#E8DDCB' }}
              >
                <Trophy size={8} />
                FOTW
              </span>
            </div>
          )}

          {/* Vote count overlay — bottom right, only if has votes */}
          {(film.votes ?? 0) > 0 && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span
                className="genre-pill flex items-center gap-1"
                style={
                  isLeading
                    ? { background: '#B28A52', color: '#161413', fontWeight: 700 }
                    : { background: 'rgba(22,20,19,0.75)', color: '#B28A52', backdropFilter: 'blur(4px)' }
                }
              >
                <ArrowUp size={8} strokeWidth={2.5} />
                {(film.votes ?? 0).toLocaleString()}
              </span>
            </div>
          )}
        </VideoPreviewCard>

        {/* Below-poster content strip */}
        <div style={{ padding: '12px 14px 14px' }}>
          <h3
            className="font-display text-sm leading-tight line-clamp-2 mb-1.5"
            style={{ color: '#E8DDCB' }}
          >
            {film.title}
          </h3>

          {/* Filmmaker row with avatar */}
          <div className="flex items-center gap-1.5">
            <span className="avatar-initial">{avatarLetter}</span>
            <p className="font-mono text-[10px]" style={{ color: '#B28A52' }}>
              {uploaderName}
            </p>
          </div>

          {/* Bottom row: genre + duration */}
          {film.runtime && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className="genre-pill"
                style={{ background: 'rgba(178,138,82,0.12)', color: '#8B6B5C' }}
              >
                {film.genre?.[0]}
              </span>
              <span className="font-mono text-[9px]" style={{ color: '#4E4A46' }}>
                {Math.floor(film.runtime / 60)}:{String(film.runtime % 60).padStart(2, '0')} min
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
