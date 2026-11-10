import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// ---- shared pieces -----------------------------------------------------------

/** Only http(s) links. z.string().url() alone also accepts javascript: and data: URLs. */
const httpUrl = z
  .string()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: 'Must be an http(s) URL' })

const shortText = (max: number) => z.string().trim().max(max)
const tagList = z.array(z.string().trim().min(1).max(50)).max(20)

export const uuidParam = z.string().uuid()

// ---- schemas ----------------------------------------------------------------

export const rateFilmSchema = z.object({
  rating: z.number().int().min(1).max(5),
})

/** Reviews double as "notes on the cut" in the app, which can be short. */
export const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  body:   z.string().trim().min(2).max(4000),
})

export const createFilmSchema = z.object({
  title:        z.string().trim().min(1).max(200),
  description:  shortText(2000).optional(),
  genre:        tagList.default([]),
  runtime:      z.number().int().positive().max(600).optional(),
  year:         z.number().int().min(1888).max(new Date().getFullYear() + 1).optional(),
  thumbnailUrl: httpUrl.optional(),
  videoUrl:     httpUrl.optional(),
  trailerUrl:   httpUrl.optional(),
  aspectRatio:  z.enum(['16:9', '4:5', '2:3']).optional(),
  uploaderRole: shortText(100).optional(),
})

export const updateUserSchema = z.object({
  name:                    z.string().trim().min(2).max(100).optional(),
  bio:                     shortText(500).optional(),
  school:                  shortText(200).optional(),
  city:                    shortText(100).optional(),
  topGenre:                shortText(50).optional(),
  lookingForCollaborators: z.boolean().optional(),
  avatarUrl:               httpUrl.optional(),
  bannerUrl:               httpUrl.optional(),
  favoriteGenres:          tagList.optional(),
  crewRoles:               tagList.optional(),
})

export const roleChangeSchema = z.object({
  role: z.enum(['filmmaker', 'viewer']),
})

// ---- middleware factories -----------------------------------------------------

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

/** Rejects requests whose :param is not a UUID with 400 instead of a database error. */
export function validUuid(...names: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of names) {
      if (!uuidParam.safeParse(req.params[name]).success) {
        res.status(400).json({ message: `Invalid ${name}`, code: 'INVALID_ID' })
        return
      }
    }
    next()
  }
}
