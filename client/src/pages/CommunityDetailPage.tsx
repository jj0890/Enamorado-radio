import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Link } from 'wouter';
import { ContentItem } from '@shared/schema';

export default function CommunityDetailPage() {
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
  const { data: oembed, isLoading: oembedLoading } = useQuery({
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-800" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 w-2/3" />
                <div className="h-32 bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
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
              <a className="text-navy dark:text-navy-light hover:underline" data-testid="link-back-community">
                ← Back to Community
              </a>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Get type-specific display data
  const getTypeLabel = () => {
    switch (item.type) {
      case 'mix': return 'Mix';
      case 'episode': return 'Episode';
      case 'writing': return 'Writing';
      case 'art': return 'Art';
      case 'playlist': return 'Playlist';
      default: return 'Content';
    }
  };

  const getCreatorName = () => {
    if ('name' in item) return item.name;
    if ('hostName' in item) return item.hostName;
    if ('authorName' in item) return item.authorName;
    if ('artistName' in item) return item.artistName;
    if ('curatorName' in item) return item.curatorName;
    return 'Unknown';
  };

  const getDate = () => {
    if ('submittedAt' in item) return item.submittedAt;
    if ('airDate' in item) return item.airDate;
    if ('publishedAt' in item) return item.publishedAt;
    return null;
  };

  const getTracklist = () => {
    if ('tracklist' in item && item.tracklist) {
      return item.tracklist;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Link href="/community">
          <a className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-navy-light mb-8 transition-colors" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </a>
        </Link>

        {/* Split Pane Layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Pane: Player / Artwork */}
          <div>
            {oembedLoading ? (
              <div className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ) : oembed?.html ? (
              <div 
                className="rounded-lg overflow-hidden shadow-lg"
                dangerouslySetInnerHTML={{ __html: oembed.html }}
                data-testid="oembed-player"
              />
            ) : item.artworkUrl ? (
              <img
                src={item.artworkUrl}
                alt={item.title}
                className="w-full aspect-square object-cover rounded-lg shadow-lg"
                data-testid="img-artwork"
              />
            ) : (
              <div className="aspect-square bg-gradient-to-br from-navy to-navy-light flex items-center justify-center rounded-lg shadow-lg">
                <span className="text-white/20 text-6xl font-serif">
                  {item.title.charAt(0)}
                </span>
              </div>
            )}

            {/* External Link */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-navy dark:text-navy-light hover:underline"
                data-testid="link-external"
              >
                <ExternalLink className="w-4 h-4" />
                Open in {oembed?.provider_name || 'original platform'}
              </a>
            )}
          </div>

          {/* Right Pane: Metadata */}
          <div>
            {/* Type Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider ${
                item.type === 'mix' ? 'bg-navy text-white' :
                item.type === 'episode' ? 'bg-blue-600 text-white' :
                item.type === 'writing' ? 'bg-green-600 text-white' :
                'bg-gray-600 text-white'
              }`} data-testid={`badge-${item.type}`}>
                {getTypeLabel()}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-white mb-4" data-testid="text-title">
              {item.title}
            </h1>

            {/* Creator */}
            <div className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-400 mb-6">
              <User className="w-5 h-5" />
              <span data-testid="text-creator">{getCreatorName()}</span>
            </div>

            {/* Metadata Grid */}
            <div className="space-y-3 mb-8">
              {getDate() && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-date">
                    {new Date(getDate()!).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {'genre' in item && item.genre && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Tag className="w-4 h-4" />
                  <span data-testid="text-genre">{item.genre}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {'description' in item && item.description && (
              <div className="mb-8">
                <h2 className="text-xl font-serif text-gray-900 dark:text-white mb-3">
                  About
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap" data-testid="text-description">
                  {item.description}
                </p>
              </div>
            )}

            {/* Tracklist */}
            {getTracklist() && (
              <div>
                <h2 className="text-xl font-serif text-gray-900 dark:text-white mb-3">
                  Tracklist
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono" data-testid="text-tracklist">
                    {getTracklist()}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
