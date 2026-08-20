import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validateQuery, paginationSchema } from '../lib/validators'

const router = Router()

// ---- GET /api/notifications -------------------------------------------------
router.get('/', requireAuth, validateQuery(paginationSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { page, limit } = req.query as any
  try {
    const countRes = await query('SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1', [req.userId])
    const total = countRes.rows[0]?.total ?? 0

    const result = await query(
      `SELECT n.*,
              p.name       AS from_name,
              p.avatar_url AS from_avatar,
              p.role       AS from_role
       FROM   notifications n
       LEFT   JOIN profiles p ON p.id = n.from_user_id
       WHERE  n.user_id = $1
       ORDER  BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, (page - 1) * limit]
    )
    res.json({
      data: result.rows.map((n) => ({
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
      })),
      pagination: { page, hasMore: page * limit < total, total },
    })
  } catch (err) { next(err) }
})

// ---- PATCH /api/notifications/read-all  (must be before /:id) ---------------
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.userId])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- PATCH /api/notifications/:id/read --------------------------------------
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
