import { useState, useEffect } from "react";
import { Search, X, Music, Radio, Calendar, User, Tag } from "lucide-react";

interface SearchResult {
  id: string;
  type: 'show' | 'artist' | 'tag' | 'zine';
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchData: SearchResult[] = [
    {
      id: '1',
      type: 'show',
      title: 'Deep Routes',
      description: 'Deep house specialist with 15+ years digging through Detroit\'s underground',
      category: 'Live Show',
      tags: ['house', 'deep', 'underground'],
      url: '/radio'
    },
    {
      id: '2',
      type: 'show',
      title: 'Experimental Sounds',
      description: 'Pushing boundaries with avant-garde and experimental music',
      category: 'Experimental',
      tags: ['experimental', 'avant-garde', 'ambient'],
      url: '/radio'
    },
    {
      id: '3',
      type: 'artist',
      title: 'Marcus Rivera',
      description: 'Host of Deep Routes - Deep house specialist',
      tags: ['house', 'deep', 'detroit'],
      url: '/radio'
    },
    {
      id: '4',
      type: 'zine',
      title: 'The Underground Renaissance',
      description: 'Exploring the resurgence of underground music scenes',
      category: 'Culture',
      tags: ['underground', 'music', 'culture'],
      url: '/zine'
    },
    {
      id: '5',
      type: 'tag',
      title: 'House Music',
      description: 'All shows and content tagged with house music',
      url: '/radio?tag=house'
    },
    {
      id: '6',
      type: 'tag',
      title: 'Experimental',
      description: 'Experimental music shows and content',
      url: '/radio?tag=experimental'
    }
  ];

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call with debounce
    const timeoutId = setTimeout(() => {
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setResults(filtered);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url;
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'show': return <Radio className="w-4 h-4" />;
      case 'artist': return <User className="w-4 h-4" />;
      case 'zine': return <Calendar className="w-4 h-4" />;
      case 'tag': return <Tag className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'show': return 'text-blue-400';
      case 'artist': return 'text-green-400';
      case 'zine': return 'text-purple-400';
      case 'tag': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl mx-4 border border-gray-700 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-700 p-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search shows, artists, tags, or zine content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-4 hover:bg-gray-800 transition-colors ${
                    index === selectedIndex ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${getTypeColor(result.type)}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white truncate">{result.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getTypeColor(result.type)} bg-gray-800`}>
                          {result.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{result.description}</p>
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg mb-2">No results found</p>
              <p className="text-sm">Try searching for shows, artists, or tags</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg mb-2">Search Enamorado Radio</p>
              <p className="text-sm">Find shows, artists, zine content, and more</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-3 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}