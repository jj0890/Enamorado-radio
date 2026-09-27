import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './shared/schema.js';

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('Creating editorial_projects table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS editorial_projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planning',
        description TEXT,
        content TEXT,
        cover_image TEXT,
        images TEXT[],
        interviewee TEXT,
        interviewee_role TEXT,
        interviewee_image TEXT,
        author TEXT,
        author_bio TEXT,
        author_image TEXT,
        external_url TEXT,
        external_type TEXT,
        assigned_to TEXT,
        due_date TIMESTAMP,
        tags TEXT[],
        credits JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        published_at TIMESTAMP
      );
    `);
    console.log('✓ editorial_projects table created');

    console.log('Creating editorial_media table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS editorial_media (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        type TEXT NOT NULL,
        size INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        uploaded_by TEXT,
        tags TEXT[]
      );
    `);
    console.log('✓ editorial_media table created');

    console.log('Creating content_mapping table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_mapping (
        id SERIAL PRIMARY KEY,
        slot_id TEXT NOT NULL UNIQUE,
        content_type TEXT,
        content_id INTEGER,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by TEXT
      );
    `);
    console.log('✓ content_mapping table created');

    console.log('Adding layout_style column to editorial_projects...');
    await pool.query(`
      ALTER TABLE editorial_projects
      ADD COLUMN IF NOT EXISTS layout_style TEXT;
    `);
    console.log('✓ layout_style column added');

    console.log('\n✅ All editorial tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
