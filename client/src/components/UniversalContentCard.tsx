import React from 'react';
import { GenreChip, GenreBadge } from './GenreChip';
import { Play, Mic, List } from 'lucide-react';

interface Genre {
  slug: string;
  name: string;
  isPrimary: boolean;
}

interface ContentCardProps {
  item: {
    id: number;
    type: 'mix' | 'episode' | 'playlist';
    title: string;
    artist?: string; // for mixes
    host?: string; // for episodes
    creator?: string; // for playlists
    artwork?: string;
    date: string;
    duration?: string;
    genres?: Genre[];
    trackCount?: number; // for playlists
  };
  onPlay?: () => void;
}

export function UniversalContentCard({ item, onPlay }: ContentCardProps) {
  const primaryGenre = item.genres?.find(g => g.isPrimary);
  const secondaryGenres = item.genres?.filter(g => !g.isPrimary).slice(0, 2) || [];

  const typeConfig = {
    mix: {
      icon: <Play className="w-4 h-4" />,
      label: 'Mix',
      creator: item.artist,
    },
    episode: {
      icon: <Mic className="w-4 h-4" />,
      label: 'Episode',
      creator: item.host,
    },
    playlist: {
      icon: <List className="w-4 h-4" />,
      label: 'Playlist',
      creator: item.creator,
    },
  };

  const config = typeConfig[item.type];

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Artwork */}
      <div className="relative aspect-square bg-gray-100">
        {item.artwork ? (
          <img
            src={item.artwork}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {config.icon}
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <button
            onClick={onPlay}
            className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform shadow-lg"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-[10px] font-bold uppercase bg-white/90 backdrop-blur rounded">
            {config.label}
          </span>
        </div>

        {/* Primary Genre */}
        {primaryGenre && (
          <div className="absolute top-2 right-2">
            <GenreBadge name={primaryGenre.name} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:underline">
          {item.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3">
          {config.creator}
        </p>

        {/* Secondary Genres */}
        {secondaryGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {secondaryGenres.map(genre => (
              <GenreChip
                key={genre.slug}
                slug={genre.slug}
                name={genre.name}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{new Date(item.date).toLocaleDateString()}</span>
          {item.duration && <span>{item.duration}</span>}
          {item.trackCount && <span>{item.trackCount} tracks</span>}
        </div>
      </div>
    </div>
  );
}
