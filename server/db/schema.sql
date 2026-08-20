-- ============================================================
-- CIMA — PostgreSQL Schema (Supabase compatible)
-- Run in the Supabase SQL Editor, or via: npm run migrate
--
-- Canonical data model. This file is safe to re-run: table/column
-- creation is guarded, and legacy column names are renamed in place
-- (never dropped-and-recreated) so existing data is preserved.
-- ============================================================

-- -----------------------------------------------
-- PROFILES  (linked to Supabase Auth users)
-- -----------------------------------------------
-- This replaces the old "users" table.
-- Passwords are managed entirely by Supabase Auth.
-- A DB trigger auto-creates a profile row whenever a user
-- registers via Supabase Auth (server also inserts eagerly on
-- register to avoid a race — see server/routes/auth.ts).

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('filmmaker', 'viewer')),
  bio         TEXT,
  school      TEXT,
  city        TEXT,
  avatar_url  TEXT,
  banner_url  TEXT,
  looking_for_collaborators BOOLEAN NOT NULL DEFAULT FALSE,
  top_genre   TEXT,
  favorite_genres TEXT[]  NOT NULL DEFAULT '{}',
  crew_roles  TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additive columns for deployments created before this revision.
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] NOT NULL DEFAULT '{}';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crew_roles TEXT[] NOT NULL DEFAULT '{}';
END $$;

-- -----------------------------------------------
-- Trigger: auto-create profile on Supabase signup
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    'viewer' -- role is never trusted from client metadata; see /api/profiles/:id/role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- FILMS
-- Canonical fields: filmmaker_id, filmmaker_name (denormalised),
-- genre[], runtime, year, thumbnail_url, video_url, trailer_url,
-- aspect_ratio, status, created_at.
-- "votes" and "is_film_of_the_week" are NOT stored columns — votes
-- live in public.votes (source of truth, one row per user per week)
-- and film-of-the-week is derived from public.featured_films.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.films (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  video_url     TEXT,
  trailer_url   TEXT,
  aspect_ratio  TEXT        CHECK (aspect_ratio IN ('16:9', '4:5', '2:3')),
  genre         TEXT[]      NOT NULL DEFAULT '{}',
  runtime       INTEGER,
  year          INTEGER,
  filmmaker_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'published'
                             CHECK (status IN ('draft','uploading','processing','ready','published','failed','archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rename legacy columns in place (data-preserving) for deployments
-- created from the pre-audit schema.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='uploader_id')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='filmmaker_id')
  THEN ALTER TABLE public.films RENAME COLUMN uploader_id TO filmmaker_id; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='runtime_min')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='runtime')
  THEN ALTER TABLE public.films RENAME COLUMN runtime_min TO runtime; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='release_year')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='films' AND column_name='year')
  THEN ALTER TABLE public.films RENAME COLUMN release_year TO year; END IF;

  ALTER TABLE public.films ADD COLUMN IF NOT EXISTS trailer_url TEXT;
  ALTER TABLE public.films ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;
  ALTER TABLE public.films ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
  ALTER TABLE public.films ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

  -- NOTE: a prior revision of the frontend wrote directly to Supabase using
  -- columns named is_film_of_the_week / votes / week_key that this schema
  -- never defined server-side. If a deployment has them (e.g. added by hand
  -- to match that old frontend code), we deliberately do NOT drop them here
  -- — that could destroy real data. They are simply unused going forward:
  -- film-of-the-week is derived from featured_films, and votes now live in
  -- the dedicated public.votes table. Drop them manually once you've
  -- confirmed nothing depends on them.
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'films_aspect_ratio_check') THEN
    ALTER TABLE public.films ADD CONSTRAINT films_aspect_ratio_check CHECK (aspect_ratio IN ('16:9','4:5','2:3'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'films_status_check') THEN
    ALTER TABLE public.films ADD CONSTRAINT films_status_check
      CHECK (status IN ('draft','uploading','processing','ready','published','failed','archived'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_films_filmmaker ON public.films(filmmaker_id);
CREATE INDEX IF NOT EXISTS idx_films_created   ON public.films(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_films_status    ON public.films(status);
CREATE INDEX IF NOT EXISTS idx_films_genre     ON public.films USING GIN (genre);

-- -----------------------------------------------
-- VOTES  (weekly "film of the week" voting — one vote per user per week)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_key   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_key)
);

CREATE INDEX IF NOT EXISTS idx_votes_film_week ON public.votes(film_id, week_key);
CREATE INDEX IF NOT EXISTS idx_votes_user_week ON public.votes(user_id, week_key);

-- -----------------------------------------------
-- FEATURED FILM OF THE WEEK
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.featured_films (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  week_start DATE        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- RATINGS  (1-5 star rating, one per user per film)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (film_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_film ON public.ratings(film_id);

-- -----------------------------------------------
-- REVIEWS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (film_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_film ON public.reviews(film_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- -----------------------------------------------
-- REVIEW LIKES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON public.review_likes(review_id);

-- -----------------------------------------------
-- REVIEW COMMENTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review ON public.review_comments(review_id);

-- -----------------------------------------------
-- FILM CREDITS  (future crew support — director, writer, etc.)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.film_credits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (film_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_film_credits_film ON public.film_credits(film_id);
CREATE INDEX IF NOT EXISTS idx_film_credits_user ON public.film_credits(user_id);

-- -----------------------------------------------
-- WATCHLIST
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, film_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);

-- -----------------------------------------------
-- FOLLOWS  (directional — distinct from Cima crew membership)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- -----------------------------------------------
-- LISTS + LIST ITEMS  (user-curated film lists)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.lists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_user ON public.lists(user_id);

CREATE TABLE IF NOT EXISTS public.list_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id    UUID        NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, film_id)
);

CREATE INDEX IF NOT EXISTS idx_list_items_list ON public.list_items(list_id);

-- -----------------------------------------------
-- ACTIVITY EVENTS  (feed of user actions, for future activity feed)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  film_id    UUID        REFERENCES public.films(id) ON DELETE SET NULL,
  target_user_id UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user    ON public.activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_events(created_at DESC);

-- -----------------------------------------------
-- CIMA REQUESTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cima_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cima_requests_status_check') THEN
    ALTER TABLE public.cima_requests DROP CONSTRAINT IF EXISTS cima_requests_status_check;
    ALTER TABLE public.cima_requests ADD CONSTRAINT cima_requests_status_check
      CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cima_requests_no_self_check') THEN
    ALTER TABLE public.cima_requests ADD CONSTRAINT cima_requests_no_self_check CHECK (from_user_id <> to_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cima_req_to ON public.cima_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_cima_req_from ON public.cima_requests(from_user_id);

-- -----------------------------------------------
-- CIMA MEMBERS  (accepted creative circles)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cima_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, member_id),
  CHECK (owner_id <> member_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_members_owner ON public.cima_members(owner_id);

-- -----------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('review','cima_request','cima_accepted','rating','follower')),
  message      TEXT        NOT NULL,
  from_user_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  film_id      UUID        REFERENCES public.films(id) ON DELETE SET NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- -----------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at')
  THEN CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'films_updated_at')
  THEN CREATE TRIGGER films_updated_at BEFORE UPDATE ON public.films FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ratings_updated_at')
  THEN CREATE TRIGGER ratings_updated_at BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reviews_updated_at')
  THEN CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'lists_updated_at')
  THEN CREATE TRIGGER lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); END IF;
END $$;

-- ============================================================
-- Row Level Security (RLS)
--
-- The Express backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses
-- RLS entirely — Express is the ONLY writer for every table below.
-- The frontend never talks to these tables directly (only to Supabase
-- Auth and Supabase Storage), so RLS here is defense-in-depth: every
-- table is publicly readable where appropriate, and NO anon/authenticated
-- write policy exists — writes are only possible through Express, which
-- enforces requireAuth / requireRole / requireOwner before touching the DB.
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_credits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cima_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cima_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_films  ENABLE ROW LEVEL SECURITY;

-- Drop any legacy client-write policies from the pre-audit schema —
-- all writes now go through Express with the service role key.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can add films"   ON public.films;
DROP POLICY IF EXISTS "Uploaders can update own films"      ON public.films;
DROP POLICY IF EXISTS "Uploaders can delete own films"      ON public.films;
DROP POLICY IF EXISTS "Auth users can rate"                 ON public.ratings;
DROP POLICY IF EXISTS "Auth users can update own rating"    ON public.ratings;
DROP POLICY IF EXISTS "Auth users can review"                ON public.reviews;
DROP POLICY IF EXISTS "Auth users can send cima requests"   ON public.cima_requests;
DROP POLICY IF EXISTS "Recipients can update cima request"  ON public.cima_requests;
DROP POLICY IF EXISTS "Users can update own notifications"  ON public.notifications;

-- Public read policies (SELECT only — every write is server-side).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Profiles are publicly readable') THEN
    CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='films' AND policyname='Published films are publicly readable') THEN
    CREATE POLICY "Published films are publicly readable" ON public.films FOR SELECT USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ratings' AND policyname='Ratings are publicly readable') THEN
    CREATE POLICY "Ratings are publicly readable" ON public.ratings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Reviews are publicly readable') THEN
    CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='featured_films' AND policyname='Featured films are public') THEN
    CREATE POLICY "Featured films are public" ON public.featured_films FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lists' AND policyname='Public lists are readable') THEN
    CREATE POLICY "Public lists are readable" ON public.lists FOR SELECT USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cima_requests' AND policyname='Cima requests visible to involved') THEN
    CREATE POLICY "Cima requests visible to involved" ON public.cima_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cima_members' AND policyname='Cima members visible to owner') THEN
    CREATE POLICY "Cima members visible to owner" ON public.cima_members FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users see own notifications') THEN
    CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
