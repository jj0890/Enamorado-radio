-- Listener-Driven Content Promotion System
-- Adds the content_likes table for anonymous session-based engagement tracking.
-- Likes on community submissions, episodes, and mixes auto-promote content
-- to editorial_features once the configured threshold is crossed.

CREATE TABLE IF NOT EXISTS content_likes (
  id           SERIAL PRIMARY KEY,
  entity_type  TEXT    NOT NULL,                   -- 'submission' | 'episode' | 'mix'
  entity_id    INTEGER NOT NULL,
  session_key  TEXT    NOT NULL,                   -- UUID from enamorado_lsid cookie
  created_at   TIMESTAMP DEFAULT NOW(),
  CONSTRAINT content_likes_unique UNIQUE (entity_type, entity_id, session_key)
);

CREATE INDEX IF NOT EXISTS content_likes_entity_idx    ON content_likes (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS content_likes_created_at_idx ON content_likes (created_at);

-- Seed default promotion threshold in settings (idempotent)
INSERT INTO settings (key, value, description)
VALUES (
  'like_promotion_threshold',
  '10',
  'Number of listener likes before content auto-promotes to a community feature slot'
)
ON CONFLICT (key) DO NOTHING;
