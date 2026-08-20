import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// ---- shared ------------------------------------------------------------------

const GENRE_MAX = 6
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ---- auth ----------------------------------------------------------------

export const registerSchema = z.object({
  name:     z.string().trim().min(2).max(100),
  email:    z.string().trim().email(),
  password: z.string().min(6).max(100),
  role:     z.enum(['filmmaker', 'viewer']).default('viewer'),
})

export const loginSchema = z.object({
  email:    z.string().trim().email(),
  password: z.string().min(1),
})

// ---- films -----------------------------------------------------------------

const aspectRatioEnum = z.enum(['16:9', '4:5', '2:3'])
const urlField = z.string().url().max(2000).optional().nullable()

export const createFilmSchema = z.object({
  title:        z.string().trim().min(1).max(200),
  description:  z.string().trim().max(4000).default(''),
  genre:        z.array(z.string().trim().min(1).max(40)).max(GENRE_MAX).default([]),
  runtime:      z.coerce.number().int().min(1).max(600).optional(),
  year:         z.coerce.number().int().min(1900).max(2100).optional(),
  thumbnailUrl: urlField,
  videoUrl:     urlField,
  trailerUrl:   urlField,
  aspectRatio:  aspectRatioEnum.optional(),
})

export const updateFilmSchema = createFilmSchema.partial().extend({
  status: z.enum(['draft', 'uploading', 'processing', 'ready', 'published', 'failed', 'archived']).optional(),
})

export const rateFilmSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
})

export const addReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body:   z.string().trim().min(10).max(4000),
})

export const filmListQuerySchema = paginationSchema.extend({
  genre: z.string().trim().max(40).optional(),
  sort:  z.enum(['newest', 'top', 'trending']).default('newest'),
  q:     z.string().trim().max(200).optional(),
  filmmakerId: z.string().uuid().optional(),
})

// ---- profiles ----------------------------------------------------------------

// role is intentionally NEVER accepted here — see roleChangeSchema + requireOwner route.
export const updateProfileSchema = z.object({
  name:                     z.string().trim().min(2).max(100).optional(),
  bio:                      z.string().trim().max(500).optional(),
  school:                   z.string().trim().max(200).optional(),
  city:                     z.string().trim().max(100).optional(),
  topGenre:                 z.string().trim().max(50).optional(),
  lookingForCollaborators:  z.boolean().optional(),
  favoriteGenres:           z.array(z.string().trim().max(40)).max(10).optional(),
  crewRoles:                z.array(z.string().trim().max(40)).max(10).optional(),
  avatarUrl:                urlField,
  bannerUrl:                urlField,
})

export const roleChangeSchema = z.object({
  role: z.enum(['filmmaker', 'viewer']),
})

export const discoverFilmmakersQuerySchema = paginationSchema.extend({
  genre:  z.string().trim().max(40).optional(),
  city:   z.string().trim().max(100).optional(),
  school: z.string().trim().max(200).optional(),
})

// ---- search -------------------------------------------------------------------

export const searchQuerySchema = z.object({
  q:    z.string().trim().min(1).max(200),
  type: z.enum(['films', 'filmmakers']).default('films'),
})

// ---- watchlist / follows -------------------------------------------------------

export const filmIdParamSchema = z.object({ filmId: z.string().uuid() })
export const userIdParamSchema = z.object({ userId: z.string().uuid() })

// ---- middleware factories ------------------------------------------------------

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: result.error.flatten().fieldErrors },
      })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Validation error', details: result.error.flatten().fieldErrors },
      })
      return
    }
    req.query = result.data as any
    next()
  }
}

// Back-compat alias used by older route files
export const validate = validateBody
