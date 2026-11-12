/**
 * A small local stand-in for the parts of Supabase Klaket uses, so the whole
 * app can run on this machine against a throwaway database:
 *
 *   Auth     sign up, sign in, refresh, get/update user, sign out, password
 *            reset (no email is sent), plus the admin calls the API and the
 *            seed use (list / create / delete users).
 *   Storage  upload with the same rules as the real buckets (own folder only,
 *            size and type limits, 50 MB project cap), public download with
 *            Range support for video, and the admin list / remove calls.
 *
 * Realtime is not provided: the app falls back to polling the unread count.
 * Never point this at real data: it trusts the local database completely.
 */
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

export interface FakeSupabaseOptions {
  port: number
  databaseUrl: string
  dataDir: string
  /** Largest upload accepted, like the project-wide limit on Supabase. */
  maxUploadBytes?: number
}

const SECRET = crypto.randomBytes(32)
const MB = 1024 * 1024

/** Same limits as the buckets in db/schema.sql. */
const BUCKETS: Record<string, { maxBytes: number; types: string[] }> = {
  films:      { maxBytes: 500 * MB, types: ['video/mp4', 'video/quicktime', 'video/webm'] },
  trailers:   { maxBytes: 100 * MB, types: ['video/mp4', 'video/quicktime', 'video/webm'] },
  thumbnails: { maxBytes: 5 * MB, types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  avatars:    { maxBytes: 5 * MB, types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  banners:    { maxBytes: 5 * MB, types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
}

// ---- small helpers ------------------------------------------------------------

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')

function signJwt(payload: Record<string, unknown>): string {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

function verifyJwt(token: string): Record<string, any> | null {
  const [head, body, sig] = token.split('.')
  if (!head || !body || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null
  return payload
}

const hashPassword = (password: string, salt = crypto.randomBytes(16).toString('hex')) =>
  `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`

function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const got = Buffer.from(hashPassword(password, salt).split(':')[1], 'hex')
  return got.length === Buffer.from(hash, 'hex').length && crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'))
}

function readBody(req: http.IncomingMessage, limit = 600 * MB): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        reject(Object.assign(new Error('too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info, x-upsert, cache-control, x-supabase-api-version, range, accept-profile, content-profile, prefer',
  'Access-Control-Expose-Headers': 'content-range, content-length, x-total-count, link, x-supabase-api-version',
}

function send(res: http.ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) {
  if (body === undefined) {
    res.writeHead(status, { ...CORS, ...headers })
    res.end()
    return
  }
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', 'x-supabase-api-version': '2024-01-01', ...headers })
  res.end(JSON.stringify(body))
}

/** Auth errors in GoTrue's shape, so supabase-js reports the same messages. */
const authError = (res: http.ServerResponse, status: number, code: string, msg: string) =>
  send(res, status, { code, error_code: code, msg, message: msg, error: code, error_description: msg })

const MIME: Record<string, string> = {
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
}

// ---- server -------------------------------------------------------------------

export function startFakeSupabase(opts: FakeSupabaseOptions): Promise<http.Server> {
  const db = new Pool({ connectionString: opts.databaseUrl })
  const maxUpload = opts.maxUploadBytes ?? 50 * MB
  const storageDir = path.join(opts.dataDir, 'storage')
  const passwordsFile = path.join(opts.dataDir, 'passwords.json')
  fs.mkdirSync(storageDir, { recursive: true })
  const passwords: Record<string, string> = fs.existsSync(passwordsFile) ? JSON.parse(fs.readFileSync(passwordsFile, 'utf8')) : {}
  const savePasswords = () => fs.writeFileSync(passwordsFile, JSON.stringify(passwords))
  const refreshTokens = new Map<string, string>() // token → user id

  async function getUser(id: string) {
    const r = await db.query('SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at FROM auth.users WHERE id = $1', [id])
    return r.rows[0] ? toUser(r.rows[0]) : null
  }

  function toUser(row: any) {
    return {
      id: row.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: row.email,
      email_confirmed_at: row.email_confirmed_at,
      confirmed_at: row.email_confirmed_at,
      user_metadata: row.raw_user_meta_data ?? {},
      app_metadata: { provider: 'email', providers: ['email'] },
      identities: [{ id: row.id, user_id: row.id, provider: 'email', identity_data: { email: row.email, sub: row.id } }],
      created_at: row.created_at,
      updated_at: row.created_at,
    }
  }

  async function createUser(email: string, password: string, meta: Record<string, unknown>, confirmed: boolean) {
    const id = crypto.randomUUID()
    const r = await db.query(
      `INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at)
       VALUES ($1, lower($2), $3, CASE WHEN $4 THEN now() END)
       RETURNING id, email, raw_user_meta_data, email_confirmed_at, created_at`,
      [id, email, meta ?? {}, confirmed],
    )
    passwords[id] = hashPassword(password)
    savePasswords()
    return toUser(r.rows[0])
  }

  function session(user: any) {
    const now = Math.floor(Date.now() / 1000)
    const refresh = crypto.randomBytes(24).toString('hex')
    refreshTokens.set(refresh, user.id)
    return {
      access_token: signJwt({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600, session_id: crypto.randomUUID() }),
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: refresh,
      user,
    }
  }

  /** The signed-in user from the request's bearer token, or null. */
  function caller(req: http.IncomingMessage): string | null {
    const h = req.headers.authorization ?? ''
    const payload = h.startsWith('Bearer ') ? verifyJwt(h.slice(7)) : null
    return payload?.sub ?? null
  }

  const isServiceRole = (req: http.IncomingMessage) => {
    const h = req.headers.authorization ?? ''
    return h === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` || req.headers.apikey === process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const filePath = (bucket: string, objectPath: string) => {
    const full = path.resolve(storageDir, bucket, objectPath)
    if (!full.startsWith(path.resolve(storageDir, bucket) + path.sep)) throw Object.assign(new Error('bad path'), { status: 400 })
    return full
  }

  // ---- auth ----
  async function handleAuth(req: http.IncomingMessage, res: http.ServerResponse, url: URL, route: string) {
    const json = async () => {
      const raw = await readBody(req, MB)
      return raw.length ? JSON.parse(raw.toString()) : {}
    }

    if (route === '/settings' && req.method === 'GET') {
      return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: false, phone_autoconfirm: false })
    }

    if (route === '/signup' && req.method === 'POST') {
      const body = await json()
      if (!body.email || !body.password) return authError(res, 400, 'validation_failed', 'Email and password are required')
      if (String(body.password).length < 6) return authError(res, 422, 'weak_password', 'Password should be at least 6 characters.')
      const existing = await db.query('SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at FROM auth.users WHERE email = lower($1)', [body.email])
      // Like Supabase with confirmations on: an existing address gets a user with no identities.
      if (existing.rows[0]) return send(res, 200, { ...toUser(existing.rows[0]), identities: [] })
      const user = await createUser(body.email, body.password, body.data ?? {}, false)
      console.log(`[fake-supabase] signup ${user.email}: confirm it with  npm run local:confirm -- ${user.email}`)
      return send(res, 200, user)
    }

    if (route === '/token' && req.method === 'POST') {
      const body = await json()
      const grant = url.searchParams.get('grant_type')
      if (grant === 'password') {
        const r = await db.query('SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at FROM auth.users WHERE email = lower($1)', [body.email ?? ''])
        const row = r.rows[0]
        if (!row || !passwords[row.id] || !checkPassword(String(body.password ?? ''), passwords[row.id])) {
          return authError(res, 400, 'invalid_credentials', 'Invalid login credentials')
        }
        if (!row.email_confirmed_at) return authError(res, 400, 'email_not_confirmed', 'Email not confirmed')
        await db.query('UPDATE auth.users SET last_sign_in_at = now() WHERE id = $1', [row.id]).catch(() => {})
        return send(res, 200, session(toUser(row)))
      }
      if (grant === 'refresh_token') {
        const userId = refreshTokens.get(body.refresh_token)
        const user = userId ? await getUser(userId) : null
        if (!user) return authError(res, 400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found')
        refreshTokens.delete(body.refresh_token)
        return send(res, 200, session(user))
      }
      return authError(res, 400, 'unsupported_grant_type', 'Unsupported grant type')
    }

    if (route === '/user') {
      const id = caller(req)
      const user = id ? await getUser(id) : null
      if (!user) return authError(res, 401, 'bad_jwt', 'invalid JWT: unable to parse or verify signature')
      if (req.method === 'GET') return send(res, 200, user)
      if (req.method === 'PUT') {
        const body = await json()
        if (body.password !== undefined) {
          if (String(body.password).length < 6) return authError(res, 422, 'weak_password', 'Password should be at least 6 characters.')
          if (checkPassword(String(body.password), passwords[id!] ?? hashPassword(crypto.randomUUID()))) {
            return authError(res, 422, 'same_password', 'New password should be different from the old password.')
          }
          passwords[id!] = hashPassword(String(body.password))
          savePasswords()
        }
        return send(res, 200, user)
      }
    }

    if (route === '/logout' && req.method === 'POST') return send(res, 204)
    if ((route === '/recover' || route === '/resend') && req.method === 'POST') {
      await json()
      console.log(`[fake-supabase] ${route.slice(1)} requested (no email is sent locally)`)
      return send(res, 200, {})
    }

    // ---- admin ----
    if (route.startsWith('/admin/users')) {
      if (!isServiceRole(req)) return authError(res, 403, 'not_admin', 'User not allowed')
      const id = route.split('/')[3]
      if (!id && req.method === 'GET') {
        const r = await db.query('SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at FROM auth.users ORDER BY created_at')
        return send(res, 200, { users: r.rows.map(toUser), aud: 'authenticated' }, { 'x-total-count': String(r.rowCount) })
      }
      if (!id && req.method === 'POST') {
        const body = await json()
        const exists = await db.query('SELECT 1 FROM auth.users WHERE email = lower($1)', [body.email])
        if (exists.rowCount) return authError(res, 422, 'email_exists', 'A user with this email address has already been registered')
        return send(res, 200, await createUser(body.email, body.password ?? crypto.randomUUID(), body.user_metadata ?? {}, !!body.email_confirm))
      }
      if (id && req.method === 'DELETE') {
        const r = await db.query('DELETE FROM auth.users WHERE id = $1 RETURNING id', [id])
        if (!r.rowCount) return authError(res, 404, 'user_not_found', 'User not found')
        delete passwords[id]
        savePasswords()
        return send(res, 200, {})
      }
    }

    return authError(res, 404, 'not_found', `Not handled by the local stand-in: ${req.method} ${route}`)
  }

  // ---- storage ----
  async function handleStorage(req: http.IncomingMessage, res: http.ServerResponse, route: string) {
    const storageError = (status: number, error: string, message: string) => send(res, status, { statusCode: String(status), error, message })

    // Public download: GET /object/public/<bucket>/<path>
    const pub = /^\/object\/public\/([^/]+)\/(.+)$/.exec(route)
    if (pub && (req.method === 'GET' || req.method === 'HEAD')) {
      const file = filePath(pub[1], decodeURIComponent(pub[2]))
      if (!fs.existsSync(file)) return storageError(404, 'not_found', 'Object not found')
      const size = fs.statSync(file).size
      const type = MIME[path.extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream'
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
      if (range) {
        const start = range[1] ? Number(range[1]) : 0
        const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
        res.writeHead(206, { ...CORS, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 })
        if (req.method === 'HEAD') return res.end()
        return fs.createReadStream(file, { start, end }).pipe(res)
      }
      res.writeHead(200, { ...CORS, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size })
      if (req.method === 'HEAD') return res.end()
      return fs.createReadStream(file).pipe(res)
    }

    // Admin list: POST /object/list/<bucket>  { prefix }
    const list = /^\/object\/list\/([^/]+)$/.exec(route)
    if (list && req.method === 'POST') {
      if (!isServiceRole(req)) return storageError(403, 'Unauthorized', 'Only the service role can list')
      const body = JSON.parse((await readBody(req, MB)).toString() || '{}')
      const dir = filePath(list[1], body.prefix || '.')
      const names = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isFile()) : []
      return send(res, 200, names.map((name) => ({ name, id: name, metadata: { size: fs.statSync(path.join(dir, name)).size } })))
    }

    // Upload: POST/PUT /object/<bucket>/<path>
    const obj = /^\/object\/([^/]+)\/(.+)$/.exec(route)
    if (obj && (req.method === 'POST' || req.method === 'PUT')) {
      const [, bucket, rawPath] = obj
      const objectPath = decodeURIComponent(rawPath)
      const rules = BUCKETS[bucket]
      if (!rules) return storageError(404, 'Bucket not found', 'Bucket not found')
      const uid = caller(req)
      // Same rule as the "Klaket: upload to own folder" storage policy.
      if (!uid || objectPath.split('/')[0] !== uid || objectPath.split('/').length < 2) {
        return storageError(403, 'Unauthorized', 'new row violates row-level security policy')
      }
      const type = String(req.headers['content-type'] ?? '').split(';')[0]
      if (!rules.types.includes(type)) return storageError(415, 'invalid_mime_type', `mime type ${type || 'unknown'} is not supported`)
      const declared = Number(req.headers['content-length'] ?? 0)
      const cap = Math.min(rules.maxBytes, maxUpload)
      if (declared > cap) return storageError(413, 'Payload too large', 'The object exceeded the maximum allowed size')
      let data: Buffer
      try {
        data = await readBody(req, cap)
      } catch {
        return storageError(413, 'Payload too large', 'The object exceeded the maximum allowed size')
      }
      const file = filePath(bucket, objectPath)
      if (fs.existsSync(file) && req.headers['x-upsert'] !== 'true') return storageError(409, 'Duplicate', 'The resource already exists')
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, data)
      return send(res, 200, { Key: `${bucket}/${objectPath}`, Id: crypto.randomUUID() })
    }

    // Admin remove: DELETE /object/<bucket>  { prefixes: [...] }
    const rm = /^\/object\/([^/]+)$/.exec(route)
    if (rm && req.method === 'DELETE') {
      if (!isServiceRole(req)) return storageError(403, 'Unauthorized', 'Only the service role can remove here')
      const body = JSON.parse((await readBody(req, MB)).toString() || '{}')
      const removed: Array<{ name: string }> = []
      for (const p of body.prefixes ?? []) {
        const file = filePath(rm[1], p)
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
          removed.push({ name: p })
        }
      }
      return send(res, 200, removed)
    }

    return storageError(404, 'not_found', `Not handled by the local stand-in: ${req.method} ${route}`)
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204)
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
      if (url.pathname.startsWith('/auth/v1')) return await handleAuth(req, res, url, url.pathname.slice('/auth/v1'.length))
      if (url.pathname.startsWith('/storage/v1')) return await handleStorage(req, res, url.pathname.slice('/storage/v1'.length))
      return send(res, 404, { message: 'Not handled by the local stand-in (realtime and REST are not provided)' })
    } catch (err: any) {
      console.error('[fake-supabase]', req.method, req.url, err?.message)
      if (!res.headersSent) send(res, err?.status ?? 500, { message: err?.message ?? 'error' })
    }
  })

  return new Promise((resolve) => server.listen(opts.port, '127.0.0.1', () => resolve(server)))
}
