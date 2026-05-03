/**
 * One-shot migration script — runs CREATE TABLE IF NOT EXISTS for every
 * table in the Drizzle schema using the app's own Neon serverless connection.
 * Safe to run multiple times (idempotent).
 */
import 'dotenv/config';
import ws from 'ws';
import { Pool, neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const statements = [
  // ── Core tables ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS episodes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT,
    artwork_url TEXT,
    duration INTEGER,
    air_date TIMESTAMP,
    genre TEXT,
    host_name TEXT,
    tags TEXT[],
    tracklist JSONB,
    likes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS editorial_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT,
    excerpt TEXT,
    cover_image_url TEXT,
    author TEXT,
    category TEXT,
    tags TEXT[],
    published_at TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS content_tags (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    UNIQUE(content_id, tag_id)
  )`,

  `CREATE TABLE IF NOT EXISTS editorial_features (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    feature_type TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS mix_submissions (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT,
    artwork_url TEXT,
    tracklist JSONB,
    tags TEXT[],
    status TEXT DEFAULT 'pending',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    submitter_handle TEXT,
    submitter_email TEXT,
    content_type TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'pending',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS current_playback (
    id SERIAL PRIMARY KEY,
    track_title TEXT,
    artist TEXT,
    album TEXT,
    artwork_url TEXT,
    started_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS stream_status (
    id SERIAL PRIMARY KEY,
    is_live BOOLEAN DEFAULT FALSE,
    listener_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  // ── Like system (NEW) ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS content_likes (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    session_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT content_likes_unique UNIQUE (entity_type, entity_id, session_key)
  )`,

  `CREATE INDEX IF NOT EXISTS content_likes_entity_idx ON content_likes (entity_type, entity_id)`,
  `CREATE INDEX IF NOT EXISTS content_likes_created_at_idx ON content_likes (created_at)`,

  // ── Seed settings ────────────────────────────────────────────────────────────
  `INSERT INTO settings (key, value, description)
   VALUES ('like_promotion_threshold', '10', 'Number of listener likes before content auto-promotes to a community feature slot')
   ON CONFLICT (key) DO NOTHING`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log(`Running ${statements.length} migration statements...`);
    for (const sql of statements) {
      const preview = sql.trim().split('\n')[0].slice(0, 70);
      process.stdout.write(`  ${preview}... `);
      await client.query(sql);
      console.log('✅');
    }
    console.log('\n🎉 Migration complete — all tables ready.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
