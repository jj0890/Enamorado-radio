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
  const artwork = mix.artUrl || (mix as any).coverUrl || mix.metadata?.imageUrl || null;

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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group shadow-sm hover:shadow-md">
      {/* Artwork */}
      <div className="aspect-square bg-gray-200 overflow-hidden relative">
        {artwork ? (
          <img 
            src={artwork} 
            alt={mix.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Music className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Genre and Date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-white bg-red-500 px-2 py-1 rounded uppercase">
              Community Mix
            </span>
            {mix.genre && (
              <Link 
                href={`/genre/${mix.genre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-mono text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded uppercase transition-colors"
              >
                {mix.genre}
              </Link>
            )}
          </div>
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(mix.date || mix.submittedAt || '').toLocaleDateString()}
          </div>
        </div>

        {/* Title (no admin badges on public pages) */}
        <div className="mb-2">
          <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-red-500 transition-colors">
            {mix.title}
          </h4>
          <div className="flex items-center text-gray-600 font-mono text-sm mt-1">
            <User className="w-3 h-3 mr-1" />
            {mix.artist || mix.name}
          </div>
        </div>


        {/* Listen Button */}
        <Button 
          size="sm" 
          className="bg-red-500 hover:bg-red-600 text-white font-mono w-full text-sm"
          onClick={handlePlay}
        >
          <Play className="w-4 h-4 mr-2" />
          Listen
        </Button>
      </div>
    </div>
  );
}