/**
 * Test doubles for the database and Supabase Auth.
 *
 * Every test registers the SQL it expects with `db.on(pattern, rows)`;
 * unmatched queries return no rows. `db.calls` records every query so tests
 * can assert what was (or wasn't) written.
 */

type Handler = (params: unknown[], sql: string) => { rows?: any[]; rowCount?: number } | Promise<{ rows?: any[]; rowCount?: number }>

export const state = {
  handlers: [] as Array<{ pattern: RegExp; handler: any }>,
  calls: [] as Array<{ sql: string; params: unknown[] }>,
  users: {} as Record<string, { id: string; email: string; user_metadata?: Record<string, unknown> }>,
}

export async function run(sql: string, params: unknown[] = []) {
  state.calls.push({ sql, params })
  const hit = state.handlers.find((h) => h.pattern.test(sql))
  const res = hit ? await hit.handler(params, sql) : {}
  const rows = res.rows ?? []
  return { rows, rowCount: res.rowCount ?? rows.length }
}

export const db = {
  on(pattern: RegExp, result: Handler | any[]) {
    const handler = typeof result === 'function' ? result : () => ({ rows: result })
    state.handlers.unshift({ pattern, handler })
  },
  reset() {
    state.handlers.length = 0
    state.calls.length = 0
    for (const k of Object.keys(state.users)) delete state.users[k]
  },
  called(pattern: RegExp) {
    return state.calls.filter((c) => pattern.test(c.sql))
  },
}

/** Register a signed-in user; requests send `Authorization: Bearer <token>`. */
export function signIn(token: string, user: { id: string; email?: string; role?: 'filmmaker' | 'viewer' }) {
  state.users[token] = { id: user.id, email: user.email ?? `${user.id}@test.local`, user_metadata: { role: user.role } }
  db.on(/SELECT role FROM profiles WHERE id = \$1/, (params) =>
    params[0] === user.id ? { rows: [{ role: user.role ?? 'viewer' }] } : { rows: [] },
  )
  return { Authorization: `Bearer ${token}` }
}

export const ids = {
  me: '11111111-1111-4111-8111-111111111111',
  other: '22222222-2222-4222-8222-222222222222',
  film: '33333333-3333-4333-8333-333333333333',
  request: '44444444-4444-4444-8444-444444444444',
  missing: '99999999-9999-4999-8999-999999999999',
}

/** Stand-in for server/db, wired up in setup.ts. */
export function fakeDbModule() {
  const query = (sql: string, params?: unknown[]) => run(sql, params)
  return {
    query,
    pool: { query: (sql: string) => run(sql) },
    transaction: async (fn: (client: { query: typeof query }) => Promise<unknown>) => fn({ query }),
    supabaseAdmin: {
      auth: {
        getUser: async (token: string) => {
          const user = state.users[token]
          return user ? { data: { user }, error: null } : { data: { user: null }, error: new Error('bad token') }
        },
      },
    },
  }
}
