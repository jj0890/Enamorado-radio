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
    <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 group focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/50 hover:transform hover:scale-[1.02]">
      {/* Hairline border */}
      <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(12,12,13,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_0_2px_rgba(239,68,68,0.4),0_8px_20px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_0_0_2px_rgba(239,68,68,0.6),0_8px_20px_rgba(0,0,0,0.6)] transition-shadow"></div>
      
      {/* Mobile: Horizontal layout, Desktop: Vertical */}
      <div className="flex sm:block">
        {/* Artwork - Small on mobile, full width on desktop */}
        <div className="w-20 h-20 sm:w-full sm:aspect-square bg-gray-200 dark:bg-gray-800 relative flex-shrink-0">
          {artwork ? (
            <img 
              src={artwork} 
              alt={mix.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700">
              <Music className="w-6 h-6 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 group-hover:text-red-400 transition-colors" />
            </div>
          )}
        </div>

        <div className="flex-1 p-2 sm:p-4 lg:p-5 min-w-0">
          {/* Genre and Date - Hide date on mobile */}
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2 lg:mb-3">
            <span className="text-[10px] sm:text-xs lg:text-sm font-mono text-white bg-red-500 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full uppercase tracking-wide">
              Mix
            </span>
            {mix.genre && (
              onGenreSelect ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenreSelect(mix.genre);
                  }}
                  data-testid={`tag-genre-${mix.genre.toLowerCase()}`}
                  className="text-[10px] sm:text-xs lg:text-sm font-mono bg-gray-100 dark:bg-gray-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full uppercase dark:text-gray-300 transition-all cursor-pointer tracking-wide"
                >
                  {mix.genre}
                </button>
              ) : (
                <span className="text-[10px] sm:text-xs lg:text-sm font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full uppercase dark:text-gray-300 tracking-wide">
                  {mix.genre}
                </span>
              )
            )}
          </div>

          {/* Title - More compact on mobile */}
          <div className="mb-1 sm:mb-2 lg:mb-3">
            <h4 className="text-xs sm:text-base lg:text-lg font-bold font-mono text-gray-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors line-clamp-1 sm:line-clamp-2 lg:line-clamp-2">
              {mix.title}
            </h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400 font-mono text-[10px] sm:text-sm lg:text-base mt-0.5 lg:mt-1 line-clamp-1">
              {mix.artist || mix.name}
            </div>
          </div>

          {/* Listen Button - Icon only on mobile */}
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-mono w-full text-xs sm:text-sm lg:text-base h-7 sm:h-9 lg:h-10 shadow-sm hover:shadow-md transition-all"
            onClick={handlePlay}
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 sm:mr-2" />
            <span className="hidden sm:inline">Listen</span>
          </Button>
        </div>
      </div>
    </div>
  );
}