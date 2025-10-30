import { useAudio } from '@/providers/AudioProvider';

interface AudioProgressBarProps {
  /** Whether the progress bar is seekable (true for VOD, false for live stream) */
  seekable?: boolean;
  /** Custom className for styling */
  className?: string;
}

export default function AudioProgressBar({ seekable = false, className = '' }: AudioProgressBarProps) {
  const { state, actions } = useAudio();
  const { currentTime, duration, isLive = false } = state; // Default isLive to false

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle seek (only if seekable)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekable || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    actions.seek(newTime);
  };

  // Auto-detect mode: if isLive flag is set OR seekable is false, show live mode
  const showLiveMode = isLive || !seekable;
  
  // For live streams, show elapsed time only (non-seekable)
  if (showLiveMode) {
    return (
      <div className={`flex items-center gap-3 text-xs font-mono ${className}`} data-testid="progress-bar-live">
        <span className="text-gray-600 dark:text-gray-400">{formatTime(currentTime)}</span>
        <div 
          className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden pointer-events-none cursor-default"
          style={{ pointerEvents: 'none', cursor: 'default' }}
        >
          <div 
            className="h-full bg-navy transition-all duration-300 pointer-events-none"
            style={{ width: `${Math.min(progress, 100)}%`, pointerEvents: 'none' }}
          />
        </div>
        <span className="text-navy text-[10px] uppercase">LIVE</span>
      </div>
    );
  }

  // For VOD/episodes, show seekable progress bar
  return (
    <div className={`flex items-center gap-3 text-xs font-mono ${className}`} data-testid="progress-bar-vod">
      <span className="text-gray-600 dark:text-gray-400">{formatTime(currentTime)}</span>
      <div 
        className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden cursor-pointer group relative"
        onClick={handleSeek}
        data-testid="progress-bar-seekable"
      >
        <div 
          className="h-full bg-navy transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {/* Hover indicator */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-full bg-red-400/30" />
        </div>
      </div>
      <span className="text-gray-600 dark:text-gray-400">{formatTime(duration)}</span>
    </div>
  );
}
