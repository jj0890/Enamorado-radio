// SoundCloud thumbnail extraction utility
export function extractSoundCloudThumbnail(url: string): string | null {
  try {
    // Extract track ID from SoundCloud URL
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) return null;
    
    // For demo purposes, we'll use a placeholder approach
    // In a real app, you'd need SoundCloud API or oEmbed
    const trackId = match[2];
    
    // Generate a consistent thumbnail based on track ID
    const thumbnails = [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571974599782-87663fca6c70?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop"
    ];
    
    // Use hash of track ID to consistently select thumbnail
    const hash = trackId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return thumbnails[Math.abs(hash) % thumbnails.length];
  } catch (error) {
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

export function getTrackThumbnail(submission: any): string | null {
  if (submission.soundcloudUrl) {
    return extractSoundCloudThumbnail(submission.soundcloudUrl);
  }
  if (submission.mixcloudUrl) {
    return extractMixcloudThumbnail(submission.mixcloudUrl);
  }
  return null;
}