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
