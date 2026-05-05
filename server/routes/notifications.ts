import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// ---- GET /api/notifications -------------------------------------------------
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT n.*,
              u.name       AS from_name,
              u.avatar_url AS from_avatar,
              u.role       AS from_role
       FROM   notifications n
       LEFT   JOIN users u ON u.id = n.from_user_id
       WHERE  n.user_id = $1
       ORDER  BY n.created_at DESC
       LIMIT  50`,
      [req.userId]
    )
    res.json(result.rows.map((n) => ({
      id:        n.id,
      userId:    n.user_id,
      type:      n.type,
      message:   n.message,
      read:      n.is_read,
      filmId:    n.film_id   ?? undefined,
      createdAt: n.created_at,
      fromUser:  n.from_user_id ? {
        id:        n.from_user_id,
        name:      n.from_name,
        avatarUrl: n.from_avatar,
        role:      n.from_role,
        email:     '',
        createdAt: '',
      } : undefined,
    })))
  } catch (err) { next(err) }
})

// ---- PATCH /api/notifications/read-all  (must be before /:id) ---------------
router.patch('/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.userId]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- PATCH /api/notifications/:id/read --------------------------------------
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
