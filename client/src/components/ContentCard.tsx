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

  return (
    <Link 
      href={detailUrl}
      className={`block bg-white dark:bg-gray-900 rounded-lg overflow-hidden transition-shadow duration-300 group relative cursor-pointer ${
        content.isFeatured 
          ? 'border-2 border-[#FF0000] shadow-[0_2px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]' 
          : 'border border-zinc-200 dark:border-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]'
      }`}
      data-testid={`card-${type}-${content.id}`}
    >
      {/* Subtle inset ring for "printed" feel */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/5"></div>

      {/* Featured Badge */}
      {content.isFeatured && (
        <div className="absolute top-3 left-3 z-10 bg-[#FF0000] text-white px-3 py-1.5 text-xs font-bold font-mono shadow-md rounded">
          Featured
        </div>
      )}

      {/* Artwork - Square aspect ratio with separate hover zoom */}
      <div className="relative w-full overflow-hidden aspect-square bg-gray-200 dark:bg-gray-800 rounded-t-lg">
        {artwork ? (
          <img 
            src={artwork} 
            alt={content.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Text block - Compact to emphasize artwork */}
      <div className="pt-4 px-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span 
            className={`text-[10px] font-mono text-white px-2 py-0.5 rounded uppercase font-semibold tracking-wide ${
              type === 'mix' ? 'bg-navy' : type === 'episode' ? 'bg-blue-500' : 'bg-purple-600'
            }`}
            data-testid={`chip-type-${type}`}
          >
            {type}
          </span>
          {platform !== 'other' && (
            <span 
              className="text-[10px] font-mono bg-zinc-100 dark:bg-gray-700 text-zinc-700 dark:text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-1 tracking-wide"
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
              className="text-[10px] font-mono bg-zinc-100 dark:bg-gray-800 hover:bg-zinc-800 hover:text-white dark:hover:bg-zinc-200 dark:hover:text-zinc-900 px-2 py-0.5 rounded uppercase tracking-wide text-zinc-700 dark:text-gray-300 transition-colors"
            >
              {content.genre}
            </button>
          )}
        </div>
        
        <h3 className="text-base font-bold text-gray-900 dark:text-white font-mono leading-tight mb-1">
          {content.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {displayName}
        </p>
      </div>

      {/* CTA row */}
      <div className="px-4 pb-4">
        <button 
          onClick={(e) => {
            e.preventDefault();
            handlePlay();
          }}
          className="w-full h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-mono font-medium flex items-center justify-center gap-2 transition-all active:translate-y-[1px]"
          data-testid={`button-listen-${content.id}`}
        >
          <Play className="w-4 h-4" />
          Listen
        </button>
      </div>
    </Link>
  );
}
