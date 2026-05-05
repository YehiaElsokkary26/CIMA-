import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// ---- schemas ----------------------------------------------------------------

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
  role:     z.enum(['filmmaker', 'viewer']).default('viewer'),
})

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const rateFilmSchema = z.object({
  rating: z.number().int().min(1).max(5),
})

export const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body:   z.string().min(10).max(4000),
})

export const updateUserSchema = z.object({
  name:                     z.string().min(2).max(100).optional(),
  bio:                      z.string().max(500).optional(),
  school:                   z.string().max(200).optional(),
  city:                     z.string().max(100).optional(),
  top_genre:                z.string().max(50).optional(),
  looking_for_collaborators: z.boolean().optional(),
})

// ---- middleware factory ------------------------------------------------------

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(422).json({
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors,
      })
      return
    }
    req.body = result.data
    next()
  }
}
