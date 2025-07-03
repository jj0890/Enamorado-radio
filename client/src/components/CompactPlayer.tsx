import { AudioTrack, PlaybackState, AudioPlayerControls } from '@/types/audio';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Music } from 'lucide-react';
import { Button } from './ui/button';

interface CompactPlayerProps {
  currentTrack: AudioTrack | null;
  playbackState: PlaybackState;
  controls: AudioPlayerControls;
  onExpandPlayer: () => void;
  isVisible: boolean;
}

export function CompactPlayer({ 
  currentTrack, 
  playbackState, 
  controls, 
  onExpandPlayer,
  isVisible 
}: CompactPlayerProps) {
  const progressPercentage = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  if (!currentTrack) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300",
      "bg-black/80 backdrop-blur-xl border-t border-white/10",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-white/70 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-white/10 text-white"
            onClick={() => {}} // Previous track functionality
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0"
            onClick={playbackState.isPlaying ? controls.pause : controls.play}
            disabled={playbackState.isLoading}
          >
            {playbackState.isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : playbackState.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-white/10 text-white"
            onClick={() => {}} // Next track functionality
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-white/10 text-white"
            onClick={onExpandPlayer}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
