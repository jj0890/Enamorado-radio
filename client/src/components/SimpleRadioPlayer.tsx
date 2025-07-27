import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

interface SimpleRadioPlayerProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function SimpleRadioPlayer({ isActive, onToggle }: SimpleRadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set the audio source to your "how did i do" mix
  const audioUrl = '/attached_assets/how%20did%20i%20do_1753594094475.mp3';

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(Math.floor(audio.currentTime));
    const updateDuration = () => setDuration(Math.floor(audio.duration));
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      console.log('Loading track: how did i do');
    };

    const handleError = (e: any) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
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
  }, []);

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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
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
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-80">
        {/* Header */}
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
                  <span>Live</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Current Track */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
              <Radio className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">how did i do</h4>
              <p className="text-gray-400 text-xs truncate">Jarrad</p>
              <p className="text-gray-500 text-xs truncate">Footwork/Juke</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="w-full bg-gray-700 rounded-full h-1 cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="bg-red-500 h-1 rounded-full transition-all duration-300"
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
                className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
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
        </div>
      </div>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        className="hidden"
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