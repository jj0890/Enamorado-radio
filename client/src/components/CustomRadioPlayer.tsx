import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, SkipForward } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  audioUrl?: string;
}

const sampleTracks: Track[] = [
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
  }
];

interface CustomRadioPlayerProps {
  onPlayingStateChange?: (isPlaying: boolean) => void;
}

export default function CustomRadioPlayer({ onPlayingStateChange }: CustomRadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes placeholder
  const [listeners, setListeners] = useState(24);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = sampleTracks[currentTrackIndex];

  useEffect(() => {
    // Simulate listener count changes
    const interval = setInterval(() => {
      setListeners(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 10000);

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
      setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % sampleTracks.length);
      setCurrentTime(0);
      // Keep playing state since we're auto-advancing to next track
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newPlayingState = !isPlaying;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        // Handle autoplay restrictions
      });
      setIsPlaying(true);
    }
    
    // Notify parent component about playing state change
    onPlayingStateChange?.(newPlayingState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercentage = clickX / rect.width;
    const newTime = clickPercentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(Math.floor(newTime));
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % sampleTracks.length);
    setCurrentTime(0);
    // Keep current playing state when manually advancing tracks
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-900 rounded-lg p-6 text-white shadow-2xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-lg">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg font-mono">Enamorado Radio</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Stream</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">{listeners} listeners</div>
          <div className="text-xs text-gray-500">24/7</div>
        </div>
      </div>

      {/* Current Track Info */}
      <div className="mb-6">
        <h4 className="text-xl font-bold mb-1">{currentTrack.title}</h4>
        <p className="text-gray-400">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative">
          <div 
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-red-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="bg-red-500 hover:bg-red-600 p-3 rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </button>
          
          <button
            onClick={nextTrack}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors"
          >
            <SkipForward className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <Volume2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 w-8">{volume}%</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">Track {currentTrackIndex + 1} of {sampleTracks.length}</div>
        </div>
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
            width: 16px;
            height: 16px;
            background: #ef4444;
            border-radius: 50%;
            cursor: pointer;
          }
          
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
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