import { Play, Music, Clock, User, Star } from 'lucide-react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/strings";

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
}

export default function PublicMixCard({ mix }: PublicMixCardProps) {
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
    <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 group focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/50">
      {/* Hairline border */}
      <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(12,12,13,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_0_1px_rgba(209,77,14,0.3),0_6px_14px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_0_0_1px_rgba(239,68,68,0.5),0_6px_14px_rgba(0,0,0,0.5)] transition-shadow"></div>
      
      {/* Mobile: Horizontal layout, Desktop: Vertical */}
      <div className="flex sm:block">
        {/* Artwork - Small on mobile, full width on desktop */}
        <div className="w-20 h-20 sm:w-full sm:aspect-square bg-gray-200 dark:bg-gray-800 relative flex-shrink-0">
          {artwork ? (
            <img 
              src={artwork} 
              alt={mix.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700">
              <Music className="w-6 h-6 sm:w-12 sm:h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 p-2 sm:p-4 min-w-0">
          {/* Genre and Date - Hide date on mobile */}
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-mono text-white bg-red-500 px-1.5 py-0.5 rounded-full uppercase">
              Mix
            </span>
            {mix.genre && (
              <span className="text-[10px] sm:text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full uppercase dark:text-gray-300">
                {mix.genre}
              </span>
            )}
          </div>

          {/* Title - More compact on mobile */}
          <div className="mb-1 sm:mb-2">
            <h4 className="text-xs sm:text-base font-bold font-mono text-gray-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors line-clamp-1 sm:line-clamp-2">
              {mix.title}
            </h4>
            <div className="flex items-center text-gray-600 dark:text-gray-400 font-mono text-[10px] sm:text-sm mt-0.5 line-clamp-1">
              {mix.artist || mix.name}
            </div>
          </div>

          {/* Listen Button - Icon only on mobile */}
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-mono w-full text-xs h-7 sm:h-9"
            onClick={handlePlay}
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Listen</span>
          </Button>
        </div>
      </div>
    </div>
  );
}