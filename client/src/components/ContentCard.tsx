import { Play, Music } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { ContentItem } from '@shared/schema';
import { Link } from 'wouter';

type Platform = 'soundcloud' | 'spotify' | 'mixcloud' | 'mp3' | 'other';

interface ContentCardProps {
  content: ContentItem;
  onGenreSelect?: (genre: string) => void;
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
  
  // Support both unified ContentItem and legacy props
  // Legacy: { content: {...}, type: 'mix' } (type as separate prop)
  // New: { content: ContentItem } (type inside content)
  const type = 
    (props as LegacyContentCardProps).type || // Legacy prop
    ('type' in content ? content.type : 'mix'); // ContentItem type field
  
  // Robust artwork fallback chain
  const artwork = content.artworkUrl || (content as any).artwork || (content as any).artUrl || (content as any).metadata?.imageUrl || null;

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

  return (
    <Link href={detailUrl}>
      <a className="block">
        <div className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative cursor-pointer ${
          content.isFeatured ? 'border-2 border-navy' : 'border border-gray-200 dark:border-gray-800'
        }`} data-testid={`card-${type}-${content.id}`}>
      {/* Featured Badge */}
      {content.isFeatured && (
        <div className="absolute top-3 left-3 z-10 bg-navy text-white px-3 py-1.5 text-xs font-bold font-mono shadow-lg">
          Featured
        </div>
      )}

      {/* Artwork - Fixed 16:9 aspect ratio */}
      <div className="relative w-full overflow-hidden aspect-[16/9] bg-gray-200 dark:bg-gray-800">
        {artwork ? (
          <img 
            src={artwork} 
            alt={content.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700">
            <Music className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Text block */}
      <div className="pt-2 px-2 pb-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span 
            className={`text-[10px] font-mono text-white px-2 py-0.5 rounded uppercase ${
              type === 'mix' ? 'bg-navy' : 'bg-blue-500'
            }`}
            data-testid={`chip-type-${type}`}
          >
            {type}
          </span>
          {platform !== 'other' && (
            <span 
              className="text-[10px] font-mono bg-gray-800 dark:bg-gray-700 text-white px-2 py-0.5 rounded uppercase flex items-center gap-1"
              data-testid={`chip-platform-${platform}`}
              title={platform}
            >
              {platform === 'soundcloud' && <SiSoundcloud className="w-3 h-3" />}
              {platform === 'spotify' && <SiSpotify className="w-3 h-3" />}
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
              className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 hover:bg-navy hover:text-white px-2 py-0.5 rounded uppercase dark:text-gray-300 transition-colors"
            >
              {content.genre}
            </button>
          )}
        </div>
        
        <h3 className="text-sm font-semibold truncate text-gray-900 dark:text-white font-mono">
          {content.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
          {displayName}
        </p>
      </div>

      {/* CTA row */}
      <div className="px-2 pb-2">
        <button 
          onClick={(e) => {
            e.preventDefault();
            handlePlay();
          }}
          className="w-full h-8 rounded-md bg-navy hover:bg-navy-dark text-white text-sm font-mono flex items-center justify-center gap-2 transition-colors"
          data-testid={`button-listen-${content.id}`}
        >
          <Play className="w-4 h-4" />
          Listen
        </button>
      </div>
        </div>
      </a>
    </Link>
  );
}
