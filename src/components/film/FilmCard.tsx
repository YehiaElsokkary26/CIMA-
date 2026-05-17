import { Link } from 'react-router-dom'
import { Play, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn, formatRuntime } from '@/lib/utils'
import type { Film } from '@/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'

interface FilmCardProps {
  film: Film
  index?: number
  className?: string
  compact?: boolean
}

export default function FilmCard({ film, index = 0, className, compact = false }: FilmCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link
        to={`/film/${film.id}`}
        className={cn('block rounded-2xl overflow-hidden shadow-card bg-card border border-border film-card-hover group', className)}
      >
        {/* Poster */}
        <div className={cn('relative w-full bg-muted overflow-hidden', compact ? 'aspect-[3/4]' : 'aspect-video')}>
          {film.thumbnailUrl ? (
            <img
              src={film.thumbnailUrl}
              alt={film.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-muted">
              <Play size={32} className="text-muted-foreground/40" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="film-overlay">
            <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 flex items-center gap-2 font-sans font-semibold text-sm shadow-glow-orange">
              <Play size={14} fill="currentColor" />
              Watch
            </div>
          </div>

          {/* Genre badge */}
          {film.genre?.[0] && (
            <div className="absolute top-2 left-2">
              <Badge variant="film">{film.genre[0]}</Badge>
            </div>
          )}

          {/* Runtime */}
          {film.runtime && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/70 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Clock size={10} className="text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">{formatRuntime(film.runtime)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        {!compact && (
          <div className="p-3 space-y-1.5">
            <h3 className="font-display text-xl uppercase tracking-wider text-foreground leading-none line-clamp-1">
              {film.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {film.uploader?.name ?? 'Unknown'} · {film.year}
              </span>
              {film.rating !== undefined && (
                <StarRating value={Math.round(film.rating)} size="sm" />
              )}
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  )
}
