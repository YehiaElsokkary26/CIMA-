import type { Film } from '@/types'
import { getCurrentWeekKey } from './votingUtils'

/** Illustrated still scenes, see components/klaket/Still.tsx */
export const STILL_KINDS = ['smith', 'tram', 'koshary', 'delta', 'rooftop', 'mother', 'ful'] as const
export type StillKind = (typeof STILL_KINDS)[number] | 'portrait'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Stable illustrated still for a film that has no thumbnail. */
export function stillKindFor(id: string): StillKind {
  return STILL_KINDS[hash(id) % STILL_KINDS.length]
}

/** Poster colourways, cycled per film so the feed reads like a wall of afeesh. */
const POSTERS = [
  { bg: '#C42320', fg: '#F1E8D3', title: '#F1B51C' },
  { bg: '#1A6A65', fg: '#F1E8D3', title: '#F1B51C' },
  { bg: '#F1B51C', fg: '#15120E', title: '#C42320' },
  { bg: '#15120E', fg: '#F1E8D3', title: '#F0614F' },
] as const

export function posterColors(id: string) {
  return POSTERS[hash(id) % POSTERS.length]
}

/** "2026-W45" → 45 */
export function weekNumber(weekKey = getCurrentWeekKey()): number {
  return parseInt(weekKey.split('-W')[1] ?? '0', 10)
}

/** Seconds → SMPTE-style timecode 00:MM:SS:00 */
export function timecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec, 0].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Runtime in minutes → "12 min" */
export function runtimeLabel(minutes?: number): string {
  return minutes ? `${minutes} min` : '—'
}

/** Roll = school or year, the way a slate names the roll of film. */
export function rollFor(film: Film): string {
  const school = film.uploader?.school
  const yr = `’${String(film.year).slice(-2)}`
  if (!school) return `${film.year}`
  const short = school
    .split(/[\s,]+/)
    .filter((w) => /^[A-Z]/.test(w) && !['of', 'the'].includes(w.toLowerCase()))
    .map((w) => (w.length <= 4 && w === w.toUpperCase() ? w : w[0]))
    .join('')
    .slice(0, 5)
  return `${short || school.slice(0, 4)} ${yr}`
}

/**
 * Reviews double as notes on the cut. A note can start with a timecode,
 * e.g. "[00:03:41] the cut on the hammer strike…". Pull it out if present.
 */
export function splitTimecodedNote(body: string): { tc: string | null; text: string } {
  const m = body.match(/^\s*\[(\d{1,2}:\d{2}(?::\d{2}){0,2})\]\s*(.*)$/s)
  if (!m) return { tc: null, text: body }
  const parts = m[1].split(':')
  while (parts.length < 4) parts.length === 2 ? parts.unshift('00') : parts.push('00')
  return { tc: parts.map((p) => p.padStart(2, '0')).join(':'), text: m[2] }
}
