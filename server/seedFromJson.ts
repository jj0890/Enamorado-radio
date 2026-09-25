/**
 * One-time migration: seed Neon DB from existing JSON flat files.
 * Run with:  npx tsx server/seedFromJson.ts
 * Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { db } from './db';
import {
  mixSubmissions,
  playlistSubmissions,
  residents,
  episodes,
  heroBanners,
  settings,
  admins,
  contributors,
} from '../shared/schema';
import { sql } from 'drizzle-orm';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function seed() {
  console.log('🌱 Starting JSON → DB seed...\n');

  // ── Mix Submissions ────────────────────────────────────────────────────────
  const mixes = await readJson<any>('mixSubmissions.json');
  if (mixes.length) {
    for (const m of mixes) {
      await db.execute(sql`
        INSERT INTO mix_submissions (
          id, name, handle, contributor_id, title, genre, about, url,
          status, artwork_url, art_url, cover_url, source_url, file_path, file_name,
          platform, playback_mode, feature_on_site, push_to_azura, target_playlist,
          approved, featured, submitted_at, reviewed_at, reviewed_by, notes, created_at
        ) VALUES (
          ${m.id}, ${m.name ?? null}, ${m.handle ?? null}, ${m.contributorId ?? null},
          ${m.title}, ${m.genre ?? ''}, ${m.about ?? null}, ${m.url},
          ${m.status ?? 'pending'}, ${m.artwork_url ?? m.artUrl ?? null},
          ${m.artUrl ?? null}, ${m.coverUrl ?? null}, ${m.sourceUrl ?? m.url ?? null},
          ${m.filePath ?? null}, ${m.fileName ?? null},
          ${m.platform ?? null}, ${m.playback_mode ?? 'stream'},
          ${m.featureOnSite !== false}, ${m.pushToAzura ?? false},
          ${m.targetPlaylist ?? 'General Rotation'},
          ${m.approved ?? false}, ${m.featured ?? false},
          ${m.submittedAt ?? new Date().toISOString()},
          ${m.reviewedAt ?? null}, ${m.reviewedBy ?? null}, ${m.notes ?? null},
          ${m.createdAt ?? m.submittedAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    // Reset the sequence so new inserts don't collide
    const maxId = Math.max(...mixes.map((m: any) => m.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('mix_submissions', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ mix_submissions: ${mixes.length} rows`);
  }

  // ── Playlist Submissions ───────────────────────────────────────────────────
  const playlists = await readJson<any>('playlistSubmissions.json');
  if (playlists.length) {
    for (const p of playlists) {
      await db.execute(sql`
        INSERT INTO playlist_submissions (
          id, title, curator_name, playlist_url, platform, description,
          status, submitted_at, created_at
        ) VALUES (
          ${p.id}, ${p.title}, ${p.curatorName ?? p.name ?? 'unknown'},
          ${p.playlistUrl ?? p.url ?? ''}, ${p.platform ?? null}, ${p.description ?? null},
          ${p.status ?? 'pending'},
          ${p.submittedAt ?? new Date().toISOString()},
          ${p.createdAt ?? p.submittedAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    const maxId = Math.max(...playlists.map((p: any) => p.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('playlist_submissions', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ playlist_submissions: ${playlists.length} rows`);
  }

  // ── Residents ──────────────────────────────────────────────────────────────
  const res = await readJson<any>('residents.json');
  if (res.length) {
    for (const r of res) {
      await db.execute(sql`
        INSERT INTO residents (
          id, username, password, display_name, email, bio,
          show_title, show_description, azuracast_username, azuracast_password,
          mount_point, is_active, can_go_live, avatar_url, created_at, updated_at
        ) VALUES (
          ${r.id}, ${r.username}, ${r.password ?? ''}, ${r.displayName ?? r.username},
          ${r.email ?? null}, ${r.bio ?? null},
          ${r.showTitle ?? null}, ${r.showDescription ?? null},
          ${r.azuracastUsername ?? null}, ${r.azuracastPassword ?? null},
          ${r.mountPoint ?? null}, ${r.isActive !== false}, ${r.canGoLive !== false},
          ${r.avatarUrl ?? null},
          ${r.createdAt ?? new Date().toISOString()},
          ${r.updatedAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    const maxId = Math.max(...res.map((r: any) => r.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('residents', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ residents: ${res.length} rows`);
  }

  // ── Episodes ───────────────────────────────────────────────────────────────
  const eps = await readJson<any>('episodes.json');
  if (eps.length) {
    for (const e of eps) {
      await db.execute(sql`
        INSERT INTO episodes (
          id, title, description, host_name, air_date, duration,
          audio_url, genre, is_featured, status, created_at
        ) VALUES (
          ${e.id}, ${e.title}, ${e.description ?? null},
          ${e.hostName ?? e.host ?? 'Enamorado Radio'},
          ${e.airDate ?? e.publishedAt ?? new Date().toISOString()},
          ${e.duration ?? 0},
          ${e.audioUrl ?? e.audio_url ?? ''},
          ${e.genre ?? 'Mixed'},
          ${e.isFeatured ?? false},
          ${e.status ?? 'published'},
          ${e.createdAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    const maxId = Math.max(...eps.map((e: any) => e.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('episodes', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ episodes: ${eps.length} rows`);
  }

  // ── Hero Banners ───────────────────────────────────────────────────────────
  const banners = await readJson<any>('heroBanners.json');
  if (banners.length) {
    for (const b of banners) {
      await db.execute(sql`
        INSERT INTO hero_banners (
          id, title, subtitle, image_url, is_active, display_order, created_at
        ) VALUES (
          ${b.id}, ${b.title}, ${b.subtitle ?? null}, ${b.imageUrl ?? ''},
          ${b.isActive ?? false}, ${b.displayOrder ?? 0},
          ${b.createdAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    const maxId = Math.max(...banners.map((b: any) => b.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('hero_banners', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ hero_banners: ${banners.length} rows`);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  const setts = await readJson<any>('settings.json');
  if (setts.length) {
    for (const s of setts) {
      await db.execute(sql`
        INSERT INTO settings (key, value, description, is_secret, updated_at)
        VALUES (${s.key}, ${s.value ?? ''}, ${s.description ?? null}, ${s.isSecret ?? false}, NOW())
        ON CONFLICT (key) DO NOTHING
      `);
    }
    console.log(`✅ settings: ${setts.length} rows`);
  }

  // ── Admins ─────────────────────────────────────────────────────────────────
  const adms = await readJson<any>('admins.json');
  if (adms.length) {
    for (const a of adms) {
      await db.execute(sql`
        INSERT INTO admins (id, username, password, role, created_at)
        VALUES (
          ${a.id}, ${a.username}, ${a.password ?? a.passwordHash ?? ''},
          ${a.role ?? 'admin'}, ${a.createdAt ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }
    const maxId = Math.max(...adms.map((a: any) => a.id));
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('admins', 'id'), ${maxId + 1}, false)`);
    console.log(`✅ admins: ${adms.length} rows`);
  }

  console.log('\n✅ Seed complete. All existing data is now in Neon DB.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
