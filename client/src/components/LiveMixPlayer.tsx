import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Track {
  id: number;
  trackNumber: number;
  title: string;
  artist: string;
  startTime: number;
  endTime: number | null;
  label: string | null;
  year: number | null;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
}

interface MixUpload {
  id: number;
  title: string;
  artist: string;
  description: string | null;
  genre: string;
  duration: number;
  fileUrl: string;
  artworkUrl: string | null;
  isLive: boolean;
  isFeatured: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

interface LiveMixPlayerProps {
  mixId: number;
  autoPlay?: boolean;
  className?: string;
}

export default function LiveMixPlayer({ mixId, autoPlay = false, className = '' }: LiveMixPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Fetch mix data
  const { data: mix, isLoading: isMixLoading } = useQuery<MixUpload>({
    queryKey: ['/api/mix-uploads', mixId],
    enabled: !!mixId,
  });

  // Fetch tracklist
  const { data: tracklist = [], isLoading: isTracklistLoading } = useQuery<Track[]>({
    queryKey: ['/api/mix-uploads', mixId, 'tracklist'],
    enabled: !!mixId,
  });

  // Get current track based on playback time
  const { data: currentTrack } = useQuery<Track | null>({
    queryKey: ['/api/mix-uploads', mixId, 'current-track', Math.floor(currentTime)],
    enabled: !!mixId && currentTime > 0,
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play when component mounts
  useEffect(() => {
    if (autoPlay && mix && audioRef.current) {
      handlePlay();
    }
  }, [autoPlay, mix]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  if (isMixLoading) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <p>Mix not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      <audio
        ref={audioRef}
        src={mix.fileUrl}
        preload="metadata"
      />
      
      {/* Mix Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            {mix.artworkUrl ? (
              <img 
                src={mix.artworkUrl} 
                alt={mix.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-white text-2xl font-bold">
                {mix.artist.charAt(0)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate">{mix.title}</h3>
          <p className="text-gray-400 truncate">{mix.artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{mix.genre}</span>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-500">{formatTime(mix.duration)}</span>
            {mix.isLive && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400">LIVE</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Current Track Info */}
      {currentTrack && (
        <div className="mb-6 p-4 bg-black/20 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">NOW PLAYING</span>
          </div>
          <h4 className="text-white font-semibold">{currentTrack.title}</h4>
          <p className="text-gray-400">{currentTrack.artist}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {currentTrack.label && (
              <span>{currentTrack.label}</span>
            )}
            {currentTrack.year && (
              <>
                <span>•</span>
                <span>{currentTrack.year}</span>
              </>
            )}
            {currentTrack.bpm && (
              <>
                <span>•</span>
                <span>{currentTrack.bpm} BPM</span>
              </>
            )}
            {currentTrack.key && (
              <>
                <span>•</span>
                <span>{currentTrack.key}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>
        
        {/* Clickable progress bar */}
        <div 
          className="h-2 bg-gray-700 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const newTime = percentage * duration;
            handleSeek(newTime);
          }}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-150"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isLoading}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          
          <button
            onClick={() => handleSeek(Math.max(0, currentTime - 10))}
            className="w-10 h-10 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
            className="w-10 h-10 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 text-gray-400 hover:text-white transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 text-gray-400 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className="w-10 h-10 text-gray-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {showVolumeSlider && (
              <div 
                className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-2 shadow-lg"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
          
          <button className="w-10 h-10 text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}