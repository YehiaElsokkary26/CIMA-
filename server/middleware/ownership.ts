import { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth'
import { query } from '../db'
import { AppError, notFound } from '../lib/errors'

/**
 * Factory: requireOwner('films', 'filmmaker_id') loads the row at
 * req.params.id from the given table and rejects unless req.userId
 * matches the given owner column. 404s (not 403s) when the row is
 * missing, so existence isn't leaked to non-owners.
 */
export function requireOwner(table: string, ownerColumn: string, idParam = 'id') {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const id = req.params[idParam]
    try {
      const result = await query<Record<string, string>>(
        `SELECT ${ownerColumn} AS owner_id FROM ${table} WHERE id = $1`,
        [id]
      )
      if (!result.rowCount) { next(notFound()); return }
      if (result.rows[0].owner_id !== req.userId) {
        next(new AppError('You do not have permission to modify this resource', 403, 'FORBIDDEN'))
        return
      }
      next()
    } catch (err) { next(err) }
  }
}
