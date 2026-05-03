-- Migration: Editorial System V2
-- Date: 2026-02-01
-- Description: Enhanced contributor profiles, content-contributor linking,
--              new content types (notes, picks_list), and Substack import support

-- ============================================
-- 1. ENHANCE CONTRIBUTORS TABLE
-- ============================================

-- Add new columns to contributors table
ALTER TABLE contributors
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS photoshoot_gallery JSONB,
ADD COLUMN IF NOT EXISTS recommended_playlist_url TEXT,
ADD COLUMN IF NOT EXISTS recommended_playlist_platform TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add comment for clarity
COMMENT ON COLUMN contributors.social_links IS 'JSONB: { instagram?, twitter?, soundcloud?, bandcamp?, spotify? }';
COMMENT ON COLUMN contributors.photoshoot_gallery IS 'JSONB: Array of { src, alt?, caption?, credit? }';
COMMENT ON COLUMN contributors.role IS 'One of: dj, writer, photographer, curator, artist, producer, other';

-- ============================================
-- 2. CREATE CONTENT-CONTRIBUTOR JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS content_contributors (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES editorial_content(id) ON DELETE CASCADE,
  contributor_id INTEGER NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'author', -- author, photographer, interviewer, subject, curator, editor
  position INTEGER DEFAULT 0, -- for ordering multiple contributors
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, contributor_id, role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_contributors_content ON content_contributors(content_id);
CREATE INDEX IF NOT EXISTS idx_content_contributors_contributor ON content_contributors(contributor_id);

COMMENT ON TABLE content_contributors IS 'Links editorial content to contributors with roles. Replaces string-based authors array.';

-- ============================================
-- 3. ENHANCE CONTENT TABLE
-- ============================================

-- Add import tracking columns
ALTER TABLE editorial_content
ADD COLUMN IF NOT EXISTS import_source TEXT, -- substack, medium, gdocs
ADD COLUMN IF NOT EXISTS import_source_url TEXT,
ADD COLUMN IF NOT EXISTS import_source_author TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN editorial_content.import_source IS 'Source platform: substack, medium, gdocs, or null for original content';
COMMENT ON COLUMN editorial_content.read_time_minutes IS 'Auto-calculated based on word count (~200 words/min)';

-- ============================================
-- 4. MIGRATE TIER VALUES (optional - run if using new naming)
-- ============================================

-- Update tier values from old naming to new naming
-- Uncomment and run these when ready to migrate:

-- UPDATE editorial_content SET tier = 'editorial' WHERE tier = 'issue';
-- UPDATE editorial_content SET tier = 'featured' WHERE tier = 'web_exclusive';
-- UPDATE editorial_content SET tier = 'archive' WHERE tier = 'community';

-- ============================================
-- 5. CREATE INDEXES FOR NEW QUERIES
-- ============================================

-- Index for filtering by tier
CREATE INDEX IF NOT EXISTS idx_content_tier ON editorial_content(tier);

-- Index for finding imported content
CREATE INDEX IF NOT EXISTS idx_content_import_source ON editorial_content(import_source) WHERE import_source IS NOT NULL;

-- Index for featured contributors
CREATE INDEX IF NOT EXISTS idx_contributors_featured ON contributors(is_featured) WHERE is_featured = true;

-- Index for public contributors
CREATE INDEX IF NOT EXISTS idx_contributors_public ON contributors(is_public) WHERE is_public = true;

-- ============================================
-- 6. HELPER FUNCTION: Calculate read time
-- ============================================

CREATE OR REPLACE FUNCTION calculate_read_time(body_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  read_time INTEGER;
BEGIN
  -- Count words (split by whitespace)
  word_count := array_length(regexp_split_to_array(COALESCE(body_text, ''), '\s+'), 1);

  -- Calculate read time at ~200 words per minute, minimum 1 minute
  read_time := GREATEST(1, CEIL(word_count::FLOAT / 200));

  RETURN read_time;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_read_time IS 'Calculates estimated read time in minutes based on word count (~200 wpm)';

-- ============================================
-- 7. TRIGGER: Auto-update read_time on content save
-- ============================================

CREATE OR REPLACE FUNCTION update_content_read_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate read time from body text
  NEW.read_time_minutes := calculate_read_time(NEW.body);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_read_time ON editorial_content;
CREATE TRIGGER trigger_update_read_time
  BEFORE INSERT OR UPDATE OF body ON editorial_content
  FOR EACH ROW
  EXECUTE FUNCTION update_content_read_time();

-- ============================================
-- 8. TRIGGER: Auto-update contributor updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_contributor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contributor_timestamp ON contributors;
CREATE TRIGGER trigger_update_contributor_timestamp
  BEFORE UPDATE ON contributors
  FOR EACH ROW
  EXECUTE FUNCTION update_contributor_timestamp();

-- ============================================
-- 9. BACKFILL: Calculate read_time for existing content
-- ============================================

UPDATE editorial_content
SET read_time_minutes = calculate_read_time(body)
WHERE read_time_minutes IS NULL AND body IS NOT NULL;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS trigger_update_read_time ON editorial_content;
DROP TRIGGER IF EXISTS trigger_update_contributor_timestamp ON contributors;
DROP FUNCTION IF EXISTS update_content_read_time();
DROP FUNCTION IF EXISTS update_contributor_timestamp();
DROP FUNCTION IF EXISTS calculate_read_time(TEXT);
DROP TABLE IF EXISTS content_contributors;

ALTER TABLE contributors
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS website_url,
DROP COLUMN IF EXISTS social_links,
DROP COLUMN IF EXISTS photoshoot_gallery,
DROP COLUMN IF EXISTS recommended_playlist_url,
DROP COLUMN IF EXISTS recommended_playlist_platform,
DROP COLUMN IF EXISTS tagline,
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS is_featured,
DROP COLUMN IF EXISTS updated_at;

ALTER TABLE editorial_content
DROP COLUMN IF EXISTS import_source,
DROP COLUMN IF EXISTS import_source_url,
DROP COLUMN IF EXISTS import_source_author,
DROP COLUMN IF EXISTS imported_at,
DROP COLUMN IF EXISTS read_time_minutes,
DROP COLUMN IF EXISTS updated_at;
*/
