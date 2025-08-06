import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Plus, Radio, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DjSubmission {
  id: number;
  djName: string;
  demoMixTitle: string;
  demoMixDescription: string;
  primaryGenre: string;
  showLength: number;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audiocomUrl?: string;
  otherUrl?: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  thumbnail?: string;
  dynamicTitle?: string;
  dynamicArtist?: string;
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
}

// Hardcoded featured mixes as requested
const FEATURED_MIXES: Mix[] = [
  {
    id: 1,
    title: "New Mix (Mostly Footwork/Juke)",
    artist: "Scumbag Jones",
    description: "A high-energy mix featuring the best of Chicago footwork and juke music",
    thumbnailUrl: "",
    platform: 'soundcloud',
    url: "https://soundcloud.com/scumbagjones1/new-mix-mostly-footwork-juke",
    genre: ["Juke", "Footwork"],
    featured: true
  },
  {
    id: 2,
    title: "GUMMP3",
    artist: "Elevator Music",
    description: "Experimental club sounds and boundary-pushing electronic music",
    thumbnailUrl: "",
    platform: 'soundcloud',
    url: "https://soundcloud.com/elevatormusiclive/gummp3-elevator-music",
    genre: ["Experimental", "Club"],
    featured: true
  },
  {
    id: 3,
    title: "Florida Man FM (7/25/23)",
    artist: "454",
    description: "Florida-core rap meets underground sounds from the sunshine state",
    thumbnailUrl: "",
    platform: 'soundcloud',
    url: "https://soundcloud.com/user-626444105/454-presents-florida-man-fm-250723",
    genre: ["Rap", "Florida-core"],
    featured: true
  }
];

export default function MixesLanding() {
  const [currentMixIndex, setCurrentMixIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch community submissions (recent submissions regardless of approval)
  const { data: communitySubmissions = [] } = useQuery<DjSubmission[]>({
    queryKey: ['/api/mixes', { community: 'true' }],
    refetchInterval: 30000, // Refresh every 30 seconds for fresh content
  });

  // Fetch all approved submissions for the All Mixes section
  const { data: allSubmissions = [] } = useQuery<DjSubmission[]>({
    queryKey: ['/api/mixes'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Function to fetch SoundCloud thumbnails using oEmbed API
  const fetchSoundCloudThumbnail = async (soundcloudUrl: string): Promise<string> => {
    try {
      const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(soundcloudUrl)}`;
      const response = await fetch(oEmbedUrl);
      if (response.ok) {
        const data = await response.json();
        return data.thumbnail_url || '';
      }
    } catch (error) {
      console.log('Could not fetch SoundCloud thumbnail:', error);
    }
    return '';
  };

  // Convert DJ submissions to Mix format with proper SoundCloud URL handling
  const convertSubmissionToMix = (submission: DjSubmission): Mix => {
    const getMainUrl = () => {
      if (submission.soundcloudUrl) return submission.soundcloudUrl;
      if (submission.audiocomUrl) return submission.audiocomUrl;
      if (submission.otherUrl) return submission.otherUrl;
      return '';
    };

    const getPlatform = (): 'soundcloud' | 'mixcloud' | 'audio' | 'mp3' | 'wav' => {
      if (submission.soundcloudUrl) return 'soundcloud';
      return 'audio';
    };

    const getDuration = () => {
      if (submission.showLength) {
        const minutes = Math.floor(submission.showLength / 60);
        const seconds = submission.showLength % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return undefined;
    };

    // Fetch thumbnail for SoundCloud URLs
    const thumbnailUrl = submission.soundcloudUrl 
      ? `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(submission.soundcloudUrl)}`
      : '';

    return {
      id: submission.id,
      title: submission.dynamicTitle || submission.title || submission.demoMixTitle,
      artist: submission.dynamicArtist || submission.name || submission.djName,
      description: submission.about || submission.demoMixDescription,
      thumbnailUrl: submission.thumbnail || '', // Use thumbnail from API metadata
      platform: getPlatform(),
      url: getMainUrl(),
      duration: getDuration(),
      genre: [submission.genre || submission.primaryGenre],
      featured: true
    };
  };

  // Use hardcoded featured mixes
  const featuredMixes: Mix[] = FEATURED_MIXES;
  
  // Convert all approved submissions to all mixes
  const approvedSubmissions = allSubmissions.filter(s => s.status === 'approved');
  const allMixes: Mix[] = approvedSubmissions.map(convertSubmissionToMix);

  // State for storing fetched thumbnails (now primarily for featured mixes only)
  const [thumbnailCache, setThumbnailCache] = useState<Record<number, string>>({});

  // Populate thumbnails for hardcoded featured mixes only - submissions now come with metadata from API
  useEffect(() => {
    const populateThumbnails = async () => {
      // Fetch thumbnails for hardcoded featured mixes only
      for (const mix of featuredMixes) {
        if (mix.platform === 'soundcloud' && mix.url && !thumbnailCache[mix.id]) {
          try {
            const thumbnail = await fetchSoundCloudThumbnail(mix.url);
            if (thumbnail) {
              setThumbnailCache(prev => ({ ...prev, [mix.id]: thumbnail }));
            }
          } catch (error) {
            console.log(`Failed to fetch thumbnail for featured mix ${mix.id}`);
          }
        }
      }
    };

    populateThumbnails();
  }, [featuredMixes.length]);

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
    const nextIndex = (currentMixIndex + 1) % featuredMixes.length;
    scrollToMix(nextIndex);
  };

  const prevMix = () => {
    const prevIndex = currentMixIndex === 0 ? featuredMixes.length - 1 : currentMixIndex - 1;
    scrollToMix(prevIndex);
  };

  // Auto-advance carousel every 8 seconds
  useEffect(() => {
    if (featuredMixes.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentMixIndex((prevIndex) => (prevIndex + 1) % featuredMixes.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [featuredMixes.length]);

  // Update carousel scroll position when currentMixIndex changes
  useEffect(() => {
    if (carouselRef.current && featuredMixes.length > 0) {
      const mixWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentMixIndex * mixWidth,
        behavior: 'smooth'
      });
    }
  }, [currentMixIndex, featuredMixes.length]);

  const extractSoundCloudId = (url: string): string | null => {
    // Handle both regular and shortened SoundCloud URLs
    const shortMatch = url.match(/on\.soundcloud\.com\/([a-zA-Z0-9]+)/);
    if (shortMatch) {
      // For shortened URLs, we'll need to resolve them
      return url;
    }
    
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
  };

  const getPlatformEmbed = (mix: Mix) => {
    switch (mix.platform) {
      case 'soundcloud':
        const soundcloudId = extractSoundCloudId(mix.url);
        if (soundcloudId) {
          return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${soundcloudId}&color=%23ff0000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }
        return null;
      case 'mixcloud':
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
          className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">MIXES</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-mono">
            Curated collection of mixes from our community
          </p>
          
          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/submit-mix">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Plus className="w-6 h-6" />
                SUBMIT YOUR MIX
              </Button>
            </Link>
            
            <Link href="/resident-application">
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Users className="w-6 h-6" />
                BECOME A RESIDENT
              </Button>
            </Link>
            
            <Link href="/residents">
              <Button variant="ghost" className="text-red-500 hover:bg-red-50 font-mono font-bold px-8 py-4 text-lg transition-colors inline-flex items-center gap-3">
                <Users className="w-6 h-6" />
                VIEW RESIDENTS
              </Button>
            </Link>
          </div>
        </div>

        {/* Featured Mix Carousel */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 font-mono text-red-500">FEATURED MIXES</h2>
          
          {/* SoundCloud Featured Carousel */}
          <div className="relative">
            {/* Carousel Navigation */}
            <button
              onClick={prevMix}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 transition-colors"
              disabled={featuredMixes.length <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextMix}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 transition-colors"
              disabled={featuredMixes.length <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex overflow-x-hidden scroll-smooth"
            >
              {featuredMixes.map((mix, index) => (
                <div
                  key={mix.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gray-50 border-2 border-black rounded-lg p-8 hover:border-red-500 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* SoundCloud Embed */}
                      <div className="lg:w-1/2">
                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            width="100%"
                            height="100%"
                            scrolling="no"
                            frameBorder="no"
                            allow="autoplay"
                            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(mix.url)}&color=%23ff0000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                      
                      {/* Mix Info */}
                      <div className="lg:w-1/2 flex flex-col justify-center">
                        <h3 className="text-3xl font-bold mb-2 font-mono text-red-500">
                          {mix.title}
                        </h3>
                        <p className="text-xl text-gray-600 mb-4 font-mono">{mix.artist}</p>
                        
                        <p className="text-gray-600 mb-6 font-mono">
                          {mix.description}
                        </p>
                        
                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {mix.genre.map((g, i) => (
                            <span
                              key={i}
                              className="bg-red-500 text-white px-3 py-1 text-sm font-mono"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <a 
                            href={mix.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-red-500 hover:bg-red-600 text-white font-mono font-semibold py-3 px-6 transition-colors"
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
              {featuredMixes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToMix(index)}
                  className={`w-3 h-3 transition-colors ${
                    index === currentMixIndex ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Fresh Community Submissions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 font-mono text-red-500">FRESH FROM THE COMMUNITY</h2>
          
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
                  <Button className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold px-8 py-3">
                    <Plus className="w-5 h-5 mr-2" />
                    Be the first to submit!
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {communitySubmissions.slice(0, 4).map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 border-2 border-black rounded-lg p-4 hover:border-red-500 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                >
                  {/* Community Submission Thumbnail */}
                  <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden relative border-2 border-black">
                    {submission.thumbnail ? (
                      <img 
                        src={submission.thumbnail} 
                        alt={`${submission.dynamicTitle || submission.title} by ${submission.dynamicArtist || submission.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <Play className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-xs font-mono">New Submission</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-mono ${
                        submission.status === 'approved' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 text-white'
                      }`}>
                        {submission.status === 'approved' ? 'FEATURED' : 'NEW'}
                      </span>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="bg-white text-black hover:bg-gray-200 text-xs px-2 py-1">
                        <Play className="h-3 w-3 mr-1" />
                        LISTEN
                      </Button>
                    </div>
                  </div>
                  
                  {/* Community Submission Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm leading-tight font-mono">
                      {submission.dynamicTitle || submission.title || submission.demoMixTitle}
                    </h3>
                    <p className="text-gray-600 font-mono text-xs">
                      {submission.dynamicArtist || submission.name || submission.djName}
                    </p>
                    
                    {/* Genre & Duration */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-red-500 text-white px-2 py-1 font-mono">
                        {submission.primaryGenre}
                      </span>
                      <span className="text-gray-500 font-mono">
                        {submission.showLength}min
                      </span>
                    </div>
                    
                    {/* Platform Link */}
                    {submission.soundcloudUrl && (
                      <a 
                        href={submission.soundcloudUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-mono text-gray-600 hover:text-red-500 gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        SOUNDCLOUD
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Mixes Grid */}
        <section>
          <h2 className="text-3xl font-bold mb-8 font-mono text-red-500">ALL MIXES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allMixes.map((mix) => (
              <div
                key={mix.id}
                className="bg-gray-50 border-2 border-black rounded-lg p-6 hover:border-red-500 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              >
                {/* Mix Thumbnail */}
                <div className="aspect-square bg-white rounded-lg mb-4 overflow-hidden relative border-2 border-black">
                  {mix.thumbnailUrl ? (
                    <img 
                      src={mix.thumbnailUrl} 
                      alt={`${mix.title} by ${mix.artist}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <Play className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-xs font-mono">Audio Mix</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                      <Play className="h-4 w-4 mr-1" />
                      PLAY
                    </Button>
                  </div>
                </div>
                
                {/* Mix Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg leading-tight font-mono">
                    {mix.title}
                  </h3>
                  <p className="text-gray-600 font-mono">{mix.artist}</p>
                  
                  {/* Genre Tags */}
                  <div className="flex flex-wrap gap-1">
                    {mix.genre.slice(0, 2).map((genre, index) => (
                      <span
                        key={index}
                        className="bg-red-500 text-white px-2 py-1 text-xs font-mono"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  
                  {/* Platform Link */}
                  <a 
                    href={mix.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-mono text-gray-600 hover:text-red-500 gap-1 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {mix.platform.toUpperCase()}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}