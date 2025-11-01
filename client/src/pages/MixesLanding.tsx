import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Plus, Radio, Users, Hash, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ContentCard from '@/components/ContentCard';

// Genre Quick Navigation Component
function GenreQuickNav() {
  const { data: genres = [] } = useQuery<Array<{name: string; slug: string; mixCount: number; total: number}>>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const r = await fetch("/api/genres", { cache: "no-store" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {genres.slice(0, 6).map((genre) => (
        <Link key={genre.slug} href={`/mixes?genre=${genre.slug}`} className="block">
          <div className="bg-gray-100 hover:bg-navy hover:text-white border-2 border-black p-3 transition-all duration-300 group text-center">
            <Hash className="w-4 h-4 mx-auto mb-1" />
            <div className="font-mono font-bold text-xs uppercase tracking-wide mb-1">
              {genre.name}
            </div>
            <div className="font-mono text-xs text-gray-600 group-hover:text-white">
              {genre.mixCount} mixes
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Updated to match actual server response from /api/public/mixes
interface DjSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  artUrl?: string;
  metadata: any;
  submittedAt: string;
  featureOnSite?: boolean;
}

interface Mix {
  id: number;
  title: string;
  artist: string;
  description: string;
  thumbnailUrl: string;
  platform: 'soundcloud' | 'mixcloud' | 'audio' | 'mp3' | 'wav';
  url: string;
  duration?: string;
  genre: string[];
  featured?: boolean;
  name?: string;
  artUrl?: string;
  metadata?: any;
}

// Featured mixes now come directly from admin-approved content

export default function MixesLanding() {
  const [currentMixIndex, setCurrentMixIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const searchString = useSearch();
  
  // Parse genre from URL query params
  const genreFilter = new URLSearchParams(searchString).get('genre');

  // Fetch admin-approved featured mixes (professional content controlled by admin)
  const { data: featuredMixes = [] } = useQuery<DjSubmission[]>({
    queryKey: ['/api/public/mixes/featured'],
    refetchInterval: 30000, // Refresh every 30 seconds for admin changes
  });

  // Fetch recent community submissions (limited for "Fresh from Community" section)
  // Use unified /api/community endpoint for consistency with Community page
  const { data: communitySubmissions = [] } = useQuery<any[]>({
    queryKey: ['/api/community', { type: 'mix', limit: 4 }],
    queryFn: async () => {
      const response = await fetch('/api/community?type=mix&limit=4&sort=recent');
      if (!response.ok) throw new Error('Failed to fetch community submissions');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch all approved mixes for "All Mixes" section
  // Use unified /api/community endpoint for consistency
  const { data: allApprovedMixes = [] } = useQuery<any[]>({
    queryKey: ['/api/community', { type: 'mix' }],
    queryFn: async () => {
      const response = await fetch('/api/community?type=mix&sort=recent');
      if (!response.ok) throw new Error('Failed to fetch all mixes');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Function to fetch SoundCloud thumbnails using our server proxy
  const fetchSoundCloudThumbnail = async (soundcloudUrl: string): Promise<string> => {
    try {
      // Use the /api/oembed endpoint for fetching metadata, including thumbnails
      const oEmbedUrl = `/api/oembed?url=${encodeURIComponent(soundcloudUrl)}`;
      const response = await fetch(oEmbedUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('oEmbed response for', soundcloudUrl, ':', data);
        // Return the thumbnail URL, preferring higher quality versions
        const thumbnail = data.thumbnail_url || data.artUrl || '';
        if (thumbnail) {
          // Upgrade to higher quality if possible
          const highQualityThumbnail = thumbnail
            .replace('large.jpg', 't500x500.jpg')
            .replace('t67x67.jpg', 't500x500.jpg')
            .replace('badge.jpg', 't500x500.jpg');
          console.log('Found thumbnail:', highQualityThumbnail);
          return highQualityThumbnail;
        }
      }
    } catch (error) {
      console.error('Could not fetch SoundCloud thumbnail:', error);
    }
    return '';
  };

  // Convert DJ submissions to Mix format with proper SoundCloud URL handling
  // Convert server response to display format
  const convertSubmissionToMix = (submission: DjSubmission): Mix => {
    const getPlatform = (): 'soundcloud' | 'mixcloud' | 'audio' | 'mp3' | 'wav' => {
      const url = submission.url;
      if (url.includes('soundcloud.com')) return 'soundcloud';
      if (url.includes('mixcloud.com')) return 'mixcloud';
      if (url.match(/\.(mp3|m4a|aac|ogg|wav)$/i)) return 'mp3';
      return 'audio';
    };

    return {
      id: submission.id,
      title: submission.title,
      artist: submission.name,
      description: submission.about,
      thumbnailUrl: submission.artUrl || '',
      platform: getPlatform(),
      url: submission.url,
      duration: undefined,
      genre: submission.genre ? [submission.genre] : [],
      featured: submission.featureOnSite || false
    };
  };

  // Convert admin-approved content to display format (REAL content controlled by admin!)
  const displayFeaturedMixes = featuredMixes.map(convertSubmissionToMix);
  
  // Map ContentItem to Mix format for custom "All Mixes" layout (not ContentCard)
  const allMixes = allApprovedMixes.map(item => ({
    id: item.id,
    title: item.title,
    artist: item.name || 'Unknown Artist',
    description: item.about || '',
    thumbnailUrl: item.artworkUrl || '',
    platform: (item.platform || 'audio') as 'soundcloud' | 'mixcloud' | 'audio' | 'mp3' | 'wav',
    url: item.url || '',
    duration: undefined,
    genre: item.genre ? [item.genre] : [],
    featured: item.isFeatured || false
  }));
  
  const displayCommunityMixes = genreFilter 
    ? allMixes.filter(mix => 
        mix.genre.some(g => g.toLowerCase().replace(/\s+/g, '-') === genreFilter.toLowerCase())
      )
    : allMixes;

  // State for storing fetched thumbnails (now primarily for featured mixes only)
  const [thumbnailCache, setThumbnailCache] = useState<Record<number, string>>({});

  // Enhanced thumbnails for admin-approved featured content
  useEffect(() => {
    const populateThumbnails = async () => {
      // Enhance thumbnails for admin-approved featured mixes
      for (const mix of displayFeaturedMixes) {
        if (mix.platform === 'soundcloud' && mix.url && !thumbnailCache[mix.id] && !mix.thumbnailUrl) {
          try {
            const thumbnail = await fetchSoundCloudThumbnail(mix.url);
            if (thumbnail) {
              setThumbnailCache(prev => ({ ...prev, [mix.id]: thumbnail }));
            }
          } catch (error) {
            console.log(`Failed to fetch enhanced thumbnail for featured mix ${mix.id}`);
          }
        }
      }
    };

    populateThumbnails();
  }, [displayFeaturedMixes.length]); // Update when admin approves new featured content

  const scrollToMix = (index: number) => {
    setCurrentMixIndex(index);
    if (carouselRef.current) {
      const mixWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: index * mixWidth,
        behavior: 'smooth'
      });
    }
  };

  const nextMix = () => {
    const nextIndex = (currentMixIndex + 1) % displayFeaturedMixes.length;
    scrollToMix(nextIndex);
  };

  const prevMix = () => {
    const prevIndex = currentMixIndex === 0 ? displayFeaturedMixes.length - 1 : currentMixIndex - 1;
    scrollToMix(prevIndex);
  };

  // Auto-advance carousel every 8 seconds (admin-controlled content)
  useEffect(() => {
    if (displayFeaturedMixes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMixIndex((prevIndex) => (prevIndex + 1) % displayFeaturedMixes.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [displayFeaturedMixes.length]);

  // Update carousel scroll position when currentMixIndex changes
  useEffect(() => {
    if (carouselRef.current && displayFeaturedMixes.length > 0) {
      const mixWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentMixIndex * mixWidth,
        behavior: 'smooth'
      });
    }
  }, [currentMixIndex, displayFeaturedMixes.length]);

  const extractSoundCloudId = (url: string): string | null => {
    // Simplified extraction, assuming the API or oEmbed handles the full resolution
    // For this specific player, it often needs the full URL or a specific ID format.
    // Let's try to match the typical /username/track-title format.
    const match = url.match(/^(https?:\/\/)?(www\.)?soundcloud\.com\/([^\/\?]+)\/([^\/\?]+)/);
    if (match && match[3] && match[4]) {
      return `${match[3]}/${match[4]}`; // This might need adjustment based on the player's expected format
    }
    // Handle shortened URLs or other formats if necessary, but rely on API for robustness
    return url; // Return the URL itself as a fallback if the player can handle it
  };

  const getPlatformEmbedUrl = (mix: Mix): string | null => {
    switch (mix.platform) {
      case 'soundcloud':
        const soundcloudIdentifier = extractSoundCloudId(mix.url);
        if (soundcloudIdentifier) {
          // The SoundCloud widget player prefers the track URL directly or a specific format.
          // Using the direct URL with parameters for embedding is a common approach.
          return `https://w.soundcloud.com/player/?url=${encodeURIComponent(mix.url)}&color=%23ff0000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }
        return null;
      case 'mixcloud':
        // Mixcloud widget URL format
        return mix.url.replace('mixcloud.com', 'mixcloud.com/widget/iframe/?hide_cover=1&light=1');
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Back to Home */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-navy transition-colors font-mono"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center pt-16 pb-8 mb-8">
          <h1 className="text-6xl font-bold mb-4 font-mono text-navy">MIXES</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-mono">
            Curated collection of mixes from our community
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/submit-mix">
              <Button className="bg-navy hover:bg-navy-dark text-white font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Plus className="w-6 h-6" />
                SUBMIT YOUR MIX
              </Button>
            </Link>

            <a href="/resident-application" data-testid="link-resident-application">
              <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Users className="w-6 h-6" />
                JOIN COMMUNITY PROGRAMMING
              </Button>
            </a>

            <Link href="/residents">
              <Button variant="ghost" className="text-navy hover:bg-red-50 font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Users className="w-6 h-6" />
                COMMUNITY PROGRAMMING
              </Button>
            </Link>
          </div>
        </div>

        {/* Featured Mix Carousel */}
        <section className="mb-16">
          <div className="pt-16 pb-8 mb-8">
            <h2 className="text-3xl font-bold font-mono text-navy">FEATURED MIXES</h2>
          </div>

          {/* SoundCloud Featured Carousel */}
          <div className="relative">
            {/* Carousel Navigation */}
            <button
              onClick={prevMix}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-navy hover:bg-navy-dark text-white p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={displayFeaturedMixes.length <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextMix}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-navy hover:bg-navy-dark text-white p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={displayFeaturedMixes.length <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex overflow-x-hidden scroll-smooth"
            >
              {displayFeaturedMixes.map((mix, index) => (
                <div
                  key={mix.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gray-50 border-2 border-black rounded-lg p-8 hover:border-navy hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* SoundCloud Embed */}
                      <div className="lg:w-1/2">
                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                          {mix.platform === 'soundcloud' && getPlatformEmbedUrl(mix) ? (
                            <iframe
                              width="100%"
                              height="100%"
                              scrolling="no"
                              frameBorder="no"
                              allow="autoplay"
                              src={getPlatformEmbedUrl(mix)!}
                              className="rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Play className="w-16 h-16" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mix Info */}
                      <div className="lg:w-1/2 flex flex-col justify-center">
                        <h3 className="text-3xl font-bold mb-2 font-mono text-navy">
                          {mix.title}
                        </h3>
                        <p className="text-xl text-gray-600 mb-4 font-mono">{mix.artist}</p>

                        <p className="text-gray-600 mb-6 font-mono">
                          {mix.description}
                        </p>

                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {mix.genre.map((g, i) => (
                            <Link
                              key={i}
                              href={`/mixes?genre=${g.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <span className="bg-navy text-white px-3 py-1 text-sm font-mono cursor-pointer hover:bg-navy-dark transition-colors">
                                {g}
                              </span>
                            </Link>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <a 
                            href={mix.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-navy hover:bg-navy-dark text-white font-mono font-semibold py-3 px-6 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5 mr-2" />
                            Listen on SoundCloud
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {displayFeaturedMixes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToMix(index)}
                  className={`w-3 h-3 transition-colors rounded-full ${
                    index === currentMixIndex ? 'bg-navy' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Genre */}
        <section className="mb-16">
          <div className="flex items-center justify-between pt-16 pb-8 mb-8">
            <h2 className="text-2xl font-bold font-mono text-navy">BROWSE BY GENRE</h2>
            <Link href="/genres" className="text-navy hover:underline font-mono text-sm flex items-center">
              View All →
            </Link>
          </div>
          
          <GenreQuickNav />
        </section>

        {/* Fresh Community Submissions */}
        <section className="mb-16">
          <div className="pt-16 pb-8 mb-8">
            <h2 className="text-3xl font-bold font-mono text-navy">FRESH FROM THE COMMUNITY</h2>
          </div>

          {communitySubmissions.length === 0 ? (
            <div className="bg-gray-50 border-2 border-black rounded-lg p-6 mb-8">
              <div className="text-center">
                <div className="text-gray-600 font-mono mb-4">
                  <Radio className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-bold">Be the First to Share</p>
                </div>
                <p className="text-gray-600 font-mono mb-6 max-w-2xl mx-auto">
                  Share your mixes, playlists, or discoveries with our community. Every submission adds to our growing archive of music and creativity - no gatekeeping, just good vibes.
                </p>
                <Link href="/submit-mix">
                  <Button className="bg-navy hover:bg-navy-dark text-white font-mono font-bold px-8 py-3">
                    <Plus className="w-5 h-5 mr-2" />
                    Be the first to submit!
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {communitySubmissions.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/community">
              <Button variant="outline" className="font-mono">
                View All Community Submissions →
              </Button>
            </Link>
          </div>
        </section>

        {/* All Mixes Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-mono text-navy">
              {genreFilter ? `${genreFilter.toUpperCase().replace(/-/g, ' ')} MIXES` : 'ALL MIXES'}
            </h2>
            {genreFilter && (
              <Link href="/mixes">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white font-mono">
                  Clear Filter
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {displayCommunityMixes.map((mix) => (
              <div
                key={mix.id}
                className="bg-gray-50 border-2 border-black rounded-lg overflow-hidden hover:border-navy hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Mix Thumbnail - Square on mobile, fixed width on desktop */}
                  <div className="relative w-full md:w-48 md:h-48 aspect-square md:aspect-auto bg-white border-b-2 md:border-b-0 md:border-r-2 border-black flex-shrink-0">
                    {(mix.thumbnailUrl || thumbnailCache[mix.id] || (mix as any).metadata?.imageUrl || (mix as any).metadata?.thumbnail_url || (mix as any).artUrl) ? (
                      <img 
                        src={mix.thumbnailUrl || thumbnailCache[mix.id] || (mix as any).metadata?.imageUrl || (mix as any).metadata?.thumbnail_url || (mix as any).artUrl} 
                        alt={`${mix.title} by ${mix.artist}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Mix thumbnail failed to load:', e.currentTarget.src);
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-white flex items-center justify-center absolute inset-0 ${
                        (mix.thumbnailUrl || thumbnailCache[mix.id] || (mix as any).metadata?.imageUrl || (mix as any).metadata?.thumbnail_url || (mix as any).artUrl) ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="text-gray-400 text-center">
                        <Play className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs font-mono">Audio Mix</p>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        className="bg-white text-black hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mix.url) {
                            window.open(mix.url, '_blank');
                          }
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        PLAY
                      </Button>
                    </div>
                  </div>

                  {/* Mix Info - Horizontal layout on desktop */}
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-lg leading-tight font-mono mb-1">
                      {mix.title}
                    </h3>
                    <p className="text-gray-600 font-mono text-sm mb-3">{mix.artist}</p>

                    {/* Genre Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mix.genre.slice(0, 2).map((genre, index) => (
                        <Link
                          key={index}
                          href={`/mixes?genre=${genre.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className="bg-navy text-white px-2 py-1 text-xs font-mono cursor-pointer hover:bg-navy-dark transition-colors">
                            {genre}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Platform Link */}
                    <a 
                      href={mix.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-mono text-gray-600 hover:text-navy gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {mix.platform.toUpperCase()}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}