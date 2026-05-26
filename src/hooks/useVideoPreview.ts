import { useRef, useCallback } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useVideoPreview(options?: { limit30s?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const handlerRef = useRef<(() => void) | null>(null)

  const play = useCallback(
    async () => {
      if (prefersReducedMotion()) return
      const video = videoRef.current
      if (!video) return

      // Remove stale time-limit listener before re-playing
      if (handlerRef.current) {
        video.removeEventListener('timeupdate', handlerRef.current)
        handlerRef.current = null
      }

      video.currentTime = 0

      if (options?.limit30s) {
        const handler = () => {
          if (videoRef.current && videoRef.current.currentTime >= 30) {
            videoRef.current.pause()
          }
        }
        handlerRef.current = handler
        video.addEventListener('timeupdate', handler)
      }

      try {
        await video.play()
      } catch {
        // Autoplay blocked — poster stays visible
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.limit30s],
  )

  const pause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (handlerRef.current) {
      video.removeEventListener('timeupdate', handlerRef.current)
      handlerRef.current = null
    }
    video.pause()
  }, [])

  return { videoRef, play, pause }
}
