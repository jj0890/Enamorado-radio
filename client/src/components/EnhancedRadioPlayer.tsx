import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Heart, Share2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TrackMetadata {
  filename: string;
  artist?: string;
  trackName?: string;
  album?: string;
  imageUrl?: string;
  lastfmUrl?: string;
  duration?: number;
  playcount?: number;
  listeners?: number;
  displayTitle: string;
}

interface EnhancedRadioPlayerProps {
  isActive: boolean;
  onClose: () => void;
}

export default function EnhancedRadioPlayer({ isActive, onClose }: EnhancedRadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Current track filename - this would come from your radio stream
  const currentTrackFilename = "how did i do_1753594094475.mp3";
  
  // Fetch track metadata from Last.fm
  const { data: trackMetadata, isLoading } = useQuery<TrackMetadata>({
    queryKey: ['track-metadata', currentTrackFilename],
    queryFn: async () => {
      const response = await fetch(`/api/track-metadata/${encodeURIComponent(currentTrackFilename)}`);
      if (!response.ok) throw new Error('Failed to fetch track metadata');
      return response.json();
    },
    enabled: !!currentTrackFilename,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const current = audio.currentTime;
      const total = audio.duration;
      setProgress((current / total) * 100);
      setDuration(total);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      // In a real radio player, this would switch to the next track
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(percentage);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-2xl w-80 font-mono">
      <audio
        ref={audioRef}
        src={`/attached_assets/${currentTrackFilename}`}
        preload="metadata"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-navy rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-navy">LIVE</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Track Art & Info */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Album Artwork */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {trackMetadata?.imageUrl ? (
              <img 
                src={trackMetadata.imageUrl} 
                alt="Track artwork"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                ♪
              </div>
            )}
          </div>
          
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {trackMetadata?.trackName || trackMetadata?.displayTitle || 'Unknown Track'}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {trackMetadata?.artist || 'Unknown Artist'}
                </p>
                {trackMetadata?.album && (
                  <p className="text-xs text-gray-500 truncate">
                    {trackMetadata.album}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div 
            className="w-full h-1 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-navy rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-navy hover:bg-navy-dark text-white rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 mx-4">
            <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-navy bg-navy/10' : 'text-gray-400 hover:text-navy'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            {trackMetadata?.lastfmUrl && (
              <a
                href={trackMetadata.lastfmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Track Stats */}
        {trackMetadata && (trackMetadata.playcount || trackMetadata.listeners) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {trackMetadata.playcount && (
              <span>{trackMetadata.playcount.toLocaleString()} plays</span>
            )}
            {trackMetadata.listeners && (
              <span>{trackMetadata.listeners.toLocaleString()} listeners</span>
            )}
          </div>
        )}
      </div>

      {/* Station Branding */}
      <div className="px-4 pb-4">
        <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg py-2">
          <span className="font-bold text-navy">ENAMORADO RADIO</span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #003F87;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #003F87;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}