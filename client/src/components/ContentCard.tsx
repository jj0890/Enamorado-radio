import { Play, Music } from 'lucide-react';

type ContentType = 'mix' | 'episode';

interface ContentCardProps {
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
  type: ContentType;
  onGenreSelect?: (genre: string) => void;
}

export default function ContentCard({ content, type, onGenreSelect }: ContentCardProps) {
  // Robust artwork fallback chain
  const artwork = content.artwork || content.artUrl || content.artworkUrl || content.metadata?.imageUrl || null;

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

  const displayName = content.artist || content.name || content.hostName || '';

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg group relative ${
      content.isFeatured ? 'border-4 border-red-500' : ''
    }`}>
      {/* Featured Badge */}
      {content.isFeatured && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-3 py-1.5 text-xs font-bold font-mono shadow-lg">
          FEATURED
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
        <div className="flex items-center gap-2 mb-2">
          <span 
            className={`text-[10px] font-mono text-white px-2 py-0.5 rounded uppercase ${
              type === 'mix' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            data-testid={`chip-type-${type}`}
          >
            {type}
          </span>
          {content.genre && onGenreSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenreSelect(content.genre!);
              }}
              data-testid={`tag-genre-${content.genre.toLowerCase()}`}
              className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded uppercase dark:text-gray-300 transition-colors"
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
          onClick={handlePlay}
          className="w-full h-8 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-mono flex items-center justify-center gap-2 transition-colors"
          data-testid={`button-listen-${content.id}`}
        >
          <Play className="w-4 h-4" />
          Listen
        </button>
      </div>
    </div>
  );
}
