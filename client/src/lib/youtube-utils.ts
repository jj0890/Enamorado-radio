export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string {
  const qualityMap = {
    'default': 'default.jpg',
    'mq': 'mqdefault.jpg',
    'hq': 'hqdefault.jpg',
    'sd': 'sddefault.jpg',
    'maxres': 'maxresdefault.jpg'
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

export function parseYouTubeUrl(url: string): { videoId: string | null; isValid: boolean } {
  const isValid = isValidYouTubeUrl(url);
  const videoId = extractYouTubeId(url);

  return { videoId, isValid };
}
