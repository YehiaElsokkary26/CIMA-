import { vi } from 'vitest'
import { supabaseAdmin } from '../db'

/** token → user. Tests sign people in with `as(user)`. */
export const tokens = new Map<string, { id: string; email: string; user_metadata: Record<string, unknown> }>()

vi.spyOn(supabaseAdmin.auth, 'getUser').mockImplementation(async (token?: string) => {
  const user = token ? tokens.get(token) : undefined
  return (user
    ? { data: { user }, error: null }
    : { data: { user: null }, error: { message: 'invalid JWT' } }) as any
})

// ---- Supabase Admin stand-ins for account deletion and file cleanup ----------
import { Client } from 'pg'

/** Files "in storage", by bucket. Tests add to it and read what was removed. */
export const storage = {
  files: new Map<string, Set<string>>(),
  removed: [] as Array<{ bucket: string; path: string }>,
  reset() {
    this.files.clear()
    this.removed.length = 0
  },
  put(bucket: string, path: string) {
    if (!this.files.has(bucket)) this.files.set(bucket, new Set())
    this.files.get(bucket)!.add(path)
  },
}

vi.spyOn(supabaseAdmin.storage, 'from').mockImplementation((bucket: string) => ({
  list: async (folder: string) => ({
    data: [...(storage.files.get(bucket) ?? [])]
      .filter((p) => p.startsWith(`${folder}/`))
      .map((p) => ({ name: p.slice(folder.length + 1) })),
    error: null,
  }),
  remove: async (paths: string[]) => {
    const set = storage.files.get(bucket) ?? new Set<string>()
    const gone = paths.filter((p) => set.delete(p))
    gone.forEach((path) => storage.removed.push({ bucket, path }))
    return { data: gone.map((name) => ({ name })), error: null }
  },
}) as any)

// Deleting the auth user is what Supabase does; the real FK cascade does the rest.
vi.spyOn(supabaseAdmin.auth.admin, 'deleteUser').mockImplementation(async (id: string) => {
  const c = new Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    await c.query('DELETE FROM auth.users WHERE id = $1', [id])
  } finally {
    await c.end()
  }
  return { data: { user: null }, error: null } as any
})
