import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, ChevronDown, ChevronUp, SkipForward, ExternalLink, Heart } from 'lucide-react';

// SoundCloud track interface matching the actual playlist
interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
    avatar_url?: string;
  };
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
  duration: number;
  waveform_url?: string;
  created_at: string;
}

// Real tracks from your Essentials playlist
const essentialsPlaylist: SoundCloudTrack[] = [
  {
    id: 1,
    title: "Jus Know (feat. Travis Scott)",
    user: { username: "PARTYNEXTDOOR", avatar_url: "https://via.placeholder.com/50x50/ff0000/ffffff?text=PND" },
    artwork_url: "https://via.placeholder.com/500x500/1a1a1a/ff0000?text=PARTYNEXTDOOR",
    stream_url: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
    permalink_url: "https://soundcloud.com/partyomo/partnextdoor-juss-know",
    duration: 180000,
    waveform_url: "",
    created_at: "2024-01-01"
  },
  {
    id: 2,
    title: "Female Energy - Freestyle",
    user: { username: "WILOUGH", avatar_url: "https://via.placeholder.com/50x50/ff0000/ffffff?text=W" },
    artwork_url: "https://via.placeholder.com/500x500/1a1a1a/ff0000?text=WILOUGH",
    stream_url: "https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a",
    permalink_url: "https://soundcloud.com/dhatu/female-energy-freestyle-prod-azzi-willow",
    duration: 200000,
    waveform_url: "",
    created_at: "2024-01-02"
  },
  {
    id: 3,
    title: "Without U (Prod. Greaf)",
    user: { username: "spookyblakc", avatar_url: "https://via.placeholder.com/50x50/ff0000/ffffff?text=SB" },
    artwork_url: "https://via.placeholder.com/500x500/1a1a1a/ff0000?text=spookyblakc",
    stream_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    permalink_url: "https://soundcloud.com/spookycorbin/without-u-prod-greaf",
    duration: 190000,
    waveform_url: "",
    created_at: "2024-01-03"
  },
  {
    id: 4,
    title: "Days In The East",
    user: { username: "Drake", avatar_url: "https://via.placeholder.com/50x50/ff0000/ffffff?text=D" },
    artwork_url: "https://via.placeholder.com/500x500/1a1a1a/ff0000?text=DRAKE",
    stream_url: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3",
    permalink_url: "https://soundcloud.com/octobersveryown/drake-days-in-the-east",
    duration: 240000,
    waveform_url: "",
    created_at: "2024-01-04"
  },
  {
    id: 5,
    title: "Persian Rugs",
    user: { username: "PARTYNEXTDOOR", avatar_url: "https://via.placeholder.com/50x50/ff0000/ffffff?text=PND" },
    artwork_url: "https://via.placeholder.com/500x500/1a1a1a/ff0000?text=PARTYNEXTDOOR",
    stream_url: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
    permalink_url: "https://soundcloud.com/partyomo/partynextdoor-persian-rugs",
    duration: 220000,
    waveform_url: "",
    created_at: "2024-01-05"
  }
];

// Waveform visualization component
function WaveformVisualization({ waveform, progress, onClick }: { 
  waveform: number[], 
  progress: number, 
  onClick: (position: number) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    // Generate mock waveform if none provided
    const data = waveform.length > 0 ? waveform : Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
    
    const barWidth = width / data.length;
    const progressX = (progress / 100) * width;
    
    data.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;
      
      // Color based on progress
      ctx.fillStyle = x < progressX ? '#ef4444' : '#374151';
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveform, progress]);
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = (x / canvas.width) * 100;
    onClick(position);
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-15 cursor-pointer rounded"
      onClick={handleClick}
    />
  );
}

interface PersistentRadioPlayerProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function PersistentRadioPlayer({ isActive, onToggle }: PersistentRadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listeners, setListeners] = useState(24);
  const [isLiked, setIsLiked] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = essentialsPlaylist[currentTrackIndex];

  // Shuffle function to randomly select next track
  const getRandomTrack = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * essentialsPlaylist.length);
    } while (nextIndex === currentTrackIndex && essentialsPlaylist.length > 1);
    return nextIndex;
  };

  useEffect(() => {
    // Generate mock waveform for current track
    setWaveform(Array.from({ length: 100 }, () => Math.random() * 1));
  }, [currentTrackIndex]);

  useEffect(() => {
    // Simulate listener count changes
    const interval = setInterval(() => {
      setListeners(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load new track when track index changes
    if (audioRef.current && currentTrack?.stream_url) {
      audioRef.current.src = currentTrack.stream_url;
      audioRef.current.load();
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(Math.floor(audio.currentTime));
    const updateDuration = () => setDuration(Math.floor(audio.duration));
    const handleEnded = () => {
      // Auto-shuffle to next random track
      setCurrentTrackIndex(getRandomTrack());
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!isActive) {
        onToggle(); // Activate the radio if not already active
      }
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
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
    setCurrentTrackIndex(getRandomTrack());
    setCurrentTime(0);
  };

  const handleWaveformClick = (position: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = (position / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isActive) {
    // Minimized state when radio is off
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 border border-gray-700"
        >
          <Radio className="w-5 h-5 text-red-500" />
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
        {/* Compact Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-1.5 rounded">
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
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Current Track with Artwork */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={currentTrack?.artwork_url || 'https://via.placeholder.com/48x48/1a1a1a/ff0000?text=ER'}
                alt="Track artwork"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{currentTrack?.title}</h4>
              <p className="text-gray-400 text-xs truncate">{currentTrack?.user.username}</p>
            </div>
          </div>

          {/* Waveform Visualization */}
          {isExpanded && (
            <div className="mb-4">
              <WaveformVisualization 
                waveform={waveform} 
                progress={progressPercentage}
                onClick={handleWaveformClick}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
              
              <button
                onClick={nextTrack}
                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded transition-colors"
              >
                <SkipForward className="w-3 h-3 text-white" />
              </button>

              {isExpanded && (
                <>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-1.5 rounded transition-colors ${
                      isLiked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Heart className="w-3 h-3" fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  
                  <button
                    onClick={() => window.open(currentTrack?.permalink_url, '_blank')}
                    className="text-gray-400 hover:text-white transition-colors p-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </>
              )}
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
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-700">
            <div className="mt-4 text-xs text-gray-400">
              <p className="mb-2">From: Essentials by {currentTrack?.user.username}</p>
              <p>{essentialsPlaylist.length} tracks • Auto-shuffling</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        className="hidden"
        src={currentTrack?.stream_url}
        preload="metadata"
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