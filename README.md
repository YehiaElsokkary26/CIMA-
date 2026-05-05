# 🎬 Cima

A mobile-first PWA for film students — built with React, Express, TypeScript, and Supabase.

---

## Tech Stack

| Layer       | Technology                                     |
|-------------|------------------------------------------------|
| Frontend    | React 18 + TypeScript + Vite                  |
| Styling     | Tailwind CSS (custom HSL tokens) + Framer Motion |
| State       | Zustand (auth) + TanStack Query (server state) |
| Backend     | Node.js + Express + TypeScript                 |
| Auth        | Supabase Auth (email/password)                 |
| Database    | Supabase PostgreSQL (via `pg` pooler)          |
| File uploads| Multer → local `/uploads` folder              |

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
- `films`, `ratings`, `reviews`, `cima_requests`, `cima_members`, `notifications`, `featured_films`
- Auto-create-profile trigger on every new Supabase Auth user
- Row Level Security policies

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

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Sign in, receive JWT |
| GET | `/auth/me` | ✓ | Get own profile |

### Films
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/films` | — | List all films |
| GET | `/films/featured/week` | — | Film of the week |
| GET | `/films/:id` | — | Film detail |
| POST | `/films` | ✓ filmmaker | Upload film |
| POST | `/films/:id/rate` | ✓ | Rate 1–5 |
| GET | `/films/:id/reviews` | — | Film reviews |
| POST | `/films/:id/review` | ✓ | Add review |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:id` | — | User profile |
| GET | `/users/:id/films` | — | User's films |
| PATCH | `/users/me` | ✓ | Update own profile |

### Cima (creative circles)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cima/mine` | ✓ | My circle + pending requests |
| POST | `/cima/request/:userId` | ✓ | Send join request |
| POST | `/cima/accept/:requestId` | ✓ | Accept request |
| POST | `/cima/decline/:requestId` | ✓ | Decline request |

### Discover
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/discover/filmmakers` | — | Search filmmakers |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | ✓ | List notifications |
| PATCH | `/notifications/:id/read` | ✓ | Mark one read |
| PATCH | `/notifications/read-all` | ✓ | Mark all read |

---

## Project Structure

```
CIMA/
├── src/                        # React frontend
│   ├── components/
│   │   ├── layout/             # AppShell, TabBar, CimaLogo
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # useAuth, useFilms, useCima, etc.
│   ├── lib/
│   │   ├── api.ts              # Axios client (auto-attaches Supabase token)
│   │   └── supabase.ts         # Supabase frontend client (anon key)
│   ├── pages/                  # All 9 app screens
│   ├── store/                  # Zustand stores (auth, ui)
│   └── types/                  # TypeScript types
├── server/                     # Express backend
│   ├── db/
│   │   ├── index.ts            # pg Pool + supabaseAdmin client
│   │   ├── schema.sql          # All tables, triggers, RLS policies
│   │   ├── migrate.ts          # Runs schema.sql against Supabase
│   │   └── seed.ts             # Demo data seeder
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification via supabaseAdmin.auth.getUser()
│   │   └── role.ts             # Filmmaker-only guard
│   ├── routes/                 # auth, films, users, cima, discover, notifications
│   ├── lib/
│   │   ├── errors.ts           # AppError + typed error helpers
│   │   ├── notify.ts           # createNotification() helper
│   │   └── validators.ts       # Zod schemas
│   └── index.ts                # Express app entry point
├── .env.example                # Frontend env template
└── server/.env.example         # Backend env template
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
