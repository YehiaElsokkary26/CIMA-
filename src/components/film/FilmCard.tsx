import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Pencil, Play, ArrowUp, Trophy, Star, CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'
import VideoPreviewCard from './VideoPreviewCard'
import Avatar from '@/components/ui/Avatar'
import { cardColorFor } from '@/lib/cardColors'

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

  const isLeading = film.isFilmOfTheWeek
  const hasVideo = !!(film.trailerUrl ?? film.videoUrl)
  const uploaderName = film.uploader?.name ?? 'Unknown'
  const color = cardColorFor(index)
  const year = film.createdAt ? new Date(film.createdAt).getFullYear() : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.5), ease: [0.22, 1, 0.36, 1] }}
      className={cn('film-card card-grain', className)}
      style={{ background: color.bg, color: color.fg, borderRadius: 24, padding: 20 }}
    >
      <Link to={`/film/${film.id}`} className="block" tabIndex={-1}>
        {/* Top row: title + owner action */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-display text-xl font-extrabold leading-tight line-clamp-2 uppercase tracking-wide">
            {film.title}
          </h3>
          {isOwner && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/upload?edit=${film.id}`)
              }}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105"
              style={{ background: '#161413' }}
              aria-label="Edit film"
            >
              <Pencil size={14} color="#E8DDCB" />
            </button>
          )}
        </div>

        {/* Metadata chip row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {film.genre?.[0] && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold"
              style={{ background: color.chip }}
            >
              {film.genre[0]}
            </span>
          )}
          {year && (
            <span
              className="font-mono text-[10px] px-3 py-1 rounded-full flex items-center gap-1"
              style={{ background: color.chip }}
            >
              <CalendarDays size={10} /> {year}
            </span>
          )}
          {film.runtime && (
            <span
              className="font-mono text-[10px] px-3 py-1 rounded-full flex items-center gap-1"
              style={{ background: color.chip }}
            >
              <Clock size={10} /> {Math.floor(film.runtime / 60)}:{String(film.runtime % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Thumbnail / trailer preview */}
        <div className="rounded-xl overflow-hidden" style={{ height: 140 }}>
          <VideoPreviewCard
            trailerSrc={film.trailerUrl}
            videoSrc={film.videoUrl}
            posterSrc={film.thumbnailUrl}
            aspectRatio="16:9"
            onHoverChange={setIsHovered}
          >
            {hasVideo && (
              <div
                className={cn(
                  'absolute top-2 right-2 z-10 transition-opacity duration-200',
                  isHovered ? 'opacity-100' : 'opacity-0',
                )}
              >
                <span
                  className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(22,20,19,0.85)', color: '#E8DDCB' }}
                >
                  <Play size={8} fill="currentColor" />
                  {film.trailerUrl ? 'Trailer' : 'Preview'}
                </span>
              </div>
            )}
            {film.isFilmOfTheWeek && (
              <div className="absolute top-2 left-2 z-10">
                <span
                  className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                  style={{ background: '#161413', color: '#B28A52' }}
                >
                  <Trophy size={8} /> FOTW
                </span>
              </div>
            )}
          </VideoPreviewCard>
        </div>

        {/* Bottom row: avatar + name + rating/votes */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={uploaderName} src={film.uploader?.avatar} size="xs" />
            <p className="font-mono text-[10px] truncate">{uploaderName}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(film.rating ?? 0) > 0 && (
              <span
                className="font-mono text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                style={{ background: color.chip }}
              >
                <Star size={9} fill="currentColor" />
                {(film.rating as number).toFixed(1)}
              </span>
            )}
            {(film.votes ?? 0) > 0 && (
              <span
                className="font-mono text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                style={isLeading ? { background: '#161413', color: '#B28A52' } : { background: color.chip }}
              >
                <ArrowUp size={9} strokeWidth={2.5} />
                {(film.votes ?? 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
