/**
 * Cleaning up uploaded files when a film or an account is deleted.
 *
 * Files live at "<bucket>/<owner id>/<file>". We only ever delete paths
 * inside the owner's own folder: a film's URLs are typed by its uploader,
 * so they could point at someone else's file, and that must never be removed.
 * Failures are logged, not thrown: a stray file is better than a half-deleted account.
 */
import { supabaseAdmin } from '../db'

export const BUCKETS = ['films', 'thumbnails', 'trailers', 'avatars', 'banners'] as const

/** "https://x.supabase.co/storage/v1/object/public/films/<uid>/a.mp4" → { bucket, path } */
export function storagePathFromUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null
  const m = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(url.split('?')[0])
  if (!m || !(BUCKETS as readonly string[]).includes(m[1])) return null
  return { bucket: m[1], path: decodeURIComponent(m[2]) }
}

/** Delete the given public URLs, keeping only those inside ownerId's folder. */
export async function removeOwnedFiles(ownerId: string, urls: Array<string | null | undefined>): Promise<number> {
  const byBucket = new Map<string, string[]>()
  for (const url of urls) {
    const ref = storagePathFromUrl(url)
    if (!ref || !ref.path.startsWith(`${ownerId}/`) || ref.path.includes('..')) continue
    byBucket.set(ref.bucket, [...(byBucket.get(ref.bucket) ?? []), ref.path])
  }
  let removed = 0
  for (const [bucket, paths] of byBucket) {
    try {
      const { data, error } = await supabaseAdmin.storage.from(bucket).remove(paths)
      if (error) console.error('Storage cleanup failed:', { bucket, message: error.message })
      else removed += data?.length ?? 0
    } catch (err) {
      console.error('Storage cleanup failed:', { bucket, message: (err as Error)?.message })
    }
  }
  return removed
}

/** Delete everything in ownerId's folder in every bucket (account deletion). */
export async function removeAllFilesOf(ownerId: string): Promise<number> {
  let removed = 0
  for (const bucket of BUCKETS) {
    try {
      const { data: files, error } = await supabaseAdmin.storage.from(bucket).list(ownerId, { limit: 1000 })
      if (error) {
        console.error('Storage listing failed:', { bucket, message: error.message })
        continue
      }
      const paths = (files ?? []).filter((f) => f.name).map((f) => `${ownerId}/${f.name}`)
      if (!paths.length) continue
      const { data, error: rmErr } = await supabaseAdmin.storage.from(bucket).remove(paths)
      if (rmErr) console.error('Storage cleanup failed:', { bucket, message: rmErr.message })
      else removed += data?.length ?? 0
    } catch (err) {
      console.error('Storage cleanup failed:', { bucket, message: (err as Error)?.message })
    }
  }
  return removed
}
