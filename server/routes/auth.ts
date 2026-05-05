import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db'
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth'
import { validate, registerSchema, loginSchema } from '../lib/validators'
import { AppError, conflict } from '../lib/errors'

const router = Router()

// ---- helpers ----------------------------------------------------------------

function safeUser(u: any) {
  return {
    id:                       u.id,
    name:                     u.name,
    email:                    u.email,
    role:                     u.role,
    bio:                      u.bio     ?? undefined,
    school:                   u.school  ?? undefined,
    city:                     u.city    ?? undefined,
    avatarUrl:                u.avatar_url ?? undefined,
    topGenre:                 u.top_genre  ?? undefined,
    lookingForCollaborators:  !!u.looking_for_collaborators,
    createdAt:                u.created_at,
  }
}

// ---- POST /api/auth/register ------------------------------------------------

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rowCount! > 0) throw conflict('Email is already registered')

    const hash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, hash, role]
    )
    const user  = result.rows[0]
    const token = signToken(user.id, user.role)

    res.status(201).json({ token, user: safeUser(user) })
  } catch (err) { next(err) }
})

// ---- POST /api/auth/login ---------------------------------------------------

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    const user   = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    const token = signToken(user.id, user.role)
    res.json({ token, user: safeUser(user) })
  } catch (err) { next(err) }
})

// ---- GET /api/auth/me -------------------------------------------------------

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.userId])
    if (!result.rowCount) throw new AppError('User not found', 404)
    res.json(safeUser(result.rows[0]))
  } catch (err) { next(err) }
})

export default router
