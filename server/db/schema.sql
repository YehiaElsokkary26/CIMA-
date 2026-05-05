-- ============================================================
-- CIMA — PostgreSQL Schema (Neon compatible)
-- Run via: npm run migrate  (server/db/migrate.ts)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- USERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('filmmaker', 'viewer')),
  bio           TEXT,
  school        TEXT,
  city          TEXT,
  avatar_url    TEXT,
  looking_for_collaborators BOOLEAN NOT NULL DEFAULT FALSE,
  top_genre     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- FILMS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS films (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  video_url     TEXT,
  genre         TEXT[]      NOT NULL DEFAULT '{}',
  runtime_min   INTEGER,
  release_year  INTEGER,
  uploader_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_films_uploader ON films(uploader_id);
CREATE INDEX IF NOT EXISTS idx_films_created  ON films(created_at DESC);

-- -----------------------------------------------
-- FEATURED FILM OF THE WEEK
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS featured_films (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  week_start DATE        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- RATINGS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (film_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_film ON ratings(film_id);

-- -----------------------------------------------
-- REVIEWS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id    UUID        NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_film ON reviews(film_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- -----------------------------------------------
-- CIMA REQUESTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS cima_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_req_to ON cima_requests(to_user_id);

-- -----------------------------------------------
-- CIMA MEMBERS (accepted creative circles)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS cima_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_cima_members_owner ON cima_members(owner_id);

-- -----------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('review','cima_request','cima_accepted','rating','follower')),
  message      TEXT        NOT NULL,
  from_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  film_id      UUID        REFERENCES films(id) ON DELETE SET NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- -----------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at')
  THEN CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'films_updated_at')
  THEN CREATE TRIGGER films_updated_at BEFORE UPDATE ON films FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ratings_updated_at')
  THEN CREATE TRIGGER ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reviews_updated_at')
  THEN CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
END $$;
