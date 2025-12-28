export interface OEmbedResult {
  platform: 'spotify' | 'apple-music' | 'soundcloud' | 'youtube' | 'mixcloud' | null;
  title?: string;
  thumbnail?: string;
  embedUrl?: string;
  trackCount?: number;
  description?: string;
  html?: string;
  providerName?: string;
  authorName?: string;
  authorUrl?: string;
  embeddable: boolean;
}

export function detectPlatform(url: string): OEmbedResult['platform'] {
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
  
  return null;
}

export function isEmbeddable(platform: OEmbedResult['platform']): boolean {
  switch (platform) {
    case 'soundcloud':
    case 'youtube':
    case 'apple-music':
    case 'mixcloud':
      return true;
    case 'spotify':
      return true;
    default:
      return false;
  }
}

async function fetchSpotifyOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.log(`Spotify oEmbed failed: ${res.status}`);
      return { platform: 'spotify', embeddable: true };
    }
    
    const data = await res.json();
    
    const embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    
    return {
      platform: 'spotify',
      title: data.title,
      thumbnail: data.thumbnail_url,
      embedUrl: embedUrl,
      html: data.html,
      providerName: data.provider_name,
      embeddable: true,
    };
  } catch (error) {
    console.error('Spotify oEmbed error:', error);
    return { platform: 'spotify', embeddable: true };
  }
}

async function fetchSoundCloudOEmbed(url: string): Promise<OEmbedResult> {
  try {
    let resolvedUrl = url;
    
    if (url.includes('on.soundcloud.com')) {
      try {
        const redirectRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        resolvedUrl = redirectRes.url;
      } catch {
        resolvedUrl = url;
      }
    }
    
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(resolvedUrl)}`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.log(`SoundCloud oEmbed failed: ${res.status}`);
      return { platform: 'soundcloud', embeddable: true };
    }
    
    const data = await res.json();
    
    const embedSrcMatch = /src="([^"]+)"/.exec(data.html || '');
    const embedUrl = embedSrcMatch ? embedSrcMatch[1] : undefined;
    
    let thumbnail = data.thumbnail_url;
    if (thumbnail) {
      thumbnail = thumbnail
        .replace(/^http:/, 'https:')
        .replace('large.jpg', 't500x500.jpg')
        .replace('t67x67.jpg', 't500x500.jpg')
        .replace('badge.jpg', 't500x500.jpg');
    }
    
    return {
      platform: 'soundcloud',
      title: data.title,
      thumbnail,
      embedUrl,
      description: data.description,
      html: data.html,
      providerName: data.provider_name,
      authorName: data.author_name,
      authorUrl: data.author_url,
      embeddable: true,
    };
  } catch (error) {
    console.error('SoundCloud oEmbed error:', error);
    return { platform: 'soundcloud', embeddable: true };
  }
}

async function fetchAppleMusicOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EnamoradoRadio/1.0)'
      }
    });
    
    if (!res.ok) {
      return {
        platform: 'apple-music',
        embedUrl,
        embeddable: true,
      };
    }
    
    const html = await res.text();
    
    const titleMatch = /<meta property="og:title" content="([^"]+)"/.exec(html);
    const imageMatch = /<meta property="og:image" content="([^"]+)"/.exec(html);
    const descMatch = /<meta property="og:description" content="([^"]+)"/.exec(html);
    
    let thumbnail = imageMatch?.[1];
    if (thumbnail) {
      thumbnail = thumbnail.replace(/\/\d+x\d+/, '/500x500');
    }
    
    return {
      platform: 'apple-music',
      title: titleMatch?.[1],
      thumbnail,
      embedUrl,
      description: descMatch?.[1],
      embeddable: true,
    };
  } catch (error) {
    console.error('Apple Music fetch error:', error);
    return { platform: 'apple-music', embeddable: true };
  }
}

async function fetchYouTubeOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.log(`YouTube oEmbed failed: ${res.status}`);
      return { platform: 'youtube', embeddable: true };
    }
    
    const data = await res.json();
    
    let videoId: string | null = null;
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('v=')) {
      videoId = new URL(url).searchParams.get('v');
    } else if (url.includes('/playlist')) {
      const listId = new URL(url).searchParams.get('list');
      if (listId) {
        return {
          platform: 'youtube',
          title: data.title,
          thumbnail: data.thumbnail_url,
          embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}`,
          html: data.html,
          providerName: data.provider_name,
          authorName: data.author_name,
          authorUrl: data.author_url,
          embeddable: true,
        };
      }
    }
    
    return {
      platform: 'youtube',
      title: data.title,
      thumbnail: data.thumbnail_url,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
      html: data.html,
      providerName: data.provider_name,
      authorName: data.author_name,
      authorUrl: data.author_url,
      embeddable: true,
    };
  } catch (error) {
    console.error('YouTube oEmbed error:', error);
    return { platform: 'youtube', embeddable: true };
  }
}

async function fetchMixcloudOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const oembedUrl = `https://www.mixcloud.com/oembed/?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.log(`Mixcloud oEmbed failed: ${res.status}`);
      return { platform: 'mixcloud', embeddable: true };
    }
    
    const data = await res.json();
    
    const embedSrcMatch = /src="([^"]+)"/.exec(data.html || '');
    const embedUrl = embedSrcMatch ? embedSrcMatch[1] : undefined;
    
    return {
      platform: 'mixcloud',
      title: data.title,
      thumbnail: data.image,
      embedUrl,
      html: data.html,
      providerName: data.provider_name,
      authorName: data.author_name,
      authorUrl: data.author_url,
      embeddable: true,
    };
  } catch (error) {
    console.error('Mixcloud oEmbed error:', error);
    return { platform: 'mixcloud', embeddable: true };
  }
}

export async function resolveOEmbed(url: string): Promise<OEmbedResult> {
  const platform = detectPlatform(url);
  
  if (!platform) {
    return { platform: null, embeddable: false };
  }
  
  console.log(`[oEmbed] Resolving ${platform} URL: ${url}`);
  
  switch (platform) {
    case 'spotify':
      return fetchSpotifyOEmbed(url);
    case 'soundcloud':
      return fetchSoundCloudOEmbed(url);
    case 'apple-music':
      return fetchAppleMusicOEmbed(url);
    case 'youtube':
      return fetchYouTubeOEmbed(url);
    case 'mixcloud':
      return fetchMixcloudOEmbed(url);
    default:
      return { platform: null, embeddable: false };
  }
}

export function normalizeEmbedUrl(url: string, platform: OEmbedResult['platform']): string {
  if (!url) return url;
  
  try {
    const embedUrl = new URL(url);
    
    switch (platform) {
      case 'spotify':
        embedUrl.searchParams.set('theme', '0');
        break;
      case 'soundcloud':
        embedUrl.searchParams.set('visual', 'true');
        embedUrl.searchParams.set('show_artwork', 'true');
        embedUrl.searchParams.set('color', '%23ff5500');
        break;
      case 'apple-music':
        break;
      case 'youtube':
        embedUrl.searchParams.set('rel', '0');
        break;
    }
    
    return embedUrl.toString();
  } catch {
    return url;
  }
}
