import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Music, Headphones, ArrowRight, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Genre {
  name: string;
  slug: string;
  mixCount: number;
  episodeCount: number;
  total: number;
}

// Genre color mapping for visual distinction
const genreColors = {
  electronic: "from-blue-500 to-cyan-500",
  jungle: "from-green-500 to-emerald-500", 
  ambient: "from-purple-500 to-pink-500",
  house: "from-orange-500 to-red-500",
  techno: "from-gray-600 to-slate-700",
  "hip-hop": "from-yellow-500 to-orange-500",
  jazz: "from-indigo-500 to-purple-500",
  rock: "from-red-500 to-pink-500",
  default: "from-gray-500 to-gray-600"
};

function GenreCard({ genre }: { genre: Genre }) {
  const colorClass = genreColors[genre.slug as keyof typeof genreColors] || genreColors.default;
  
  return (
    <Link href={`/genre/${genre.slug}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-navy transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-[1.02]">
        {/* Genre Header with Gradient */}
        <div className={`h-32 bg-gradient-to-br ${colorClass} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <h3 className="font-mono font-bold text-lg uppercase tracking-wide">
                {genre.name}
              </h3>
            </div>
          </div>
          
          {/* Hover Arrow */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Content Stats */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="font-mono text-xs">
              {genre.total} items
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-mono text-gray-600">
              <div className="flex items-center">
                <Music className="w-3 h-3 mr-2" />
                Mixes
              </div>
              <span className="font-semibold">{genre.mixCount}</span>
            </div>
            
            {genre.episodeCount > 0 && (
              <div className="flex items-center justify-between text-sm font-mono text-gray-600">
                <div className="flex items-center">
                  <Headphones className="w-3 h-3 mr-2" />
                  Episodes
                </div>
                <span className="font-semibold">{genre.episodeCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GenreDiscovery() {
  const { data: genres = [], isLoading, error } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const r = await fetch("/api/genres", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load genres");
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center font-mono text-gray-500">Loading genres…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center font-mono text-navy">Failed to load genres</div>
      </div>
    );
  }

  const totalContent = genres.reduce((sum, genre) => sum + genre.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-mono text-navy mb-2">
              Explore Genres
            </h1>
            <p className="font-mono text-gray-600">
              Discover content organized by musical style and genre
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-gray-900">
              {genres.length}
            </div>
            <div className="text-xs font-mono text-gray-500 uppercase">
              Genres
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm font-mono text-gray-600">
          <div className="flex items-center">
            <Music className="w-4 h-4 mr-1" />
            {genres.reduce((sum, g) => sum + g.mixCount, 0)} total mixes
          </div>
          <div className="flex items-center">
            <Headphones className="w-4 h-4 mr-1" />
            {genres.reduce((sum, g) => sum + g.episodeCount, 0)} total episodes
          </div>
          <div className="flex items-center">
            <Hash className="w-4 h-4 mr-1" />
            {totalContent} total items
          </div>
        </div>
      </div>

      {/* Genre Grid */}
      {genres.length === 0 ? (
        <div className="text-center py-12">
          <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="font-mono text-lg text-gray-600 mb-2">No genres yet</h3>
          <p className="font-mono text-sm text-gray-500 mb-6">
            Submit some content to start building your genre collection
          </p>
          <Link href="/submit-mix">
            <button className="bg-navy hover:bg-navy-dark text-white font-mono px-6 py-2 rounded">
              Submit Content
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <GenreCard key={genre.slug} genre={genre} />
          ))}
        </div>
      )}
      
      {/* Footer Note */}
      {genres.length > 0 && (
        <div className="mt-12 text-center">
          <p className="font-mono text-xs text-gray-500">
            Genres are automatically detected from submitted content. 
            <Link href="/submit-mix" className="text-navy hover:underline ml-1">
              Add more content →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}