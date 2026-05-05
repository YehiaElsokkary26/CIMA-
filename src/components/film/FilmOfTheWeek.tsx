import { Link } from 'react-router-dom'
import { Play, Film } from 'lucide-react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef } from 'react'
import type { Film as FilmType } from '@/types'
import Button from '@/components/ui/Button'
import { formatRuntime } from '@/lib/utils'

interface FilmOfTheWeekProps {
  film: FilmType
}

export default function FilmOfTheWeek({ film }: FilmOfTheWeekProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const rawY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const y = useSpring(rawY, { stiffness: 120, damping: 30 })

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl shadow-film mx-4 my-4">
      {/* Background poster with parallax */}
      <div className="relative h-72 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y }}>
          {film.thumbnailUrl ? (
            <img
              src={film.thumbnailUrl}
              alt={film.title}
              className="w-full h-full object-cover scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary via-accent/60 to-background" />
          )}
        </motion.div>

        {/* Grain on this card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '150px',
            opacity: 0.08,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-center gap-2 mb-3">
            <Film size={12} className="text-primary" />
            <span className="font-mono text-xs text-primary uppercase tracking-[0.2em]">
              Film of the Week
            </span>
          </div>

          <h2 className="font-display text-4xl uppercase tracking-widest text-foreground leading-none mb-2 projector-flicker">
            {film.title}
          </h2>

          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-muted-foreground">
              {film.uploader?.name}
            </span>
            {film.runtime && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatRuntime(film.runtime)}
                </span>
              </>
            )}
            {film.year && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-xs text-muted-foreground">{film.year}</span>
              </>
            )}
          </div>

          {film.description && (
            <p className="font-sans text-xs text-muted-foreground line-clamp-2 mb-4 max-w-xs">
              {film.description}
            </p>
          )}

          <Link to={`/film/${film.id}`}>
            <Button size="sm" pulse className="w-fit">
              <Play size={13} fill="currentColor" />
              Watch Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
