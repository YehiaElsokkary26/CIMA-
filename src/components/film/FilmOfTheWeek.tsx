import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Play } from 'lucide-react'
import type { Film } from '@/types'
import { formatRuntime } from '@/lib/utils'
import { useVideoPreview } from '@/hooks/useVideoPreview'
import WeeklyCountdown from './WeeklyCountdown'

interface FilmOfTheWeekProps {
  film: Film
}

export default function FilmOfTheWeek({ film }: FilmOfTheWeekProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { videoRef, play, pause } = useVideoPreview()

  const activeSrc = film.trailerUrl ?? film.videoUrl

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const rawY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const y = useSpring(rawY, { stiffness: 120, damping: 30 })

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (activeSrc) play()
  }
  const handleMouseLeave = () => {
    setIsHovered(false)
    if (activeSrc) pause()
  }

  return (
    <div
      ref={ref}
      className="relative overflow-hidden mx-4 my-3"
      style={{ height: 'clamp(260px, 38vw, 420px)', borderRadius: 20 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Poster — parallax */}
      <motion.div className="absolute inset-0 scale-110" style={{ y }}>
        {film.thumbnailUrl ? (
          <img
            src={film.thumbnailUrl}
            alt={film.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: isHovered && activeSrc ? 0 : 1 }}
          />
        ) : (
          <div className="w-full h-full bg-card" />
        )}

        {/* Video background */}
        {activeSrc && (
          <video
            ref={videoRef}
            src={activeSrc}
            preload="none"
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: isHovered ? 1 : 0 }}
          />
        )}
      </motion.div>

      {/* Hero overlay for text legibility */}
      <div className="absolute inset-0 pointer-events-none hero-overlay" />
      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Left editorial content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7 max-w-md">
        {/* Label row */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-px w-5 bg-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
            Film of the Week
          </span>
        </div>

        {/* Community + votes */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/60">
            Voted by the Community
          </span>
          {(film.votes ?? 0) > 0 && (
            <span className="text-[10px] text-white/80">
              · {(film.votes ?? 0).toLocaleString()} votes
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className="font-display leading-none mb-2 text-white"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          {film.title.toUpperCase()}
        </h2>

        {/* Filmmaker + runtime + year */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs text-white/75">
            {film.uploader?.name}
          </span>
          {film.runtime && (
            <>
              <span className="text-white/35">·</span>
              <span className="text-xs text-white/75">
                {formatRuntime(film.runtime)}
              </span>
            </>
          )}
          {film.year && (
            <>
              <span className="text-white/35">·</span>
              <span className="text-xs text-white/75">
                {film.year}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {film.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-4 max-w-xs text-white/75">
            {film.description}
          </p>
        )}

        {/* Watch Now */}
        <Link
          to={`/film/${film.id}`}
          className="btn-cima inline-flex items-center gap-2 w-fit"
          style={{ letterSpacing: '0.15em' }}
        >
          <Play size={11} fill="currentColor" />
          Watch Now
        </Link>
      </div>

      {/* Bottom right: countdown */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 select-none pointer-events-none">
        <WeeklyCountdown />
      </div>
    </div>
  )
}
