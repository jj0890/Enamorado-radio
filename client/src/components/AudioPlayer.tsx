import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, SkipBack, SkipForward } from "lucide-react";

interface AudioPlayerProps {
  track?: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    streamUrl: string;
    duration: number;
    genre: string;
  };
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

export function AudioPlayer({ track, isExpanded, onToggleExpanded, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [track]);

  const togglePlay = () => {
    if (!audioRef.current || !track) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <div className={`${className} bg-black/80 backdrop-blur-sm border-t border-white/10 p-4`}>
        <div className="text-center text-white/60">
          <div className="text-sm">No track selected</div>
          <div className="text-xs mt-1">Choose a mix to start listening</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-black/90 backdrop-blur-sm border-t border-white/10 transition-all duration-300 ${isExpanded ? 'p-6' : 'p-4'}`}>
      <audio
        ref={audioRef}
        src={track.streamUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {isExpanded ? (
        // Expanded Player
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/60 text-sm">NOW PLAYING</div>
            <button
              onClick={onToggleExpanded}
              className="text-white/60 hover:text-white transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              {track.artwork ? (
                <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white/60 text-center">
                  <div className="text-xs font-medium">{track.genre.toUpperCase()}</div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-white text-lg font-semibold mb-1">{track.title}</h3>
              <p className="text-white/70 text-sm mb-3">{track.artist}</p>

              <div className="flex items-center gap-4 mb-3">
                <button className="text-white/60 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="bg-white text-black rounded-full p-3 hover:bg-white/90 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button className="text-white/60 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-white/60 text-xs">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white/60 text-xs">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      ) : (
        // Compact Player
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            {track.artwork ? (
              <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-white/60 text-xs font-medium">{track.genre.slice(0, 2).toUpperCase()}</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-semibold truncate">{track.title}</h4>
            <p className="text-white/70 text-xs truncate">{track.artist}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-2 hover:bg-white/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleExpanded}
              className="text-white/60 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}