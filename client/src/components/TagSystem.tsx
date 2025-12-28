import { useState } from "react";
import { X, Hash, TrendingUp, Music, Radio, Calendar } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  count: number;
  category: 'genre' | 'mood' | 'style' | 'era';
  trending?: boolean;
}

interface TagSystemProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export function TagSystem({ selectedTags, onTagToggle, onClearAll }: TagSystemProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'genre' | 'mood' | 'style' | 'era'>('all');

  const tags: Tag[] = [
    // Genres
    { id: '1', name: 'house', count: 42, category: 'genre', trending: true },
    { id: '2', name: 'techno', count: 38, category: 'genre', trending: true },
    { id: '3', name: 'ambient', count: 29, category: 'genre' },
    { id: '4', name: 'experimental', count: 33, category: 'genre' },
    { id: '5', name: 'jazz', count: 21, category: 'genre' },
    { id: '6', name: 'electronic', count: 56, category: 'genre' },
    { id: '7', name: 'hip-hop', count: 18, category: 'genre' },
    { id: '8', name: 'world', count: 15, category: 'genre' },
    
    // Moods
    { id: '9', name: 'chill', count: 34, category: 'mood' },
    { id: '10', name: 'energetic', count: 27, category: 'mood' },
    { id: '11', name: 'melancholic', count: 19, category: 'mood' },
    { id: '12', name: 'uplifting', count: 23, category: 'mood' },
    { id: '13', name: 'dark', count: 31, category: 'mood', trending: true },
    { id: '14', name: 'dreamy', count: 16, category: 'mood' },
    
    // Styles
    { id: '15', name: 'underground', count: 45, category: 'style', trending: true },
    { id: '16', name: 'minimal', count: 22, category: 'style' },
    { id: '17', name: 'industrial', count: 14, category: 'style' },
    { id: '18', name: 'psychedelic', count: 18, category: 'style' },
    { id: '19', name: 'lo-fi', count: 26, category: 'style' },
    { id: '20', name: 'progressive', count: 20, category: 'style' },
    
    // Eras
    { id: '21', name: '80s', count: 12, category: 'era' },
    { id: '22', name: '90s', count: 17, category: 'era' },
    { id: '23', name: '2000s', count: 13, category: 'era' },
    { id: '24', name: 'modern', count: 41, category: 'era' },
    { id: '25', name: 'classic', count: 25, category: 'era' },
    { id: '26', name: 'contemporary', count: 32, category: 'era' }
  ];

  const filteredTags = activeCategory === 'all' 
    ? tags 
    : tags.filter(tag => tag.category === activeCategory);

  const sortedTags = filteredTags.sort((a, b) => {
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return b.count - a.count;
  });

  const trendingTags = tags.filter(tag => tag.trending).slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'genre': return <Music className="w-4 h-4" />;
      case 'mood': return <Radio className="w-4 h-4" />;
      case 'style': return <Hash className="w-4 h-4" />;
      case 'era': return <Calendar className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">Selected Tags</h3>
            <button
              onClick={onClearAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 hover:bg-blue-600 transition-colors"
              >
                <span>{tag}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Tags */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <h3 className="font-medium text-white">Trending</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTags.includes(tag.name)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tag.name} ({tag.count})
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium text-white mb-3">Browse by Category</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All Tags' },
            { key: 'genre', label: 'Genres' },
            { key: 'mood', label: 'Moods' },
            { key: 'style', label: 'Styles' },
            { key: 'era', label: 'Eras' }
          ].map(category => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sortedTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.name)}
              className={`p-3 rounded-lg text-left transition-colors border ${
                selectedTags.includes(tag.name)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <div className={`${selectedTags.includes(tag.name) ? 'text-white' : 'text-gray-400'}`}>
                  {getCategoryIcon(tag.category)}
                </div>
                {tag.trending && (
                  <TrendingUp className="w-3 h-3 text-orange-500" />
                )}
              </div>
              <div className="font-medium text-sm">{tag.name}</div>
              <div className={`text-xs ${
                selectedTags.includes(tag.name) ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {tag.count} shows
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}