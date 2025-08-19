import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface AzuraCastPlayerProps {
  className?: string;
}

export function AzuraCastPlayer({ className = '' }: AzuraCastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get now playing info from AzuraCast
  const { data: nowPlaying } = useQuery({
    queryKey: ['/api/azuracast/nowplaying'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Stream URL from environment or default
  const streamUrl = 'http://24.199.109.18/listen/enamorado_radio/radio.mp3';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Audio playback error');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        if (!audio.src) {
          audio.src = streamUrl;
        }
        await audio.play();
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  const openPublicPlayer = () => {
    window.open('http://24.199.109.18/public/enamorado_radio', '_blank');
  };

  const currentTrack = nowPlaying?.now_playing?.song;
  const listeners = nowPlaying?.listeners?.current || 0;

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} preload="none" />
      
      {/* Now Playing Info */}
      <div className="flex items-center gap-3 mb-3">
        {currentTrack?.art && (
          <img
            src={currentTrack.art}
            alt={currentTrack.title}
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {currentTrack?.title || 'Enamorado Radio'}
          </h3>
          {currentTrack?.artist && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {currentTrack.artist}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {listeners} listener{listeners !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="w-8 h-8 p-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openPublicPlayer}
            className="w-8 h-8 p-0"
            title="Open full player"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 p-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}