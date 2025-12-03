import { Play, Star } from 'lucide-react';
import { Link } from 'wouter';

interface FeaturedHeroProps {
  item: {
    id: number;
    slug?: string;
    title: string;
    name?: string;
    hostName?: string;
    curatorName?: string;
    genre?: string;
    description?: string;
    about?: string;
    artworkUrl?: string;
    artwork?: string;
    artUrl?: string;
    type: 'mix' | 'episode' | 'playlist';
    metadata?: {
      imageUrl?: string;
    };
  };
}

export default function FeaturedHero({ item }: FeaturedHeroProps) {
  const artwork = item.artworkUrl || item.artwork || item.artUrl || item.metadata?.imageUrl;
  const displayName = item.name || item.hostName || item.curatorName || '';
  const description = item.description || item.about || '';
  const identifier = item.slug ?? item.id;
  
  const getTypeLabel = () => {
    switch (item.type) {
      case 'episode': return 'Featured Episode';
      case 'playlist': return 'Featured Playlist';
      default: return 'Featured Mix';
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'episode': return 'bg-blue-600';
      case 'playlist': return 'bg-purple-600';
      default: return 'bg-navy';
    }
  };

  return (
    <Link 
      href={`/community/${identifier}`}
      className="block group mb-10"
      data-testid="featured-hero"
    >
      <div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-dark to-black min-h-[320px] md:min-h-[400px]"
        style={{
          backgroundImage: artwork ? `linear-gradient(to right, rgba(0,63,135,0.95) 0%, rgba(0,63,135,0.7) 50%, transparent 100%), url(${artwork})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 max-w-2xl">
          {/* Featured Badge */}
          <div className={`inline-flex items-center gap-2 ${getTypeColor()} text-white px-4 py-2 text-sm font-mono font-bold uppercase tracking-wider mb-4 w-fit shadow-lg`}>
            <Star className="w-4 h-4 fill-current" />
            {getTypeLabel()}
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-5xl font-bold text-white font-mono leading-tight mb-3 group-hover:text-cream transition-colors">
            {item.title}
          </h2>
          
          {/* Artist/Host */}
          {displayName && (
            <p className="text-xl md:text-2xl text-white/80 font-mono mb-4">
              {displayName}
            </p>
          )}
          
          {/* Description (truncated) */}
          {description && (
            <p className="text-white/70 font-mono text-sm md:text-base line-clamp-2 mb-6 max-w-xl">
              {description}
            </p>
          )}
          
          {/* Genre + Play CTA */}
          <div className="flex items-center gap-4">
            {item.genre && (
              <span className="text-xs font-mono bg-white/20 text-white px-3 py-1 uppercase tracking-wider">
                {item.genre}
              </span>
            )}
            <div className="flex items-center gap-2 text-white font-mono text-sm group-hover:text-cream transition-colors">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-navy fill-navy ml-0.5" />
              </div>
              <span>Listen Now</span>
            </div>
          </div>
        </div>

        {/* Gradient overlay for non-artwork case */}
        {!artwork && (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-black opacity-90" />
        )}
      </div>
    </Link>
  );
}
