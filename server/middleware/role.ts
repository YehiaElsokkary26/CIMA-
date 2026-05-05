import { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'
import { AppError } from '../lib/errors'

export function isFilmmaker(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'filmmaker') {
    next(new AppError('This action requires the Filmmaker role', 403, 'FORBIDDEN'))
    return
  }
  next()
}
