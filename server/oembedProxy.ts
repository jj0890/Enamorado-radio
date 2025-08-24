// SoundCloud oEmbed proxy for fetching artwork and metadata
export class OEmbedService {
  async fetchSoundCloudMetadata(url: string) {
    try {
      if (!url.includes('soundcloud.com')) {
        throw new Error('Only SoundCloud URLs are supported');
      }

      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error(`oEmbed request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        title: data.title || null,
        author: data.author_name || null,
        thumbnail_url: data.thumbnail_url || null,
        description: data.description || null,
        provider_name: data.provider_name || 'SoundCloud'
      };
    } catch (error) {
      console.error('SoundCloud oEmbed fetch failed:', error);
      return null;
    }
  }
}

export const oembedService = new OEmbedService();