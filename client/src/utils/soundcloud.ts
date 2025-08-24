// SoundCloud thumbnail extraction utility using oEmbed API
export async function extractSoundCloudThumbnail(url: string): Promise<string | null> {
  try {
    // Use our server proxy to avoid CORS issues
    const oembedUrl = `/api/oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch oEmbed data');
    }
    
    const data = await response.json();
    
    // Return the thumbnail URL from oEmbed response
    return data.thumbnail_url || data.artUrl || null;
  } catch (error) {
    console.error('Error fetching SoundCloud thumbnail:', error);
    
    // Fallback to track-specific placeholder
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    if (match) {
      const trackId = match[2];
      
      // Generate genre-based thumbnails
      const thumbnails = {
        'footwork': "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        'juke': "https://images.unsplash.com/photo-1571974599782-87663fca6c70?w=400&h=400&fit=crop",
        'electronic': "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop",
        'ambient': "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
        'default': "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop"
      };
      
      // Detect genre from track name
      const trackName = trackId.toLowerCase();
      if (trackName.includes('footwork') || trackName.includes('juke')) {
        return thumbnails.footwork;
      } else if (trackName.includes('electronic') || trackName.includes('mix')) {
        return thumbnails.electronic;
      } else if (trackName.includes('ambient') || trackName.includes('elevator')) {
        return thumbnails.ambient;
      }
      
      return thumbnails.default;
    }
    
    return null;
  }
}

export function extractMixcloudThumbnail(url: string): string | null {
  try {
    // Similar approach for Mixcloud
    const match = url.match(/mixcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) return null;
    
    const thumbnails = [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571974599782-87663fca6c70?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop"
    ];
    
    const trackId = match[2];
    const hash = trackId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return thumbnails[Math.abs(hash) % thumbnails.length];
  } catch (error) {
    return null;
  }
}

export async function getTrackThumbnail(submission: any): Promise<string | null> {
  if (submission.soundcloudUrl) {
    return await extractSoundCloudThumbnail(submission.soundcloudUrl);
  }
  if (submission.mixcloudUrl) {
    return extractMixcloudThumbnail(submission.mixcloudUrl);
  }
  return null;
}

// Extract SoundCloud embed URL from regular URL
export function getSoundCloudEmbedUrl(url: string): string | null {
  try {
    // Ensure URL starts with https://
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://')) {
      if (cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
      } else if (cleanUrl.startsWith('soundcloud.com')) {
        cleanUrl = 'https://' + cleanUrl;
      }
    }
    
    // Remove any query parameters from the original URL
    cleanUrl = cleanUrl.split('?')[0];
    
    // Convert regular SoundCloud URL to embed URL
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
    return embedUrl;
  } catch (error) {
    console.error('Error creating SoundCloud embed URL:', error);
    return null;
  }
}

// Extract track ID from SoundCloud URL for API calls
export function extractTrackId(url: string): string | null {
  try {
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    return match ? match[2] : null;
  } catch (error) {
    return null;
  }
}