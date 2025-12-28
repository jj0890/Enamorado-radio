import { AudioShow } from '@/types/audio';
import { cn } from '@/lib/utils';
import { Calendar, Clock, User, Music } from 'lucide-react';
import { Waveform } from './ui/waveform';

interface FeaturedShowsProps {
  shows: AudioShow[];
  onShowSelect: (show: AudioShow) => void;
  currentShowId?: number;
}

const genreColors = {
  'Deep House': 'from-purple-500 to-pink-500',
  'Techno': 'from-blue-500 to-cyan-500',
  'Hip-Hop': 'from-orange-500 to-navy',
  'Jazz': 'from-indigo-500 to-purple-500',
  'Indie': 'from-green-500 to-blue-500',
  'Electronic': 'from-cyan-500 to-blue-500',
};

export function FeaturedShows({ shows, onShowSelect, currentShowId }: FeaturedShowsProps) {
  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {shows.map((show) => (
        <div
          key={show.id}
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:transform hover:scale-105",
            "bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm",
            "border border-white/10 rounded-xl p-4",
            "hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/30",
            currentShowId === show.id && "ring-2 ring-blue-500"
          )}
          onClick={() => onShowSelect(show)}
        >
          <div className={cn(
            "w-full h-32 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden",
            "bg-gradient-to-br",
            genreColors[show.genre as keyof typeof genreColors] || 'from-gray-500 to-gray-600'
          )}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              {show.genre === 'Deep House' || show.genre === 'Techno' || show.genre === 'Electronic' ? (
                <Waveform className="w-16 h-16" barCount={8} color="white" />
              ) : show.genre === 'Hip-Hop' ? (
                <Music className="w-12 h-12 text-white" />
              ) : show.genre === 'Jazz' ? (
                <div className="text-white text-3xl">🎷</div>
              ) : (
                <div className="text-white text-3xl">🎸</div>
              )}
            </div>
            {show.isLive && (
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-navy rounded-full animate-pulse"></div>
                <span className="text-xs text-white/90 font-medium">LIVE</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
              {show.title}
            </h4>
            <div className="flex items-center space-x-2 text-white/70">
              <User className="w-3 h-3" />
              <span className="text-sm">{show.host}</span>
            </div>
            {show.description && (
              <p className="text-white/60 text-xs line-clamp-2">
                {show.description}
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-blue-400 font-medium">
                  {show.genre}
                </span>
                {show.scheduledAt && (
                  <div className="flex items-center space-x-1 text-white/50">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {formatTime(show.scheduledAt)}
                    </span>
                  </div>
                )}
              </div>
              {show.duration && (
                <span className="text-xs text-white/50">
                  {show.duration}min
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
