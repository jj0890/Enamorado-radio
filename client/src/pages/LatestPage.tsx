import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, User, Music, Clock } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import PublicMixCard from "@/components/PublicMixCard";

// Episode Card Component for consistent styling with mixes
function EpisodeCard({ episode }: { episode: any }) {
  const handlePlay = () => {
    window.open(`/episode/${episode.id}`, '_blank');
  };

  // Fallback artwork for episodes (using genre-based thumbnails)
  const artwork = episode.artworkUrl || episode.artwork || episode.artUrl || `https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group shadow-sm hover:shadow-md">
      {/* Artwork */}
      <div className="aspect-square bg-gray-200 overflow-hidden relative">
        <img 
          src={artwork} 
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        {/* Episode Badge and Date */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-white bg-red-500 px-2 py-1 rounded uppercase">
            Episode
          </span>
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(episode.airDate || episode.date).toLocaleDateString()}
          </div>
        </div>

        {/* Title */}
        <div className="mb-2">
          <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-red-500 transition-colors">
            {episode.title}
          </h4>
          <div className="flex items-center text-gray-600 font-mono text-sm mt-1">
            <User className="w-3 h-3 mr-1" />
            {episode.hostName || episode.host}
          </div>
        </div>

        {/* Genre */}
        <div className="mb-3">
          {episode.genre && (
            <span className="text-xs font-mono text-gray-600">
              {episode.genre}
            </span>
          )}
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

export default function LatestPage() {
  const [filter, setFilter] = useState<'all' | 'episodes' | 'mixes'>('all');

  // Fetch latest content
  const { data: latestContent = [], isLoading } = useQuery({
    queryKey: ["/api/latest", { limit: 20 }],
    refetchInterval: 30000,
  });

  const filteredContent = latestContent.filter((item: any) => {
    if (filter === 'all') return true;
    if (filter === 'episodes') return item.type === 'episode';
    if (filter === 'mixes') return item.type === 'mix';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading latest content...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StickyRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-red-500 font-medium">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  EPISODES
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4">
        {/* Back Navigation */}
        <div className="pt-16 pb-8 mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="pt-16 pb-8 mb-8">
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">LATEST</h1>
          <p className="text-xl text-gray-600 max-w-2xl font-mono">
            The most recent episodes, shows, and mixes from our community
          </p>
        </div>

        {/* Filter Controls */}
        <div className="pt-16 pb-8 mb-8">
          <div className="flex gap-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              All Content
            </Button>
            <Button
              variant={filter === 'episodes' ? 'default' : 'outline'}
              onClick={() => setFilter('episodes')}
              className={filter === 'episodes' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              Episodes
            </Button>
            <Button
              variant={filter === 'mixes' ? 'default' : 'outline'}
              onClick={() => setFilter('mixes')}
              className={filter === 'mixes' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              Community Mixes
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredContent.map((item: any, index: number) => (
              item.type === 'mix' ? (
                <PublicMixCard key={`${item.type}-${item.id}`} mix={item} />
              ) : (
                <EpisodeCard key={`${item.type}-${item.id}`} episode={item} />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">
              No {filter === 'all' ? 'content' : filter} available yet.
            </div>
            <Link href="/submit-mix" className="mt-4 inline-block">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                Submit Your Mix
              </Button>
            </Link>
          </div>
        )}

        {/* Load More (Future Enhancement) */}
        {filteredContent.length >= 20 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
              Load More Content
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}