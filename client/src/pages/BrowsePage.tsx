import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GenreChip } from '../components/GenreChip';
import { UniversalContentCard } from '../components/UniversalContentCard';
import { Loader2 } from 'lucide-react';

interface Genre {
  id: number;
  slug: string;
  name: string;
  category: string;
  description?: string;
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [content, setContent] = useState<any[]>([]);
  const [genres, setGenres] = useState<Record<string, Genre[]>>({});
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'all' | 'mix' | 'episode' | 'playlist'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load genres on mount
  useEffect(() => {
    fetch('/api/genres')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setGenres(data.data.byCategory);
        }
      });
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      setSelectedGenres([genreParam]);
    }
  }, []);

  // Load content based on filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (selectedGenres.length) params.append('genres', selectedGenres.join(','));
    if (contentType !== 'all') params.append('type', contentType);
    if (search) params.append('search', search);

    fetch(`/api/content/browse?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setContent(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGenres, contentType, search]);

  // Toggle genre selection
  const toggleGenre = (slug: string) => {
    setSelectedGenres(prev =>
      prev.includes(slug)
        ? prev.filter(g => g !== slug)
        : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setContentType('all');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Browse</h1>

          {/* Search */}
          <div className="mb-4">
            <input
              type="search"
              placeholder="Search mixes, episodes, playlists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Content Type Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'mix', 'episode', 'playlist'] as const).map(type => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  contentType === type
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Content' : `${type}s`}
              </button>
            ))}
          </div>

          {/* Selected Genres */}
          {selectedGenres.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtering by:</span>
              {selectedGenres.map(slug => {
                // Find genre name
                const genre = Object.values(genres).flat().find(g => g.slug === slug);
                return genre ? (
                  <GenreChip
                    key={slug}
                    slug={slug}
                    name={genre.name}
                    active
                    onClick={() => toggleGenre(slug)}
                  />
                ) : null;
              })}
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Genre Filters */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-32">
              <h3 className="font-bold mb-4 text-lg">Genres</h3>

              <div className="space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto">
                {Object.entries(genres).map(([category, categoryGenres]) => (
                  <div key={category}>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryGenres.map(genre => (
                        <GenreChip
                          key={genre.slug}
                          slug={genre.slug}
                          name={genre.name}
                          active={selectedGenres.includes(genre.slug)}
                          onClick={() => toggleGenre(genre.slug)}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Content Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="inline-block animate-spin h-12 w-12 text-gray-400" />
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No content found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-black underline hover:no-underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {content.length} {content.length === 1 ? 'result' : 'results'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content.map(item => (
                    <UniversalContentCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onPlay={() => {
                        // TODO: Implement play functionality
                        console.log('Play:', item);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
