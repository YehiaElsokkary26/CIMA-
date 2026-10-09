import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Pencil, Play, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'
import VideoPreviewCard from './VideoPreviewCard'

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

  const hasVideo = !!(film.trailerUrl ?? film.videoUrl)
  const uploaderName = film.uploader?.name ?? 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.45), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: 'easeOut' } }}
      className={cn('rounded-2xl overflow-hidden bg-card border border-border', className)}
    >
      <Link to={`/film/${film.id}`} className="block" tabIndex={-1}>
        {/* Poster / video area */}
        <VideoPreviewCard
          trailerSrc={film.trailerUrl}
          videoSrc={film.videoUrl}
          posterSrc={film.thumbnailUrl}
          aspectRatio="2:3"
          onHoverChange={setIsHovered}
        >
          {/* Trailer preview pill — top center, on hover */}
          {hasVideo && (
            <div
              className={cn(
                'absolute top-2.5 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200',
                isHovered ? 'opacity-100' : 'opacity-0',
              )}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 text-white text-[10px] font-semibold px-3 py-1">
                <Play size={9} fill="currentColor" />
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
                'absolute top-2.5 right-2.5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 transition-opacity duration-200',
                isHovered ? 'opacity-100' : 'opacity-0',
              )}
              aria-label="Edit film"
            >
              <Pencil size={13} className="text-white" />
            </button>
          )}

          {/* Rating badge — bottom left of poster */}
          {(film.rating ?? 0) > 0 && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 text-white text-xs px-2 py-0.5">
                <Star size={10} fill="currentColor" />
                {(film.rating as number).toFixed(1)}
              </span>
            </div>
          )}
        </VideoPreviewCard>

        {/* Below-poster info */}
        <div className="p-3 space-y-0.5">
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {film.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{uploaderName}</p>
        </div>
      </Link>
    </motion.div>
  )
}
