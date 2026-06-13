-- ============================================================
-- CIMA — PostgreSQL Schema (Supabase compatible)
-- Run in the Supabase SQL Editor, or via: npm run migrate
-- ============================================================

-- -----------------------------------------------
-- PROFILES  (linked to Supabase Auth users)
-- -----------------------------------------------
-- This replaces the old "users" table.
-- Passwords are managed entirely by Supabase Auth.
-- A DB trigger auto-creates a profile row whenever a user
-- registers via Supabase Auth.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('filmmaker', 'viewer')),
  bio         TEXT,
  school      TEXT,
  city        TEXT,
  avatar_url  TEXT,
  looking_for_collaborators BOOLEAN NOT NULL DEFAULT FALSE,
  top_genre   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate so the function update takes effect
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- FILMS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.films (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  video_url     TEXT,
  genre         TEXT[]      NOT NULL DEFAULT '{}',
  runtime_min   INTEGER,
  release_year  INTEGER,
  uploader_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_films_uploader ON public.films(uploader_id);
CREATE INDEX IF NOT EXISTS idx_films_created  ON public.films(created_at DESC);

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
-- RATINGS
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_film ON public.reviews(film_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- -----------------------------------------------
-- CIMA REQUESTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cima_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_req_to ON public.cima_requests(to_user_id);

-- -----------------------------------------------
-- CIMA MEMBERS  (accepted creative circles)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cima_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, member_id)
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

CREATE INDEX IF NOT EXISTS idx_notif_user   ON public.notifications(user_id);
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
END $$;

-- -----------------------------------------------
-- Row Level Security (RLS)
-- The Express backend uses SERVICE_ROLE_KEY which bypasses RLS.
-- These policies govern direct frontend/dashboard access.
-- -----------------------------------------------
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cima_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cima_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_films ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, self-update
CREATE POLICY "Profiles are publicly readable"     ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Films: public read, authenticated insert (filmmaker check done in Express)
CREATE POLICY "Films are publicly readable"        ON public.films FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add films"  ON public.films FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Uploaders can update own films"     ON public.films FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Uploaders can delete own films"     ON public.films FOR DELETE USING (auth.uid() = uploader_id);

-- Ratings/reviews: public read, authenticated write
CREATE POLICY "Ratings are publicly readable"      ON public.ratings  FOR SELECT USING (true);
CREATE POLICY "Auth users can rate"                ON public.ratings  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can update own rating"   ON public.ratings  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Reviews are publicly readable"      ON public.reviews  FOR SELECT USING (true);
CREATE POLICY "Auth users can review"              ON public.reviews  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Cima
CREATE POLICY "Cima requests visible to involved"  ON public.cima_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Auth users can send cima requests"  ON public.cima_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Recipients can update cima request" ON public.cima_requests FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Cima members visible to owner"      ON public.cima_members  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

-- Notifications: private to owner
CREATE POLICY "Users see own notifications"        ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Featured films: publicly readable
CREATE POLICY "Featured films are public"          ON public.featured_films FOR SELECT USING (true);

-- -----------------------------------------------
-- FILM EXTRA COLUMNS (idempotent additions)
-- -----------------------------------------------
ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS trailer_url      TEXT,
  ADD COLUMN IF NOT EXISTS votes            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aspect_ratio     TEXT    NOT NULL DEFAULT '4:5',
  ADD COLUMN IF NOT EXISTS is_film_of_week  BOOLEAN NOT NULL DEFAULT FALSE;

-- -----------------------------------------------
-- FILM VOTES  (one vote per user per week)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.film_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_film_votes_film ON public.film_votes(film_id);
CREATE INDEX IF NOT EXISTS idx_film_votes_user ON public.film_votes(user_id);

ALTER TABLE public.film_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own votes"    ON public.film_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth users can vote"        ON public.film_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
