// MusicBrainz API integration for album artwork retrieval
// Uses highest-rated album cover as fallback (no placeholder data)

interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit': Array<{ artist: { name: string; id: string } }>;
  'release-group': { id: string };
  score: number; // MusicBrainz confidence score 0-100
  date?: string;
}

interface CoverArtArchiveResponse {
  images: Array<{
    front: boolean;
    back: boolean;
    types: string[];
    image: string;
    thumbnails: {
      small: string;
      large: string;
      '250'?: string;
      '500'?: string;
      '1200'?: string;
    };
  }>;
  release: string;
}

interface AlbumDetails {
  musicbrainzId: string;
  releaseGroupId: string;
  artist: string;
  title: string;
  coverArtUrl: string | null;
  score: number;
  date?: string;
}

export class MusicBrainzService {
  private baseUrl = 'https://musicbrainz.org/ws/2';
  private coverArtUrl = 'https://coverartarchive.org';
  
  // Rate limiting: MusicBrainz requires 1 request per second
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second
  
  private async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url, options);
  }
  
  /**
   * Search for releases and get highest-rated album cover
   * Falls back to highest MusicBrainz score when primary artwork unavailable
   */
  async getAlbumArtwork(artist: string, album: string): Promise<string | null> {
    try {
      const searchUrl = `${this.baseUrl}/release/?query=artist:"${encodeURIComponent(artist)}" AND release:"${encodeURIComponent(album)}"&fmt=json`;
      
      const searchResponse = await this.rateLimitedFetch(searchUrl, {
        headers: { 
          'User-Agent': 'EnamoradoRadio/1.0 (contact@enamoradoradio.com)',
          'Accept': 'application/json'
        }
      });
      
      if (!searchResponse.ok) {
        console.error(`MusicBrainz search failed: ${searchResponse.status}`);
        return null;
      }
      
      const searchData = await searchResponse.json();
      const releases: MusicBrainzRelease[] = searchData.releases || [];
      
      if (releases.length === 0) {
        console.log(`No MusicBrainz releases found for: ${artist} - ${album}`);
        return null;
      }
      
      // Sort by MusicBrainz confidence score (highest first)
      const sortedReleases = releases.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      console.log(`Found ${releases.length} releases for ${artist} - ${album}, trying highest-scored...`);
      
      // Try to get cover art from highest-scored releases
      for (const release of sortedReleases) {
        const coverArt = await this.fetchCoverArt(release.id);
        if (coverArt) {
          console.log(`✅ Found cover art for ${artist} - ${album} (score: ${release.score})`);
          return coverArt;
        }
      }
      
      // If no cover art found, try release-group
      const releaseGroupId = sortedReleases[0]['release-group']?.id;
      if (releaseGroupId) {
        const groupCoverArt = await this.fetchCoverArt(releaseGroupId);
        if (groupCoverArt) {
          console.log(`✅ Found release-group cover art for ${artist} - ${album}`);
          return groupCoverArt;
        }
      }
      
      console.log(`No cover art available for: ${artist} - ${album}`);
      return null;
    } catch (error) {
      console.error('MusicBrainz API error:', error);
      return null;
    }
  }

  private async fetchCoverArt(releaseId: string): Promise<string | null> {
    try {
      const coverUrl = `${this.coverArtUrl}/release/${releaseId}`;
      const response = await fetch(coverUrl);
      
      if (!response.ok) return null;
      
      const data: CoverArtArchiveResponse = await response.json();
      const frontCover = data.images.find(img => img.front);
      
      // Prefer large thumbnail, fallback to full image
      return frontCover?.thumbnails?.large || frontCover?.thumbnails?.['500'] || frontCover?.image || null;
    } catch {
      return null;
    }
  }

  /**
   * Get detailed album info including musicbrainz ID for caching
   */
  async getAlbumDetails(artist: string, album: string): Promise<AlbumDetails | null> {
    try {
      const searchUrl = `${this.baseUrl}/release/?query=artist:"${encodeURIComponent(artist)}" AND release:"${encodeURIComponent(album)}"&fmt=json`;
      
      const response = await this.rateLimitedFetch(searchUrl, {
        headers: { 
          'User-Agent': 'EnamoradoRadio/1.0 (contact@enamoradoradio.com)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const topRelease = data.releases?.sort((a: MusicBrainzRelease, b: MusicBrainzRelease) => (b.score || 0) - (a.score || 0))[0];
      
      if (!topRelease) return null;
      
      const coverArt = await this.getAlbumArtwork(artist, album);
      
      return {
        musicbrainzId: topRelease.id,
        releaseGroupId: topRelease['release-group']?.id || '',
        artist: topRelease['artist-credit']?.[0]?.artist?.name || artist,
        title: topRelease.title || album,
        coverArtUrl: coverArt,
        score: topRelease.score || 0,
        date: topRelease.date
      };
    } catch (error) {
      console.error('MusicBrainz getAlbumDetails error:', error);
      return null;
    }
  }
}

export const musicbrainzService = new MusicBrainzService();
