// ─── Week key ─────────────────────────────────────────────────────────────────

export function getCurrentWeekKey(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun … 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToMonday),
  )

  // ISO week: week containing Jan 4 is always week 1
  const jan4 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 4))
  const dayOfJan4 = jan4.getUTCDay() || 7
  const weekOneStart = new Date(jan4)
  weekOneStart.setUTCDate(jan4.getUTCDate() + 1 - dayOfJan4)

  const weekNum =
    Math.floor((monday.getTime() - weekOneStart.getTime()) / (7 * 864e5)) + 1

  return `${monday.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ─── Countdown ────────────────────────────────────────────────────────────────

export function getMsUntilNextWeek(): number {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday),
  )
  return Math.max(0, nextMonday.getTime() - now.getTime())
}

export function getWeekCountdown(): string {
  const ms = getMsUntilNextWeek()
  const totalSecs = Math.floor(ms / 1000)
  const days = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// ─── localStorage vote helpers ────────────────────────────────────────────────

const PREFIX = 'cima_vote_'

export function getUserVoteThisWeek(userId: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${userId}_${getCurrentWeekKey()}`)
  } catch {
    return null
  }
}

export function hasUserVotedThisWeek(userId: string): boolean {
  return getUserVoteThisWeek(userId) !== null
}

export function hasUserVotedForFilm(userId: string, filmId: string): boolean {
  return getUserVoteThisWeek(userId) === filmId
}

export function setUserVote(userId: string, filmId: string): void {
  try {
    localStorage.setItem(`${PREFIX}${userId}_${getCurrentWeekKey()}`, filmId)
  } catch {
    // localStorage unavailable — silently ignore
  }
}
