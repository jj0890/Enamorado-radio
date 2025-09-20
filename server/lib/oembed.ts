// Using built-in fetch available in Node 18+

export async function getOEmbedThumbSafe(originalUrl: string): Promise<{ artUrl?: string }> {
  try {
    let endpoint: string | undefined;

    if (/soundcloud\.com\//i.test(originalUrl)) {
      endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(originalUrl)}`;
    } else if (/mixcloud\.com\//i.test(originalUrl)) {
      endpoint = `https://www.mixcloud.com/oembed/?format=json&url=${encodeURIComponent(originalUrl)}`;
    } else {
      return {};
    }

    const res = await fetch(endpoint, { 
      headers: {
        'User-Agent': 'EnamoradoRadio/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.log(`oEmbed fetch failed for ${originalUrl}: ${res.status}`);
      return {};
    }
    
    const data = await res.json();

    // SoundCloud: thumbnail_url or thumbnail_url_https, Mixcloud: thumbnail_url
    let raw = (data.thumbnail_url_https || data.thumbnail_url || data.thumbnail_url_large || data.image);
    if (!raw) {
      console.log(`No thumbnail found in oEmbed data for ${originalUrl}`);
      return {};
    }

    // Force https and upgrade to higher quality
    let artUrl = String(raw)
      .replace(/^http:/, 'https:')
      .replace('large.jpg', 't500x500.jpg')
      .replace('t67x67.jpg', 't500x500.jpg')
      .replace('badge.jpg', 't500x500.jpg');

    console.log(`Successfully fetched thumbnail for ${originalUrl}: ${artUrl}`);
    return { artUrl };
  } catch (error) {
    console.log(`Error fetching oEmbed for ${originalUrl}:`, error);
    return {};
  }
}