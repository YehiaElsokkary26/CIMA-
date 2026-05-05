import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFound(resource = 'Resource') {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND')
}

export function forbidden(msg = 'Forbidden') {
  return new AppError(msg, 403, 'FORBIDDEN')
}

export function conflict(msg: string) {
  return new AppError(msg, 409, 'CONFLICT')
}

// Global error handler — mount LAST in Express
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code })
    return
  }

  // Postgres unique violation
  if (err.code === '23505') {
    res.status(409).json({ message: 'Resource already exists', code: 'CONFLICT' })
    return
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    res.status(400).json({ message: 'Referenced resource does not exist', code: 'FK_VIOLATION' })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
}
