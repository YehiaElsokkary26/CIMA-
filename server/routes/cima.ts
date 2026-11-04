/**
 * Crew ("Cima" in the database and URLs). A request goes from one filmmaker
 * to another; when it is accepted, both people are added to each other's crew.
 */
import { Router, Response, NextFunction } from 'express'
import { query, transaction } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { validUuid } from '../lib/validators'
import { notFound, conflict, AppError } from '../lib/errors'
import { createNotification } from '../lib/notify'

const router = Router()

// Emails are never included here: crew lists and requests only need public profile fields.
const PUBLIC_PROFILE = `p.id AS uid, p.name, p.role, p.bio, p.school, p.city,
                        p.avatar_url, p.top_genre, p.crew_roles, p.created_at AS ucreated`

function mapPerson(r: any) {
  return {
    id:        r.uid,
    name:      r.name,
    email:     '',
    role:      r.role,
    bio:       r.bio ?? undefined,
    school:    r.school ?? undefined,
    city:      r.city ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    topGenre:  r.top_genre ?? undefined,
    crewRoles: r.crew_roles ?? [],
    createdAt: r.ucreated,
  }
}

// ---- GET /api/cima/mine -----------------------------------------------------
router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [membersRes, requestsRes] = await Promise.all([
      query(
        `SELECT cm.id, cm.joined_at, ${PUBLIC_PROFILE}
         FROM   cima_members cm
         JOIN   profiles p ON p.id = cm.member_id
         WHERE  cm.owner_id = $1
         ORDER  BY cm.joined_at DESC`,
        [req.userId]
      ),
      query(
        `SELECT cr.id, cr.status, cr.created_at, ${PUBLIC_PROFILE}
         FROM   cima_requests cr
         JOIN   profiles p ON p.id = cr.from_user_id
         WHERE  cr.to_user_id = $1 AND cr.status = 'pending'
         ORDER  BY cr.created_at DESC`,
        [req.userId]
      ),
    ])

    res.json({
      members: membersRes.rows.map((m) => ({ id: m.id, joinedAt: m.joined_at, user: mapPerson(m) })),
      requests: requestsRes.rows.map((r) => ({
        id: r.id, fromUserId: r.uid, toUserId: req.userId, status: r.status, createdAt: r.created_at,
        from: mapPerson(r),
      })),
    })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/request/:targetUserId -----------------------------------
router.post('/request/:targetUserId', validUuid('targetUserId'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetUserId = req.params.targetUserId as string
  if (targetUserId === req.userId) {
    next(new AppError('You can’t send a call sheet to yourself', 400, 'SELF_REQUEST')); return
  }
  try {
    const targetRes = await query('SELECT id FROM profiles WHERE id = $1', [targetUserId])
    if (!targetRes.rowCount) throw notFound('User')

    const already = await query(
      'SELECT 1 FROM cima_members WHERE owner_id = $1 AND member_id = $2',
      [req.userId, targetUserId]
    )
    if (already.rowCount) throw conflict('You are already on each other’s crew')

    // Only a pending request blocks a resend; declined ones can be sent again.
    const existing = await query(
      'SELECT status FROM cima_requests WHERE from_user_id = $1 AND to_user_id = $2',
      [req.userId, targetUserId]
    )
    if (existing.rowCount && existing.rows[0].status === 'pending') {
      throw conflict('Call sheet already sent')
    }

    const result = await query(
      `INSERT INTO cima_requests (from_user_id, to_user_id, status)
       VALUES ($1,$2,'pending')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET status = 'pending', updated_at = NOW()
       RETURNING id`,
      [req.userId, targetUserId]
    )

    const fromRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
    await createNotification({
      userId:     targetUserId,
      type:       'cima_request',
      message:    `${fromRes.rows[0]?.name ?? 'Someone'} sent you a call sheet`,
      fromUserId: req.userId,
    })

    res.status(201).json({ id: result.rows[0].id, status: 'pending' })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/accept/:requestId ---------------------------------------
router.post('/accept/:requestId', validUuid('requestId'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reqRes = await query(
      `SELECT * FROM cima_requests WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [req.params.requestId, req.userId]
    )
    if (!reqRes.rowCount) throw notFound('Call sheet')
    const crewReq = reqRes.rows[0]

    // Crew is mutual: add each person to the other's crew in one transaction.
    await transaction(async (client) => {
      await client.query(
        `UPDATE cima_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
        [crewReq.id]
      )
      await client.query(
        `INSERT INTO cima_members (owner_id, member_id)
         VALUES ($1,$2), ($2,$1)
         ON CONFLICT (owner_id, member_id) DO NOTHING`,
        [req.userId, crewReq.from_user_id]
      )
    })

    const toRes = await query('SELECT name FROM profiles WHERE id = $1', [req.userId])
    await createNotification({
      userId:     crewReq.from_user_id,
      type:       'cima_accepted',
      message:    `${toRes.rows[0]?.name ?? 'Someone'} signed on to your crew`,
      fromUserId: req.userId,
    })

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- POST /api/cima/decline/:requestId --------------------------------------
router.post('/decline/:requestId', validUuid('requestId'), authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE cima_requests SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING id`,
      [req.params.requestId, req.userId]
    )
    if (!result.rowCount) throw notFound('Call sheet')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
