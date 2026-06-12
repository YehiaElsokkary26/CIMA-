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
          <div className="w-full h-full" style={{ background: '#161413' }} />
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

      {/* Film-burn gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(22,20,19,0.92) 0%, rgba(74,30,36,0.75) 35%, rgba(74,30,36,0.35) 65%, transparent 100%)',
        }}
      />
      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(22,20,19,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '150px',
          opacity: 0.07,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Left editorial content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7 max-w-md">
        {/* Label row */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-px w-5" style={{ background: '#B28A52' }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#B28A52' }}
          >
            Film of the Week
          </span>
        </div>

        {/* Community + votes */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: '#B28A52' }}
          >
            Voted by the Community
          </span>
          {(film.votes ?? 0) > 0 && (
            <span className="font-mono text-[10px]" style={{ color: '#E8DDCB' }}>
              · {(film.votes ?? 0).toLocaleString()} votes
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className="font-display leading-none mb-2 projector-flicker"
          style={{ color: '#E8DDCB', fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          {film.title.toUpperCase()}
        </h2>

        {/* Filmmaker + runtime + year — Rule 1: dust-brown (#8B6B5C) fails on dark overlay → use muted cream */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="font-mono text-xs" style={{ color: 'rgba(232,221,203,0.75)' }}>
            {film.uploader?.name}
          </span>
          {film.runtime && (
            <>
              <span style={{ color: 'rgba(232,221,203,0.35)' }}>·</span>
              <span className="font-mono text-xs" style={{ color: 'rgba(232,221,203,0.75)' }}>
                {formatRuntime(film.runtime)}
              </span>
            </>
          )}
          {film.year && (
            <>
              <span style={{ color: 'rgba(232,221,203,0.35)' }}>·</span>
              <span className="font-mono text-xs" style={{ color: 'rgba(232,221,203,0.75)' }}>
                {film.year}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {film.description && (
          <p
            className="font-sans text-xs leading-relaxed line-clamp-2 mb-4 max-w-xs"
            style={{ color: 'rgba(232,221,203,0.75)' }}
          >
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

      {/* Bottom right: countdown + ticket stub */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 select-none pointer-events-none">
        <WeeklyCountdown />
        <div
          className="font-mono text-[8px] uppercase tracking-[0.2em] px-3 py-1.5"
          style={{
            background: '#4A1E24',
            color: '#B28A52',
            border: '0.5px solid rgba(178,138,82,0.35)',
            transform: 'rotate(1.5deg)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#A32626', fontSize: 7 }}>◆</span>
            Admit One
          </div>
          <div className="mt-0.5 opacity-60" style={{ fontSize: 7 }}>
            {film.genre?.[0] ?? 'Short Film'} · {film.year}
          </div>
        </div>
      </div>
    </div>
  )
}
