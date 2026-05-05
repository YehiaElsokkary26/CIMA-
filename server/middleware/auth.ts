import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../lib/errors'

export const JWT_SECRET = process.env.JWT_SECRET || 'cima_dev_secret_change_in_production'
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d'

export interface AuthRequest extends Request {
  userId?:   string
  userRole?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED'))
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    req.userId   = payload.userId
    req.userRole = payload.role
    next()
  } catch (err) {
    next(new AppError('Token is invalid or expired', 401, 'TOKEN_INVALID'))
  }
}

/** Middleware — attach user if token present, but don't fail if absent */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; role: string }
      req.userId   = payload.userId
      req.userRole = payload.role
    } catch { /* ignore */ }
  }
  next()
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any)
}
