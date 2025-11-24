import { useQuery } from '@tanstack/react-query';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/providers/AudioProvider';
import type { HeroBanner } from '@shared/schema';

interface LiveShowCardProps {
  streamUrl?: string;
  fallbackImage?: string;
}

interface NowPlayingData {
  now_playing?: {
    song?: {
      title?: string;
      artist?: string;
      text?: string;
      art?: string;
    };
  };
  live?: {
    is_live?: boolean;
    streamer_name?: string;
  };
}

export default function LiveShowCard({ 
  streamUrl = '/stream.mp3',
  fallbackImage = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop'
}: LiveShowCardProps) {
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';

  // Fetch active hero banner
  const { data: activeBanner } = useQuery<HeroBanner | null>({
    queryKey: ['/api/hero-banners/active'],
    refetchInterval: 60000, // Poll every minute
  });

  // Fetch now playing data
  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const isLive = nowPlaying?.live?.is_live || false;
  const streamerName = nowPlaying?.live?.streamer_name || '';
  const artist = nowPlaying?.now_playing?.song?.artist || '';
  const title = nowPlaying?.now_playing?.song?.title || 'AutoDJ';
  const songArtwork = nowPlaying?.now_playing?.song?.art || fallbackImage;
  
  // Use hero banner if available, otherwise use song artwork
  const artwork = activeBanner?.imageUrl || songArtwork;

  const handlePlayPause = async () => {
    if (isPlaying) {
      actions.pause();
    } else {
      await actions.play(streamUrl, {
        title: isLive ? streamerName : title,
        artist: isLive ? 'Live' : artist,
        artwork,
        isLive,
      });
    }
  };

  // Format current time for display
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get end time (1 hour from now as placeholder)
  const getEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <section 
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden group cursor-pointer"
      onClick={handlePlayPause}
      data-testid="live-show-card"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
        {/* Top Section - Mission Statement & Status */}
        <div className="space-y-3">
          <h1 className="text-lg md:text-xl font-mono tracking-wide">
            San Antonio's first community-run radio platform
          </h1>
          <div className="flex items-center gap-3">
            {isLive ? (
              <>
                <div className="flex items-center gap-2 bg-navy text-white px-3 py-1.5 font-mono text-xs font-bold">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE NOW
                </div>
                <span className="text-sm font-mono opacity-90">
                  {streamerName}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-1.5">
                <span className="text-xs font-mono">
                  🎵 AutoDJ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Now Playing & Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-mono opacity-80 tracking-wider uppercase">
              {isLive ? 'On Air Now' : 'Now Playing'}
            </div>
            <h2 className="text-4xl md:text-6xl font-serif leading-tight tracking-tight">
              {isLive ? streamerName : title}
            </h2>
            {!isLive && artist && (
              <p className="text-xl md:text-2xl font-mono opacity-90">
                {artist}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="group/btn flex items-center gap-3 bg-white text-navy hover:bg-cream px-8 py-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              data-testid="button-live-play"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
              <span className="font-mono text-base font-bold tracking-wide uppercase">
                {isPlaying ? 'Pause' : 'Listen Live'}
              </span>
            </button>
            
            <a 
              href="#latest"
              className="text-white/90 hover:text-white underline underline-offset-4 font-mono text-sm transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Browse Archives →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
