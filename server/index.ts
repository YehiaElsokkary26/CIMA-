import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { pool } from './db'
import { errorHandler } from './lib/errors'

import authRoutes          from './routes/auth'
import filmsRoutes         from './routes/films'
import profilesRoutes      from './routes/profiles'
import cimaRoutes          from './routes/cima'
import discoverRoutes      from './routes/discover'
import notificationsRoutes from './routes/notifications'
import searchRoutes        from './routes/search'
import watchlistRoutes     from './routes/watchlist'
import followsRoutes       from './routes/follows'

// ---- Setup ------------------------------------------------------------------
// Note: film/thumbnail/trailer/avatar media is uploaded directly from the
// browser to Supabase Storage (see src/lib/storage.ts) — Express never
// touches raw file bytes. It only persists the resulting storage URLs.

const PORT = parseInt(process.env.PORT || '3001', 10)

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
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: { code: 'RATE_LIMITED', message: 'Too many auth requests, try again later' } } }))
app.use('/api',      rateLimit({ windowMs: 60 * 1000,      max: 300, message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' } } }))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ---- Routes -----------------------------------------------------------------

app.use('/api/auth',          authRoutes)
app.use('/api/films',         filmsRoutes)
app.use('/api/profiles',      profilesRoutes)
app.use('/api/cima',          cimaRoutes)
app.use('/api/discover',      discoverRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/watchlist',     watchlistRoutes)
app.use('/api/follows',       followsRoutes)

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
app.use('/api/*', (_req, res) => res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } }))

// Global error handler — MUST be last
app.use(errorHandler)

// ---- Start ------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`
  ┌────────────────────────────────────────┐
  │  🎬  Cima API                          │
  │      http://localhost:${PORT}               │
  └────────────────────────────────────────┘
  `)
})

export default app
