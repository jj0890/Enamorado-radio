import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, ChevronDown, ChevronUp, SkipForward } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  audioUrl?: string;
}

// Tracks from the Essentials playlist
const playlistTracks: Track[] = [
  {
    title: "Jus Know (feat. Travis Scott)",
    artist: "PARTYNEXTDOOR",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3"
  },
  {
    title: "Female Energy - Freestyle",
    artist: "WILOUGH",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a"
  },
  {
    title: "Without U",
    artist: "spookyblakc",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
  },
  {
    title: "Days In The East",
    artist: "Drake",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3"
  },
  {
    title: "Persian Rugs",
    artist: "PARTYNEXTDOOR",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3"
  },
  {
    title: "West District",
    artist: "PARTYNEXTDOOR",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a"
  },
  {
    title: "Self Righteous",
    artist: "Bryson Tiller",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
  },
  {
    title: "Talk to Me",
    artist: "Bryson Tiller",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3"
  }
];

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
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = playlistTracks[currentTrackIndex];

  // Shuffle function to randomly select next track
  const getRandomTrack = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlistTracks.length);
    } while (nextIndex === currentTrackIndex && playlistTracks.length > 1);
    return nextIndex;
  };

  useEffect(() => {
    // Simulate listener count changes
    const interval = setInterval(() => {
      setListeners(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load new track when track index changes
    if (audioRef.current && currentTrack.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
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
        isExpanded ? 'w-80' : 'w-72'
      }`}>
        {/* Compact Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-red-500 p-1.5 rounded">
                <Radio className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm font-mono">ER</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{listeners}</span>
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
                className="text-gray-400 hover:text-white transition-colors text-xs"
              >
                ×
              </button>
            </div>
          </div>

          {/* Current Track */}
          <div className="mb-3">
            <h4 className="text-white font-medium text-sm truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
          </div>

          {/* Compact Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
            {/* Progress Bar */}
            <div className="mt-4 mb-4">
              <div className="w-full h-1 bg-gray-700 rounded-full">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Track List Preview */}
            <div className="text-xs text-gray-400">
              <p className="mb-2">From: Essentials Playlist</p>
              <p>{playlistTracks.length} tracks • Shuffling</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        className="hidden"
        src={currentTrack.audioUrl}
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