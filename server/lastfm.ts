import crypto from 'crypto';

export interface LastFmTrackInfo {
  name: string;
  artist: string;
  album?: string;
  image?: string;
  url?: string;
  duration?: number;
  playcount?: number;
  listeners?: number;
}

export interface LastFmResponse {
  track?: {
    name: string;
    artist: {
      name: string;
      url?: string;
    };
    album?: {
      title: string;
      artist: string;
      image?: Array<{
        '#text': string;
        size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
      }>;
    };
    image?: Array<{
      '#text': string;
      size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
    }>;
    url?: string;
    duration?: string;
    playcount?: string;
    listeners?: string;
  };
  error?: number;
  message?: string;
}

class LastFmService {
  private apiKey: string;
  private sharedSecret: string;
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  constructor() {
    this.apiKey = process.env.LASTFM_API_KEY!;
    this.sharedSecret = process.env.LASTFM_SHARED_SECRET!;
    
    if (!this.apiKey || !this.sharedSecret) {
      throw new Error('Last.fm API credentials not found in environment variables');
    }
  }

  private createSignature(params: Record<string, string>): string {
    // Sort parameters alphabetically and create signature string
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');
    
    return crypto
      .createHash('md5')
      .update(sortedParams + this.sharedSecret)
      .digest('hex');
  }

  async getTrackInfo(artist: string, track: string): Promise<LastFmTrackInfo | null> {
    try {
      const params = {
        method: 'track.getInfo',
        api_key: this.apiKey,
        artist: artist.trim(),
        track: track.trim(),
        format: 'json'
      };

      const url = new URL(this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`[lastfm] Fetching track info for: ${artist} - ${track}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Enamorado-Radio/1.0'
        }
      });

      if (!response.ok) {
        console.error(`[lastfm] HTTP error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: LastFmResponse = await response.json();

      if (data.error) {
        console.warn(`[lastfm] API error ${data.error}: ${data.message}`);
        return null;
      }

      if (!data.track) {
        console.warn(`[lastfm] No track data found for: ${artist} - ${track}`);
        return null;
      }

      // Extract the largest available image
      const images = data.track.image || data.track.album?.image || [];
      const largestImage = images.find(img => img.size === 'extralarge') || 
                          images.find(img => img.size === 'large') || 
                          images.find(img => img.size === 'medium') ||
                          images[0];

      const trackInfo: LastFmTrackInfo = {
        name: data.track.name,
        artist: data.track.artist.name,
        album: data.track.album?.title,
        image: largestImage?.['#text'],
        url: data.track.url,
        duration: data.track.duration ? parseInt(data.track.duration) : undefined,
        playcount: data.track.playcount ? parseInt(data.track.playcount) : undefined,
        listeners: data.track.listeners ? parseInt(data.track.listeners) : undefined
      };

      console.log(`[lastfm] Successfully fetched track info for: ${trackInfo.artist} - ${trackInfo.name}`);
      return trackInfo;

    } catch (error) {
      console.error(`[lastfm] Error fetching track info:`, error);
      return null;
    }
  }

  // Helper method to search for track when exact match fails
  async searchTrack(query: string): Promise<LastFmTrackInfo | null> {
    try {
      const params = {
        method: 'track.search',
        api_key: this.apiKey,
        track: query.trim(),
        format: 'json',
        limit: '1'
      };

      const url = new URL(this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`[lastfm] Searching for track: ${query}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Enamorado-Radio/1.0'
        }
      });

      if (!response.ok) {
        console.error(`[lastfm] Search HTTP error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (data.error || !data.results?.trackmatches?.track?.[0]) {
        console.warn(`[lastfm] No search results for: ${query}`);
        return null;
      }

      const track = data.results.trackmatches.track[0];
      
      // Get detailed info for the found track
      return await this.getTrackInfo(track.artist, track.name);

    } catch (error) {
      console.error(`[lastfm] Error searching track:`, error);
      return null;
    }
  }

  // Parse filename to extract artist and track info
  parseFilename(filename: string): { artist?: string; track?: string } {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Try different separators
    const separators = [' - ', ' – ', ' — ', '_', ' | '];
    
    for (const sep of separators) {
      if (nameWithoutExt.includes(sep)) {
        const parts = nameWithoutExt.split(sep);
        if (parts.length >= 2) {
          return {
            artist: parts[0].trim(),
            track: parts.slice(1).join(sep).trim()
          };
        }
      }
    }
    
    // If no separator found, treat the whole thing as track name
    return { track: nameWithoutExt.trim() };
  }
}

export const lastFmService = new LastFmService();