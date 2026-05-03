import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft, ExternalLink, Calendar, User, Tag, Play, Pause } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Link } from 'wouter';
import { ContentItem } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/providers/AudioProvider';

export default function CommunityDetailPage() {
  const [, params] = useRoute('/community/:id');
  const itemId = params?.id;
  
  const { state, actions } = useAudio();
  const currentSrc = state.src;

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

  const getCreatorHandle = (): string | null => {
    if ('handle' in item && item.handle) return item.handle;
    return null;
  };

  const getDate = () => {
    if ('submittedAt' in item) return item.submittedAt;
    if ('airDate' in item) return item.airDate;
    if ('publishedAt' in item) return item.publishedAt;
    return null;
  };

  const getTracklist = (): Array<{artist: string; title: string; timestamp?: number}> | null => {
    if ('tracklist' in item && item.tracklist) {
      try {
        // Parse JSON string if it's a string
        if (typeof item.tracklist === 'string') {
          return JSON.parse(item.tracklist);
        }
        // Return directly if already an array
        if (Array.isArray(item.tracklist)) {
          return item.tracklist;
        }
      } catch (error) {
        console.error('Failed to parse tracklist:', error);
      }
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

        {/* Split Pane Layout - 35% meta / 65% viewer */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Pane: Metadata - 35% on desktop */}
          <div className="w-full md:w-[35%] order-2 md:order-1">
            {/* Type Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider ${
                item.type === 'mix' ? 'bg-navy text-white' :
                item.type === 'episode' ? 'bg-blue-600 text-white' :
                item.type === 'playlist' ? 'bg-purple-600 text-white' :
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
              {getCreatorHandle() ? (
                <Link href={`/contributors/${getCreatorHandle()}`} className="hover:text-navy dark:hover:text-navy-light hover:underline transition-colors" data-testid="link-creator">
                  {getCreatorName()}
                </Link>
              ) : (
                <span data-testid="text-creator">{getCreatorName()}</span>
              )}
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

            {/* External Link */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-navy dark:text-navy-light hover:underline"
                data-testid="link-external"
              >
                <ExternalLink className="w-4 h-4" />
                Open in {oembed?.provider_name || 'original platform'}
              </a>
            )}
          </div>

          {/* Right Pane: Player / Artwork - 65% on desktop */}
          <div className="w-full md:w-[65%] order-1 md:order-2">
            {item.type === 'episode' && item.url && item.url.startsWith('/episodes/') ? (
              /* Episode Audio Player - uses shared audio context for persistent playback */
              (() => {
                const episodeUrl = item.url!; // We know it's defined from the condition above
                const isThisEpisodePlaying = currentSrc === episodeUrl && state.status === 'playing';
                const isThisEpisodeLoaded = currentSrc === episodeUrl;
                
                const handleEpisodePlay = async () => {
                  if (isThisEpisodePlaying) {
                    actions.pause();
                  } else if (isThisEpisodeLoaded) {
                    actions.toggle();
                  } else {
                    await actions.play(episodeUrl, {
                      title: item.title,
                      artist: getCreatorName(),
                      artwork: item.artworkUrl || undefined,
                      isLive: false,
                    });
                  }
                };
                
                return (
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                    {item.artworkUrl ? (
                      <img
                        src={item.artworkUrl}
                        alt={item.title}
                        className="w-full aspect-square object-cover"
                        data-testid="img-artwork"
                      />
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                        <span className="text-white/20 text-6xl font-serif">
                          {item.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={handleEpisodePlay}
                          size="lg"
                          className="w-14 h-14 rounded-full bg-navy hover:bg-navy-dark text-white"
                          data-testid="button-play-episode"
                        >
                          {isThisEpisodePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </Button>
                        <div className="flex-1">
                          <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {isThisEpisodePlaying ? 'Now Playing' : isThisEpisodeLoaded ? 'Paused' : 'Press play to listen'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {'duration' in item && item.duration ? item.duration : 'Episode'}
                          </div>
                        </div>
                      </div>
                      {isThisEpisodeLoaded && (
                        <div className="mt-3 text-xs text-navy dark:text-navy-light">
                          ✓ Playing in sticky player - browse the site while listening
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : oembedLoading ? (
              <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
            ) : oembed?.html ? (
              <div
                className="rounded-lg overflow-hidden shadow-lg"
                dangerouslySetInnerHTML={{ __html: oembed.html }}
                data-testid="oembed-player"
              />
            ) : item.url && /\.(mp3|m4a|aac|ogg|wav|flac)(\?|$)/i.test(item.url) ? (
              /* Direct audio file — HTML5 native player */
              <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                {item.artworkUrl && (
                  <img
                    src={item.artworkUrl}
                    alt={item.title}
                    className="w-full aspect-square object-cover"
                    data-testid="img-artwork"
                  />
                )}
                <div className="p-4">
                  <audio
                    controls
                    className="w-full"
                    preload="metadata"
                    data-testid="audio-player-native"
                  >
                    <source src={item.url} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>
            ) : item.artworkUrl ? (
              <img
                src={item.artworkUrl}
                alt={item.title}
                className="w-full aspect-square object-cover rounded-lg shadow-lg"
                data-testid="img-artwork"
              />
            ) : (
              <div className="aspect-square bg-gradient-to-br from-charcoal-800 to-charcoal-900 flex items-center justify-center rounded-lg shadow-lg">
                <span className="text-white/20 text-6xl font-serif">
                  {item.title.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Full-Width Tracklist Section */}
        {getTracklist() && (
          <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-12">
            <h2 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">
              Tracklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getTracklist()!.map((track, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-navy dark:hover:border-sky-500 p-3 rounded-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy/10 dark:hover:shadow-sky-500/20 group cursor-default"
                  data-testid={`track-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-navy dark:text-sky-400 font-mono font-bold text-sm pt-0.5 min-w-[2rem]">
                      #{String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-mono group-hover:text-navy dark:group-hover:text-sky-400 transition-colors">
                        {track.artist}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {track.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
