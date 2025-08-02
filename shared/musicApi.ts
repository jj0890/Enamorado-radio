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

// MusicBrainz API for album artwork with proper error handling
export async function getAlbumArtwork(artist: string, album: string): Promise<string | null> {
  try {
    console.log(`[MusicBrainz] Fetching artwork for: ${artist} - ${album}`);
    
    // Use proper MusicBrainz search syntax
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)} AND release:${encodeURIComponent(album)}&fmt=json&limit=1`;
    
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
    console.log(`[MusicBrainz] Raw response:`, JSON.stringify(data, null, 2));
    
    // Validate response with Zod schema
    const validatedData = MusicBrainzSearchResponse.safeParse(data);
    if (!validatedData.success) {
      console.error(`[MusicBrainz] Schema validation failed:`, validatedData.error);
      return null;
    }
    
    const releases = validatedData.data.releases;
    console.log(`[MusicBrainz] Found ${releases.length} releases for ${album}`);
    
    if (releases.length > 0) {
      const mbid = releases[0].id;
      console.log(`[MusicBrainz] Found MBID for ${album}: ${mbid}`);
      
      // Always try the Cover Art Archive regardless of cover-art-archive field
      const coverUrl = `https://coverartarchive.org/release/${mbid}/front-500`;
      
      // Verify cover exists
      try {
        const coverResponse = await fetch(coverUrl, { method: 'HEAD' });
        if (coverResponse.ok) {
          console.log(`✓ [MusicBrainz] Found cover art for ${album}: ${coverUrl}`);
          return coverUrl;
        } else {
          console.log(`✗ [MusicBrainz] Cover art not accessible for ${album} (${coverResponse.status})`);
        }
      } catch (coverError) {
        console.log(`✗ [MusicBrainz] Cover art request failed for ${album}:`, coverError);
      }
    } else {
      console.log(`✗ [MusicBrainz] No releases found for ${artist} - ${album}`);
    }
    
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
export async function enrichAlbumData(albumInfo: AlbumInfo): Promise<AlbumInfo> {
  const [coverUrl, spotifyUrl] = await Promise.all([
    getAlbumArtwork(albumInfo.artist, albumInfo.title),
    getSpotifyAlbumUrl(albumInfo.artist, albumInfo.title)
  ]);
  
  return {
    ...albumInfo,
    coverUrl: coverUrl || albumInfo.coverUrl,
    spotifyUrl: spotifyUrl || albumInfo.spotifyUrl
  };
}

// Function to batch process multiple albums
export async function enrichMultipleAlbums(albums: AlbumInfo[]): Promise<AlbumInfo[]> {
  const enrichedAlbums = await Promise.all(
    albums.map(album => enrichAlbumData(album))
  );
  
  return enrichedAlbums;
}