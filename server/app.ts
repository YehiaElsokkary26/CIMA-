/**
 * The Express app, without starting a server. index.ts listens on a port;
 * the tests import this file directly.
 */
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { pool } from './db'
import { errorHandler } from './lib/errors'

import filmsRoutes         from './routes/films'
import usersRoutes         from './routes/users'
import cimaRoutes          from './routes/cima'
import discoverRoutes      from './routes/discover'
import notificationsRoutes from './routes/notifications'

export function createApp() {
  const app = express()

  // Behind a proxy (Render, Fly, etc.) the rate limiter needs the real client IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY)
  app.disable('x-powered-by')

  // CORS: the listed origins always; any origin in development.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        cb(null, true)
      } else {
        cb(new Error(`CORS: ${origin} not allowed`))
      }
    },
    credentials: true,
  }))

  app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Try again in a minute.', code: 'RATE_LIMITED' },
  }))

  app.use(express.json({ limit: '1mb' }))

  // ---- Routes ---------------------------------------------------------------
  app.use('/api/films',         filmsRoutes)
  app.use('/api/users',         usersRoutes)
  app.use('/api/cima',          cimaRoutes)
  app.use('/api/discover',      discoverRoutes)
  app.use('/api/notifications', notificationsRoutes)

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() })
    } catch {
      res.status(503).json({ status: 'error', db: 'disconnected' })
    }
  })

  app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found', code: 'NOT_FOUND' }))

  app.use(errorHandler)
  return app
}

export default createApp
