import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Music, Upload, Clock, User, Star } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

// All Mixes Component
function AllMixesSection() {
  const [allMixesFilter, setAllMixesFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  
  const { data: allMixes = [], isLoading } = useQuery({
    queryKey: ["/api/mixes", { status: allMixesFilter === 'all' ? undefined : allMixesFilter, limit: 50 }],
    refetchInterval: 30000,
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300", 
      featured: "bg-red-100 text-red-800 border-red-300"
    };
    return (
      <span className={`px-2 py-1 text-xs font-mono border rounded ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 font-mono">Loading all mixes...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls for All Mixes */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'featured'].map((filterOption) => (
            <Button
              key={filterOption}
              size="sm"
              variant={allMixesFilter === filterOption ? 'default' : 'outline'}
              onClick={() => setAllMixesFilter(filterOption as typeof allMixesFilter)}
              className={allMixesFilter === filterOption 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono text-xs" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono text-xs"
              }
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* All Mixes Grid */}
      {allMixes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allMixes.map((mix: any) => {
            const metadata = mix.metadata && typeof mix.metadata === 'object' ? mix.metadata : {};
            const title = metadata.title || mix.title;
            const artist = metadata.artist || mix.name;
            const artwork = metadata.artwork || null;

            return (
              <div 
                key={mix.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group"
              >
                {/* Compact Artwork */}
                <div className="aspect-square bg-gray-200 overflow-hidden relative">
                  {artwork ? (
                    <img 
                      src={artwork} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <Music className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(mix.status)}
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Genre and Date */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-red-500 uppercase bg-red-50 px-2 py-1 rounded">
                      {mix.genre}
                    </span>
                    <div className="text-xs font-mono text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(mix.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Title and Artist */}
                  <div className="mb-3">
                    <h4 className="text-sm font-bold font-mono text-gray-900 mb-1 group-hover:text-red-500 transition-colors line-clamp-1">
                      {title}
                    </h4>
                    <div className="flex items-center text-gray-600 font-mono text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {artist}
                    </div>
                  </div>

                  {/* Listen Button */}
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 text-white font-mono w-full text-xs"
                    onClick={() => window.open(mix.url, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Listen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 font-mono">No mixes found for {allMixesFilter} status.</div>
        </div>
      )}
    </div>
  );
}

export default function MixesPage() {
  const [filter, setFilter] = useState<'approved' | 'featured' | 'pending'>('approved');

  // Fetch mixes with different status filters
  const { data: mixes = [], isLoading } = useQuery({
    queryKey: ["/api/mixes", { status: filter, limit: 20 }],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading community mixes...</div>
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
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  EPISODES
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-red-500 font-medium">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">COMMUNITY MIXES</h1>
              <p className="text-xl text-gray-600 max-w-2xl font-mono">
                Discover fresh sounds from our community of DJs, producers, and music lovers
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => document.getElementById('all-mixes')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              >
                <Music className="w-4 h-4 mr-2" />
                View All Mixes
              </Button>
              <Link href="/submit-mix">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Your Mix
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
              className={filter === 'approved' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Music className="w-4 h-4 mr-2" />
              Community Picks
            </Button>
            <Button
              variant={filter === 'featured' ? 'default' : 'outline'}
              onClick={() => setFilter('featured')}
              className={filter === 'featured' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Star className="w-4 h-4 mr-2" />
              Featured Mixes
            </Button>
          </div>
        </div>

        {/* Mixes Grid */}
        {mixes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mixes.map((mix: any) => {
              // Extract metadata for enhanced display
              const metadata = mix.metadata && typeof mix.metadata === 'object' ? mix.metadata : {};
              const title = metadata.title || mix.title;
              const artist = metadata.artist || mix.name;
              const artwork = metadata.artwork || null;
              const isFeatured = mix.status === 'featured';

              return (
                <div 
                  key={mix.id} 
                  className="bg-gray-50 border-2 border-black rounded-lg overflow-hidden hover:border-red-500 transition-all duration-300 group"
                >
                  {/* Artwork */}
                  <div className="aspect-square bg-gray-200 overflow-hidden relative">
                    {artwork ? (
                      <img 
                        src={artwork} 
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <Music className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {isFeatured && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-mono font-bold">
                          FEATURED
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {/* Genre and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-red-500 uppercase bg-red-50 px-2 py-1 rounded">
                        {mix.genre}
                      </span>
                      <div className="text-xs font-mono text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(mix.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Title and Artist */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold font-mono text-gray-900 mb-1 group-hover:text-red-500 transition-colors line-clamp-2">
                        {title}
                      </h3>
                      <div className="flex items-center text-gray-600 font-mono text-sm">
                        <User className="w-3 h-3 mr-1" />
                        {artist}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 font-mono text-sm mb-4 line-clamp-3">
                      {mix.about}
                    </p>

                    {/* Platform Info */}
                    <div className="text-xs font-mono text-gray-500 mb-4">
                      {mix.url.includes('soundcloud.com') && '🎵 SoundCloud'}
                      {mix.url.includes('mixcloud.com') && '🎧 Mixcloud'}
                      {mix.url.includes('audio.com') && '📻 Audio.com'}
                      {!mix.url.includes('soundcloud.com') && !mix.url.includes('mixcloud.com') && !mix.url.includes('audio.com') && '🔗 Direct Link'}
                    </div>

                    {/* Listen Button */}
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white font-mono w-full"
                      onClick={() => window.open(mix.url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Listen Now
                    </Button>

                    {/* Enhanced Metadata Display */}
                    {metadata.description && metadata.description !== mix.about && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-mono text-gray-500 line-clamp-2">
                          Platform: {metadata.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 font-mono mb-4">
              No {filter === 'featured' ? 'featured' : 'community'} mixes available yet.
            </div>
            <p className="text-gray-500 font-mono text-sm mb-6">
              Be the first to share your work with our community!
            </p>
            <Button 
              onClick={() => document.getElementById('all-mixes')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-red-500 hover:bg-red-600 text-white font-mono"
            >
              <Music className="w-4 h-4 mr-2" />
              View All Mixes
            </Button>
          </div>
        )}

        {/* All Mixes Section */}
        <div id="all-mixes" className="mt-20 pt-12 border-t border-gray-200">
          <h2 className="text-4xl font-bold mb-8 font-mono text-red-500">ALL COMMUNITY MIXES</h2>
          <AllMixesSection />
        </div>

        {/* Community Guidelines */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">COMMUNITY GUIDELINES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <Music className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-blue-900 mb-2">All Genres Welcome</h3>
              <p className="text-sm font-mono text-blue-800">
                From house to hip-hop, experimental to electronic - diversity is celebrated
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <User className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-green-900 mb-2">Community Friendly</h3>
              <p className="text-sm font-mono text-green-800">
                No harsh rejections - we support emerging artists and encourage experimentation
              </p>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <Star className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-yellow-900 mb-2">Featured Potential</h3>
              <p className="text-sm font-mono text-yellow-800">
                Outstanding submissions may be featured on our radio programming
              </p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <Upload className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-purple-900 mb-2">Easy Submission</h3>
              <p className="text-sm font-mono text-purple-800">
                Just paste your SoundCloud, Mixcloud, or Audio.com link and we'll handle the rest
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center bg-red-50 border-2 border-red-200 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4 font-mono text-red-500">Ready to Share Your Sound?</h3>
          <p className="text-gray-600 font-mono mb-6">
            Join our community of music creators and help shape the future of Enamorado Radio
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/submit-mix">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                <Upload className="w-4 h-4 mr-2" />
                Submit a Mix
              </Button>
            </Link>
            <Link href="/resident-application">
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                <User className="w-4 h-4 mr-2" />
                Become a Resident
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}