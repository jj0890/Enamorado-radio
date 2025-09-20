// Platform detection utility for music URLs
// Supports reference-only approach for Spotify/Apple Music

export type MusicPlatform = 'spotify' | 'apple' | 'soundcloud' | 'mixcloud' | 'youtube' | 'audio' | 'upload' | 'unknown';

export type PlaybackMode = 'embed' | 'file' | 'stream';

export interface PlatformInfo {
  platform: MusicPlatform;
  playbackMode: PlaybackMode;
  isRadioIngestable: boolean;
  requiresAlternative: boolean;
  embedSupported: boolean;
}

/**
 * Detect music platform from URL
 */
export function detectMusicPlatform(url: string): PlatformInfo {
  if (!url || typeof url !== 'string') {
    return {
      platform: 'unknown',
      playbackMode: 'file',
      isRadioIngestable: false,
      requiresAlternative: true,
      embedSupported: false
    };
  }

  const urlLower = url.toLowerCase();

  // Spotify detection
  if (urlLower.includes('spotify.com') || urlLower.includes('open.spotify.com')) {
    return {
      platform: 'spotify',
      playbackMode: 'embed',
      isRadioIngestable: false,
      requiresAlternative: true,
      embedSupported: true
    };
  }

  // Apple Music detection
  if (urlLower.includes('music.apple.com') || urlLower.includes('itunes.apple.com')) {
    return {
      platform: 'apple',
      playbackMode: 'embed',
      isRadioIngestable: false,
      requiresAlternative: true,
      embedSupported: true
    };
  }

  // SoundCloud detection (radio ingestable)
  if (urlLower.includes('soundcloud.com')) {
    return {
      platform: 'soundcloud',
      playbackMode: 'stream',
      isRadioIngestable: true,
      requiresAlternative: false,
      embedSupported: true
    };
  }

  // Mixcloud detection (radio ingestable)
  if (urlLower.includes('mixcloud.com')) {
    return {
      platform: 'mixcloud',
      playbackMode: 'stream',
      isRadioIngestable: true,
      requiresAlternative: false,
      embedSupported: true
    };
  }

  // YouTube detection (reference-only for copyright safety)
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return {
      platform: 'youtube',
      playbackMode: 'embed',
      isRadioIngestable: false,
      requiresAlternative: true,
      embedSupported: true
    };
  }

  // Audio.com detection
  if (urlLower.includes('audio.com')) {
    return {
      platform: 'audio',
      playbackMode: 'stream',
      isRadioIngestable: true,
      requiresAlternative: false,
      embedSupported: false
    };
  }

  // Direct MP3/audio file
  if (urlLower.match(/\.(mp3|wav|flac|m4a|aac|ogg)(\?|$)/)) {
    return {
      platform: 'upload',
      playbackMode: 'file',
      isRadioIngestable: true,
      requiresAlternative: false,
      embedSupported: false
    };
  }

  // Unknown/unsupported platform
  return {
    platform: 'unknown',
    playbackMode: 'embed',
    isRadioIngestable: false,
    requiresAlternative: true,
    embedSupported: false
  };
}

/**
 * Get display information for platform
 */
export function getPlatformDisplayInfo(platform: MusicPlatform): {
  name: string;
  badge: string;
  color: string;
  description: string;
} {
  switch (platform) {
    case 'spotify':
      return {
        name: 'Spotify',
        badge: 'Web-only',
        color: 'green',
        description: 'Can embed on website, cannot be aired on radio without alternative source'
      };
    case 'apple':
      return {
        name: 'Apple Music',
        badge: 'Web-only',
        color: 'gray',
        description: 'Can embed on website, cannot be aired on radio without alternative source'
      };
    case 'youtube':
      return {
        name: 'YouTube',
        badge: 'Web-only',
        color: 'red',
        description: 'Can embed on website, cannot be aired on radio without alternative source'
      };
    case 'soundcloud':
      return {
        name: 'SoundCloud',
        badge: 'Radio-ready',
        color: 'orange',
        description: 'Can be aired on radio and embedded on website'
      };
    case 'mixcloud':
      return {
        name: 'Mixcloud',
        badge: 'Radio-ready',
        color: 'blue',
        description: 'Can be aired on radio and embedded on website'
      };
    case 'audio':
      return {
        name: 'Audio.com',
        badge: 'Radio-ready',
        color: 'purple',
        description: 'Can be aired on radio'
      };
    case 'upload':
      return {
        name: 'Direct Audio',
        badge: 'Radio-ready',
        color: 'emerald',
        description: 'Direct audio file, can be aired on radio'
      };
    default:
      return {
        name: 'Unknown',
        badge: 'Unsupported',
        color: 'gray',
        description: 'Platform not supported'
      };
  }
}

/**
 * Check if URL is a reference-only platform (Spotify, Apple Music, YouTube)
 */
export function isReferenceOnly(url: string): boolean {
  const info = detectMusicPlatform(url);
  return !info.isRadioIngestable;
}

/**
 * Get platform badge component props
 */
export function getPlatformBadgeProps(platform: MusicPlatform): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  text: string;
} {
  const info = getPlatformDisplayInfo(platform);
  
  if (!detectMusicPlatform('').isRadioIngestable) {
    return {
      variant: 'outline',
      className: 'border-amber-500 text-amber-700 bg-amber-50',
      text: info.badge
    };
  }
  
  return {
    variant: 'default',
    className: 'border-green-500 text-green-700 bg-green-50',
    text: info.badge
  };
}

/**
 * Extract track ID from platform URLs for metadata fetching
 */
export function extractTrackId(url: string): { platform: MusicPlatform; trackId: string | null } {
  const platform = detectMusicPlatform(url).platform;
  
  switch (platform) {
    case 'spotify':
      const spotifyMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
      return { platform, trackId: spotifyMatch ? spotifyMatch[1] : null };
      
    case 'apple':
      const appleMatch = url.match(/music\.apple\.com\/[^/]+\/album\/[^/]+\/(\d+)/);
      return { platform, trackId: appleMatch ? appleMatch[1] : null };
      
    case 'youtube':
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      return { platform, trackId: youtubeMatch ? youtubeMatch[1] : null };
      
    default:
      return { platform, trackId: null };
  }
}