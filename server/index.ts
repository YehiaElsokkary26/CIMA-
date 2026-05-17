import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import rateLimit from 'express-rate-limit'

import { pool } from './db'
import { errorHandler } from './lib/errors'

import authRoutes         from './routes/auth'
import filmsRoutes        from './routes/films'
import usersRoutes        from './routes/users'
import cimaRoutes         from './routes/cima'
import discoverRoutes     from './routes/discover'
import notificationsRoutes from './routes/notifications'

// ---- Setup ------------------------------------------------------------------

const PORT    = parseInt(process.env.PORT || '3001', 10)
const UPLOADS = path.join(__dirname, 'uploads')

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true })

// ---- App --------------------------------------------------------------------

const app = express()

// CORS — allow dev frontend + any origin in development
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173').split(',')

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true)
    } else {
      cb(new Error(`CORS: ${origin} not allowed`))
    }
  },
  credentials: true,
}))

// Rate limits
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many auth requests, try again later' } }))
app.use('/api',      rateLimit({ windowMs: 60 * 1000,      max: 300 }))

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Static uploads
app.use('/uploads', express.static(UPLOADS))

// ---- Routes -----------------------------------------------------------------

app.use('/api/auth',          authRoutes)
app.use('/api/films',         filmsRoutes)
app.use('/api/users',         usersRoutes)
app.use('/api/cima',          cimaRoutes)
app.use('/api/discover',      discoverRoutes)
app.use('/api/notifications', notificationsRoutes)

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

// 404 for unknown API routes
app.use('/api/*', (_req, res) => res.status(404).json({ message: 'Route not found' }))

// Global error handler — MUST be last
app.use(errorHandler)

// ---- Start ------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`
  ┌────────────────────────────────────────┐
  │  🎬  Cima API                          │
  │      http://localhost:${PORT}               │
  │                                        │
  │  Demo:  demo@cima.film / password      │
  │  Viewer: viewer@cima.film / password   │
  └────────────────────────────────────────┘
  `)
})

export default app
