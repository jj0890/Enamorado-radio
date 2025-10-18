import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Music, GraduationCap, Star, User, Tags } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function ExplorePage() {
  const [filter, setFilter] = useState<'all' | 'artist' | 'genre' | 'tutorial' | 'editorial'>('all');

  // Fetch guides with different filters
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["/api/guides"],
    refetchInterval: 30000,
  });

  const filteredGuides = guides.filter((guide: any) => {
    if (filter === 'all') return true;
    return guide.guideType === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading guides...</div>
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
                <Link href="/explore" className="text-red-500 font-medium">
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
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">EXPLORE</h1>
          <p className="text-xl text-gray-600 max-w-3xl font-mono">
            Curated guides and thematic entry points for discovering new music, artists, and genres
          </p>
        </div>

        {/* Filter Controls */}
        <div className="pt-16 pb-8 mb-8">
          <div className="flex flex-wrap gap-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <BookOpen className="w-4 h-4 mr-2" />
              All Guides
            </Button>
            <Button
              variant={filter === 'artist' ? 'default' : 'outline'}
              onClick={() => setFilter('artist')}
              className={filter === 'artist' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <User className="w-4 h-4 mr-2" />
              Artist Guides
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
              Genre Guides
            </Button>
            <Button
              variant={filter === 'tutorial' ? 'default' : 'outline'}
              onClick={() => setFilter('tutorial')}
              className={filter === 'tutorial' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              How-To Guides
            </Button>
            <Button
              variant={filter === 'editorial' ? 'default' : 'outline'}
              onClick={() => setFilter('editorial')}
              className={filter === 'editorial' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Star className="w-4 h-4 mr-2" />
              Editorial
            </Button>
          </div>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide: any) => (
              <Link key={guide.id} href={`/explore/${guide.slug}`}>
                <div className="bg-gray-50 border-2 border-black rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group cursor-pointer h-full">
                  {/* Cover Image */}
                  {guide.coverImageUrl && (
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      <img 
                        src={guide.coverImageUrl} 
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Guide Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-red-500 uppercase bg-red-50 px-2 py-1 rounded">
                        {guide.guideType}
                      </span>
                      {guide.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    {/* Title and Author */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold font-mono text-gray-900 mb-2 group-hover:text-red-500 transition-colors">
                        {guide.title}
                      </h3>
                      <div className="flex items-center text-gray-600 font-mono text-sm">
                        <User className="w-3 h-3 mr-1" />
                        {guide.authorName}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 font-mono text-sm mb-4 line-clamp-3">
                      {guide.description}
                    </p>

                    {/* Tags */}
                    {guide.tags && guide.tags.length > 0 && (
                      <div className="flex items-center flex-wrap gap-2 mb-4">
                        <Tags className="w-3 h-3 text-gray-400" />
                        {guide.tags.slice(0, 3).map((tag: string) => (
                          <span 
                            key={tag}
                            className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {guide.tags.length > 3 && (
                          <span className="text-xs font-mono text-gray-400">
                            +{guide.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Read Guide Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white font-mono w-full group-hover:bg-red-600"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Guide
                      </Button>
                    </div>

                    {/* Guide Stats */}
                    <div className="mt-3 text-xs font-mono text-gray-400">
                      {guide.viewCount > 0 && `${guide.viewCount} views • `}
                      Updated {new Date(guide.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono mb-4">
              No {filter === 'all' ? 'guides' : `${filter} guides`} available yet.
            </div>
            <p className="text-gray-500 font-mono text-sm mb-6">
              Guides are curated collections that help you discover new music and learn about artists, genres, and techniques.
            </p>
            <Link href="/" className="inline-block">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                Back to Homepage
              </Button>
            </Link>
          </div>
        )}

        {/* Coming Soon Features */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">COMING SOON</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <User className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-600 mb-2">Community Guides</h3>
              <p className="text-sm font-mono text-gray-500">
                User-submitted guides and recommendations
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Music className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-600 mb-2">Interactive Playlists</h3>
              <p className="text-sm font-mono text-gray-500">
                Playable guides with embedded audio
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Tags className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-600 mb-2">Advanced Filtering</h3>
              <p className="text-sm font-mono text-gray-500">
                Search by tags, difficulty, and length
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}