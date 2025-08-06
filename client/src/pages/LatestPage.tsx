import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, User, Music } from "lucide-react";
import PersistentRadioPlayer from "@/components/PersistentRadioPlayer";

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
        <PersistentRadioPlayer />
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
      <PersistentRadioPlayer />

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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">LATEST</h1>
          <p className="text-xl text-gray-600 max-w-2xl font-mono">
            The most recent episodes, shows, and mixes from our community
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item: any, index: number) => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="bg-gray-50 border-2 border-black rounded-lg p-6 hover:border-red-500 transition-all duration-300 group"
              >
                {/* Content Type Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-red-500 uppercase bg-red-50 px-2 py-1 rounded">
                    {item.type === 'episode' ? 'Episode' : 'Community Mix'}
                  </span>
                  <div className="text-xs font-mono text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(item.type === 'episode' ? item.airDate : item.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Title and Creator */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold font-mono text-gray-900 mb-2 group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center text-gray-600 font-mono text-sm">
                    <User className="w-3 h-3 mr-1" />
                    {item.type === 'episode' ? item.hostName : item.name}
                  </div>
                </div>

                {/* Description */}
                {(item.description || item.about) && (
                  <p className="text-gray-600 font-mono text-sm mb-4 line-clamp-3">
                    {item.type === 'episode' ? item.description : item.about}
                  </p>
                )}

                {/* Genre and Duration */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-xs font-mono text-gray-500">
                    <Music className="w-3 h-3 mr-1" />
                    {item.genre}
                  </div>
                  {item.duration && (
                    <div className="text-xs font-mono text-gray-500">
                      {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  {item.type === 'episode' ? (
                    <Link href={`/episode/${item.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white font-mono w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Listen to Episode
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white font-mono w-full"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Listen on Platform
                    </Button>
                  )}
                </div>

                {/* Series Info for Episodes */}
                {item.type === 'episode' && item.seriesTitle && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-mono text-gray-500">
                      Part of: {item.seriesTitle}
                      {item.episodeNumber && ` #${item.episodeNumber}`}
                    </div>
                  </div>
                )}
              </div>
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