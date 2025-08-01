// Multi-platform music metadata service
import { z } from "zod";

export interface TrackMetadata {
  platform: string;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  imageUrl?: string;
  previewUrl?: string;
  releaseDate?: string;
  popularity?: number;
  genres?: string[];
  externalUrls: {
    spotify?: string;
    apple?: string;
    soundcloud?: string;
    bandcamp?: string;
    youtube?: string;
  };
}

class MetadataService {
  private spotifyToken: string | null = null;
  private spotifyTokenExpiry: number = 0;

  // Extract track ID from various platform URLs
  extractTrackId(url: string): { platform: string; trackId: string } | null {
    console.log(`[extractTrackId] Processing URL: ${url}`);
    
    // Spotify
    const spotifyMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      console.log(`[extractTrackId] Matched Spotify: ${spotifyMatch[1]}`);
      return { platform: 'spotify', trackId: spotifyMatch[1] };
    }

    // Apple Music
    const appleMatch = url.match(/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/(\d+)\?i=(\d+)/);
    if (appleMatch) {
      console.log(`[extractTrackId] Matched Apple Music: ${appleMatch[2]}`);
      return { platform: 'apple_music', trackId: appleMatch[2] };
    }

    // SoundCloud (including shortened URLs)
    if (url.includes('on.soundcloud.com')) {
      console.log(`[extractTrackId] Matched SoundCloud shortened URL: ${url}`);
      // Handle shortened URLs like https://on.soundcloud.com/xyz - use full URL for oEmbed
      return { platform: 'soundcloud', trackId: url };
    }
    const soundcloudMatch = url.match(/soundcloud\.com\/([^/]+)\/([^/?]+)/);
    if (soundcloudMatch) {
      const trackId = `${soundcloudMatch[1]}/${soundcloudMatch[2]}`;
      console.log(`[extractTrackId] Matched SoundCloud full URL: ${trackId}`);
      return { platform: 'soundcloud', trackId };
    }

    // Bandcamp
    const bandcampMatch = url.match(/([^.]+)\.bandcamp\.com\/track\/([^/?]+)/);
    if (bandcampMatch) {
      console.log(`[extractTrackId] Matched Bandcamp: ${bandcampMatch[1]}/${bandcampMatch[2]}`);
      return { platform: 'bandcamp', trackId: `${bandcampMatch[1]}/${bandcampMatch[2]}` };
    }

    // YouTube Music
    const youtubeMatch = url.match(/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      console.log(`[extractTrackId] Matched YouTube: ${youtubeMatch[1]}`);
      return { platform: 'youtube', trackId: youtubeMatch[1] };
    }

    console.log(`[extractTrackId] No match found for URL: ${url}`);
    return null;
  }

  // Get Spotify access token using Client Credentials flow
  private async getSpotifyToken(): Promise<string | null> {
    try {
      // Check if we have SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('[spotify] No client credentials found');
        return null;
      }

      // Check if current token is still valid
      if (this.spotifyToken && Date.now() < this.spotifyTokenExpiry) {
        return this.spotifyToken;
      }

      const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        console.error('[spotify] Token request failed:', response.status);
        return null;
      }

      const data = await response.json();
      this.spotifyToken = data.access_token;
      this.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('[spotify] Successfully obtained access token');
      return this.spotifyToken;
    } catch (error) {
      console.error('[spotify] Error getting token:', error);
      return null;
    }
  }

  // Fetch Spotify track metadata
  async fetchSpotifyMetadata(trackId: string): Promise<TrackMetadata | null> {
    try {
      const token = await this.getSpotifyToken();
      if (!token) {
        console.log('[spotify] No token available for metadata fetch');
        return null;
      }

      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('[spotify] Track fetch failed:', response.status);
        return null;
      }

      const track = await response.json();
      
      console.log(`[spotify] Successfully fetched metadata for: ${track.name} by ${track.artists[0]?.name}`);

      return {
        platform: 'spotify',
        trackId,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album?.name,
        duration: Math.round(track.duration_ms / 1000),
        imageUrl: track.album?.images?.[0]?.url,
        previewUrl: track.preview_url,
        releaseDate: track.album?.release_date,
        popularity: track.popularity,
        genres: [], // Would need to fetch artist separately for genres
        externalUrls: {
          spotify: track.external_urls?.spotify,
        },
      };
    } catch (error) {
      console.error('[spotify] Error fetching metadata:', error);
      return null;
    }
  }

  // Fetch SoundCloud metadata (using oEmbed API)
  async fetchSoundCloudMetadata(trackId: string): Promise<TrackMetadata | null> {
    try {
      // If trackId is a full URL (shortened), use it directly
      const trackUrl = trackId.includes('http') ? trackId : `https://soundcloud.com/${trackId}`;
      const response = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`);
      
      if (!response.ok) {
        console.error('[soundcloud] oEmbed fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Parse artist and title from the title field
      const titleParts = data.title.split(' by ');
      const title = titleParts[0];
      const artist = titleParts[1] || data.author_name;

      console.log(`[soundcloud] Successfully fetched metadata for: ${title} by ${artist}`);

      return {
        platform: 'soundcloud',
        trackId,
        title,
        artist,
        imageUrl: data.thumbnail_url,
        externalUrls: {
          soundcloud: trackUrl,
        },
      };
    } catch (error) {
      console.error('[soundcloud] Error fetching metadata:', error);
      return null;
    }
  }

  // Fetch Mixcloud metadata  
  async fetchMixcloudMetadata(trackId: string): Promise<TrackMetadata | null> {
    try {
      const trackUrl = `https://www.mixcloud.com/${trackId}`;
      const response = await fetch(`https://app.mixcloud.com/oembed/?format=json&url=${encodeURIComponent(trackUrl)}`);
      
      if (!response.ok) {
        console.error('[mixcloud] oEmbed fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Extract larger thumbnail from the HTML if available
      let imageUrl = data.thumbnail_url;
      if (data.html) {
        const imgMatch = data.html.match(/src="([^"]*mixcloud[^"]*\.jpg[^"]*)"/);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1].replace('_300_300', '_630_630'); // Get larger image
        }
      }
      
      console.log(`[mixcloud] Successfully fetched metadata for: ${data.title}`);

      return {
        platform: 'mixcloud',
        trackId,
        title: data.title,
        artist: data.author_name || 'Unknown Artist',
        album: null,
        duration: null,
        imageUrl: imageUrl || null,
        previewUrl: null,
        releaseDate: null,
        popularity: null,
        genres: [],
        externalUrls: {
          mixcloud: trackUrl,
        },
      };
    } catch (error) {
      console.error('[mixcloud] Error fetching metadata:', error);
      return null;
    }
  }

  // Main method to fetch metadata from any platform
  async fetchMetadata(url: string): Promise<TrackMetadata | null> {
    const extracted = this.extractTrackId(url);
    if (!extracted) {
      console.error('[metadata] Could not extract track ID from URL:', url);
      return null;
    }

    console.log(`[metadata] Fetching metadata for ${extracted.platform} track: ${extracted.trackId}`);

    switch (extracted.platform) {
      case 'spotify':
        return this.fetchSpotifyMetadata(extracted.trackId);
      
      case 'soundcloud':
        return this.fetchSoundCloudMetadata(extracted.trackId);
      
      case 'mixcloud':
        return this.fetchMixcloudMetadata(extracted.trackId);
      
      case 'apple_music':
        // Apple Music would require complex JWT setup and $99/year developer account
        console.log('[metadata] Apple Music metadata requires developer account setup');
        return {
          platform: 'apple_music',
          trackId: extracted.trackId,
          title: 'Track from Apple Music',
          artist: 'Unknown Artist',
          externalUrls: { apple: url },
        };
      
      case 'bandcamp':
        // Bandcamp has no official API - would require scraping
        console.log('[metadata] Bandcamp metadata requires web scraping');
        return {
          platform: 'bandcamp', 
          trackId: extracted.trackId,
          title: 'Track from Bandcamp',
          artist: 'Unknown Artist',
          externalUrls: { bandcamp: url },
        };
      
      case 'youtube':
        // YouTube Music would require YouTube Data API
        console.log('[metadata] YouTube Music metadata requires YouTube Data API');
        return {
          platform: 'youtube',
          trackId: extracted.trackId,
          title: 'Track from YouTube Music',
          artist: 'Unknown Artist',
          externalUrls: { youtube: url },
        };
      
      default:
        return null;
    }
  }

  // Demo method for the Spotify URL you provided
  async demonstrateSpotifyExtraction(url: string) {
    console.log(`[demo] Processing URL: ${url}`);
    
    const extracted = this.extractTrackId(url);
    if (extracted) {
      console.log(`[demo] Extracted: Platform=${extracted.platform}, TrackID=${extracted.trackId}`);
      
      if (extracted.platform === 'spotify') {
        const metadata = await this.fetchSpotifyMetadata(extracted.trackId);
        if (metadata) {
          console.log(`[demo] Track: "${metadata.title}" by ${metadata.artist}`);
          console.log(`[demo] Album: ${metadata.album}`);
          console.log(`[demo] Duration: ${metadata.duration}s`);
          console.log(`[demo] Popularity: ${metadata.popularity}/100`);
          console.log(`[demo] Image: ${metadata.imageUrl}`);
        }
        return metadata;
      }
    }
    return null;
  }
}

export const metadataService = new MetadataService();

// Test the service with your Spotify URL
if (process.env.NODE_ENV === 'development') {
  // Demonstrate with your exact URL
  const testUrl = "https://open.spotify.com/track/4hAPiyiwGAlIKP53qfmDuN?si=7d5b5385b0ac4654";
  setTimeout(async () => {
    await metadataService.demonstrateSpotifyExtraction(testUrl);
  }, 1000);
}