import { db } from "./db";
import { contributors } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Normalize a handle to consistent format (without @ prefix)
 */
function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, '').trim().toLowerCase();
}

/**
 * Ensure a contributor exists, creating one if needed.
 * Used during submission to auto-provision contributor records.
 */
export async function ensureContributor(params: {
  handle: string;
  displayName?: string;
  socialHandle?: string;
}): Promise<{ id: number; handle: string; displayName: string }> {
  const normalizedHandle = normalizeHandle(params.handle);
  
  if (!normalizedHandle) {
    throw new Error("Invalid contributor handle");
  }

  // Check if contributor exists
  const existing = await db
    .select()
    .from(contributors)
    .where(eq(contributors.handle, normalizedHandle))
    .limit(1);

  if (existing.length > 0) {
    return {
      id: existing[0].id,
      handle: existing[0].handle,
      displayName: existing[0].displayName,
    };
  }

  // Create new contributor
  const [newContributor] = await db
    .insert(contributors)
    .values({
      handle: normalizedHandle,
      displayName: params.displayName || normalizedHandle,
      socialHandle: params.socialHandle || null,
      bio: null,
      email: null,
      avatarUrl: null,
    })
    .returning();

  console.log(`[Contributors] Auto-provisioned new contributor: @${normalizedHandle}`);

  return {
    id: newContributor.id,
    handle: newContributor.handle,
    displayName: newContributor.displayName,
  };
}

/**
 * Convert a display name to a normalized handle
 */
export function nameToHandle(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Backfill contributors from file-based submissions.
 * Creates contributor records and links submissions to them.
 * Works with the FileStorage system used for mix/playlist data.
 */
export async function backfillContributorsFromFileStorage(
  mixSubmissions: Array<{ id: number; name: string; handle?: string; contributorId?: number }>,
  playlistSubmissions: Array<{ id: number; curatorName: string; handle?: string; contributorId?: number }>
): Promise<{
  contributors: { created: number; skipped: number };
  mixes: { updated: number; skipped: number };
  playlists: { updated: number; skipped: number };
  updatedMixes: Array<{ id: number; name: string; handle?: string; contributorId?: number }>;
  updatedPlaylists: Array<{ id: number; curatorName: string; handle?: string; contributorId?: number }>;
}> {
  const stats = {
    contributors: { created: 0, skipped: 0 },
    mixes: { updated: 0, skipped: 0 },
    playlists: { updated: 0, skipped: 0 },
    updatedMixes: [...mixSubmissions] as Array<{ id: number; name: string; handle?: string; contributorId?: number }>,
    updatedPlaylists: [...playlistSubmissions] as Array<{ id: number; curatorName: string; handle?: string; contributorId?: number }>,
  };

  // Collect unique names from mixes and playlists
  const nameMap = new Map<string, { displayName: string; handle: string }>();
  
  for (const mix of mixSubmissions) {
    if (mix.name && !mix.contributorId) {
      const handle = nameToHandle(mix.name);
      if (handle) {
        nameMap.set(handle, { displayName: mix.name, handle });
      }
    }
  }
  
  for (const playlist of playlistSubmissions) {
    if (playlist.curatorName && !playlist.contributorId) {
      const handle = nameToHandle(playlist.curatorName);
      if (handle) {
        nameMap.set(handle, { displayName: playlist.curatorName, handle });
      }
    }
  }

  // Create contributors for each unique handle
  const handleToId = new Map<string, number>();
  
  for (const [handle, data] of Array.from(nameMap.entries())) {
    try {
      // Check if contributor exists
      const existing = await db
        .select()
        .from(contributors)
        .where(eq(contributors.handle, handle))
        .limit(1);
      
      if (existing.length > 0) {
        handleToId.set(handle, existing[0].id);
        stats.contributors.skipped++;
        console.log(`[Backfill] Contributor @${handle} already exists (id: ${existing[0].id})`);
      } else {
        // Create contributor
        const [newContributor] = await db.insert(contributors).values({
          handle,
          displayName: data.displayName,
        }).returning();
        
        handleToId.set(handle, newContributor.id);
        stats.contributors.created++;
        console.log(`[Backfill] Created contributor @${handle} (id: ${newContributor.id})`);
      }
    } catch (err) {
      console.error(`[Backfill] Error creating contributor "${handle}":`, err);
    }
  }

  // Update mixes with contributor IDs
  stats.updatedMixes = mixSubmissions.map(mix => {
    if (mix.contributorId) {
      stats.mixes.skipped++;
      return mix;
    }
    
    const handle = nameToHandle(mix.name);
    const contributorId = handleToId.get(handle);
    
    if (contributorId) {
      stats.mixes.updated++;
      return { ...mix, handle, contributorId };
    }
    
    stats.mixes.skipped++;
    return mix;
  });

  // Update playlists with contributor IDs
  stats.updatedPlaylists = playlistSubmissions.map(playlist => {
    if (playlist.contributorId) {
      stats.playlists.skipped++;
      return playlist;
    }
    
    const handle = nameToHandle(playlist.curatorName);
    const contributorId = handleToId.get(handle);
    
    if (contributorId) {
      stats.playlists.updated++;
      return { ...playlist, handle, contributorId };
    }
    
    stats.playlists.skipped++;
    return playlist;
  });

  console.log(`[Backfill] Complete:
  - Contributors: ${stats.contributors.created} created, ${stats.contributors.skipped} existing
  - Mixes: ${stats.mixes.updated} updated, ${stats.mixes.skipped} skipped
  - Playlists: ${stats.playlists.updated} updated, ${stats.playlists.skipped} skipped`);

  return stats;
}
