import { MixSubmission } from "@shared/schema";

export interface UIMix {
  id: number;
  title: string;
  artist: string;
  url: string;
  artwork: string | null;
  genre: string | null;
  platform: string | null;
  approved: boolean;
  featured: boolean;
  status: 'pending' | 'approved' | 'featured';
  date: Date;
  about?: string;
}

/**
 * Shared serializer for consistent mix data structure across all endpoints
 * Converts database MixSubmission to normalized UI format with proper timestamp logic
 */
export function serializeMix(row: MixSubmission): UIMix {
  // Determine platform from URL
  let platform: string | null = null;
  if (row.url?.includes('soundcloud.com')) platform = 'soundcloud';
  else if (row.url?.includes('mixcloud.com')) platform = 'mixcloud';
  else if (row.url?.includes('audio.com')) platform = 'audiocom';
  else if (row.url) platform = 'file';

  // Use status field as primary source of truth, fall back to boolean flags
  let status: 'pending' | 'approved' | 'featured' = 'pending';
  
  if (row.status) {
    // Use the canonical status field if it exists
    status = row.status as 'pending' | 'approved' | 'featured';
  } else {
    // Fall back to boolean flags for legacy data
    const featureOnSite = (row as any).featureOnSite || !!(row as any).featured_at || (row as any).featured;
    const pushToAzura = (row as any).pushToAzura || !!(row as any).approved_at;
    
    if (featureOnSite) {
      status = 'featured';
    } else if (pushToAzura) {
      status = 'approved';
    }
  }

  // Set boolean flags based on status for backward compatibility
  const featured = status === 'featured';
  const approved = status === 'approved' || status === 'featured';

  // Priority order for date: featured_at > approved_at > created_at > submittedAt
  const date = (row as any).featured_at || 
               (row as any).approved_at || 
               row.createdAt || 
               row.submittedAt || 
               new Date();

  return {
    id: row.id,
    title: row.title,
    artist: row.name,
    url: row.url,
    artwork: (row as any).artUrl || (row as any).artwork_url || (row.metadata as any)?.imageUrl || null,
    genre: row.genre || null,
    platform,
    approved,
    featured,
    status,  // Add the status field that frontend expects
    date: new Date(date),
    about: row.about
  };
}