import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Music, Upload, Clock, User, Star } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import Navigation from "@/components/Navigation";
import PublicMixCard from "@/components/PublicMixCard";
import { filterByTags, type Mix } from "@/lib/filters";

export default function MixesPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'featured'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'AND' | 'OR'>('OR');

  // Fetch all mixes
  const queryKey = statusFilter === 'featured' 
    ? ["/api/public/mixes/featured", { limit: 20 }]
    : ["/api/public/mixes", { limit: 20 }];

  const { data: allMixes = [], isLoading } = useQuery<Mix[]>({
    queryKey,
    refetchInterval: 30000,
  });

  // Apply client-side filtering
  const mixes = filterByTags(allMixes, activeTags, mode);

  // Toggle tag selection
  function toggleTag(tag: string) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setStatusFilter('all'); // Reset status filter when selecting tags
  }

  // Clear all filters
  const clearAllFilters = () => {
    setActiveTags([]);
    setStatusFilter('all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <StickyRadioPlayer />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400 font-mono">Loading community mixes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />
      <Navigation />
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
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              size="sm"
              variant={statusFilter === 'all' && activeTags.length === 0 ? 'default' : 'outline'}
              onClick={clearAllFilters}
              className={statusFilter === 'all' && activeTags.length === 0
                ? "bg-red-500 hover:bg-red-600 text-white font-mono text-xs" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono text-xs"
              }
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'featured' ? 'default' : 'outline'}
              onClick={() => { setStatusFilter('featured'); setActiveTags([]); }}
              className={statusFilter === 'featured' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono text-xs" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono text-xs"
              }
              data-testid="filter-featured"
            >
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Button>
            
            {activeTags.length > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Active tags:</span>
                {activeTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant="default"
                    onClick={() => toggleTag(tag)}
                    className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs"
                    data-testid={`filter-tag-active-${tag.toLowerCase()}`}
                  >
                    {tag} ✕
                  </Button>
                ))}
                
                {activeTags.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode(mode === 'OR' ? 'AND' : 'OR')}
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono text-xs"
                    data-testid="filter-mode-toggle"
                  >
                    {mode}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mixes Grid */}
        {mixes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mixes.map((mix: any) => (
              <PublicMixCard key={mix.id} mix={mix} onGenreSelect={toggleTag} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <div className="text-gray-600 dark:text-gray-400 font-mono mb-4">
              {activeTags.length > 0
                ? `No mixes found matching ${mode === 'AND' ? 'all of' : 'any of'}: ${activeTags.join(', ')}` 
                : statusFilter === 'featured' 
                  ? 'No featured mixes available yet.' 
                  : 'No mixes available yet.'}
            </div>
            <p className="text-gray-500 dark:text-gray-500 font-mono text-sm mb-6">
              Be the first to share your work with our community!
            </p>
            <Link href="/submit-mix">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                <Music className="w-4 h-4 mr-2" />
                Submit a Mix
              </Button>
            </Link>
          </div>
        )}

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
            <a href="/resident-application" data-testid="link-resident-application">
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                <User className="w-4 h-4 mr-2" />
                Become a Resident
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}