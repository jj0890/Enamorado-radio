import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, User, Music, Clock, ListMusic, ExternalLink } from "lucide-react";
import { SiSpotify, SiApplemusic, SiSoundcloud, SiYoutube } from "react-icons/si";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import Navigation from "@/components/Navigation";
import PublicMixCard from "@/components/PublicMixCard";
import FeaturedHero from "@/components/FeaturedHero";

// Episode Card Component for consistent styling with mixes
function EpisodeCard({ episode }: { episode: any }) {
  const handlePlay = () => {
    window.open(`/episode/${episode.id}`, '_blank');
  };

  const artwork = episode.artworkUrl || episode.artwork || episode.artUrl || `https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop`;

  return (
    <div className="bg-white rounded-lg overflow-hidden transition-all duration-200 group shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1">
      <div className="aspect-square bg-gray-200 overflow-hidden relative">
        <img
          src={artwork}
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-white bg-burnt-orange-500 px-2 py-1 rounded uppercase">
            Episode
          </span>
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(episode.airDate || episode.date).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-2">
          <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-burnt-orange-500 transition-colors">
            {episode.title}
          </h4>
          <div className="flex items-center text-gray-600 font-mono text-sm mt-1">
            <User className="w-3 h-3 mr-1" />
            {episode.hostName || episode.host}
          </div>
        </div>

        <div className="mb-3">
          {episode.genre && (
            <span className="text-xs font-mono text-gray-600">
              {episode.genre}
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-mono w-full text-sm"
          onClick={handlePlay}
        >
          <Play className="w-4 h-4 mr-2" />
          Listen
        </Button>
      </div>
    </div>
  );
}

// Playlist Card Component
function PlaylistCard({ playlist }: { playlist: any }) {
  const getPlatformIcon = () => {
    const platform = playlist.platform?.toLowerCase();
    if (platform === 'spotify') return <SiSpotify className="w-4 h-4" />;
    if (platform === 'apple' || platform === 'apple music') return <SiApplemusic className="w-4 h-4" />;
    if (platform === 'soundcloud') return <SiSoundcloud className="w-4 h-4" />;
    if (platform === 'youtube') return <SiYoutube className="w-4 h-4" />;
    return <ListMusic className="w-4 h-4" />;
  };

  const artwork = playlist.artworkUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop`;

  return (
    <Link href={`/community/${playlist.id}`}>
      <div className="bg-white rounded-lg overflow-hidden transition-all duration-200 group shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1 cursor-pointer">
        <div className="aspect-square bg-gray-200 overflow-hidden relative">
          <img
            src={artwork}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-full">
            {getPlatformIcon()}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-white bg-terracotta-500 px-2 py-1 rounded uppercase">
              Playlist
            </span>
            <div className="text-xs font-mono text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(playlist.submittedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="mb-2">
            <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-terracotta-500 transition-colors line-clamp-2">
              {playlist.title}
            </h4>
            <div className="flex items-center text-gray-600 font-mono text-sm mt-1">
              <User className="w-3 h-3 mr-1" />
              {playlist.curatorName || playlist.name}
            </div>
          </div>

          {playlist.tags && playlist.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {playlist.tags.slice(0, 2).map((tag: string, i: number) => (
                <span key={i} className="text-xs font-mono text-terracotta-500 bg-burnt-orange-100 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="bg-terracotta-500 hover:bg-terracotta-400 text-white font-mono w-full text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Playlist
          </Button>
        </div>
      </div>
    </Link>
  );
}

export default function LatestPage() {
  const [filter, setFilter] = useState<'all' | 'episodes' | 'mixes' | 'playlists'>('all');

  // Fetch latest content
  const { data: latestContent = [], isLoading } = useQuery({
    queryKey: ["/api/latest", { limit: 24 }],
    refetchInterval: 30000,
  });

  const filteredContent = latestContent.filter((item: any) => {
    if (filter === 'all') return true;
    if (filter === 'episodes') return item.type === 'episode';
    if (filter === 'mixes') return item.type === 'mix';
    if (filter === 'playlists') return item.type === 'playlist';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 text-charcoal-900">
        <StickyRadioPlayer />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-charcoal-600 font-mono">Loading latest content...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900">
      <StickyRadioPlayer />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4">
        {/* Back Navigation */}
        <div className="pt-16 pb-8 mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-charcoal-600 hover:text-burnt-orange-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="pt-16 pb-8 mb-8">
          <h1 className="text-6xl font-bold mb-4 font-mono text-charcoal-900">LATEST</h1>
          <p className="text-xl text-charcoal-600 max-w-2xl font-mono">
            The most recent episodes, shows, and mixes from our community
          </p>
        </div>

        {/* Filter Controls */}
        <div className="pt-16 pb-8 mb-8">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all'
                ? "bg-charcoal-800 hover:bg-charcoal-900 text-white font-mono"
                : "border-charcoal-800 text-charcoal-800 hover:bg-charcoal-800 hover:text-white font-mono"
              }
            >
              All Content
            </Button>
            <Button
              variant={filter === 'episodes' ? 'default' : 'outline'}
              onClick={() => setFilter('episodes')}
              className={filter === 'episodes'
                ? "bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-mono"
                : "border-burnt-orange-500 text-burnt-orange-500 hover:bg-burnt-orange-500 hover:text-white font-mono"
              }
            >
              Episodes
            </Button>
            <Button
              variant={filter === 'mixes' ? 'default' : 'outline'}
              onClick={() => setFilter('mixes')}
              className={filter === 'mixes'
                ? "bg-olive-500 hover:bg-olive-400 text-white font-mono"
                : "border-olive-500 text-olive-500 hover:bg-olive-500 hover:text-white font-mono"
              }
            >
              Mixes
            </Button>
            <Button
              variant={filter === 'playlists' ? 'default' : 'outline'}
              onClick={() => setFilter('playlists')}
              className={filter === 'playlists'
                ? "bg-terracotta-500 hover:bg-terracotta-400 text-white font-mono"
                : "border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white font-mono"
              }
            >
              Playlists
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <>
            {/* Featured Hero - Show first featured item prominently */}
            {filteredContent[0]?.isFeatured && (
              <FeaturedHero item={filteredContent[0]} />
            )}

            {/* Regular Grid - Skip first if it was featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredContent
                .slice(filteredContent[0]?.isFeatured ? 1 : 0)
                .map((item: any) => {
                  if (item.type === 'mix') {
                    return <PublicMixCard key={`mix-${item.id}`} mix={{ ...item, isFeatured: false }} />;
                  } else if (item.type === 'playlist') {
                    return <PlaylistCard key={`playlist-${item.id}`} playlist={item} />;
                  } else {
                    return <EpisodeCard key={`episode-${item.id}`} episode={item} />;
                  }
                })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-charcoal-600 font-mono">
              No {filter === 'all' ? 'content' : filter} available yet.
            </div>
            <Link href="/submit-mix" className="mt-4 inline-block">
              <Button className="bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-mono">
                Submit Your Mix
              </Button>
            </Link>
          </div>
        )}

        {/* Load More (Future Enhancement) */}
        {filteredContent.length >= 20 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-burnt-orange-500 text-burnt-orange-500 hover:bg-burnt-orange-500 hover:text-white font-mono">
              Load More Content
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}