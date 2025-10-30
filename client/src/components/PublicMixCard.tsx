import { Play, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PublicMixCardProps {
  mix: {
    id: number;
    title: string;
    artist?: string;    // API now returns artist instead of name
    name?: string;      // Fallback for old format
    genre: string;
    about?: string;
    url: string;
    artwork?: string;   // New standardized field
    artUrl?: string;    // Legacy field
    date?: string;      // API returns date
    submittedAt?: string;
    metadata?: {
      imageUrl?: string;
      title?: string;
      artist?: string;
    };
  };
  onGenreSelect?: (genre: string) => void;
}

export default function PublicMixCard({ mix, onGenreSelect }: PublicMixCardProps) {
  // Robust artwork fallback chain
  const artwork = mix.artwork || mix.artUrl || (mix as any).coverUrl || mix.metadata?.imageUrl || null;

  const handlePlay = () => {
    const url = (mix as any).fileUrl || (mix as any).streamUrl || mix.url;
    if (!url) return;

    // If MP3 on our server -> play in our player
    if (/\.(mp3|m4a|aac|ogg|wav)($|\?)/i.test(url)) {
      // fallback
      const audioEl = new Audio(url);
      audioEl.play().catch(() => window.open(url, "_blank"));
    } else {
      // external platforms -> open their page
      window.open(url, "_blank");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      {/* Artwork - Fixed 16:9 aspect ratio */}
      <div className="relative w-full overflow-hidden aspect-[16/9] bg-gray-200 dark:bg-gray-800">
        {artwork ? (
          <img 
            src={artwork} 
            alt={mix.title}
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
          <span className="text-[10px] font-mono text-white bg-navy px-2 py-0.5 rounded uppercase">
            Mix
          </span>
          {mix.genre && onGenreSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenreSelect(mix.genre);
              }}
              data-testid={`tag-genre-${mix.genre.toLowerCase()}`}
              className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 hover:bg-navy hover:text-white px-2 py-0.5 rounded uppercase dark:text-gray-300 transition-colors"
            >
              {mix.genre}
            </button>
          )}
        </div>
        
        <h3 className="text-sm font-semibold truncate text-gray-900 dark:text-white font-mono">
          {mix.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
          {mix.artist || mix.name}
        </p>
      </div>

      {/* CTA row */}
      <div className="px-2 pb-2">
        <button 
          onClick={handlePlay}
          className="w-full h-8 rounded-md bg-navy hover:bg-navy-dark text-white text-sm font-mono flex items-center justify-center gap-2 transition-colors"
          data-testid={`button-listen-${mix.id}`}
        >
          <Play className="w-4 h-4" />
          Listen
        </button>
      </div>
    </div>
  );
}