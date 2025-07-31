import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Wifi } from 'lucide-react';
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
  const [isLive, setIsLive] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'checking' | 'live' | 'offline'>('checking');

  // Get current radio rotation track
  const { data: currentTrack } = useQuery<TrackInfo>({
    queryKey: ['/api/radio/current-track'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Your actual Icecast stream URLs
  const LIVE_STREAM_URL = "http://24.199.109.18:8000/stream";
  const FALLBACK_MP3 = "/attached_assets/how did i do_1753594094475.mp3";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Check if live stream is available using CORS-free proxy
  const checkStreamStatus = async () => {
    try {
      const response = await fetch('/api/stream/status');
      const data = await response.json();
      
      if (data.isLive) {
        setStreamStatus('live');
        console.log(`Live stream active with ${data.streamCount} source(s)`);
      } else {
        setStreamStatus('offline');
        console.log('Live stream offline, using recorded mix');
      }
      return data.isLive;
    } catch (error) {
      console.log('Stream status check failed, assuming offline');
      setStreamStatus('offline');
      return false;
    }
  };

  // Check stream status on mount and periodically
  useEffect(() => {
    checkStreamStatus();
    const interval = setInterval(checkStreamStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      playCurrentSource();
    }
  };

  const playCurrentSource = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const sourceUrl = isLive && streamStatus === 'live' ? LIVE_STREAM_URL : FALLBACK_MP3;
    
    audio.src = sourceUrl;
    audio.play()
      .then(() => {
        setIsPlaying(true);
        console.log(`Playing ${isLive ? 'live stream' : 'recorded mix'}`);
      })
      .catch((error) => {
        console.error('Playback failed:', error);
        // If live stream fails, try fallback
        if (isLive && audio.src !== FALLBACK_MP3) {
          audio.src = FALLBACK_MP3;
          audio.play().then(() => {
            setIsPlaying(true);
            setIsLive(false);
            console.log('Switched to recorded mix due to stream error');
          });
        }
      });
  };

  const switchToLive = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (streamStatus === 'live') {
      setIsLive(true);
      if (isPlaying) {
        audio.src = LIVE_STREAM_URL;
        audio.play().catch((error) => {
          console.error('Live stream failed:', error);
          setIsLive(false);
        });
      }
    }
  };

  const switchToRecorded = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLive(false);
    if (isPlaying) {
      audio.src = FALLBACK_MP3;
      audio.play();
    }
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
    <div className={`bg-gradient-to-br from-red-500 to-red-600 border border-gray-200 rounded-lg p-6 text-white ${className}`}>
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        crossOrigin="anonymous"
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-3 ${streamStatus === 'live' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
          <span className="text-xl font-mono font-bold tracking-wider">
            ENAMORADO RADIO
          </span>
          <div className={`w-3 h-3 rounded-full ml-3 ${streamStatus === 'live' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
        </div>
        <p className="text-sm font-mono opacity-90 mb-4">
          Digital space dedicated to the things we are enamored with
        </p>
      </div>

      {/* Stream Status & Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <button
            onClick={switchToRecorded}
            className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
              !isLive 
                ? 'bg-white text-red-500 font-bold' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            RECORDED
          </button>
          <button
            onClick={switchToLive}
            disabled={streamStatus !== 'live'}
            className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
              isLive && streamStatus === 'live'
                ? 'bg-white text-red-500 font-bold' 
                : streamStatus === 'live'
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {streamStatus === 'live' ? 'LIVE' : 'OFFLINE'}
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="text-sm font-mono opacity-75 mb-1">
            {isLive ? 'LIVE STREAM' : 'NOW PLAYING'}:
          </div>
          <div className="text-lg font-mono font-bold">
            {isLive ? 'Live DJ Set' : (currentTrack?.displayTitle || "How Did I Do")}
          </div>
          {!isLive && currentTrack?.artist && (
            <div className="text-sm font-mono opacity-75">
              by {currentTrack.artist}
            </div>
          )}
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <button
          onClick={togglePlay}
          className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleMute} 
          className="text-white/80 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-sm font-mono text-white/75 min-w-[3ch]">
          {Math.round((isMuted ? 0 : volume) * 100)}
        </span>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}