import { supabase } from './supabase'

export type StorageBucket = 'films' | 'thumbnails' | 'trailers' | 'avatars' | 'banners'

const LIMITS: Record<StorageBucket, { maxBytes: number; mimePrefixes: string[] }> = {
  films:      { maxBytes: 2 * 1024 * 1024 * 1024, mimePrefixes: ['video/'] },
  trailers:   { maxBytes: 500 * 1024 * 1024,       mimePrefixes: ['video/'] },
  thumbnails: { maxBytes: 8 * 1024 * 1024,         mimePrefixes: ['image/'] },
  avatars:    { maxBytes: 5 * 1024 * 1024,         mimePrefixes: ['image/'] },
  banners:    { maxBytes: 8 * 1024 * 1024,         mimePrefixes: ['image/'] },
}

export class StorageValidationError extends Error {}

function sanitizeFilename(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const base = name.slice(0, name.length - ext.length)
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10)
  return `${safeBase || 'file'}${safeExt}`
}

/** Validates a file client-side before it's ever sent, then uploads it directly to Supabase Storage. */
export async function uploadToBucket(bucket: StorageBucket, file: File, ownerId: string): Promise<string> {
  const limit = LIMITS[bucket]

  if (!limit.mimePrefixes.some((p) => file.type.startsWith(p))) {
    throw new StorageValidationError(`"${file.name}" isn't a supported file type for ${bucket}.`)
  }
  if (file.size > limit.maxBytes) {
    const maxMb = Math.round(limit.maxBytes / (1024 * 1024))
    throw new StorageValidationError(`"${file.name}" is too large — max ${maxMb}MB.`)
  }

  const path = `${ownerId}/${Date.now()}-${sanitizeFilename(file.name)}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type,
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
