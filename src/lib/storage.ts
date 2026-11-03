import { supabase } from './supabase'

/**
 * Uploads a file directly to Supabase Storage from the browser and returns
 * its public URL. This is the one legitimate direct-to-Supabase write left
 * in the app — everything else (film/profile/vote/review *data*) goes
 * through the Express API so it can be validated and scoped server-side.
 * Storage itself stays safe because every call site below namespaces the
 * path under the caller's own auth uid.
 */
export async function uploadFile(bucket: string, file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}
