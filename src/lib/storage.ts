import { supabase, supabaseAnonKey, supabaseUrl } from './supabase'

const VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MB = 1024 * 1024

/**
 * Largest single upload the Supabase project accepts. The free plan caps every
 * file at 50 MB whatever a bucket allows; set VITE_MAX_UPLOAD_MB after raising
 * it (Supabase dashboard → Storage → Settings) on a paid plan.
 */
export const MAX_UPLOAD_MB = Math.max(1, Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 50)

/** Bucket limits from server/db/schema.sql, capped by the project limit above. */
const LIMITS: Record<string, { maxBytes: number; types: string[]; kind: string }> = {
  films:      { maxBytes: Math.min(500, MAX_UPLOAD_MB) * MB, types: VIDEO, kind: 'an MP4, MOV or WebM video' },
  trailers:   { maxBytes: Math.min(100, MAX_UPLOAD_MB) * MB, types: VIDEO, kind: 'an MP4, MOV or WebM video' },
  thumbnails: { maxBytes: 5 * MB, types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
  avatars:    { maxBytes: 5 * MB, types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
  banners:    { maxBytes: 5 * MB, types: IMAGE, kind: 'a JPG, PNG, WebP or GIF image' },
}

/** Size limit in MB for a bucket, for hints like "up to 50 MB". */
export function uploadLimitMB(bucket: string): number {
  return Math.round((LIMITS[bucket]?.maxBytes ?? MAX_UPLOAD_MB * MB) / MB)
}

/** Storage keys must be plain ASCII: 'فيلم نهائي.mp4' becomes 'file.mp4', 'My Cut (v2).MOV' becomes 'My-Cut-v2.mov'. */
export function safeStoragePath(path: string): string {
  const parts = path.split('/')
  const name = parts.pop() ?? ''
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^A-Za-z0-9]/g, '').toLowerCase() : ''
  return [...parts, (base || 'file') + (ext ? '.' + ext : '')].join('/')
}

/** Plain-language message for a failed upload. */
function uploadError(status: number, serverMessage: string): Error {
  if (status === 413 || /too large|maximum allowed size|exceeded/i.test(serverMessage)) {
    return new Error(`That file is bigger than the upload limit (${MAX_UPLOAD_MB} MB).`)
  }
  if (/mime|content type|not supported/i.test(serverMessage)) return new Error('That file type isn’t supported here.')
  if (/row-level security|unauthorized|not allowed/i.test(serverMessage)) return new Error('You can only upload into your own space. Sign out and back in, then try again.')
  if (status === 401) return new Error('Your session expired. Sign in again, then retry the upload.')
  if (status === 0) return new Error('The upload stopped. Check your connection and try again.')
  return new Error(serverMessage || 'Upload failed. Try again.')
}

/**
 * Uploads a file straight to Supabase Storage from the browser and returns its
 * public URL. This is the one direct-to-Supabase write left in the app;
 * everything else goes through the Express API. Storage policies only allow
 * writes under the caller's own user id, and each bucket caps size and type.
 *
 * It sends the request itself (not supabase.storage.upload) so it can report
 * real progress: onProgress gets 0..1 as bytes go out.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  rawPath: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Your session expired. Sign in again, then retry the upload.')

  const objectPath = path.split('/').map(encodeURIComponent).join('/')
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.setRequestHeader('cache-control', 'max-age=3600')
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        resolve()
        return
      }
      let message = ''
      try {
        const body = JSON.parse(xhr.responseText)
        message = body.message || body.error || ''
      } catch { /* not JSON */ }
      reject(uploadError(xhr.status, message))
    }
    xhr.onerror = () => reject(uploadError(0, ''))
    xhr.onabort = () => reject(new Error('Upload cancelled.'))
    xhr.send(file)
  })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}
