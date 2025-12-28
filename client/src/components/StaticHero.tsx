import { useQuery } from '@tanstack/react-query';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/providers/AudioProvider';
import type { HeroBanner } from '@shared/schema';

interface StaticHeroProps {
  backgroundImage?: string;
  streamUrl?: string;
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

export default function StaticHero({ 
  backgroundImage = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1600&h=800&fit=crop',
  streamUrl = '/stream.mp3'
}: StaticHeroProps) {
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';

  // Fetch active hero banner
  const { data: activeBanner } = useQuery<HeroBanner | null>({
    queryKey: ['/api/hero-banners/active'],
    refetchInterval: 60000, // Poll every minute
  });

  // Fetch now playing data for live metadata overlay
  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Use active banner image if available, otherwise fallback to prop
  const displayImage = activeBanner?.imageUrl || backgroundImage;

  const isLive = nowPlaying?.live?.is_live || false;
  const streamerName = nowPlaying?.live?.streamer_name || 'Live DJ';
  const artist = nowPlaying?.now_playing?.song?.artist || '';
  const title = nowPlaying?.now_playing?.song?.title || 'AutoDJ';
  const artwork = nowPlaying?.now_playing?.song?.art || '';

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

  return (
    <section 
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden"
      data-testid="static-hero"
    >
      {/* Static Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${displayImage})` }}
      />
      
      {/* Navy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/50 to-navy/90" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8 text-white">
        {/* Top Section - LIVE Indicator */}
        <div className="space-y-2">
          {isLive && (
            <div 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-2"
              data-testid="badge-live-indicator"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider">
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Bottom Section - Now Playing Metadata & Play Button */}
        <div className="space-y-6">
          {/* Now Playing Info */}
          <div className="space-y-2">
            <div className="text-xs font-mono tracking-wider uppercase opacity-80">
              Now Playing
            </div>
            <h2 
              className="text-3xl md:text-5xl font-serif leading-tight tracking-tight max-w-3xl"
              data-testid="text-now-playing-title"
            >
              {isLive ? streamerName : title}
            </h2>
            {!isLive && artist && (
              <div 
                className="text-lg md:text-xl font-mono opacity-90"
                data-testid="text-now-playing-artist"
              >
                {artist}
              </div>
            )}
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayPause}
            className="inline-flex items-center gap-3 bg-cream/90 hover:bg-cream text-navy backdrop-blur-sm px-8 py-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            data-testid="button-hero-play"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span className="text-sm font-mono font-bold tracking-wider uppercase">
                  Pause
                </span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span className="text-sm font-mono font-bold tracking-wider uppercase">
                  Listen Live
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
