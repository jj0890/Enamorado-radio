// Content type detector utility
// Analyzes URLs and files to determine content type

export function detectContentType(url: string, file?: File): string {
  // Check file type if file is provided
  if (file) {
    if (file.type.startsWith('image/')) return 'art';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'writing';
    if (file.type.startsWith('audio/')) return 'mix';
  }

  // Check URL patterns
  if (!url) return 'link';

  const urlLower = url.toLowerCase();

  // Video platforms
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'video';
  if (urlLower.includes('vimeo.com')) return 'video';
  if (urlLower.includes('tiktok.com')) return 'video';

  // Music/playlist platforms
  if (urlLower.includes('spotify.com/playlist')) return 'playlist';
  if (urlLower.includes('spotify.com/track')) return 'playlist';
  if (urlLower.includes('spotify.com/album')) return 'playlist';
  if (urlLower.includes('soundcloud.com/') && urlLower.includes('/sets/')) return 'playlist';
  if (urlLower.includes('apple.com/') && urlLower.includes('/playlist')) return 'playlist';
  if (urlLower.includes('music.youtube.com/playlist')) return 'playlist';

  // DJ mixes
  if (urlLower.includes('mixcloud.com')) return 'mix';
  if (urlLower.includes('soundcloud.com') && !urlLower.includes('/sets/')) return 'mix';

  // Image platforms
  if (urlLower.includes('instagram.com')) return 'art';
  if (urlLower.includes('imgur.com')) return 'art';
  if (urlLower.includes('flickr.com')) return 'art';
  if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return 'art';

  // Writing platforms
  if (urlLower.includes('medium.com')) return 'writing';
  if (urlLower.includes('substack.com')) return 'writing';
  if (urlLower.includes('notion.so')) return 'writing';

  // Default to link for everything else
  return 'link';
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    art: 'Artwork / Visual',
    video: 'Video',
    writing: 'Writing',
    mix: 'DJ Mix',
    playlist: 'Playlist',
    link: 'Link / Other',
  };
  return labels[type] || 'Unknown';
}

export function getContentTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    art: 'Visual art, photography, illustrations, or creative images',
    video: 'Video content from YouTube, Vimeo, TikTok, or other platforms',
    writing: 'Articles, essays, poems, or written content',
    mix: 'DJ mixes or audio content from SoundCloud, Mixcloud, etc.',
    playlist: 'Curated playlists from Spotify, Apple Music, YouTube Music, etc.',
    link: 'Web links, articles, or other online content',
  };
  return descriptions[type] || 'Content type not recognized';
}

export function getPlatformIcon(url: string): string {
  if (!url) return '🔗';

  const urlLower = url.toLowerCase();

  // Platform-specific icons
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return '📺';
  if (urlLower.includes('spotify.com')) return '🎵';
  if (urlLower.includes('soundcloud.com')) return '🔊';
  if (urlLower.includes('mixcloud.com')) return '🎧';
  if (urlLower.includes('instagram.com')) return '📷';
  if (urlLower.includes('vimeo.com')) return '🎬';
  if (urlLower.includes('tiktok.com')) return '📱';
  if (urlLower.includes('bandcamp.com')) return '💿';

  // Generic content type icons
  if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return '🖼️';
  if (urlLower.match(/\.(mp3|wav|flac|m4a)(\?|$)/i)) return '🎵';
  if (urlLower.match(/\.(mp4|mov|avi|webm)(\?|$)/i)) return '🎥';
  if (urlLower.match(/\.(pdf)(\?|$)/i)) return '📄';

  return '🔗';
}
