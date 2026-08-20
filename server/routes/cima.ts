import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, transaction } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { notFound, conflict, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'
import { validateBody } from '../lib/validators'

const router = Router()

const sendRequestSchema = z.object({ toUserId: z.string().uuid() })

function mapMember(m: any) {
  return {
    id: m.id, joinedAt: m.joined_at,
    user: { id: m.uid, name: m.name, email: m.email, role: m.role, bio: m.bio, school: m.school, city: m.city, avatarUrl: m.avatar_url, topGenre: m.top_genre, createdAt: m.created_at },
  }
}

// ---- GET /api/cima  (my crew + my incoming requests) -------------------------
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [membersRes, requestsRes] = await Promise.all([
      query(
        `SELECT cm.id, cm.joined_at,
                p.id AS uid, p.name, p.email, p.role, p.bio, p.school,
                p.city, p.avatar_url, p.top_genre, p.created_at
         FROM   cima_members cm
         JOIN   profiles p ON p.id = cm.member_id
         WHERE  cm.owner_id = $1
         ORDER  BY cm.joined_at DESC`,
        [req.userId]
      ),
      query(
        `SELECT cr.id, cr.status, cr.created_at,
                p.id AS uid, p.name, p.email, p.role, p.bio,
                p.school, p.avatar_url, p.created_at AS ucreated
         FROM   cima_requests cr
         JOIN   profiles p ON p.id = cr.from_user_id
         WHERE  cr.to_user_id = $1 AND cr.status = 'pending'
         ORDER  BY cr.created_at DESC`,
        [req.userId]
      ),
    ])

    res.json({
      members: membersRes.rows.map(mapMember),
      requests: requestsRes.rows.map((r) => ({
        id: r.id, fromUserId: r.uid, toUserId: req.userId, status: r.status, createdAt: r.created_at,
        from: { id: r.uid, name: r.name, email: r.email, role: r.role, bio: r.bio, school: r.school, avatarUrl: r.avatar_url, createdAt: r.ucreated },
      })),
    })
  } catch (err) { next(err) }
})

// ---- GET /api/cima/:userId  (public: another user's crew) --------------------
router.get('/:userId', async (req, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT cm.id, cm.joined_at,
              p.id AS uid, p.name, p.email, p.role, p.bio, p.school,
              p.city, p.avatar_url, p.top_genre, p.created_at
       FROM   cima_members cm
       JOIN   profiles p ON p.id = cm.member_id
       WHERE  cm.owner_id = $1
       ORDER  BY cm.joined_at DESC`,
      [req.params.userId]
    )
    res.json({ members: result.rows.map(mapMember) })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/requests  (body: { toUserId }) ----------------------------
router.post('/requests', requireAuth, validateBody(sendRequestSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { toUserId } = req.body
  if (toUserId === req.userId) {
    next(new AppError('You cannot send a Cima request to yourself', 400, 'SELF_REQUEST')); return
  }
  try {
    const targetRes = await query('SELECT id, name FROM profiles WHERE id = $1', [toUserId])
    if (!targetRes.rowCount) throw notFound('User')

    const existing = await query(
      `SELECT id, status FROM cima_requests WHERE from_user_id = $1 AND to_user_id = $2`,
      [req.userId, toUserId]
    )
    if (existing.rowCount! > 0 && existing.rows[0].status === 'pending') throw conflict('Cima request already sent')

    const result = await query(
      `INSERT INTO cima_requests (from_user_id, to_user_id, status)
       VALUES ($1,$2,'pending')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET status = 'pending', updated_at = NOW()
       RETURNING id`,
      [req.userId, toUserId]
    )

    const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
    await createNotification({
      userId:     toUserId,
      type:       'cima_request',
      message:    `${fromRes.rows[0]?.name ?? 'Someone'} wants to join your Cima`,
      fromUserId: req.userId,
    })

    res.status(201).json({ id: result.rows[0].id, status: 'pending' })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/requests/:id/accept ---------------------------------------
router.post('/requests/:id/accept', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reqRes = await query(
      `SELECT * FROM cima_requests WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [req.params.id, req.userId]
    )
    if (!reqRes.rowCount) throw notFound('Cima request')
    const cimaReq = reqRes.rows[0]

    await transaction(async (client) => {
      await client.query(`UPDATE cima_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`, [cimaReq.id])
      await client.query(
        `INSERT INTO cima_members (owner_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [req.userId, cimaReq.from_user_id]
      )
    })

    const toRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
    await createNotification({
      userId:     cimaReq.from_user_id,
      type:       'cima_accepted',
      message:    `${toRes.rows[0]?.name ?? 'Someone'} accepted your Cima request`,
      fromUserId: req.userId,
    })

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/requests/:id/decline ---------------------------------------
router.post('/requests/:id/decline', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE cima_requests SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING id`,
      [req.params.id, req.userId]
    )
    if (!result.rowCount) throw notFound('Cima request')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/requests/:id/cancel  (sender withdraws) -------------------
router.post('/requests/:id/cancel', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE cima_requests SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND from_user_id = $2 AND status = 'pending'
       RETURNING id`,
      [req.params.id, req.userId]
    )
    if (!result.rowCount) throw notFound('Cima request')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
