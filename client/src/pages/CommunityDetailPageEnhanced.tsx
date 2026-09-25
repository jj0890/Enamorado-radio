import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Link } from 'wouter';
import { ContentItem } from '@shared/schema';
import ReadingTemplate from '@/components/editorial/ReadingTemplate';
import PlaylistTemplate from '@/components/editorial/PlaylistTemplate';
import { detectPlaylistPlatform, getEmbedUrl, getEmbedHeight, isEmbeddablePlatform } from '@/lib/embed-utils';

/**
 * Enhanced Community Detail Page
 * Routes to appropriate template based on content type:
 * - Playlists → PlaylistTemplate (embed-focused)
 * - Episodes/Mixes → ReadingTemplate (if text-heavy) or current split-pane (if media-focused)
 * - Art/Writing → ReadingTemplate (reading-optimized)
 */
export default function CommunityDetailPageEnhanced() {
  const [, params] = useRoute('/community/:id');
  const itemId = params?.id;

  // Fetch the specific content item
  const { data: item, isLoading } = useQuery<ContentItem>({
    queryKey: ['/api/community', itemId],
    queryFn: async () => {
      const response = await fetch(`/api/community/${itemId}`);
      if (!response.ok) throw new Error('Failed to fetch content item');
      return response.json();
    },
    enabled: !!itemId,
    refetchOnWindowFocus: false,
  });

  // Fetch enhanced oEmbed data
  const { data: oembed } = useQuery({
    queryKey: ['/api/oembed/enhanced', item?.url],
    queryFn: async () => {
      if (!item?.url) return null;
      const response = await fetch(`/api/oembed/enhanced?url=${encodeURIComponent(item.url)}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!item?.url,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-2xl mx-auto">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 mb-8" />
            <div className="h-12 bg-gray-200 dark:bg-gray-800 mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-800 w-2/3 mb-8" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-serif text-gray-900 dark:text-white mb-4">
              Content Not Found
            </h1>
            <Link href="/community">
              <a className="text-navy dark:text-navy-light hover:underline">
                ← Back to Community
              </a>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Extract tracklist if available
  const getTracklist = (): Array<{
    position: number;
    artist: string;
    title: string;
    album?: string;
    duration?: string;
  }> => {
    if ('tracklist' in item && item.tracklist) {
      try {
        const parsedList = typeof item.tracklist === 'string'
          ? JSON.parse(item.tracklist)
          : item.tracklist;

        if (Array.isArray(parsedList)) {
          return parsedList.map((track: any, index: number) => ({
            position: index + 1,
            artist: track.artist || 'Unknown Artist',
            title: track.title || 'Unknown Title',
            album: track.album,
            duration: track.duration,
          }));
        }
      } catch (error) {
        console.error('Failed to parse tracklist:', error);
      }
    }
    return [];
  };

  // Calculate word count from description (rough estimate)
  const estimateWordCount = (text?: string) => {
    if (!text) return 0;
    return text.split(/\s+/).length;
  };

  const wordCount = estimateWordCount(item.description ?? undefined);

  // Route to appropriate template based on content type
  const renderTemplate = () => {
    switch (item.type) {
      case 'playlist':
        return (
          <PlaylistTemplate
            content={item as ContentItem & { type: 'playlist' }}
            tracks={getTracklist()}
          />
        );

      case 'episode':
      case 'mix':
        // For episodes/mixes, use reading template if they have substantial text
        // Otherwise fall through to media-focused template
        if (wordCount > 100) {
          return (
            <ReadingTemplate
              content={item}
              wordCount={wordCount}
              themes={('genre' in item && item.genre) ? [item.genre] : []}
            />
          );
        }
        // Fall through to default media template
        break;

      case 'art':
        // Art/writing content always uses reading template
        return (
          <ReadingTemplate
            content={item}
            wordCount={wordCount}
          />
        );

      default:
        break;
    }

    // Default media layout for episodes, mixes, and other content
    const rawUrl = item.url ?? '';
    const platform = rawUrl ? detectPlaylistPlatform(rawUrl) : 'unknown';
    const embeddable = rawUrl ? isEmbeddablePlatform(platform) : false;
    const embedUrl = embeddable ? getEmbedUrl(rawUrl, platform) : null;
    const embedHeight = embeddable ? getEmbedHeight(platform) : 180;

    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Title block */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-olive mb-2">
            {item.type}
          </p>
          <h1 className="font-display font-black uppercase text-foreground leading-none mb-3"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            {item.title}
          </h1>
          {('name' in item && item.name) && (
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              {item.name as string}
            </p>
          )}
          {('genre' in item && item.genre) && (
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-1">
              {item.genre as string}
            </p>
          )}
        </div>

        {/* Embed player */}
        {embedUrl ? (
          <div className="border border-paper-border mb-8">
            <iframe
              src={embedUrl}
              width="100%"
              height={embedHeight}
              allow="autoplay"
              className="block"
              style={{ border: 'none' }}
              loading="lazy"
              title={item.title ?? 'Player'}
            />
          </div>
        ) : rawUrl ? (
          <div className="border border-paper-border p-6 mb-8 text-center">
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-olive hover:underline"
            >
              Listen externally →
            </a>
          </div>
        ) : null}

        {/* Description */}
        {item.description && (
          <p className="font-serif italic text-ink-muted leading-relaxed" style={{ fontSize: '1.05rem' }}>
            {item.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950">
      <Navigation />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link href="/community">
          <a className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </a>
        </Link>
      </div>

      <main>
        {renderTemplate()}
      </main>
    </div>
  );
}
