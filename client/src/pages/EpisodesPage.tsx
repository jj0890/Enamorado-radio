import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Calendar, User, Music, Clock, Radio } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function EpisodesPage() {
  const [filter, setFilter] = useState<'all' | 'recent' | 'featured' | 'genre'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  // Fetch episodes with pagination
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["/api/episodes", { filter, genre: selectedGenre, limit: 24 }],
    refetchInterval: 60000,
  });

  // Get unique genres for filtering
  const genres = [...new Set(episodes.map((ep: any) => ep.genre).filter(Boolean))];

  const filteredEpisodes = episodes.filter((episode: any) => {
    if (filter === 'all') return true;
    if (filter === 'recent') return new Date(episode.airDate) > new Date(Date.now() - 7 * 24 * 60 * 1000);
    if (filter === 'featured') return episode.isFeatured;
    if (filter === 'genre') return !selectedGenre || episode.genre === selectedGenre;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading episodes...</div>
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
                <Link href="/latest" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/episodes" className="text-red-500 font-medium">
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
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">ALL EPISODES</h1>
          <p className="text-xl text-gray-600 max-w-3xl font-mono">
            Complete archive of radio episodes, shows, and special broadcasts
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Music className="w-4 h-4 mr-2" />
              All Episodes ({episodes.length})
            </Button>
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              onClick={() => setFilter('recent')}
              className={filter === 'recent' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Calendar className="w-4 h-4 mr-2" />
              This Week
            </Button>
            <Button
              variant={filter === 'featured' ? 'default' : 'outline'}
              onClick={() => setFilter('featured')}
              className={filter === 'featured' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Radio className="w-4 h-4 mr-2" />
              Featured
            </Button>
            <Button
              variant={filter === 'genre' ? 'default' : 'outline'}
              onClick={() => setFilter('genre')}
              className={filter === 'genre' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Music className="w-4 h-4 mr-2" />
              By Genre
            </Button>
          </div>

          {/* Genre Selector */}
          {filter === 'genre' && genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre('')}
                className={`px-3 py-1 text-xs font-mono rounded border-2 transition-colors ${
                  !selectedGenre 
                    ? 'bg-red-500 text-white border-red-500' 
                    : 'bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
                }`}
              >
                All Genres
              </button>
              {genres.map((genre: string) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 text-xs font-mono rounded border-2 transition-colors ${
                    selectedGenre === genre 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Episodes Grid */}
        {filteredEpisodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEpisodes.map((episode: any) => (
              <div 
                key={episode.id}
                className="bg-gray-50 border-2 border-black rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group"
              >
                {/* Episode Artwork */}
                <div className="aspect-square bg-gray-200 overflow-hidden relative">
                  {episode.artworkUrl ? (
                    <img 
                      src={episode.artworkUrl} 
                      alt={episode.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <Radio className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {episode.isFeatured && (
                      <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-mono font-bold">
                        FEATURED
                      </div>
                    )}
                    {episode.isLive && (
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-mono font-bold animate-pulse">
                        LIVE
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Episode Meta */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-red-500 uppercase bg-red-50 px-2 py-1 rounded">
                      {episode.genre || 'Radio'}
                    </span>
                    <div className="flex items-center text-xs font-mono text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* Title and Host */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold font-mono text-gray-900 mb-1 group-hover:text-red-500 transition-colors line-clamp-2">
                      {episode.title}
                    </h3>
                    <div className="flex items-center text-gray-600 font-mono text-sm mb-2">
                      <User className="w-3 h-3 mr-1" />
                      {episode.hostName}
                    </div>
                    <div className="flex items-center text-gray-500 font-mono text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(episode.airDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Description */}
                  {episode.description && (
                    <p className="text-gray-600 font-mono text-sm mb-4 line-clamp-3">
                      {episode.description}
                    </p>
                  )}

                  {/* Episode Series */}
                  {episode.seriesTitle && (
                    <div className="text-xs font-mono text-gray-500 mb-4">
                      {episode.seriesTitle}
                      {episode.episodeNumber && ` • Episode ${episode.episodeNumber}`}
                    </div>
                  )}

                  {/* Listen Button */}
                  <Link href={`/episode/${episode.id}`}>
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white font-mono w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Listen to Episode
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 font-mono mb-4">
              No episodes found{filter === 'genre' && selectedGenre ? ` in ${selectedGenre}` : ''}
            </div>
            <p className="text-gray-500 font-mono text-sm mb-6">
              Check back soon for new episodes, or explore our other content.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/latest">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                  Browse Latest
                </Button>
              </Link>
              <Link href="/mixes">
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  Community Mixes
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Load More / Pagination */}
        {filteredEpisodes.length >= 24 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
            >
              Load More Episodes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}