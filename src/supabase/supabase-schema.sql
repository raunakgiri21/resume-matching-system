-- ============================================================
-- Resume Matcher — Supabase SQL Schema
-- Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── USERS ─────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password         TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'student'
                     CHECK (role IN ('admin', 'student')),

  -- Student profile fields
  phone            TEXT,
  branch           TEXT,
  graduation_year  TEXT,
  skills           TEXT,
  linkedin_url     TEXT,

  -- Resume
  resume_url       TEXT,
  resume_filename  TEXT,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── PLACEMENTS ────────────────────────────────────────────────────────────
CREATE TABLE placements (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  company_name         TEXT NOT NULL,
  role_title           TEXT NOT NULL,
  job_description      TEXT NOT NULL,
  ctc_lpa              NUMERIC(6,2) NOT NULL DEFAULT 0,
  location             TEXT,
  required_skills      TEXT,
  eligibility_criteria TEXT,
  last_date            DATE,

  status               TEXT NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open', 'closed', 'completed')),

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);


-- ── REGISTRATIONS ─────────────────────────────────────────────────────────
CREATE TABLE registrations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id  UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status        TEXT NOT NULL DEFAULT 'registered'
                  CHECK (status IN ('registered', 'matched', 'shortlisted', 'rejected')),

  registered_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(placement_id, student_id)
);


-- ── MATCH RESULTS ─────────────────────────────────────────────────────────
CREATE TABLE match_results (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id  UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  placement_id     UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  score            INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  rank             INTEGER,

  matching_skills  JSONB DEFAULT '[]',
  missing_skills   JSONB DEFAULT '[]',
  strengths        JSONB DEFAULT '[]',

  feedback         TEXT,       -- shown to student
  admin_summary    TEXT,       -- shown to admin only

  processed_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX idx_registrations_placement ON registrations(placement_id);
CREATE INDEX idx_registrations_student   ON registrations(student_id);
CREATE INDEX idx_match_results_placement ON match_results(placement_id);
CREATE INDEX idx_match_results_student   ON match_results(student_id);
CREATE INDEX idx_match_results_score     ON match_results(score DESC);
CREATE INDEX idx_match_results_rank      ON match_results(placement_id, rank);


-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- NestJS uses the service_role key which bypasses RLS automatically.
-- These policies protect the tables if the anon key is ever used directly.

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Placements: anyone can read
CREATE POLICY "placements_public_read" ON placements
  FOR SELECT USING (true);

-- Registrations: student sees only their own rows
CREATE POLICY "registrations_own" ON registrations
  FOR SELECT USING (student_id::text = current_setting('app.user_id', true));

-- Match results: student sees only their own rows
CREATE POLICY "match_results_own" ON match_results
  FOR SELECT USING (student_id::text = current_setting('app.user_id', true));