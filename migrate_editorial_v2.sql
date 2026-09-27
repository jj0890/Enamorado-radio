-- Editorial CMS expansion migration
-- Run this against your Neon database

-- ── editorial_projects: new columns ────────────────────────────────────────

ALTER TABLE editorial_projects
  ADD COLUMN IF NOT EXISTS slug                TEXT,
  ADD COLUMN IF NOT EXISTS meta_title          TEXT,
  ADD COLUMN IF NOT EXISTS meta_description    TEXT,
  ADD COLUMN IF NOT EXISTS og_image            TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS license             TEXT DEFAULT 'all-rights-reserved',
  ADD COLUMN IF NOT EXISTS reading_time        INTEGER,
  ADD COLUMN IF NOT EXISTS word_count          INTEGER,
  ADD COLUMN IF NOT EXISTS view_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS co_authors          TEXT[],
  ADD COLUMN IF NOT EXISTS editorial_notes     TEXT,
  ADD COLUMN IF NOT EXISTS copy_edited_by      TEXT,
  ADD COLUMN IF NOT EXISTS copy_edited_at      TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fact_checked        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_cleared       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS related_project_ids INTEGER[],
  ADD COLUMN IF NOT EXISTS image_captions      JSONB,
  ADD COLUMN IF NOT EXISTS featured_embed      JSONB;

-- ── editorial_media: caption + alt text + project link ──────────────────────

ALTER TABLE editorial_media
  ADD COLUMN IF NOT EXISTS caption    TEXT,
  ADD COLUMN IF NOT EXISTS alt_text   TEXT,
  ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- ── editorial_revisions: new table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editorial_revisions (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL,
  label        TEXT,
  content      TEXT,
  form_snapshot JSONB,
  saved_by     TEXT,
  saved_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_editorial_revisions_project
  ON editorial_revisions (project_id, saved_at DESC);
