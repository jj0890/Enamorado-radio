import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ContentCard from '@/components/ContentCard';
import { ContentItem } from '@shared/schema';

type ContentType = 'all' | 'mix' | 'episode' | 'playlist';

const filterOptions: { value: ContentType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mix', label: 'Mixes' },
  { value: 'episode', label: 'Episodes' },
  { value: 'playlist', label: 'Playlists' },
];

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch community content with filters
  const { data: allContent = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/community', activeFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: activeFilter,
        limit: '48',
        sort: 'recent',
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/community?${params}`);
      if (!response.ok) throw new Error('Failed to fetch community content');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Separate featured (Staff Picks) from regular content
  const staffPicks = allContent.filter(item => item.isFeatured);
  const freshContent = allContent.filter(item => !item.isFeatured);
  
  // When searching, show all results together (don't split)
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-white mb-4">
            Community
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Discover mixes, episodes, and editorial content from our community of music lovers and creators.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`px-4 py-2 font-mono text-sm transition-colors ${
                activeFilter === value
                  ? 'bg-navy text-white dark:bg-navy-light dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              data-testid={`filter-${value}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, artist, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-navy-light"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Content Sections */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : allContent.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              No content found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {searchQuery ? 'Try adjusting your search or filters' : 'Check back soon for new content'}
            </p>
          </div>
        ) : isSearching ? (
          // Search results - show all together without sections
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allContent.map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} content={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Staff Picks Section - Only show if there are featured items */}
            {staffPicks.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-navy/10 dark:bg-navy/20 px-4 py-2 rounded-lg">
                    <Star className="w-4 h-4 text-navy dark:text-navy-light fill-current" />
                    <h2 className="text-lg font-bold font-mono text-navy dark:text-navy-light">
                      Staff Picks
                    </h2>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {staffPicks.slice(0, 4).map((item) => (
                    <ContentCard 
                      key={`${item.type}-${item.id}`} 
                      content={item} 
                      showFeaturedBadge={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Fresh from Community Section */}
            {freshContent.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                    Fresh from the Community
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {freshContent.map((item) => (
                    <ContentCard key={`${item.type}-${item.id}`} content={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && allContent.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Showing {allContent.length} {allContent.length === 1 ? 'item' : 'items'}
              {staffPicks.length > 0 && !isSearching && ` (${staffPicks.length} staff pick${staffPicks.length !== 1 ? 's' : ''})`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
