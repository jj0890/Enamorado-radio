// client/src/lib/oembed.ts
export type OMeta = {
  platform: string;
  url?: string;
  title?: string | null;
  thumbnail?: string | null;
  embedUrl?: string | null;
  embedHtml?: string | null;
  description?: string | null;
};

export async function fetchOEmbed(url?: string | null): Promise<OMeta | null> {
  if (!url) return null;
  try {
    const r = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
