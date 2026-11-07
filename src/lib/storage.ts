import { supabase } from './supabase'

const VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MB = 1024 * 1024

/** Mirrors the bucket limits in server/db/schema.sql, so people hear 'too big' before a long upload. */
const LIMITS: Record<string, { maxBytes: number; types: string[]; kind: string }> = {
  films:      { maxBytes: 500 * MB, types: VIDEO, kind: 'an MP4, MOV or WebM video' },
  trailers:   { maxBytes: 100 * MB, types: VIDEO, kind: 'an MP4, MOV or WebM video' },
  thumbnails: { maxBytes: 5 * MB,   types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
  avatars:    { maxBytes: 5 * MB,   types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
  banners:    { maxBytes: 5 * MB,   types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
}

/** Storage keys must be plain ASCII: 'فيلم نهائي.mp4' becomes 'file.mp4', 'My Cut (v2).MOV' becomes 'My-Cut-v2.mov'. */
export function safeStoragePath(path: string): string {
  const parts = path.split('/')
  const name = parts.pop() ?? ''
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^A-Za-z0-9]/g, '').toLowerCase() : ''
  return [...parts, (base || 'file') + (ext ? '.' + ext : '')].join('/')
}

/**
 * Uploads a file directly to Supabase Storage from the browser and returns
 * its public URL. This is the one direct-to-Supabase write left in the app;
 * everything else goes through the Express API. Storage policies only allow
 * writes under the caller's own user id, and each bucket caps size and type.
 */
export async function uploadFile(bucket: string, file: File, rawPath: string): Promise<string> {
  const path = safeStoragePath(rawPath)
  const limit = LIMITS[bucket]
  if (limit) {
    if (file.type && !limit.types.includes(file.type)) {
      throw new Error(`That file type isn’t supported here. Use ${limit.kind}.`)
    }
    if (file.size > limit.maxBytes) {
      throw new Error(`That file is too big. The limit is ${Math.round(limit.maxBytes / MB)} MB.`)
    }
  }
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || undefined })
  if (error) throw new Error(error.message)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}
