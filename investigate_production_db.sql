-- Production Database Investigation Script
-- Run this to understand what tables exist and which have data
-- Usage: psql $DATABASE_URL -f investigate_production_db.sql

\echo '=== PRODUCTION DATABASE INVESTIGATION ==='
\echo ''

-- 1. List all tables with size and row counts
\echo '1. ALL TABLES (sorted by size):'
\echo '-----------------------------------'
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

\echo ''
\echo '2. ROW COUNTS FOR ALL TABLES:'
\echo '-----------------------------------'

-- Tables detected by drizzle-kit
SELECT 'admins' as table_name, COUNT(*) as rows FROM admins WHERE EXISTS (SELECT 1 FROM admins);
SELECT 'dj_submissions' as table_name, COUNT(*) as rows FROM dj_submissions WHERE EXISTS (SELECT 1 FROM dj_submissions);
SELECT 'physical_media' as table_name, COUNT(*) as rows FROM physical_media WHERE EXISTS (SELECT 1 FROM physical_media);
SELECT 'editorial_workflow' as table_name, COUNT(*) as rows FROM editorial_workflow WHERE EXISTS (SELECT 1 FROM editorial_workflow);
SELECT 'stations' as table_name, COUNT(*) as rows FROM stations WHERE EXISTS (SELECT 1 FROM stations);
SELECT 'zine_content' as table_name, COUNT(*) as rows FROM zine_content WHERE EXISTS (SELECT 1 FROM zine_content);
SELECT 'zine_submissions' as table_name, COUNT(*) as rows FROM zine_submissions WHERE EXISTS (SELECT 1 FROM zine_submissions);
SELECT 'mix_tracklist' as table_name, COUNT(*) as rows FROM mix_tracklist WHERE EXISTS (SELECT 1 FROM mix_tracklist);
SELECT 'radio_playlist' as table_name, COUNT(*) as rows FROM radio_playlist WHERE EXISTS (SELECT 1 FROM radio_playlist);
SELECT 'episode_tracklist' as table_name, COUNT(*) as rows FROM episode_tracklist WHERE EXISTS (SELECT 1 FROM episode_tracklist);
SELECT 'mix_uploads' as table_name, COUNT(*) as rows FROM mix_uploads WHERE EXISTS (SELECT 1 FROM mix_uploads);
SELECT 'track_metadata' as table_name, COUNT(*) as rows FROM track_metadata WHERE EXISTS (SELECT 1 FROM track_metadata);
SELECT 'live_shows' as table_name, COUNT(*) as rows FROM live_shows WHERE EXISTS (SELECT 1 FROM live_shows);
SELECT 'program_state' as table_name, COUNT(*) as rows FROM program_state WHERE EXISTS (SELECT 1 FROM program_state);
SELECT 'radio_rotation' as table_name, COUNT(*) as rows FROM radio_rotation WHERE EXISTS (SELECT 1 FROM radio_rotation);
SELECT 'song_submissions' as table_name, COUNT(*) as rows FROM song_submissions WHERE EXISTS (SELECT 1 FROM song_submissions);
SELECT 'themed_programs' as table_name, COUNT(*) as rows FROM themed_programs WHERE EXISTS (SELECT 1 FROM themed_programs);

\echo ''
\echo '3. TABLE STRUCTURES (first 5 tables):'
\echo '-----------------------------------'

-- Show structure of key tables
\d+ admins
\d+ dj_submissions
\d+ zine_content
\d+ track_metadata
\d+ stations

\echo ''
\echo '4. FOREIGN KEY RELATIONSHIPS:'
\echo '-----------------------------------'
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '5. INDEXES:'
\echo '-----------------------------------'
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '6. SAMPLE DATA FROM KEY TABLES:'
\echo '-----------------------------------'

\echo 'Sample from admins (if exists):'
SELECT * FROM admins LIMIT 3;

\echo ''
\echo 'Sample from zine_content (if exists):'
SELECT id, title, created_at, status FROM zine_content LIMIT 3;

\echo ''
\echo 'Sample from track_metadata (if exists):'
SELECT * FROM track_metadata LIMIT 3;

\echo ''
\echo '=== END OF INVESTIGATION ==='
\echo ''
\echo 'NEXT STEPS:'
\echo '1. Review tables with data (row count > 0)'
\echo '2. Identify which tables are active vs legacy'
\echo '3. Plan migration strategy for active tables'
\echo '4. Update shared/schema.ts to include all active tables'
