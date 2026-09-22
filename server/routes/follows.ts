import { Router, Response, NextFunction } from 'express'
import { query } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError, notFound } from '../lib/errors'

const router = Router()

// ---- GET /api/follows/:userId  (who :userId follows + who follows them) -------
router.get('/:userId', async (req, res: Response, next: NextFunction) => {
  try {
    const [followers, following] = await Promise.all([
      query(
        `SELECT p.id, p.name, p.avatar_url, p.role FROM follows fo
         JOIN profiles p ON p.id = fo.follower_id WHERE fo.following_id = $1`,
        [req.params.userId]
      ),
      query(
        `SELECT p.id, p.name, p.avatar_url, p.role FROM follows fo
         JOIN profiles p ON p.id = fo.following_id WHERE fo.follower_id = $1`,
        [req.params.userId]
      ),
    ])
    const mapRow = (r: any) => ({ id: r.id, name: r.name, avatarUrl: r.avatar_url, role: r.role, email: '', createdAt: '' })
    res.json({
      followers: followers.rows.map(mapRow),
      following: following.rows.map(mapRow),
      followerCount: followers.rowCount,
      followingCount: following.rowCount,
    })
  } catch (err) { next(err) }
})

// ---- POST /api/follows/:userId  (current user follows :userId) ----------------
router.post('/:userId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.params.userId === req.userId) {
    next(new AppError('You cannot follow yourself', 400, 'SELF_FOLLOW')); return
  }
  try {
    const targetRes = await query('SELECT id, name FROM profiles WHERE id = $1', [req.params.userId])
    if (!targetRes.rowCount) throw notFound('User')

    await query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.userId, req.params.userId]
    )
    res.status(201).json({ ok: true })
  } catch (err) { next(err) }
})

// ---- DELETE /api/follows/:userId -----------------------------------------------
router.delete('/:userId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.userId, req.params.userId])
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
