# 🎬 Cima

A mobile-first PWA for film students — built with React, Express, TypeScript, and Supabase.

---

## Tech Stack

| Layer       | Technology                                     |
|-------------|------------------------------------------------|
| Frontend    | React 18 + TypeScript + Vite                  |
| Styling     | Tailwind CSS (custom HSL tokens) + Framer Motion |
| State       | Zustand (auth/ui) + TanStack Query (server state) |
| Backend     | Node.js + Express + TypeScript                 |
| Auth        | Supabase Auth (email/password), verified server-side on every request |
| Database    | Supabase PostgreSQL (via `pg` pooler)          |
| File uploads| Browser → Supabase Storage directly (films/thumbnails/trailers/avatars/banners buckets); Express only stores the resulting URL |

**Data flow:** `React → React Query → Axios → Express → PostgreSQL`. The Supabase client in the browser is used for exactly two things: Auth and Storage uploads — every other read/write goes through the Express API, which enforces authentication, role checks, and resource ownership before touching the database.

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to you
3. Set a strong database password and save it

### 2. Run the Database Schema

In your Supabase dashboard:

1. Click **SQL Editor** → **New query**
2. Paste the contents of `server/db/schema.sql`
3. Click **Run**

This creates:
- `profiles` table (linked to `auth.users` via FK + trigger)
- `films`, `votes`, `ratings`, `reviews`, `review_likes`, `review_comments`, `film_credits`,
  `watchlist`, `follows`, `lists`, `list_items`, `activity_events`,
  `cima_requests`, `cima_members`, `notifications`, `featured_films`
- Auto-create-profile trigger on every new Supabase Auth user (always role `'viewer'` — role changes only ever happen through the server)
- Row Level Security policies — every table is publicly readable where appropriate, but has **no client-side write policy**. All writes go through Express using the service-role key, so RLS here is defense-in-depth, not the primary authorization layer.

You'll also want to create the five Storage buckets used for uploads — `films`, `thumbnails`, `trailers`, `avatars`, `banners` — from Dashboard → Storage, with reasonable per-bucket file-size limits and allowed MIME types (video/* for films & trailers, image/* for the rest).

### 3. Configure Environment Variables

**Backend** — copy and fill in `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Settings → API → service_role (secret)
DATABASE_URL=postgres://postgres.your-project-ref:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

> **Where to find these values:**
> - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: Dashboard → Settings → API
> - `DATABASE_URL`: Dashboard → Settings → Database → Connection string → URI → switch to **Transaction** mode (port 6543)

**Frontend** — copy and fill in `.env.example`:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...           # Settings → API → anon (public)
```

### 4. Install Dependencies

```bash
# Root (frontend)
npm install

# Backend
cd server && npm install && cd ..
```

### 5. Seed Demo Data (optional)

Populates 8 demo users, 7 films, ratings, reviews, and notifications:

```bash
cd server && npm run seed
```

Demo credentials:
| Email | Password | Role |
|---|---|---|
| `demo@cima.film` | `password` | Filmmaker |
| `viewer@cima.film` | `password` | Viewer |

### 6. Run the App

**Terminal 1 — Backend:**
```bash
cd server && npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Supabase Dashboard — Manage Users & Data

| Task | Location |
|---|---|
| Create / delete users | Authentication → Users |
| View & edit profiles | Table Editor → profiles |
| View films | Table Editor → films |
| View notifications | Table Editor → notifications |
| Run custom SQL | SQL Editor |
| View auth logs | Authentication → Logs |

**To add a user from the dashboard:**
1. Authentication → Users → **Invite user** or **Add user**
2. The `handle_new_user` trigger automatically creates their `profiles` row
3. Set their `role` in Table Editor → profiles → find the row → edit `role` to `'filmmaker'` or `'viewer'`

---

## API Reference

All endpoints are prefixed with `/api`.

Note: Auth registration/login happen client-side via `supabase.auth.signUp` / `signInWithPassword` directly (Supabase Auth is the identity source of truth) — `/auth/*` below exists mainly for `GET /auth/me` and API parity.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account (server-side path) |
| POST | `/auth/login` | — | Sign in, receive JWT (server-side path) |
| GET | `/auth/me` | ✓ | Get own profile |

### Films
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/films` | — | Paginated, filter by `genre`/`q`, sort `newest`\|`top`\|`trending` |
| GET | `/films/featured/week` | — | Film of the week |
| GET | `/films/:id` | — | Film detail |
| POST | `/films` | ✓ filmmaker | Create film (metadata only — media already in Supabase Storage) |
| PATCH | `/films/:id` | ✓ owner | Update film |
| DELETE | `/films/:id` | ✓ owner | Delete film |
| POST | `/films/:id/vote` | ✓ | Weekly "film of the week" vote |
| GET | `/films/votes/mine` | ✓ | This week's vote, if any |
| POST | `/films/:id/rating` | ✓ | Rate 1–5 |
| GET | `/films/:id/reviews` | — | Paginated reviews |
| POST | `/films/:id/reviews` | ✓ | Add/update review |

### Profiles
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profiles/:id` | — | Profile |
| GET | `/profiles/:id/films` | — | Their published films (paginated) |
| PATCH | `/profiles/:id` | ✓ owner | Update profile (role is never accepted here) |
| POST | `/profiles/:id/role` | ✓ owner | The only way to change `role` — validated server-side |

### Cima (creative circles)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cima` | ✓ | My circle + pending requests |
| GET | `/cima/:userId` | — | Another user's crew (public) |
| POST | `/cima/requests` | ✓ | Send join request — `{ toUserId }` |
| POST | `/cima/requests/:id/accept` | ✓ | Accept request |
| POST | `/cima/requests/:id/decline` | ✓ | Decline request |
| POST | `/cima/requests/:id/cancel` | ✓ | Sender withdraws request |

### Discover / Search
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/discover/filmmakers` | — | Paginated, filter by genre/city/school |
| GET | `/search?q=&type=films\|filmmakers` | — | ILIKE search |

### Watchlist / Follows
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/watchlist` | ✓ | My watchlist |
| POST/DELETE | `/watchlist/:filmId` | ✓ | Add/remove |
| GET | `/follows/:userId` | — | Followers/following |
| POST/DELETE | `/follows/:userId` | ✓ | Follow/unfollow |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | ✓ | Paginated; the frontend also subscribes to Supabase Realtime for live updates |
| PATCH | `/notifications/:id/read` | ✓ | Mark one read |
| PATCH | `/notifications/read-all` | ✓ | Mark all read |

All error responses share the shape `{ error: { code, message } }`.

---

## Project Structure

```
CIMA/
├── src/                        # React frontend
│   ├── components/
│   │   ├── layout/             # AppShell, TabBar, CimaLogo
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # useAuth, useFilms, useProfile, useCima,
│   │                           # useFilmmakers, useSearch, useWatchlist,
│   │                           # useFollows, useNotifications, etc.
│   ├── lib/
│   │   ├── api.ts              # THE canonical data-access layer (axios → Express)
│   │   ├── storage.ts          # Supabase Storage uploads (client-side validated)
│   │   └── supabase.ts         # Supabase client — Auth + Storage ONLY
│   ├── pages/                  # App screens — real data + empty states, no mocks
│   ├── store/                  # Zustand stores (auth, ui, search, toast)
│   ├── types/                  # TypeScript types (DB row → API DTO → frontend model)
│   └── __tests__/fixtures/     # mockData.ts — test fixtures only, never imported by pages
├── server/                     # Express backend
│   ├── db/
│   │   ├── index.ts            # pg Pool + supabaseAdmin client (service role)
│   │   ├── schema.sql          # All tables, indexes, constraints, RLS policies
│   │   ├── migrate.ts          # Runs schema.sql against Supabase
│   │   └── seed.ts             # Demo data seeder
│   ├── middleware/
│   │   ├── auth.ts             # requireAuth / optionalAuth (JWT verification)
│   │   ├── role.ts             # requireRole('filmmaker' | 'viewer')
│   │   └── ownership.ts        # requireOwner(table, ownerColumn)
│   ├── routes/                 # auth, films, profiles, cima, discover, search,
│   │                           # watchlist, follows, notifications
│   ├── lib/
│   │   ├── errors.ts           # AppError + { error: { code, message } } responses
│   │   ├── notify.ts           # createNotification() helper
│   │   ├── validators.ts       # Zod schemas for every route input
│   │   └── week.ts             # ISO week key (weekly voting)
│   └── index.ts                # Express app entry point
├── .env.example                # Frontend env template (VITE_ vars only — public)
└── server/.env.example         # Backend env template (includes the service role key)
```

---

## Auth Flow

```
User signs up / logs in
        │
        ▼
Frontend: supabase.auth.signInWithPassword() or signUp()
        │  Supabase Auth issues a signed JWT (access_token)
        │  DB trigger fires → creates/updates profiles row
        ▼
Frontend: stores access_token in Zustand + localStorage
        │
        ▼
API calls: axios interceptor attaches Bearer <access_token>
        │
        ▼
Express: supabaseAdmin.auth.getUser(token)
        │  Verifies token cryptographically against Supabase
        │  Fetches role from profiles table
        ▼
Route handler: req.userId, req.userRole are available
```

Token auto-refresh is handled by the Supabase client on the frontend. When the access token expires, the interceptor calls `supabase.auth.refreshSession()` automatically.

---

## License

MIT
