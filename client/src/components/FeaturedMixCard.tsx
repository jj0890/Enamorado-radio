import { Play, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioManager } from '@/lib/audioManager';
import type { FeaturedMix } from '@/lib/audioManager';

interface FeaturedMixCardProps {
  mix: {
    id: number;
    title: string;
    name: string;
    genre: string;
    about: string;
    url: string;
    artUrl?: string;
    metadata?: {
      imageUrl?: string;
      platform?: string;
      artist?: string;
    };
  };
}

export function FeaturedMixCard({ mix }: FeaturedMixCardProps) {
  const { playUserSelectedMix, currentTrack, isPlaying } = useAudioManager();

  const isCurrentlyPlaying = currentTrack?.id === mix.id && isPlaying;

  const handlePlayClick = () => {
    const featuredMix: FeaturedMix = {
      id: mix.id,
      title: mix.title,
      name: mix.name,
      url: mix.url,
      metadata: mix.metadata,
    };
    playUserSelectedMix(featuredMix);
  };

  const getImageUrl = () => {
    if (mix.artUrl) {
      return mix.artUrl;
    }
    if (mix.metadata?.imageUrl) {
      return mix.metadata.imageUrl;
    }
    // Default image based on platform
    if (mix.url.includes('soundcloud.com')) {
      return 'https://via.placeholder.com/300x300/ff5500/ffffff?text=SoundCloud';
    }
    if (mix.url.includes('mixcloud.com')) {
      return 'https://via.placeholder.com/300x300/314359/ffffff?text=Mixcloud';
    }
    if (mix.url.includes('audio.com')) {
      return 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Audio.com';
    }
    return 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Mix';
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-6 transition-all duration-200 ${
      isCurrentlyPlaying 
        ? 'border-navy shadow-lg scale-105' 
        : 'border-gray-200 hover:border-navy-light hover:shadow-md'
    }`}>
      {/* Mix Image */}
      <div className="relative mb-4">
        <img 
          src={getImageUrl()} 
          alt={mix.title}
          className="w-full h-48 object-cover rounded-lg"
        />
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 bg-navy/20 rounded-lg flex items-center justify-center">
            <div className="bg-navy text-white px-3 py-1 rounded-full text-sm font-mono">
              NOW PLAYING
            </div>
          </div>
        )}
      </div>

      {/* Mix Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold font-mono text-gray-900 mb-2 line-clamp-2">
          {mix.title}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-sm text-gray-600">{mix.name}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
            {mix.genre}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-mono line-clamp-3">
          {mix.about}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlayClick}
          className={`flex-1 font-mono ${
            isCurrentlyPlaying
              ? 'bg-navy-dark hover:bg-navy-dark'
              : 'bg-navy hover:bg-navy-dark'
          } text-white`}
          disabled={isCurrentlyPlaying}
        >
          <Play className="w-4 h-4 mr-2" />
          {isCurrentlyPlaying ? 'Playing' : 'Play Mix'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-700 hover:border-navy hover:text-navy"
          onClick={() => window.open(mix.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Platform Badge */}
      {mix.metadata?.platform && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500 font-mono">
            via {mix.metadata.platform}
          </span>
        </div>
      )}
    </div>
  );
}