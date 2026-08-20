/** ISO week key (e.g. "2026-W34") — the server-side source of truth for weekly voting. */
export function getCurrentWeekKey(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun … 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToMonday),
  )

  const jan4 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 4))
  const dayOfJan4 = jan4.getUTCDay() || 7
  const weekOneStart = new Date(jan4)
  weekOneStart.setUTCDate(jan4.getUTCDate() + 1 - dayOfJan4)

  const weekNum =
    Math.floor((monday.getTime() - weekOneStart.getTime()) / (7 * 864e5)) + 1

  return `${monday.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}
