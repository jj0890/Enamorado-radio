import { Play, Music, Star } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { ContentItem } from '@shared/schema';
import { Link } from 'wouter';

type Platform = 'soundcloud' | 'spotify' | 'mixcloud' | 'mp3' | 'other';

interface ContentCardProps {
  content: ContentItem;
  onGenreSelect?: (genre: string) => void;
  showFeaturedBadge?: boolean; // Only show featured badge when explicitly enabled (e.g., in Staff Picks section)
}

// Legacy interface support for backward compatibility
interface LegacyContentCardProps {
  content: {
    id: number;
    title: string;
    artist?: string;
    name?: string;
    hostName?: string;
    genre?: string;
    url?: string;
    artwork?: string;
    artUrl?: string;
    artworkUrl?: string;
    date?: string;
    submittedAt?: string;
    airDate?: string;
    isFeatured?: boolean;
    metadata?: {
      imageUrl?: string;
      title?: string;
      artist?: string;
    };
  };
  type: 'mix' | 'episode';
  onGenreSelect?: (genre: string) => void;
}

export default function ContentCard(props: ContentCardProps | LegacyContentCardProps) {
  const { content, onGenreSelect } = props;
  const showFeaturedBadge = (props as ContentCardProps).showFeaturedBadge ?? false;
  
  // Support both unified ContentItem and legacy props
  // Legacy: { content: {...}, type: 'mix' } (type as separate prop)
  // New: { content: ContentItem } (type inside content)
  const type = 
    (props as LegacyContentCardProps).type || // Legacy prop
    ('type' in content ? content.type : 'mix'); // ContentItem type field
  
  // Robust artwork fallback chain - ensure truly valid URLs only
  const rawArtwork = content.artworkUrl || (content as any).artwork || (content as any).artUrl || (content as any).metadata?.imageUrl;
  const artwork = rawArtwork && rawArtwork.trim() !== '' ? rawArtwork : null;

  // Detect platform from URL (check fileUrl/streamUrl first for MP3s)
  const detectPlatform = (): Platform => {
    const url = (content as any).fileUrl || (content as any).streamUrl || content.url;
    if (!url) return 'other';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('mixcloud.com')) return 'mixcloud';
    if (/\.(mp3|m4a|aac|ogg|wav)($|\?)/i.test(url)) return 'mp3';
    return 'other';
  };

  const platform = detectPlatform();

  const handlePlay = () => {
    if (type === 'episode') {
      window.location.href = `/episode/${content.id}`;
      return;
    }

    const url = (content as any).fileUrl || (content as any).streamUrl || content.url;
    if (!url) return;

    // If MP3 on our server -> play in our player
    if (/\.(mp3|m4a|aac|ogg|wav)($|\?)/i.test(url)) {
      const audioEl = new Audio(url);
      audioEl.play().catch(() => window.open(url, "_blank"));
    } else {
      // external platforms -> open their page
      window.open(url, "_blank");
    }
  };

  // Get display name based on content type
  const displayName = 
    'name' in content ? content.name :
    'hostName' in content ? content.hostName :
    'authorName' in content ? content.authorName :
    'artistName' in content ? content.artistName :
    'curatorName' in content ? content.curatorName :
    (content as any).artist || '';

  // Determine detail page URL (prefer slug over ID for canonical URLs)
  const getDetailUrl = () => {
    const identifier = ('slug' in content && content.slug) ? content.slug : content.id;
    
    // Use unified /community/:id route for all content types (including episodes)
    return `/community/${identifier}`;
  };
  
  const detailUrl = getDetailUrl();

  // Softer styling - all cards get the same base, featured gets subtle glow on hover
  const baseCardClasses = "block bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 group relative cursor-pointer border border-gray-200 dark:border-gray-800";
  const hoverClasses = content.isFeatured && showFeaturedBadge
    ? "shadow-sm hover:shadow-[0_8px_30px_rgba(0,63,135,0.12)] hover:-translate-y-1 hover:border-navy/30" 
    : "shadow-sm hover:shadow-lg hover:-translate-y-0.5";

  return (
    <Link 
      href={detailUrl}
      className={`${baseCardClasses} ${hoverClasses}`}
      data-testid={`card-${type}-${content.id}`}
    >
      {/* Staff Pick Badge - only shown when explicitly enabled */}
      {content.isFeatured && showFeaturedBadge && (
        <div className="absolute top-3 left-3 z-10 bg-navy/90 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-medium font-mono rounded-md flex items-center gap-1.5 shadow-md">
          <Star className="w-3 h-3 fill-current" />
          Staff Pick
        </div>
      )}

      {/* Artwork - Square aspect ratio with separate hover zoom */}
      <div className="relative w-full overflow-hidden aspect-square bg-gray-200 dark:bg-gray-800">
        {artwork ? (
          <img 
            src={artwork} 
            alt={content.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700">
            <Music className="w-20 h-20 text-gray-400" />
          </div>
        )}
        
        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-navy fill-navy ml-1" />
          </div>
        </div>
      </div>

      {/* Text block - More generous spacing */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span 
            className={`text-xs font-mono text-white px-3 py-1 uppercase font-bold tracking-wider ${
              type === 'mix' ? 'bg-navy' : type === 'episode' ? 'bg-blue-600' : 'bg-purple-600'
            }`}
            data-testid={`chip-type-${type}`}
          >
            {type}
          </span>
          {platform !== 'other' && (
            <span 
              className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-2 py-1 uppercase flex items-center gap-1.5 tracking-wide"
              data-testid={`chip-platform-${platform}`}
              title={platform}
            >
              {platform === 'soundcloud' && <SiSoundcloud className="w-3.5 h-3.5" />}
              {platform === 'spotify' && <SiSpotify className="w-3.5 h-3.5" />}
              {platform === 'mp3' && '♫'}
              {platform === 'mixcloud' && 'MC'}
            </span>
          )}
          {content.genre && onGenreSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenreSelect(content.genre!);
              }}
              data-testid={`tag-genre-${content.genre.toLowerCase()}`}
              className="text-xs font-mono bg-gray-100 dark:bg-gray-800 hover:bg-navy hover:text-white dark:hover:bg-navy px-2 py-1 uppercase tracking-wide text-gray-700 dark:text-gray-300 transition-all"
            >
              {content.genre}
            </button>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono leading-snug mb-2 line-clamp-2">
          {content.title}
        </h3>
        <p className="text-base text-gray-600 dark:text-gray-400 font-mono">
          {displayName}
        </p>
      </div>
    </Link>
  );
}
