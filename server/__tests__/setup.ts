import { vi, beforeEach } from 'vitest'

// Replace the real database + Supabase admin client for every test.
vi.mock('../db', async () => (await import('./helpers')).fakeDbModule())

beforeEach(async () => {
  ;(await import('./helpers')).db.reset()
})
