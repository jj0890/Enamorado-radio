# Database Schema Merge Analysis

## Executive Summary

**CRITICAL**: The production webplayer database contains **17+ tables** that are NOT in the current merged schema. Deploying without investigating these tables will result in **DATA LOSS**.

## Current Situation

### Tables in Production Webplayer DB (from drizzle-kit detection):
1. `admins` - Admin user accounts
2. `dj_submissions` - DJ mix submissions
3. `physical_media` - Physical media catalog
4. `editorial_workflow` - Editorial workflow states
5. `stations` - Radio station configurations
6. `zine_content` - Magazine/zine content
7. `zine_submissions` - Magazine submissions
8. `mix_tracklist` - Mix track listings
9. `radio_playlist` - Radio playlists
10. `episode_tracklist` - Episode track listings
11. `mix_uploads` - Uploaded mix files
12. `track_metadata` - Track metadata cache
13. `live_shows` - Live show schedule
14. `program_state` - Program state management
15. `radio_rotation` - Track rotation schedule
16. `song_submissions` - Song submissions
17. `themed_programs` - Themed radio programs

### Tables in Current Merged Schema (shared/schema.ts):
**Radio Tables:**
- `users` (conflicts with `admins`)
- `shows`
- `episodes`
- `guides`
- `hero_banners`
- `mix_submissions` (similar to `dj_submissions`)
- `episode_submissions`
- `playlist_submissions`
- `schedule`
- `resident_applications`
- `residents`
- `album_suggestions`
- `album_votes`
- `album_picks`
- `album_pick_items`
- `album_suggestion_notes`
- `current_playback`
- `contributors`
- `settings`
- `tags`

**Magazine Tables (NEW):**
- `submissions` (CONFLICTS with production naming)
- `content` (CONFLICTS - production may have content table)
- `issues`
- `issue_contents`
- `features`
- `pitches`
- `open_calls`

## Critical Conflicts

### 1. Authentication System
- **Production**: `admins` table
- **Merged Schema**: `users` table
- **Risk**: Admin login will break if deployed
- **Solution**: Need to migrate `admins` → `users` OR keep `admins` and update code

### 2. Naming Conventions
- **Production**: camelCase (`mixSubmissions`, `djSubmissions`)
- **Merged Schema**: snake_case (`mix_submissions`, `episode_submissions`)
- **Risk**: All foreign keys and relationships will break
- **Solution**: Either rename production tables OR change merged schema to camelCase

### 3. Magazine "content" Table
- **Drizzle asking**: Is `content` table new or renamed from another table?
- **Production might have**: Unknown if `content` table already exists
- **Risk**: Could overwrite existing content
- **Solution**: Rename magazine table to `editorial_content`

### 4. Missing Tables
Production has these tables that aren't in merged schema:
- `physical_media` - What is this? Still in use?
- `zine_content` - Old magazine content? Needs migration?
- `zine_submissions` - Old submissions? Merge with new system?
- `track_metadata` - Critical for music display?
- `radio_rotation` - Active radio feature?
- `themed_programs` - Active programs?

## Recommended Schema Strategy

### Phase 1: Investigation (DO THIS FIRST)
```sql
-- Run this to see what's actually in production
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = t.table_name) as column_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- Check for data in unknown tables
SELECT 'admins' as table_name, COUNT(*) as row_count FROM admins
UNION ALL SELECT 'dj_submissions', COUNT(*) FROM dj_submissions
UNION ALL SELECT 'physical_media', COUNT(*) FROM physical_media
UNION ALL SELECT 'zine_content', COUNT(*) FROM zine_content
UNION ALL SELECT 'track_metadata', COUNT(*) FROM track_metadata;
```

### Phase 2: Rename Magazine Tables (Avoid Conflicts)
Instead of generic names, use `editorial_` prefix:

**Current → Proposed:**
- `content` → `editorial_content`
- `submissions` → `editorial_submissions`
- `issues` → `editorial_issues`
- `issue_contents` → `editorial_issue_contents`
- `features` → `editorial_features`
- `pitches` → `editorial_pitches`
- `open_calls` → `editorial_open_calls`

### Phase 3: Handle Authentication
**Option A** (Recommended): Keep both systems initially
- Production keeps `admins` table
- Update auth code to read from `admins` not `users`
- Migrate `admins` → `users` later after testing

**Option B**: Migrate immediately
```sql
-- Migrate admins to users
INSERT INTO users (username, password_hash, role, created_at)
SELECT username, password_hash, 'admin', created_at FROM admins;
```

### Phase 4: Preserve Production Tables
Add these to schema.ts if still in use:
- `physical_media` - Check with you if still needed
- `track_metadata` - Likely still needed for music display
- `radio_rotation` - Check if active feature
- `themed_programs` - Check if active feature
- `mix_tracklist`, `episode_tracklist` - Needed for track listings
- `radio_playlist` - Needed for playlists

### Phase 5: Handle Legacy Magazine Tables
If `zine_content` and `zine_submissions` have data:
```sql
-- Migrate old zine content to new editorial system
INSERT INTO editorial_content (title, body, author_id, created_at, status)
SELECT title, body, author_id, created_at, 'published'
FROM zine_content
WHERE status = 'published';
```

## Migration Plan (Safe Approach)

### Step 1: Backup Everything
```bash
# Full backup before ANY changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Create Investigation Report
```bash
# Connect to production DB and run investigation queries
psql $DATABASE_URL -f investigation.sql > production_db_report.txt
```

### Step 3: Update Schema with Production Tables
Add missing production tables to `shared/schema.ts`:
- Keep ALL existing production tables in schema
- Add magazine tables with `editorial_` prefix
- Use production's naming convention (camelCase if that's what exists)

### Step 4: Update API Routes
Update `server/routes.ts` to use correct table names:
- Change `/api/content` → `/api/editorial/content`
- Change `/api/submissions` → `/api/editorial/submissions`
- Keep existing routes that reference production tables

### Step 5: Deploy in Stages
1. **Stage 1**: Add new editorial tables only (no changes to existing tables)
2. **Stage 2**: Test editorial features work
3. **Stage 3**: Gradually migrate data from legacy tables
4. **Stage 4**: Deprecate old tables only after confirming migration

## Risk Assessment

### HIGH RISK (Don't Deploy Without Fixing):
- ❌ Deploying current schema will DROP 17+ production tables
- ❌ Admin authentication will break (admins → users mismatch)
- ❌ All camelCase tables will be recreated as snake_case (data loss)
- ❌ Foreign key relationships will break

### MEDIUM RISK:
- ⚠️ Table name conflicts (`content`, `submissions`)
- ⚠️ Unknown tables might be legacy (safe to drop) or active (data loss)

### LOW RISK:
- ✅ Adding new editorial tables is safe (if using different names)
- ✅ Magazine features are new (no existing data to lose)

## Immediate Action Items

1. **STOP** - Don't run `db:push` yet
2. **BACKUP** - Full production database dump
3. **INVESTIGATE** - Run SQL to document all production tables
4. **DOCUMENT** - List which tables are active vs legacy
5. **UPDATE SCHEMA** - Add production tables to schema.ts
6. **RENAME** - Change magazine tables to use `editorial_` prefix
7. **TEST** - Deploy to staging environment first
8. **VALIDATE** - Confirm all data preserved and accessible
9. **DEPLOY** - Production deployment with rollback plan

## Questions for You

Before I can complete the safe migration:

1. **Are these tables still in use?**
   - `physical_media`
   - `track_metadata`
   - `radio_rotation`
   - `themed_programs`
   - `mix_tracklist` / `episode_tracklist`

2. **Do these legacy magazine tables have data we need?**
   - `zine_content`
   - `zine_submissions`
   - `editorial_workflow`

3. **What naming convention does production actually use?**
   - camelCase (`mixSubmissions`) or
   - snake_case (`mix_submissions`)

4. **Is there a staging/dev database I can test migrations on?**

## Next Steps

I can help you:
1. Create SQL investigation script to document production DB
2. Update schema.ts to preserve all production tables
3. Rename magazine tables to avoid conflicts
4. Create safe migration SQL scripts
5. Test everything in staging first

**Do you want me to start with the investigation script to see exactly what's in your production database?**
