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

    const res = await fetch(endpoint, { timeout: 8000 });
    if (!res.ok) return {};
    const data = await res.json();

    // SoundCloud: thumbnail_url or thumbnail_url_https, Mixcloud: thumbnail_url
    let raw = (data.thumbnail_url_https || data.thumbnail_url || data.thumbnail_url_large || data.image);
    if (!raw) return {};

    // Force https and a reasonable size
    let artUrl = String(raw).replace(/^http:/, 'https:');

    // Some providers return SVG or tiny images; no-op if so
    return { artUrl };
  } catch {
    return {};
  }
}