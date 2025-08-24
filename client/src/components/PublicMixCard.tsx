import { Play, Music, Clock, User, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PublicMixCardProps {
  mix: {
    id: number;
    name: string;
    title: string;
    genre: string;
    about: string;
    url: string;
    artUrl?: string;
    featureOnSite?: boolean;
    submittedAt: string;
  };
}

export default function PublicMixCard({ mix }: PublicMixCardProps) {
  // Use server-fetched artUrl, fallback to placeholder
  const artwork = mix.artUrl || null;
  
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
          <span className="text-xs font-mono text-white bg-red-500 px-2 py-1 rounded uppercase">
            Community Mix
          </span>
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(mix.submittedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Title with Featured Star */}
        <div className="mb-2">
          <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-red-500 transition-colors flex items-center gap-2">
            {mix.title}
            {mix.featureOnSite && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" title="Featured" />
            )}
          </h4>
          <div className="flex items-center text-gray-600 font-mono text-sm mt-1">
            <User className="w-3 h-3 mr-1" />
            {mix.name}
          </div>
        </div>

        {/* Genre Tag */}
        <div className="mb-3">
          <span className="text-xs font-mono text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
            {mix.genre}
          </span>
        </div>

        {/* Listen Button */}
        <Button 
          size="sm" 
          className="bg-red-500 hover:bg-red-600 text-white font-mono w-full text-sm"
          onClick={() => window.open(mix.url, '_blank')}
        >
          <Play className="w-4 h-4 mr-2" />
          Listen on Platform
        </Button>
      </div>
    </div>
  );
}