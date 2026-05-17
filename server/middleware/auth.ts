import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin, query } from '../db'
import { AppError } from '../lib/errors'

export interface AuthRequest extends Request {
  userId?:   string
  userRole?: string
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

    // Pull role from our profiles table (Supabase Auth doesn't store app roles)
    const profileRes = await query<{ role: string }>(
      'SELECT role FROM profiles WHERE id = $1',
      [user.id]
    )

    req.userId   = user.id
    req.userRole = profileRes.rows[0]?.role ?? 'viewer'
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
        const profileRes = await query<{ role: string }>(
          'SELECT role FROM profiles WHERE id = $1',
          [user.id]
        )
        req.userId   = user.id
        req.userRole = profileRes.rows[0]?.role ?? 'viewer'
      }
    } catch { /* ignore — token verification failure is fine for optional auth */ }
  }
  next()
}
