import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, SkipForward, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface RadioTrack {
  id: number;
  title: string;
  artist: string;
  description: string;
  genre: string;
  duration: number;
  fileUrl: string;
  artworkUrl: string;
  isActive: boolean;
  playCount: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface HTML5RadioPlayerProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function HTML5RadioPlayer({ isActive, onToggle }: HTML5RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listeners, setListeners] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  // Fetch radio playlist
  const { data: playlist = [], isLoading } = useQuery<RadioTrack[]>({
    queryKey: ['/api/radio/playlist'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Track play count mutation
  const playCountMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const response = await fetch(`/api/radio/playlist/${trackId}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to update play count');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/playlist'] });
    },
  });

  const currentTrack = playlist[currentTrackIndex];

  // Shuffle function to randomly select next track
  const getRandomTrack = () => {
    if (playlist.length <= 1) return 0;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (nextIndex === currentTrackIndex);
    return nextIndex;
  };

  // Simulate listener count (replace with WebSocket in production)
  useEffect(() => {
    const baseListeners = 15 + Math.floor(Math.random() * 20);
    setListeners(baseListeners);
    
    const interval = setInterval(() => {
      setListeners(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(5, prev + change);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handle track loading
  useEffect(() => {
    if (audioRef.current && currentTrack?.fileUrl) {
      audioRef.current.src = currentTrack.fileUrl;
      audioRef.current.load();
    }
  }, [currentTrackIndex, currentTrack]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(Math.floor(audio.currentTime));
    const updateDuration = () => setDuration(Math.floor(audio.duration));
    const handleEnded = () => {
      // Increment play count and move to next track
      if (currentTrack) {
        playCountMutation.mutate(currentTrack.id);
      }
      setCurrentTrackIndex(getRandomTrack());
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      console.log('Loading track:', currentTrack?.title);
    };

    const handleError = (e: any) => {
      console.error('Audio error:', e);
      // Try next track on error
      setCurrentTrackIndex(getRandomTrack());
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrackIndex, currentTrack, playCountMutation]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!isActive) {
        onToggle(); // Activate the radio if not already active
      }
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        // Try next track if current one fails
        setCurrentTrackIndex(getRandomTrack());
      });
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const nextTrack = () => {
    if (currentTrack) {
      playCountMutation.mutate(currentTrack.id);
    }
    setCurrentTrackIndex(getRandomTrack());
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-navy animate-pulse" />
            <span className="font-mono text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // No tracks available
  if (!playlist.length) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-gray-500" />
            <span className="font-mono text-sm">No tracks available</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isActive) {
    // Minimized state when radio is off
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 border border-gray-700"
        >
          <Radio className="w-5 h-5 text-navy" />
          <span className="font-mono text-sm">Listen Live</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`bg-gray-900 rounded-lg shadow-2xl border border-gray-700 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-navy p-1.5 rounded">
                <Radio className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm font-mono">Enamorado Radio</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live • {listeners} listeners</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Current Track */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={currentTrack?.artworkUrl || 'https://via.placeholder.com/48x48/1a1a1a/ff0000?text=ER'}
                alt="Track artwork"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{currentTrack?.title}</h4>
              <p className="text-gray-400 text-xs truncate">{currentTrack?.artist}</p>
              <p className="text-gray-500 text-xs truncate">{currentTrack?.genre}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-navy h-1 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                disabled={!currentTrack}
                className="bg-navy hover:bg-navy-dark disabled:bg-gray-600 p-2 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
              
              <button
                onClick={nextTrack}
                disabled={playlist.length <= 1}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 p-1.5 rounded transition-colors"
              >
                <SkipForward className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <VolumeX className="w-3 h-3 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <Volume2 className="w-3 h-3 text-gray-400" />
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>Now Playing:</strong> {currentTrack?.title}</p>
                <p><strong>Artist:</strong> {currentTrack?.artist}</p>
                <p><strong>Genre:</strong> {currentTrack?.genre}</p>
                <p><strong>Play Count:</strong> {currentTrack?.playCount}</p>
                <p className="truncate">{currentTrack?.description}</p>
                <p className="mt-2">
                  <strong>Playlist:</strong> {playlist.length} tracks • Auto-shuffling
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        className="hidden"
        preload="metadata"
        crossOrigin="anonymous"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #ef4444;
            border-radius: 50%;
            cursor: pointer;
          }
          
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #ef4444;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        `
      }} />
    </div>
  );
}