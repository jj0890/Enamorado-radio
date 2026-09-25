import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, User, Music, Clock, ListMusic, ExternalLink } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-navy transition-all duration-300 group shadow-sm hover:shadow-md">
      <div className="aspect-square bg-gray-200 overflow-hidden relative">
        <img 
          src={artwork} 
          alt={episode.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-white bg-navy px-2 py-1 rounded uppercase">
            Episode
          </span>
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(episode.airDate || episode.date).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-2">
          <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-navy transition-colors">
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
          className="bg-navy hover:bg-navy-dark text-white font-mono w-full text-sm"
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
    const p = (playlist.platform ?? playlist.playlistUrl ?? '').toLowerCase();
    const platform = p.includes('spotify') ? 'spotify'
      : p.includes('apple') ? 'apple-music'
      : p.includes('soundcloud') ? 'soundcloud'
      : p.includes('youtube') ? 'youtube'
      : p.includes('mixcloud') ? 'mixcloud'
      : 'unknown';
    return <PlatformIcon platform={platform} size={16} branded />;
  };

  const artwork = playlist.artworkUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop`;

  return (
    <Link href={`/community/${playlist.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 transition-all duration-300 group shadow-sm hover:shadow-md cursor-pointer">
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
            <span className="text-xs font-mono text-white bg-purple-600 px-2 py-1 rounded uppercase">
              Playlist
            </span>
            <div className="text-xs font-mono text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(playlist.submittedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="mb-2">
            <h4 className="text-lg font-bold font-mono text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
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
                <span key={i} className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white font-mono w-full text-sm"
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
  const [, params] = useRoute('/latest/:section?');
  const section = params?.section || 'all'; // featured, recent, staff-picks, or all

  const [filter, setFilter] = useState<'all' | 'episodes' | 'mixes' | 'playlists'>('all');

  // Fetch latest content
  const { data: latestContent = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/latest", { limit: 24 }],
    refetchInterval: 30000,
  });

  // Filter by section (featured, recent, staff-picks)
  let sectionFiltered = latestContent;
  if (section === 'featured') {
    sectionFiltered = latestContent.filter((item: any) => item.isFeatured);
  } else if (section === 'staff-picks') {
    sectionFiltered = latestContent.filter((item: any) => item.isFeatured);
  } else if (section === 'recent') {
    // Recent is default sorting, just use all
    sectionFiltered = latestContent;
  }

  // Then filter by content type
  const filteredContent = sectionFiltered.filter((item: any) => {
    if (filter === 'all') return true;
    if (filter === 'episodes') return item.type === 'episode';
    if (filter === 'mixes') return item.type === 'mix';
    if (filter === 'playlists') return item.type === 'playlist';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <StickyRadioPlayer />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400 font-mono">Loading latest content...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StickyRadioPlayer />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4">
        {/* Back Navigation */}
        <div className="pt-16 pb-8 mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-navy transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="pt-16 pb-8 mb-8">
          <h1 className="text-6xl font-bold mb-4 font-mono text-navy">
            {section === 'featured' ? 'FEATURED' :
             section === 'staff-picks' ? 'STAFF PICKS' :
             section === 'recent' ? 'RECENT' : 'LATEST'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl font-mono">
            {section === 'featured' ? 'Our hand-picked featured content' :
             section === 'staff-picks' ? 'Curated selections from our team' :
             section === 'recent' ? 'The newest additions to our catalog' :
             'The most recent episodes, shows, and mixes from our community'}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="pt-16 pb-8 mb-8">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? "bg-navy hover:bg-navy-dark text-white font-mono" 
                : "border-navy text-navy hover:bg-navy hover:text-white font-mono"
              }
            >
              All Content
            </Button>
            <Button
              variant={filter === 'episodes' ? 'default' : 'outline'}
              onClick={() => setFilter('episodes')}
              className={filter === 'episodes' 
                ? "bg-navy hover:bg-navy-dark text-white font-mono" 
                : "border-navy text-navy hover:bg-navy hover:text-white font-mono"
              }
            >
              Episodes
            </Button>
            <Button
              variant={filter === 'mixes' ? 'default' : 'outline'}
              onClick={() => setFilter('mixes')}
              className={filter === 'mixes' 
                ? "bg-navy hover:bg-navy-dark text-white font-mono" 
                : "border-navy text-navy hover:bg-navy hover:text-white font-mono"
              }
            >
              Mixes
            </Button>
            <Button
              variant={filter === 'playlists' ? 'default' : 'outline'}
              onClick={() => setFilter('playlists')}
              className={filter === 'playlists' 
                ? "bg-purple-600 hover:bg-purple-700 text-white font-mono" 
                : "border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-mono"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-gray-600 font-mono">
              No {filter === 'all' ? 'content' : filter} available yet.
            </div>
            <Link href="/submit-mix" className="mt-4 inline-block">
              <Button className="bg-navy hover:bg-navy-dark text-white font-mono">
                Submit Your Mix
              </Button>
            </Link>
          </div>
        )}

        {/* Load More (Future Enhancement) */}
        {filteredContent.length >= 20 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white font-mono">
              Load More Content
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}