import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Filter, Play, Radio, User, Calendar, Tag as TagIcon, TrendingUp, Music } from "lucide-react";
import { SearchModal } from "../components/SearchModal";
import { TagSystem } from "../components/TagSystem";

interface Show {
  id: string;
  title: string;
  host: string;
  description: string;
  tags: string[];
  category: string;
  isLive: boolean;
  duration: number;
  startTime?: string;
  artwork?: string;
}

export default function Discover() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  const shows: Show[] = [
    {
      id: '1',
      title: 'Deep Routes',
      host: 'Marcus Rivera',
      description: 'Deep house specialist with 15+ years digging through Detroit\'s underground',
      tags: ['house', 'deep', 'underground', 'detroit'],
      category: 'Live Show',
      isLive: true,
      duration: 120,
      startTime: '2025-01-15T20:00:00'
    },
    {
      id: '2',
      title: 'Experimental Sounds',
      host: 'Alex Stone',
      description: 'Pushing boundaries with avant-garde and experimental music',
      tags: ['experimental', 'avant-garde', 'ambient', 'modern'],
      category: 'Experimental',
      isLive: false,
      duration: 90,
      startTime: '2025-01-16T18:00:00'
    },
    {
      id: '3',
      title: 'Midnight Sessions',
      host: 'Luna Park',
      description: 'Late night ambient and downtempo selections for the sleepless',
      tags: ['ambient', 'downtempo', 'chill', 'contemporary'],
      category: 'Residency',
      isLive: false,
      duration: 60,
      startTime: '2025-01-17T00:00:00'
    },
    {
      id: '4',
      title: 'Techno Archaeology',
      host: 'Luna Park',
      description: 'Digging through decades of techno evolution',
      tags: ['techno', 'underground', 'electronic', '90s'],
      category: 'Residency',
      isLive: false,
      duration: 90,
      startTime: '2025-01-18T22:00:00'
    },
    {
      id: '5',
      title: 'Jazz Futures',
      host: 'Sarah Moon',
      description: 'Contemporary jazz and experimental fusion',
      tags: ['jazz', 'experimental', 'contemporary', 'fusion'],
      category: 'Guest Mix',
      isLive: false,
      duration: 75,
      startTime: '2025-01-19T19:00:00'
    },
    {
      id: '6',
      title: 'Industrial Complex',
      host: 'Viktor Noir',
      description: 'Dark and heavy industrial soundscapes',
      tags: ['industrial', 'dark', 'electronic', 'minimal'],
      category: 'Live Show',
      isLive: false,
      duration: 100,
      startTime: '2025-01-20T21:00:00'
    }
  ];

  const filteredShows = shows.filter(show => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => show.tags.includes(tag));
  });

  const sortedShows = [...filteredShows].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.tags.length - a.tags.length; // More tags = more popular
      case 'trending':
        return a.isLive ? -1 : 1; // Live shows first
      case 'latest':
      default:
        return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime();
    }
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Live Show': return 'bg-red-500/20 text-red-400';
      case 'Residency': return 'bg-blue-500/20 text-blue-400';
      case 'Guest Mix': return 'bg-green-500/20 text-green-400';
      case 'Experimental': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm">
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  HOME
                </Link>
                <Link href="/discover" className="text-blue-400 font-medium">
                  DISCOVER
                </Link>
                <Link href="/radio" className="text-white/80 hover:text-white transition-colors">
                  RADIO
                </Link>
                <Link href="/zine" className="text-white/80 hover:text-white transition-colors">
                  ZINE
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded transition-colors ${
                  showFilters ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Discover</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Explore our vast catalog of shows, genres, and artists. Use tags to find exactly what you're looking for.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Tags and Filters */}
          <div className={`lg:col-span-1 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Sort Options */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-3">Sort By</h3>
              <div className="space-y-2">
                {[
                  { key: 'latest', label: 'Latest', icon: Calendar },
                  { key: 'popular', label: 'Popular', icon: TrendingUp },
                  { key: 'trending', label: 'Trending', icon: Radio }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key as any)}
                    className={`w-full flex items-center space-x-2 p-2 rounded transition-colors ${
                      sortBy === key
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{sortedShows.length}</div>
                <div className="text-gray-400 text-sm">Shows Found</div>
                {selectedTags.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    with {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Tag System */}
            <TagSystem 
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearAll={handleClearAllTags}
            />
          </div>

          {/* Main Content - Show Results */}
          <div className="lg:col-span-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-6 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <Radio className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {shows.filter(s => s.isLive).length}
                    </div>
                    <div className="text-blue-300 text-sm">Live Now</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-6 border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <User className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {new Set(shows.map(s => s.host)).size}
                    </div>
                    <div className="text-green-300 text-sm">DJs & Hosts</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-6 border border-purple-500/20">
                <div className="flex items-center space-x-3">
                  <TagIcon className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(shows.flatMap(s => s.tags)).size}
                    </div>
                    <div className="text-purple-300 text-sm">Unique Tags</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shows Grid */}
            <div className="space-y-4">
              {sortedShows.length > 0 ? (
                sortedShows.map((show) => (
                  <div
                    key={show.id}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Artwork Placeholder */}
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center relative">
                        <Music className="w-8 h-8 text-gray-400" />
                        {show.isLive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>

                      {/* Show Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">
                              {show.title}
                            </h3>
                            <p className="text-gray-400">by {show.host}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(show.category)}`}>
                              {show.category}
                            </span>
                            {show.isLive && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-300 mb-3 line-clamp-2">{show.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {show.tags.map((tag, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagToggle(tag);
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                selectedTags.includes(tag)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center space-x-4">
                            {show.startTime && (
                              <span>{formatTime(show.startTime)}</span>
                            )}
                            <span>{formatDuration(show.duration)}</span>
                          </div>
                          <button className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                            <Play className="w-4 h-4" />
                            <span>{show.isLive ? 'Listen Live' : 'Play'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <TagIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2">No shows found</h3>
                  <p className="text-gray-400 mb-4">
                    Try adjusting your tag selection or browse all shows
                  </p>
                  <button
                    onClick={handleClearAllTags}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Clear All Tags
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}