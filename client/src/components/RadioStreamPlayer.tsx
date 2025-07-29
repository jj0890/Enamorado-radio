import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TrackInfo {
  filename: string;
  displayTitle: string;
  artist?: string;
  trackName?: string;
  imageUrl?: string;
}

interface RadioStreamPlayerProps {
  className?: string;
}

export default function RadioStreamPlayer({ className = "" }: RadioStreamPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Get current radio rotation track
  const { data: currentTrack } = useQuery<TrackInfo>({
    queryKey: ['/api/radio/current-track'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Mock radio stream (replace with actual stream URL)
  const radioStreamUrl = "https://streams.example.com/enamorado-radio";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // For now, play the "How Did I Do" mix as radio stream
      audio.src = `/attached_assets/how did i do_1753594094475.mp3`;
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Enhanced Radio Stream Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
          <span className="text-xl font-mono text-red-500 font-bold tracking-wider">
            ENAMORADO RADIO
          </span>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse ml-3"></div>
        </div>
        <p className="text-sm font-mono text-gray-600 mb-4">
          Digital space dedicated to the things we are enamored with - Continuous Mix
        </p>
        
        {/* Now Playing & Next Show Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-mono text-gray-500 mb-1">NOW PLAYING:</div>
            <div className="font-mono font-medium text-gray-900 text-sm">
              {currentTrack?.displayTitle || "How Did I Do"}
            </div>
            {currentTrack?.artist && (
              <div className="text-xs font-mono text-gray-600">
                by {currentTrack.artist}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-mono text-gray-500 mb-1">NEXT LIVE SHOW:</div>
            <div className="font-mono font-medium text-gray-900 text-sm">
              Thursday 7PM
            </div>
            <div className="text-xs font-mono text-gray-600">
              Resident Mix
            </div>
          </div>
        </div>
      </div>

      {/* Now Playing Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            {currentTrack?.imageUrl ? (
              <img 
                src={currentTrack.imageUrl} 
                alt="Track artwork"
                className="w-12 h-12 object-cover rounded-lg"
              />
            ) : (
              <Radio className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-mono text-gray-600 mb-1">NOW PLAYING:</div>
            <div className="text-base font-mono font-medium text-gray-900 truncate">
              {currentTrack?.displayTitle || "How Did I Do"}
            </div>
            {currentTrack?.artist && (
              <div className="text-sm font-mono text-gray-600 truncate">
                by {currentTrack.artist}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex items-center space-x-2 flex-1">
          <button onClick={toggleMute} className="text-gray-600 hover:text-red-500 transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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

        <div className="text-xs font-mono text-gray-500">
          LIVE
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}