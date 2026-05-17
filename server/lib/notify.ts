/**
 * Centralised notification creator.
 * Call this whenever an event should create a notification for a user.
 */
import { query } from '../db'

type NotifType = 'review' | 'cima_request' | 'cima_accepted' | 'rating' | 'follower'

export async function createNotification(opts: {
  userId:     string
  type:       NotifType
  message:    string
  fromUserId?: string | null
  filmId?:    string | null
}) {
  await query(
    `INSERT INTO notifications (user_id, type, message, from_user_id, film_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [opts.userId, opts.type, opts.message, opts.fromUserId ?? null, opts.filmId ?? null]
  )
}
