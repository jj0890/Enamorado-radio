-- Editorial Projects Table
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

-- Editorial Media Library
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

-- Content Mapping Table
CREATE TABLE IF NOT EXISTS content_mapping (
  id SERIAL PRIMARY KEY,
  slot_id TEXT NOT NULL UNIQUE,
  content_type TEXT,
  content_id INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);
