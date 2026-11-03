import { Request, Response, NextFunction } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabaseAdmin, query } from '../db'
import { AppError } from '../lib/errors'

export interface AuthRequest extends Request {
  userId?:   string
  userRole?: string
}

/**
 * Looks up this verified Supabase user's role from our profiles table.
 *
 * Safety net: the handle_new_user DB trigger is supposed to create the
 * profile row at signup, but if it didn't fire for any reason (timing,
 * trigger disabled, manually created auth user, etc.), self-heal here so a
 * verified Supabase Auth user is never stuck without a profile row.
 * Bootstraps from the same auth metadata the trigger itself reads.
 */
async function getOrCreateRole(user: User): Promise<string> {
  const profileRes = await query<{ role: string }>(
    'SELECT role FROM profiles WHERE id = $1',
    [user.id]
  )
  if (profileRes.rowCount) return profileRes.rows[0].role

  const meta = (user.user_metadata ?? {}) as { name?: string; role?: string }
  const name = meta.name || user.email?.split('@')[0] || ''
  const role = meta.role === 'filmmaker' ? 'filmmaker' : 'viewer'
  await query(
    `INSERT INTO profiles (id, name, email, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [user.id, name, user.email ?? '', role]
  )
  const retry = await query<{ role: string }>(
    'SELECT role FROM profiles WHERE id = $1',
    [user.id]
  )
  return retry.rows[0]?.role ?? role
}

/**
 * Verifies the Supabase JWT sent in the Authorization header.
 * Attaches req.userId (Supabase Auth UID) and req.userRole (from profiles table).
 */
export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED'))
    return
  }

  const token = header.slice(7)
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      next(new AppError('Token is invalid or expired', 401, 'TOKEN_INVALID'))
      return
    }

    req.userId   = user.id
    req.userRole = await getOrCreateRole(user)
    next()
  } catch {
    next(new AppError('Token is invalid or expired', 401, 'TOKEN_INVALID'))
  }
}

/**
 * Same as authMiddleware but never rejects — simply leaves req.userId undefined
 * when no valid token is present.
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(header.slice(7))
      if (!error && user) {
        req.userId   = user.id
        req.userRole = await getOrCreateRole(user)
      }
    } catch { /* ignore — token verification failure is fine for optional auth */ }
  }
  next()
}
