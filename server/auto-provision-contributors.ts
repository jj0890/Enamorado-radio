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
 * Backfill contributors from existing mix submissions.
 * Creates contributor records for unique submitter names.
 */
export async function backfillContributorsFromSubmissions(): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const stats = { created: 0, skipped: 0, errors: 0 };
  
  try {
    // Get unique submitter names from mix submissions
    const submissions = await db.query.mixSubmissions.findMany({
      columns: { name: true },
    });
    
    const namesSet = new Set<string>();
    submissions.forEach((s: { name: string }) => {
      if (s.name) namesSet.add(s.name);
    });
    const uniqueNames = Array.from(namesSet);
    
    for (const name of uniqueNames) {
      try {
        const handle = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        if (!handle) {
          stats.skipped++;
          continue;
        }
        
        // Check if already exists
        const existing = await db
          .select()
          .from(contributors)
          .where(eq(contributors.handle, handle))
          .limit(1);
        
        if (existing.length > 0) {
          stats.skipped++;
          continue;
        }
        
        // Create contributor
        await db.insert(contributors).values({
          handle,
          displayName: name,
        });
        
        stats.created++;
      } catch (err) {
        console.error(`[Backfill] Error processing "${name}":`, err);
        stats.errors++;
      }
    }
    
    console.log(`[Backfill] Complete: ${stats.created} created, ${stats.skipped} skipped, ${stats.errors} errors`);
  } catch (err) {
    console.error("[Backfill] Fatal error:", err);
    throw err;
  }
  
  return stats;
}
