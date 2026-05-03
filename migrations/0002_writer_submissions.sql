-- Migration: Editorial Writer Submissions
-- Date: 2026-02-23
-- Description: Creates the editorial_writer_submissions table for writer pitch management.
--              Uses a distinct table name to avoid collision with the existing
--              editorial_submissions (community/magazine) table.

CREATE TABLE IF NOT EXISTS editorial_writer_submissions (
  id                    SERIAL PRIMARY KEY,

  -- Writer info
  writer_name           VARCHAR(255)  NOT NULL,
  writer_email          VARCHAR(255)  NOT NULL,
  writer_bio            TEXT,
  portfolio_links       JSONB,          -- string[]
  social_links          JSONB,          -- { twitter?, instagram? }

  -- Pitch info
  pitch_title           VARCHAR(500)  NOT NULL,
  pitch_category        VARCHAR(100),
  pitch_summary         TEXT          NOT NULL,
  why_this_publication  TEXT,
  unique_angle          TEXT,

  -- Writing sample
  writing_sample_text   TEXT,
  writing_sample_file   VARCHAR(500),   -- S3 URL or file path
  word_count            INTEGER,

  -- Metadata
  target_publish_date   TIMESTAMP,
  exclusive_submission  BOOLEAN       DEFAULT false,
  previously_published  BOOLEAN       DEFAULT false,

  -- Review workflow
  status                VARCHAR(50)   DEFAULT 'pending'
                          CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
  reviewed_by           INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  review_notes          TEXT,

  -- Timestamps
  submitted_at          TIMESTAMP     DEFAULT NOW(),
  reviewed_at           TIMESTAMP,
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
);

-- Index for the admin listing queries (filter by status + order by submitted_at)
CREATE INDEX IF NOT EXISTS idx_ews_status_submitted
  ON editorial_writer_submissions (status, submitted_at DESC);

-- Index for reviewer lookups
CREATE INDEX IF NOT EXISTS idx_ews_reviewed_by
  ON editorial_writer_submissions (reviewed_by);

COMMENT ON TABLE editorial_writer_submissions IS
  'Writer pitch submissions to the Enamorado Radio editorial team. '
  'Status flow: pending → under_review → accepted | rejected.';
