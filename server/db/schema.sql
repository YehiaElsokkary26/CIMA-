-- ============================================================
-- KLAKET — PostgreSQL Schema (Supabase compatible). Safe to re-run.
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
  top_genre       TEXT,
  favorite_genres TEXT[]      NOT NULL DEFAULT '{}',
  crew_roles      TEXT[]      NOT NULL DEFAULT '{}',
  banner_url      TEXT,
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
  -- Sign-up metadata comes from the browser, so treat it as untrusted:
  -- any role other than 'filmmaker' becomes 'viewer' (an unexpected value
  -- would otherwise fail the CHECK constraint and break the whole sign-up),
  -- and the name is trimmed and capped.
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    LEFT(COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)), 100),
    COALESCE(NEW.email, ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'filmmaker' THEN 'filmmaker' ELSE 'viewer' END
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
  uploader_role TEXT,
  uploader_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_films_uploader ON public.films(uploader_id);
CREATE INDEX IF NOT EXISTS idx_films_created  ON public.films(created_at DESC);

-- Trailer + aspect ratio were added after the initial release — the
-- frontend upload flow and film cards both need them. ADD COLUMN IF NOT
-- EXISTS keeps this script re-runnable against a DB that already has them.
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS trailer_url  TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS uploader_role TEXT;

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
CREATE INDEX IF NOT EXISTS idx_featured_film ON public.featured_films(film_id);

-- -----------------------------------------------
-- VOTES  (Film of the Week — one vote per user per calendar week)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE        NOT NULL DEFAULT (date_trunc('week', now() AT TIME ZONE 'UTC')::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_votes_film_week ON public.votes(film_id, week_start);
-- Weeks run Monday to Sunday in UTC, matching the app (older databases used the server's zone).
ALTER TABLE public.votes ALTER COLUMN week_start SET DEFAULT (date_trunc('week', now() AT TIME ZONE 'UTC')::date);

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
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_user_id <> to_user_id),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_req_to ON public.cima_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_cima_req_from ON public.cima_requests(from_user_id, status);

-- -----------------------------------------------
-- CIMA MEMBERS  (accepted creative circles)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cima_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (owner_id <> member_id),
  UNIQUE (owner_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_members_owner ON public.cima_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_cima_members_member ON public.cima_members(member_id);

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

-- Every CREATE POLICY below is preceded by DROP POLICY IF EXISTS for both
-- its own name and any name an earlier iteration of this script used, so
-- the whole file stays safely re-runnable against a database that already
-- has policies from a previous run (under any of their past names).

-- Drop the old overly-permissive write policies if this script is being
-- re-run against a database that already has them — "WITH CHECK
-- (auth.uid() IS NOT NULL)" let any signed-in user write these tables
-- directly from the browser, impersonating any uploader_id/user_id.
DROP POLICY IF EXISTS "Authenticated users can add films" ON public.films;
DROP POLICY IF EXISTS "Uploaders can update own films"    ON public.films;
DROP POLICY IF EXISTS "Uploaders can delete own films"    ON public.films;
DROP POLICY IF EXISTS "Auth users can rate"                ON public.ratings;
DROP POLICY IF EXISTS "Auth users can update own rating"   ON public.ratings;
DROP POLICY IF EXISTS "Auth users can review"              ON public.reviews;

-- Profiles: public read, self-update
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly readable"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"       ON public.profiles;
CREATE POLICY "Profiles are publicly readable"     ON public.profiles FOR SELECT USING (true);
-- No direct-client UPDATE on profiles: PATCH /api/users/me validates every field.

-- Films: public read only. All writes go through Express with the
-- service-role key (which bypasses RLS entirely), so there is deliberately
-- no direct-client INSERT/UPDATE/DELETE policy here any more — a policy
-- like "WITH CHECK (auth.uid() IS NOT NULL)" only checks the caller is
-- logged in, not that uploader_id matches them, which let any signed-in
-- user write a films row claiming to be anyone else. Also fixed: these
-- referenced a "filmmaker_id" column that was never the real column name
-- (public.films.uploader_id), so they could never have worked as written.
DROP POLICY IF EXISTS "Films are publicly readable" ON public.films;
CREATE POLICY "Films are publicly readable"        ON public.films FOR SELECT USING (true);

-- Ratings/reviews: public read only, same reasoning as films above —
-- all writes go through Express (POST /api/films/:id/rate and
-- /api/films/:id/review), which sets user_id from the verified JWT.
DROP POLICY IF EXISTS "Ratings are publicly readable" ON public.ratings;
CREATE POLICY "Ratings are publicly readable"      ON public.ratings  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"      ON public.reviews  FOR SELECT USING (true);

-- Votes: a secret ballot. The API returns counts only; each person can see
-- just their own votes. POST /api/films/:id/vote is the only way to vote.
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Votes are publicly readable" ON public.votes;
DROP POLICY IF EXISTS "Users see own votes"         ON public.votes;
CREATE POLICY "Users see own votes"                ON public.votes FOR SELECT USING (auth.uid() = user_id);

-- Cima
DROP POLICY IF EXISTS "Cima requests visible to sender or recipient" ON public.cima_requests;
DROP POLICY IF EXISTS "Recipient can update request status"          ON public.cima_requests;
DROP POLICY IF EXISTS "Users can send cima requests"                 ON public.cima_requests;
DROP POLICY IF EXISTS "Cima requests visible to involved"            ON public.cima_requests;
DROP POLICY IF EXISTS "Auth users can send cima requests"            ON public.cima_requests;
DROP POLICY IF EXISTS "Recipients can update cima request"           ON public.cima_requests;
CREATE POLICY "Cima requests visible to involved"  ON public.cima_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
-- No direct-client writes on crew tables: the API sends notifications and keeps both sides in sync.

DROP POLICY IF EXISTS "Cima members publicly readable" ON public.cima_members;
DROP POLICY IF EXISTS "Owner manages own cima members" ON public.cima_members;
DROP POLICY IF EXISTS "Cima members visible to owner"  ON public.cima_members;
CREATE POLICY "Cima members visible to owner"      ON public.cima_members  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

-- Notifications: private to owner
DROP POLICY IF EXISTS "System or self can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users see own notifications"              ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications"           ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"       ON public.notifications;
CREATE POLICY "Users see own notifications"        ON public.notifications FOR SELECT USING (auth.uid() = user_id);
-- Marking notifications read goes through PATCH /api/notifications/*.

-- Featured films: publicly readable
DROP POLICY IF EXISTS "Featured films publicly readable" ON public.featured_films;
DROP POLICY IF EXISTS "Featured films are public"         ON public.featured_films;
CREATE POLICY "Featured films are public"          ON public.featured_films FOR SELECT USING (true);

-- -----------------------------------------------
-- STORAGE  (films, thumbnails, trailers, avatars, banners)
-- -----------------------------------------------
-- Files are uploaded straight from the browser with the user's own session,
-- always to "<bucket>/<their user id>/<file>". Buckets are public, so anyone
-- can view a file by URL; these policies decide who may write.
-- Wrapped in DO blocks: on projects where the migration role does not own
-- storage.objects, this logs a notice instead of aborting the migration
-- (create the same policies in Dashboard → Storage → Policies instead).
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES
    ('films', 'films', true),
    ('thumbnails', 'thumbnails', true),
    ('trailers', 'trailers', true),
    ('avatars', 'avatars', true),
    ('banners', 'banners', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
  RAISE NOTICE 'Skipped bucket setup: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Klaket: read own uploads"      ON storage.objects;
  DROP POLICY IF EXISTS "Klaket: upload to own folder"  ON storage.objects;
  DROP POLICY IF EXISTS "Klaket: replace own uploads"   ON storage.objects;
  DROP POLICY IF EXISTS "Klaket: delete own uploads"    ON storage.objects;

  CREATE POLICY "Klaket: read own uploads" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id IN ('films','thumbnails','trailers','avatars','banners')
           AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "Klaket: upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('films','thumbnails','trailers','avatars','banners')
                AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "Klaket: replace own uploads" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('films','thumbnails','trailers','avatars','banners')
           AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id IN ('films','thumbnails','trailers','avatars','banners')
                AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "Klaket: delete own uploads" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('films','thumbnails','trailers','avatars','banners')
           AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN insufficient_privilege OR undefined_table OR undefined_function THEN
  RAISE NOTICE 'Skipped storage policies: %', SQLERRM;
END $$;

-- Size and type limits, enforced by Supabase Storage on every upload.
DO $$
BEGIN
  UPDATE storage.buckets SET file_size_limit = 524288000,  -- 500 MB
         allowed_mime_types = ARRAY['video/mp4','video/quicktime','video/webm']
   WHERE id = 'films';
  UPDATE storage.buckets SET file_size_limit = 104857600,  -- 100 MB
         allowed_mime_types = ARRAY['video/mp4','video/quicktime','video/webm']
   WHERE id = 'trailers';
  UPDATE storage.buckets SET file_size_limit = 5242880,    -- 5 MB
         allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
   WHERE id IN ('thumbnails','avatars','banners');
EXCEPTION WHEN insufficient_privilege OR undefined_table OR undefined_column THEN
  RAISE NOTICE 'Skipped bucket limits: %', SQLERRM;
END $$;

-- -----------------------------------------------
-- REALTIME  (live notifications in the app)
-- -----------------------------------------------
-- The Notifications screen listens for new rows over Supabase Realtime,
-- which only sees tables in the supabase_realtime publication. Row-level
-- security still applies, so people only receive their own notifications.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Skipped realtime publication: %', SQLERRM;
END $$;

-- -----------------------------------------------
-- LEAST PRIVILEGE  (what the browser's anon key can touch)
-- -----------------------------------------------
-- Supabase grants anon/authenticated ALL on every public table by default,
-- so RLS was the only guard and anyone with the public anon key could read
-- columns such as profiles.email over the REST API. The app never reads or
-- writes these tables from the browser: everything goes through the Express
-- API (service role). The one exception is the live notifications feed, which
-- needs SELECT on notifications (RLS still limits it to the owner's rows).
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END LOOP;
    GRANT SELECT ON public.notifications TO authenticated;
    -- Tables created later by this role start locked down too.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
  END IF;
END $$;
