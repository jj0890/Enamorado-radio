import { AudioStation } from '@/types/audio';
import { cn } from '@/lib/utils';
import { Music, Headphones } from 'lucide-react';

interface StationGridProps {
  stations: AudioStation[];
  onStationSelect: (station: AudioStation) => void;
  currentStationId?: number;
}

const genreColors = {
  Electronic: 'from-cyan-500 to-blue-500',
  'Hip-Hop': 'from-purple-500 to-pink-500',
  Country: 'from-orange-500 to-yellow-500',
  Jazz: 'from-indigo-500 to-purple-500',
  Chill: 'from-teal-500 to-green-500',
  Rock: 'from-navy to-blue-500',
};

const genreLabels = {
  Electronic: 'ELECTRONIC',
  'Hip-Hop': 'HIP-HOP',
  Country: 'COUNTRY',
  Jazz: 'JAZZ',
  Chill: 'CHILL',
  Rock: 'ROCK',
};

export function StationGrid({ stations, onStationSelect, currentStationId }: StationGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stations.map((station) => (
        <div
          key={station.id}
          className={cn(
            "group cursor-pointer transition-all duration-300 hover:transform hover:scale-105",
            "bg-gradient-to-br border border-white/10 rounded-xl p-4",
            "hover:shadow-lg hover:shadow-blue-500/20",
            currentStationId === station.id && "ring-2 ring-blue-500"
          )}
          onClick={() => onStationSelect(station)}
        >
          <div className={cn(
            "w-full h-32 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden",
            "bg-gradient-to-br",
            genreColors[station.genre as keyof typeof genreColors] || 'from-gray-500 to-gray-600'
          )}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center">
              <div className="text-white font-bold text-xl mb-1">
                {station.id === 1 ? '1' : 
                 station.genre === 'Hip-Hop' ? 'HITS' :
                 genreLabels[station.genre as keyof typeof genreLabels] || station.genre}
              </div>
              <div className="text-white/80 text-xs uppercase">
                {station.genre === 'Hip-Hop' ? 'HIP-HOP' : station.genre}
              </div>
            </div>
            {station.isLive && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-navy rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              {station.name}
            </h4>
            <p className="text-white/70 text-sm line-clamp-2">
              {station.description}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                station.isLive ? "bg-navy/20 text-navy-light" : "bg-gray-500/20 text-gray-400"
              )}>
                {station.isLive ? 'LIVE' : 'OFFLINE'}
              </span>
              <div className="flex items-center space-x-1">
                <Headphones className="w-3 h-3 text-white/50" />
                <span className="text-xs text-white/50">
                  {Math.floor(Math.random() * 1000) + 100}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
