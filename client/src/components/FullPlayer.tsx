import { AudioTrack, PlaybackState, AudioPlayerControls } from '@/types/audio';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  MoreHorizontal, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  RotateCw,
  VolumeX,
  Volume2,
  Radio,
  List,
  MessageCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Waveform } from './ui/waveform';

interface FullPlayerProps {
  currentTrack: AudioTrack | null;
  playbackState: PlaybackState;
  controls: AudioPlayerControls;
  onClosePlayer: () => void;
  isVisible: boolean;
}

export function FullPlayer({ 
  currentTrack, 
  playbackState, 
  controls, 
  onClosePlayer,
  isVisible 
}: FullPlayerProps) {
  const progressPercentage = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (duration: number, currentTime: number) => {
    if (currentTrack?.isLive) {
      return `-${formatTime(duration - currentTime)}`;
    }
    return formatTime(duration);
  };

  if (!currentTrack) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 transition-transform duration-300",
      "bg-gradient-to-br from-black via-gray-900 to-black",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-white/10 text-white"
            onClick={onClosePlayer}
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-medium text-white">RadioCast</p>
            <p className="text-xs text-white/70">Your Music, Your Way</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-white/10 text-white"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            <div className="w-80 h-80 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Waveform className="w-32 h-32" barCount={12} color="white" />
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl -z-10 scale-110" />
          </div>
        </div>
        
        {/* Track Info */}
        <div className="px-6 pb-4">
          {currentTrack.isLive && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-navy rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-white/80">LIVE</span>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-white mb-1">
            {currentTrack.title}
          </h2>
          <p className="text-white/70 mb-1">
            {currentTrack.artist}
          </p>
          {currentTrack.isLive && (
            <p className="text-white/50 text-sm">
              Journey through electronic music depths
            </p>
          )}
        </div>
        
        {/* Progress */}
        <div className="px-6 pb-4">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span>
              {playbackState.duration > 0 
                ? formatDuration(playbackState.duration, playbackState.currentTime)
                : '--:--'
              }
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="px-6 pb-8">
          <div className="flex items-center justify-center space-x-8 mb-6">
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 p-0 hover:bg-white/10 text-white"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 p-0 hover:bg-white/10 text-white"
              onClick={() => {}} // Previous track functionality
            >
              <SkipBack className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0"
              onClick={playbackState.isPlaying ? controls.pause : controls.play}
              disabled={playbackState.isLoading}
            >
              {playbackState.isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : playbackState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 p-0 hover:bg-white/10 text-white"
              onClick={() => {}} // Next track functionality
            >
              <SkipForward className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="w-12 h-12 p-0 hover:bg-white/10 text-white"
            >
              <RotateCw className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-white/10 text-white/70"
              onClick={playbackState.isMuted ? controls.unmute : controls.mute}
            >
              {playbackState.isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            
            <Slider
              value={[playbackState.isMuted ? 0 : playbackState.volume * 100]}
              onValueChange={(value) => controls.setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="flex-1"
            />
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-white/10 text-white/70"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Bottom Controls */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center space-x-8">
            <Button
              variant="ghost"
              size="lg"
              className="p-3 hover:bg-white/10 text-white/70"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="p-3 hover:bg-white/10 text-white/70"
            >
              <Radio className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="p-3 hover:bg-white/10 text-white/70"
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
