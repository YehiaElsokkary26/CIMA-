import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin, query } from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { validate, registerSchema, loginSchema } from '../lib/validators'
import { AppError } from '../lib/errors'

const router = Router()

// ---- helpers ----------------------------------------------------------------

function safeUser(u: any) {
  return {
    id:                      u.id,
    name:                    u.name,
    email:                   u.email,
    role:                    u.role,
    bio:                     u.bio       ?? undefined,
    school:                  u.school    ?? undefined,
    city:                    u.city      ?? undefined,
    avatarUrl:               u.avatar_url ?? undefined,
    topGenre:                u.top_genre  ?? undefined,
    lookingForCollaborators: !!u.looking_for_collaborators,
    createdAt:               u.created_at,
  }
}

// ---- POST /api/auth/register ------------------------------------------------

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body
  try {
    // Create user in Supabase Auth — the DB trigger auto-creates their profile row
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

    if (authError) {
      // Supabase returns different messages depending on version; normalise them
      const msg = authError.message?.toLowerCase() ?? ''
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('email_exists')) {
        next(new AppError('Email is already registered', 409, 'CONFLICT')); return
      }
      next(new AppError(authError.message ?? 'Registration failed', 400)); return
    }

    // Immediately sign in to obtain a fresh access token for the client
    const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (signInError || !session?.session) {
      next(new AppError('Account created — please log in to continue', 200)); return
    }

    // The profile trigger may need a moment on very fast DB connections
    await new Promise((r) => setTimeout(r, 250))

    const profileRes = await query('SELECT * FROM profiles WHERE id = $1', [authData.user!.id])
    const profile = profileRes.rows[0]

    res.status(201).json({ token: session.session.access_token, user: safeUser(profile) })
  } catch (err) { next(err) }
})

// ---- POST /api/auth/login ---------------------------------------------------

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (error || !data?.session) {
      next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')); return
    }

    const profileRes = await query('SELECT * FROM profiles WHERE id = $1', [data.user.id])
    const profile = profileRes.rows[0]

    if (!profile) {
      // Edge case: Auth user exists but profile trigger hasn't run yet — create it now
      await query(
        `INSERT INTO profiles (id, name, email, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [data.user.id, data.user.user_metadata?.name ?? email.split('@')[0], email, data.user.user_metadata?.role ?? 'viewer']
      )
      const newProfileRes = await query('SELECT * FROM profiles WHERE id = $1', [data.user.id])
      return res.json({ token: data.session.access_token, user: safeUser(newProfileRes.rows[0]) })
    }

    res.json({ token: data.session.access_token, user: safeUser(profile) })
  } catch (err) { next(err) }
})

// ---- GET /api/auth/me -------------------------------------------------------

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.userId])
    if (!result.rowCount) throw new AppError('User not found', 404)
    res.json(safeUser(result.rows[0]))
  } catch (err) { next(err) }
})

export default router
