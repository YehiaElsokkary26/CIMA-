import { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'
import { AppError } from '../lib/errors'

/** Factory: requireRole('filmmaker') rejects anyone whose profile role doesn't match. */
export function requireRole(role: 'filmmaker' | 'viewer') {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.userRole !== role) {
      next(new AppError(`This action requires the ${role} role`, 403, 'FORBIDDEN'))
      return
    }
    next()
  }
}

// Back-compat alias used by existing route files
export const isFilmmaker = requireRole('filmmaker')
