import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code: string = 'ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFound(resource = 'Resource') {
  return new AppError(`${resource} not found`, 404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`)
}

export function forbidden(msg = 'Forbidden') {
  return new AppError(msg, 403, 'FORBIDDEN')
}

export function conflict(msg: string, code = 'CONFLICT') {
  return new AppError(msg, 409, code)
}

export function badRequest(msg: string, code = 'BAD_REQUEST') {
  return new AppError(msg, 400, code)
}

// Global error handler — mount LAST in Express.
// Response shape: { error: { code, message } } everywhere.
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }

  // Postgres unique violation
  if (err.code === '23505') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } })
    return
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    res.status(400).json({ error: { code: 'FK_VIOLATION', message: 'Referenced resource does not exist' } })
    return
  }

  // Postgres check constraint violation
  if (err.code === '23514') {
    res.status(422).json({ error: { code: 'CONSTRAINT_VIOLATION', message: 'Invalid value' } })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
}
