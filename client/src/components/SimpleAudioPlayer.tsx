import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface SimpleAudioPlayerProps {
  className?: string;
}

export function SimpleAudioPlayer({ className = '' }: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get current track info from AzuraCast
  const { data: currentTrack } = useQuery<{ url: string; title: string; artist: string; artwork: string } | null>({
    queryKey: ['/api/current-playback'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get stream URL from AzuraCast
  const { data: streamInfo } = useQuery<{ url: string } | null>({
    queryKey: ['/api/stream-status'],
    refetchInterval: 60000, // Check every minute
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Update audio source when stream info changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamInfo?.url) return;

    if (audio.src !== streamInfo.url) {
      audio.src = streamInfo.url;
      audio.volume = volume[0] / 100;
    }
  }, [streamInfo, volume]);

  // Volume control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume[0] / 100;
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  if (!currentTrack && !streamInfo) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      {/* Track Info */}
      <div className="flex items-center gap-3 mb-3">
        {currentTrack?.artwork && (
          <img
            src={currentTrack.artwork}
            alt={currentTrack.title}
            className="w-12 h-12 rounded object-cover"
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-navy dark:text-navy-light">
            <div className="w-2 h-2 bg-navy rounded-full animate-pulse" />
            LIVE via AzuraCast
          </span>
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
            value={volume[0]}
            onChange={(e) => setVolume([parseInt(e.target.value)])}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}