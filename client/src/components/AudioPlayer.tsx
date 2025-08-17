import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Slider } from '@/components/ui/slider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CurrentPlayback } from '@shared/schema';
// Simple player for AzuraCast compatibility - complex features handled by AzuraCast

interface AudioPlayerProps {
  className?: string;
}

export function AudioPlayer({ className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const { data: currentPlayback } = useQuery<CurrentPlayback>({
    queryKey: ['/api/current-playback'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: streamStatus } = useQuery({
    queryKey: ['/api/stream-status'],
    refetchInterval: 10000, // Check stream status every 10 seconds
  });

  const updatePlaybackMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/current-playback', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/current-playback'] });
    },
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        const progressValue = (audio.currentTime / audio.duration) * 100;
        setProgress([progressValue]);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next track in rotation
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update audio source when playback changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentPlayback) return;

    let audioUrl = '';
    
    if (currentPlayback.isLive && (streamStatus as any)?.isLive) {
      audioUrl = 'http://24.199.109.18:8000/stream';
    } else if (currentPlayback.trackUrl) {
      audioUrl = currentPlayback.trackUrl;
    }

    if (audioUrl && audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.volume = volume[0] / 100;
      
      // Auto-play if not live stream
      if (!currentPlayback.isLive) {
        audio.play().catch(console.error);
      }
    }
  }, [currentPlayback, streamStatus, volume]);

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

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setProgress(value);
  };

  const handleNextTrack = async () => {
    // AzuraCast will handle track progression
    console.log('Next track requested - AzuraCast will handle this');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentPlayback) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      {/* Track Info */}
      <div className="flex items-center gap-3 mb-3">
        {currentPlayback.artwork && (
          <img
            src={currentPlayback.artwork}
            alt={currentPlayback.title}
            className="w-12 h-12 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {currentPlayback.title}
          </h3>
          {currentPlayback.artist && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {currentPlayback.artist}
            </p>
          )}
          {currentPlayback.isLive && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!currentPlayback.isLive && duration > 0 && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full" 
              style={{ width: `${progress[0]}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime((progress[0] / 100) * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

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
          
          {!currentPlayback.isLive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextTrack}
              className="w-8 h-8 p-0"
              disabled={updatePlaybackMutation.isPending}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
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