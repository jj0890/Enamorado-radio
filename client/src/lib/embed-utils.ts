export type PlaylistPlatform = 'spotify' | 'apple-music' | 'apple_music' | 'soundcloud' | 'youtube' | 'mixcloud' | 'unknown';

export function detectPlaylistPlatform(url: string): PlaylistPlatform {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('open.spotify.com') || lowercaseUrl.includes('spotify.com')) {
    return 'spotify';
  }
  if (lowercaseUrl.includes('music.apple.com')) {
    return 'apple-music';
  }
  if (lowercaseUrl.includes('soundcloud.com') || lowercaseUrl.includes('on.soundcloud.com')) {
    return 'soundcloud';
  }
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercaseUrl.includes('mixcloud.com')) {
    return 'mixcloud';
  }
  
  return 'unknown';
}

export function isEmbeddablePlatform(platform: PlaylistPlatform): boolean {
  switch (platform) {
    case 'spotify':
    case 'soundcloud':
    case 'youtube':
    case 'apple-music':
    case 'apple_music':
    case 'mixcloud':
      return true;
    default:
      return false;
  }
}

export function getEmbedHeight(platform: PlaylistPlatform): number {
  switch (platform) {
    case 'spotify':
      return 380;
    case 'soundcloud':
      return 300;
    case 'apple-music':
    case 'apple_music':
      return 450;
    case 'youtube':
      return 315;
    case 'mixcloud':
      return 400;
    default:
      return 300;
  }
}

export function normalizeSpotifyEmbed(url: string): string {
  try {
    let embedUrl = url;
    
    if (!url.includes('/embed/')) {
      embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    
    const urlObj = new URL(embedUrl);
    urlObj.searchParams.set('theme', '0');
    urlObj.searchParams.set('utm_source', 'generator');
    
    return urlObj.toString();
  } catch {
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  }
}

export function normalizeSoundCloudEmbed(url: string): string {
  try {
    if (url.includes('api.soundcloud.com/tracks')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('visual', 'true');
      urlObj.searchParams.set('show_artwork', 'true');
      urlObj.searchParams.set('color', '%23ff5500');
      urlObj.searchParams.set('auto_play', 'false');
      urlObj.searchParams.set('hide_related', 'true');
      urlObj.searchParams.set('show_comments', 'false');
      urlObj.searchParams.set('show_user', 'true');
      urlObj.searchParams.set('show_reposts', 'false');
      return urlObj.toString();
    }
    
    if (url.includes('w.soundcloud.com')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('visual', 'true');
      urlObj.searchParams.set('show_artwork', 'true');
      return urlObj.toString();
    }
    
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=true&show_artwork=true&auto_play=false`;
  } catch {
    return url;
  }
}

export function normalizeAppleMusicEmbed(url: string): string {
  try {
    return url.replace('music.apple.com', 'embed.music.apple.com');
  } catch {
    return url;
  }
}

export function normalizeYouTubeEmbed(url: string): string {
  try {
    const urlObj = new URL(url);
    
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
      }
    }
    
    if (url.includes('/embed/')) {
      urlObj.searchParams.set('rel', '0');
      return urlObj.toString();
    }
    
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    
    const listId = urlObj.searchParams.get('list');
    if (listId) {
      return `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0`;
    }
    
    return url;
  } catch {
    return url;
  }
}

export function normalizeMixcloudEmbed(url: string): string {
  try {
    if (url.includes('widget/iframe')) {
      return url;
    }
    
    const path = new URL(url).pathname;
    return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}`;
  } catch {
    return url;
  }
}

export function getEmbedUrl(originalUrl: string, platform: PlaylistPlatform): string {
  switch (platform) {
    case 'spotify':
      return normalizeSpotifyEmbed(originalUrl);
    case 'soundcloud':
      return normalizeSoundCloudEmbed(originalUrl);
    case 'apple-music':
    case 'apple_music':
      return normalizeAppleMusicEmbed(originalUrl);
    case 'youtube':
      return normalizeYouTubeEmbed(originalUrl);
    case 'mixcloud':
      return normalizeMixcloudEmbed(originalUrl);
    default:
      return originalUrl;
  }
}

export function getPlatformColor(platform: PlaylistPlatform): string {
  switch (platform) {
    case 'spotify':
      return '#1DB954';
    case 'soundcloud':
      return '#FF5500';
    case 'apple-music':
    case 'apple_music':
      return '#FC3C44';
    case 'youtube':
      return '#FF0000';
    case 'mixcloud':
      return '#5000FF';
    default:
      return '#666666';
  }
}

export function getPlatformDisplayName(platform: PlaylistPlatform): string {
  switch (platform) {
    case 'spotify':
      return 'Spotify';
    case 'soundcloud':
      return 'SoundCloud';
    case 'apple-music':
    case 'apple_music':
      return 'Apple Music';
    case 'youtube':
      return 'YouTube';
    case 'mixcloud':
      return 'Mixcloud';
    default:
      return 'Link';
  }
}
