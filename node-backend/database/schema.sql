-- ============================================================
-- Kalinga Cloud Development — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (project: psblyvwfbgmwyrtzoyhz)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT        NOT NULL UNIQUE,
  password_hash   TEXT,                          -- NULL if using Supabase Auth
  full_name       TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'responder'
                              CHECK (role IN ('responder','doh_officer','admin','patient','logistics')),
  contact_number  TEXT,
  address         TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','verified','deactivated','suspended')),
  verified_at           TIMESTAMPTZ,
  deactivated_at        TIMESTAMPTZ,
  deactivation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── REGIONS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT  NOT NULL,
  code        TEXT,
  province    TEXT,
  coordinates JSONB  -- { lat, lng } or GeoJSON
);

-- ─── LOCATIONS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  address     TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RESPONDERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responders (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT,
  contact_number  TEXT,
  role            TEXT        DEFAULT 'field_responder',
  status          TEXT        NOT NULL DEFAULT 'standby'
                              CHECK (status IN ('active','on_duty','standby','off_duty','unavailable')),
  specialty       TEXT,
  certifications  JSONB,
  location        JSONB,      -- { lat, lng, address }
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HOSPITALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  address         TEXT,
  type            TEXT        DEFAULT 'general'
                              CHECK (type IN ('general','specialty','trauma','doh_accredited')),
  status          TEXT        NOT NULL DEFAULT 'operational'
                              CHECK (status IN ('operational','limited','overcapacity','closed')),
  total_beds      INTEGER     DEFAULT 0,
  available_beds  INTEGER     DEFAULT 0,
  icu_beds        INTEGER     DEFAULT 0,
  contact_number  TEXT,
  coordinates     JSONB,      -- { lat, lng }
  specialties     JSONB,      -- ["Cardiology","Emergency"]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PATIENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  full_name       TEXT        NOT NULL,
  age             INTEGER,
  gender          TEXT        CHECK (gender IN ('male','female','other')),
  contact_number  TEXT,
  hospital_id     UUID        REFERENCES hospitals(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'admitted'
                              CHECK (status IN ('admitted','discharged','referred','critical','deceased')),
  triage_level    TEXT        CHECK (triage_level IN ('low','medium','high','very_high','critical')),
  assigned_bed    TEXT,
  admitted_at     TIMESTAMPTZ DEFAULT NOW(),
  discharged_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRIAGE CASES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage_cases (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id           UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id            UUID        REFERENCES patients(id) ON DELETE SET NULL,
  triage_level          TEXT        NOT NULL DEFAULT 'low'
                                    CHECK (triage_level IN ('low','medium','high','very_high','critical')),
  status                TEXT        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active','transferred','resolved','deceased')),
  presenting_complaint  TEXT,
  vitals                JSONB,      -- { bp, hr, temp, spo2, rr }
  notes                 TEXT,
  assigned_to           UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INCIDENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT        NOT NULL,
  type                    TEXT        NOT NULL DEFAULT 'general',
  status                  TEXT        NOT NULL DEFAULT 'open'
                                      CHECK (status IN ('open','assigned','in_progress','resolved','closed')),
  severity                TEXT        NOT NULL DEFAULT 'medium'
                                      CHECK (severity IN ('low','medium','high','critical')),
  description             TEXT,
  location                TEXT,
  coordinates             JSONB,      -- { lat, lng }
  reporter_id             UUID        REFERENCES users(id) ON DELETE SET NULL,
  assigned_responder_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
  hospital_id             UUID        REFERENCES hospitals(id) ON DELETE SET NULL,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HOSPITAL REPORTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospital_reports (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  hospital_name TEXT        NOT NULL,
  message       TEXT,
  action        TEXT,
  severity      TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (severity IN ('low','medium','high','critical')),
  occupancy     INTEGER     CHECK (occupancy BETWEEN 0 AND 100),
  type          TEXT        DEFAULT 'capacity'
                            CHECK (type IN ('capacity','specialist','supply','general')),
  status        TEXT        DEFAULT 'active' CHECK (status IN ('active','resolved')),
  reporter_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EVACUATION CENTERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evacuation_centers (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT  NOT NULL,
  location    TEXT,
  coordinates JSONB,
  capacity    INTEGER DEFAULT 0,
  status      TEXT    DEFAULT 'active' CHECK (status IN ('active','full','closed'))
);

-- ─── RESOURCES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL
                          CHECK (type IN ('water','food','medicine','clothes','equipment','other')),
  quantity    NUMERIC     NOT NULL DEFAULT 0,
  unit        TEXT        DEFAULT 'units',
  center_id   UUID        REFERENCES evacuation_centers(id) ON DELETE SET NULL,
  status      TEXT        DEFAULT 'available' CHECK (status IN ('available','low','depleted')),
  expiry_date DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  type          TEXT        NOT NULL DEFAULT 'info'
                            CHECK (type IN ('info','warning','error','success','emergency')),
  recipient_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USER SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme                   TEXT        NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  language                TEXT        NOT NULL DEFAULT 'en',
  notifications_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications     BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_notifications       BOOLEAN     NOT NULL DEFAULT FALSE,
  two_factor_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  timezone                TEXT        NOT NULL DEFAULT 'Asia/Manila',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RESPONDER ACTIVITY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responder_activity (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  responder_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT        NOT NULL,
  description   TEXT,
  incident_id   UUID        REFERENCES incidents(id) ON DELETE SET NULL,
  points        INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRAINING COURSES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_courses (
  id                UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT  NOT NULL,
  category          TEXT,
  description       TEXT,
  total_lessons     INTEGER DEFAULT 0,
  duration_minutes  INTEGER DEFAULT 0,
  thumbnail_url     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRAINING RECORDS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_records (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         UUID        NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  module_id         TEXT,
  status            TEXT        NOT NULL DEFAULT 'not_started'
                                CHECK (status IN ('not_started','in_progress','completed','failed')),
  score             NUMERIC(5,2),
  progress_percent  INTEGER     NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- ─── CERTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       UUID        NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  certificate_url TEXT
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_recipient    ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_incidents_status           ON incidents(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter         ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_triage_hospital            ON triage_cases(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_patients_hospital          ON patients(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_resources_type             ON resources(type, center_id);
CREATE INDEX IF NOT EXISTS idx_responders_status          ON responders(status);
CREATE INDEX IF NOT EXISTS idx_activity_responder         ON responder_activity(responder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_user              ON training_records(user_id, status);

-- ─── ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────────
-- Enable RLS on sensitive tables

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE responder_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own row
CREATE POLICY "users_own_read"   ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Notifications: each user sees only their own
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = recipient_id);

-- Settings: each user sees only their own
CREATE POLICY "settings_own" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Training records: own only
CREATE POLICY "training_own" ON training_records FOR ALL USING (auth.uid() = user_id);

-- Activity: own only
CREATE POLICY "activity_own" ON responder_activity FOR ALL USING (auth.uid() = responder_id);

-- NOTE: The Node.js backend uses the SERVICE ROLE KEY which bypasses RLS.
-- These policies apply to direct Supabase JS SDK calls from the frontend.
