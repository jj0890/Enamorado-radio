import { Play } from 'lucide-react';
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
      case 'episode': return 'EPISODE';
      case 'playlist': return 'PLAYLIST';
      default: return 'MIX';
    }
  };

  return (
    <Link 
      href={`/community/${identifier}`}
      className="block group mb-10"
      data-testid="featured-hero"
    >
      {/* Clean artwork-first layout with navy frame */}
      <div className="overflow-hidden rounded-lg border-2 border-navy shadow-lg hover:shadow-xl transition-shadow bg-cream">
        <div className="flex flex-col md:flex-row">
          {/* Artwork - prominent, no overlay */}
          <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-[360px] bg-gray-100 flex-shrink-0">
            {artwork ? (
              <img 
                src={artwork} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-navy flex items-center justify-center">
                <Play className="w-16 h-16 text-cream" />
              </div>
            )}
            
            {/* Play button overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-navy fill-navy ml-1" />
              </div>
            </div>
          </div>
          
          {/* Content - clean typography on dark transparent background */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-black/90">
            {/* Small type badge */}
            <span className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
              Featured {getTypeLabel()}
            </span>
            
            {/* Title */}
            <h2 className="text-2xl md:text-4xl font-bold text-white font-mono leading-tight mb-1 group-hover:text-cream transition-colors">
              {item.title}
            </h2>
            
            {/* Artist/Host - smaller, secondary */}
            {displayName && (
              <p className="text-base md:text-lg text-white/60 font-mono mb-3">
                {displayName}
              </p>
            )}
            
            {/* Description (truncated) */}
            {description && (
              <p className="text-white/50 font-mono text-sm line-clamp-2 mb-4 max-w-md">
                {description}
              </p>
            )}
            
            {/* Genre + Play CTA - tighter spacing */}
            <div className="flex items-center gap-4">
              {item.genre && (
                <span className="text-xs font-mono bg-white/10 text-white/70 px-3 py-1.5 uppercase tracking-wider">
                  {item.genre}
                </span>
              )}
              <div className="flex items-center gap-2 text-white font-mono text-sm font-medium group-hover:text-cream transition-colors">
                <Play className="w-4 h-4 fill-current" />
                <span>Listen Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
