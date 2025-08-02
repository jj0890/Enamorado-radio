// MusicBrainz and Spotify API integration for album artwork and links

export interface AlbumInfo {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  spotifyUrl?: string;
  mbid?: string;
}

import { MusicBrainzSearchResponse } from './schemas';

// MusicBrainz API for album artwork with improved matching
export async function getAlbumArtwork(artist: string, album: string, releaseYear?: number): Promise<string | null> {
  try {
    console.log(`[MusicBrainz] Fetching artwork for: ${artist} - ${album} (${releaseYear || 'unknown year'})`);
    
    // Use release-group endpoint for better matching
    const searchUrl = `https://musicbrainz.org/ws/2/release-group/?query=release:${encodeURIComponent(album)} AND artist:${encodeURIComponent(artist)}&fmt=json&limit=5`;
    
    console.log(`[MusicBrainz] Search URL: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0 (contact@enamoradoradio.com)'
      }
    });
    
    if (!response.ok) {
      console.error(`[MusicBrainz] API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[MusicBrainz] Found ${data['release-groups']?.length || 0} release groups for ${album}`);
    
    if (data['release-groups'] && data['release-groups'].length > 0) {
      // Sort by score and try to match year if provided
      const releaseGroups = data['release-groups'].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      
      for (const rg of releaseGroups) {
        console.log(`[MusicBrainz] Trying release group: ${rg.id} (score: ${rg.score})`);
        
        // Get releases for this release group
        const releasesUrl = `https://musicbrainz.org/ws/2/release/?release-group=${rg.id}&fmt=json&limit=10`;
        const releasesResponse = await fetch(releasesUrl, {
          headers: {
            'User-Agent': 'EnamoradoRadio/1.0 (contact@enamoradoradio.com)'
          }
        });
        
        if (releasesResponse.ok) {
          const releasesData = await releasesResponse.json();
          const releases = releasesData.releases || [];
          
          // Sort releases by score and prefer ones matching the year
          const sortedReleases = releases.sort((a: any, b: any) => {
            const aScore = a.score || 0;
            const bScore = b.score || 0;
            const aYear = a.date ? parseInt(a.date.split('-')[0]) : 0;
            const bYear = b.date ? parseInt(b.date.split('-')[0]) : 0;
            
            // Prefer exact year match
            if (releaseYear) {
              if (aYear === releaseYear && bYear !== releaseYear) return -1;
              if (bYear === releaseYear && aYear !== releaseYear) return 1;
            }
            
            return bScore - aScore;
          });
          
          for (const release of sortedReleases) {
            const coverUrl = `https://coverartarchive.org/release/${release.id}/front-500`;
            
            try {
              const coverResponse = await fetch(coverUrl, { method: 'HEAD' });
              if (coverResponse.ok) {
                console.log(`✓ [MusicBrainz] Found cover art for ${album}: ${coverUrl}`);
                return coverUrl;
              }
            } catch (coverError) {
              console.log(`✗ [MusicBrainz] Cover art request failed for release ${release.id}`);
            }
          }
        }
      }
    }
    
    console.log(`✗ [MusicBrainz] No cover art found for ${artist} - ${album}`);
    return null;
  } catch (error) {
    console.error('[MusicBrainz] Error fetching album artwork:', error);
    return null;
  }
}

// Spotify search for streaming links
export async function getSpotifyAlbumUrl(artist: string, album: string): Promise<string | null> {
  try {
    // This would require Spotify API credentials
    // For now, we'll return a Spotify search URL
    const searchQuery = `${artist} ${album}`;
    return `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
  } catch (error) {
    console.error('Error getting Spotify URL:', error);
    return null;
  }
}

// Combined function to get both artwork and Spotify link
export async function enrichAlbumData(albumInfo: AlbumInfo & { releaseYear?: number }): Promise<AlbumInfo> {
  const [coverUrl, spotifyUrl] = await Promise.all([
    getAlbumArtwork(albumInfo.artist, albumInfo.title, albumInfo.releaseYear),
    getSpotifyAlbumUrl(albumInfo.artist, albumInfo.title)
  ]);
  
  return {
    ...albumInfo,
    coverUrl: coverUrl || albumInfo.coverUrl,
    spotifyUrl: spotifyUrl || albumInfo.spotifyUrl
  };
}

// Function to batch process multiple albums with better matching
export async function enrichMultipleAlbums(albums: (AlbumInfo & { releaseYear?: number })[]): Promise<AlbumInfo[]> {
  const enrichedAlbums = await Promise.all(
    albums.map(album => enrichAlbumData(album))
  );
  
  return enrichedAlbums;
}