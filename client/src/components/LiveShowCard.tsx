import { useQuery } from '@tanstack/react-query';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/providers/AudioProvider';

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

  // Fetch now playing data
  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const isLive = nowPlaying?.live?.is_live || false;
  const streamerName = nowPlaying?.live?.streamer_name || '';
  const artist = nowPlaying?.now_playing?.song?.artist || '';
  const title = nowPlaying?.now_playing?.song?.title || 'AutoDJ';
  const artwork = nowPlaying?.now_playing?.song?.art || fallbackImage;

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
        {/* Top Section - Station & Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tracking-wider uppercase opacity-80">
              San Antonio
            </span>
            {isLive && (
              <span className="bg-navy text-white px-2 py-1 text-xs font-mono font-bold">
                ON AIR
              </span>
            )}
          </div>
        </div>

        {/* Bottom Section - Show Info & Play Button */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-serif leading-tight tracking-tight">
              {isLive ? streamerName : title}
            </h2>
            <div className="flex items-center gap-2 text-sm font-mono opacity-90">
              <span>{getCurrentTime()}</span>
              <span>—</span>
              <span>{getEndTime()} CST</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            className="group/btn flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            data-testid="button-live-play"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="white" />
            ) : (
              <Play className="w-5 h-5" fill="white" />
            )}
            <span className="font-mono text-sm font-bold tracking-wide">
              {isPlaying ? 'PAUSE' : 'LISTEN LIVE'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
