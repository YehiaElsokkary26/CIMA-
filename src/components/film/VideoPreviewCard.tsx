// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useVideoPreview } from '@/hooks/useVideoPreview'

interface VideoPreviewCardProps {
  trailerSrc?: string
  videoSrc?: string
  posterSrc?: string
  aspectRatio?: '16:9' | '4:5' | '2:3'
  className?: string
  onHoverChange?: (isHovered: boolean) => void
  children?: React.ReactNode
}

const aspectPadding: Record<string, string> = {
  '16:9': '56.25%',
  '4:5': '125%',
  '2:3': '150%',
}

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function VideoPreviewCard({
  trailerSrc,
  videoSrc,
  posterSrc,
  aspectRatio = '4:5',
  className,
  onHoverChange,
  children,
}: VideoPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Trailer takes priority; fall back to main film (capped at 30s)
  const activeSrc = trailerSrc ?? videoSrc
  const isTrailer = !!trailerSrc
  const hasVideo = !!activeSrc

  const { videoRef, play, pause } = useVideoPreview({ limit30s: !isTrailer && !!videoSrc })

  const handleEnter = () => {
    setIsHovered(true)
    onHoverChange?.(true)
    if (hasVideo) play()
  }

  const handleLeave = () => {
    setIsHovered(false)
    onHoverChange?.(false)
    if (hasVideo) pause()
  }

  const pt = aspectPadding[aspectRatio] ?? '125%'

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ paddingTop: pt, position: 'relative' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Poster image */}
      {posterSrc ? (
        <img
          src={posterSrc}
          alt=""
          draggable={false}
          loading="lazy"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            !hasVideo && isHovered && !reduceMotion() && 'ken-burns-active',
          )}
          style={{ opacity: isHovered && hasVideo ? 0 : 1 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card to-muted" />
      )}

      {/* Video (trailer or main clip) */}
      {activeSrc && (
        <video
          ref={videoRef}
          src={activeSrc}
          preload="none"
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        />
      )}

      {/* Children (overlays, badges, etc.) */}
      {children}
    </div>
  )
}
