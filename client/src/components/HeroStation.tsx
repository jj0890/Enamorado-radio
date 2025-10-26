import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAudio } from '@/providers/AudioProvider';

interface HeroStationProps {
  streamUrlPrimary?: string;
  streamUrlFallback?: string;
  nowPlayingEndpoint?: string;
}

interface NowPlayingData {
  now_playing?: {
    song?: {
      title?: string;
      artist?: string;
      text?: string;
    };
  };
  live?: {
    is_live?: boolean;
    streamer_name?: string;
  };
}

export default function HeroStation({
  streamUrlPrimary = '/stream.mp3',
  streamUrlFallback = '/stream.mp3',
  nowPlayingEndpoint = '/api/now-playing',
}: HeroStationProps) {
  const [streamUrl, setStreamUrl] = useState(streamUrlPrimary);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Use shared audio context
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';

  // Fetch now playing data
  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: [nowPlayingEndpoint],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Initialize stream URL on mount and check health
  useEffect(() => {
    const checkStream = async () => {
      try {
        const response = await fetch(streamUrlPrimary, { method: 'HEAD' });
        if (!response.ok) {
          console.log('Primary stream not available, using fallback');
          setStreamUrl(streamUrlFallback);
        }
      } catch (error) {
        console.log('Primary stream check failed, using fallback');
        setStreamUrl(streamUrlFallback);
      }
    };

    checkStream();
  }, [streamUrlPrimary, streamUrlFallback]);

  // Scroll listener for sticky/minimize behavior
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle play/pause
  const handlePlayPause = async () => {
    if (isPlaying) {
      actions.pause();
    } else {
      const isLive = nowPlaying?.live?.is_live || false;
      const streamerName = nowPlaying?.live?.streamer_name || '';
      const artist = nowPlaying?.now_playing?.song?.artist || '';
      const title = nowPlaying?.now_playing?.song?.title || 'Enamorado Radio';

      await actions.play(streamUrl, {
        title: isLive && streamerName ? streamerName : title,
        artist: isLive ? '' : artist,
        isLive,
      });
    }
  };

  // Extract now playing text
  const getNowPlayingText = () => {
    if (nowPlaying?.live?.is_live && nowPlaying?.live?.streamer_name) {
      return `🔴 LIVE — ${nowPlaying.live.streamer_name}`;
    }
    
    if (nowPlaying?.now_playing?.song) {
      const { artist, title, text } = nowPlaying.now_playing.song;
      if (artist && title) {
        return `${artist} — ${title}`;
      }
      if (text) {
        return text;
      }
    }
    
    return state.title || 'Enamorado Radio';
  };

  const nowPlayingText = getNowPlayingText();

  return (
    <div
      className={`sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-500 border-b-4 border-black dark:border-gray-700 transition-all duration-300 ${
        isMinimized ? 'py-3' : 'py-16 md:py-24'
      }`}
      data-testid="hero-station"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Full-size Hero Layout */}
        {!isMinimized && (
          <div className="text-center space-y-6 text-white">
            {/* Large Play Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handlePlayPause}
                data-testid="button-hero-play"
                className="w-24 h-24 rounded-full bg-white text-red-500 hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center shadow-2xl"
                aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12" />
                ) : (
                  <Play className="w-12 h-12 ml-1" />
                )}
              </button>
            </div>

            {/* Now Playing Ticker */}
            <div className="overflow-hidden">
              <div className="nowPlaying">
                <div className="nowPlaying__inner font-mono text-lg md:text-2xl font-bold opacity-90">
                  {nowPlayingText}
                </div>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-lg md:text-xl font-mono max-w-2xl mx-auto opacity-80">
              Community internet radio from San Antonio
            </p>
          </div>
        )}

        {/* Minimized Hero Layout */}
        {isMinimized && (
          <div className="flex items-center justify-center gap-4 text-white">
            {/* Mini play button */}
            <button
              onClick={handlePlayPause}
              data-testid="button-hero-play-mini"
              className="w-10 h-10 rounded-full bg-white text-red-500 hover:bg-gray-100 transition-all flex items-center justify-center flex-shrink-0"
              aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Now Playing Ticker (compact) */}
            <div className="overflow-hidden flex-1 max-w-2xl">
              <div className="nowPlaying">
                <div className="nowPlaying__inner font-mono text-sm md:text-base font-bold opacity-90">
                  {nowPlayingText}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
