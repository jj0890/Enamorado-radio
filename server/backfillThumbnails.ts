// Backfill missing thumbnails for existing SoundCloud/Mixcloud mixes

import { getOEmbedThumbSafe } from './lib/oembed';
import { FileStorage } from './persistentStorage';

/**
 * Backfill artwork for existing mixes that are missing thumbnails
 */
export async function backfillMissingThumbnails() {
  console.log('🎨 Starting thumbnail backfill for existing mixes...');
  
  const storage = new FileStorage();
  const allMixes = await storage.getMixSubmissions({});
  
  let updated = 0;
  let skipped = 0;
  
  for (const mix of allMixes) {
    // Skip if already has artwork
    if ((mix as any).artUrl || (mix as any).artwork_url) {
      skipped++;
      continue;
    }
    
    // Skip if not SoundCloud/Mixcloud
    if (!mix.url || (!mix.url.includes('soundcloud.com') && !mix.url.includes('mixcloud.com'))) {
      skipped++;
      continue;
    }
    
    try {
      console.log(`🎨 Fetching artwork for: ${mix.title} - ${mix.url}`);
      const oembedData = await getOEmbedThumbSafe(mix.url);
      
      if (oembedData && oembedData.artUrl) {
        // Update the mix with artwork
        const updatedMix = {
          ...mix,
          artUrl: oembedData.artUrl,
          artwork_url: oembedData.artUrl
        };
        
        await storage.updateMixSubmission(mix.id, updatedMix);
        console.log(`✅ Updated artwork for: ${mix.title}`);
        updated++;
      } else {
        console.log(`⚠️ No artwork found for: ${mix.title}`);
        skipped++;
      }
    } catch (error) {
      console.log(`❌ Failed to fetch artwork for ${mix.title}:`, error);
      skipped++;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎨 Thumbnail backfill complete: ${updated} updated, ${skipped} skipped`);
  return { updated, skipped };
}

// Run backfill if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillMissingThumbnails().catch(console.error);
}