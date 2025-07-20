import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Play, ExternalLink, Folder, FileText, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Guide {
  id: number;
  title: string;
  description: string;
  category: 'artist' | 'genre' | 'social' | 'technical';
  author: string;
  coverImage?: string;
  isFolder: boolean;
  episodeCount?: number;
  readTime?: string;
  tags: string[];
  featuredContent?: {
    title: string;
    type: 'episode' | 'article' | 'video';
    url: string;
  };
  createdAt: string;
}

export default function Guides() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<number | null>(null);

  // Mock data for guides - would come from API
  const guides: Guide[] = [
    {
      id: 1,
      title: "Guide to Earl Sweatshirt",
      description: "Dive into the artistry of Earl Sweatshirt and explore his timeless discography",
      category: 'artist',
      author: "Jarrad",
      coverImage: "@assets/IMG_0231_1752971370281.PNG",
      isFolder: true,
      episodeCount: 8,
      readTime: "45 min",
      tags: ["Hip-Hop", "Underground", "Introspective"],
      featuredContent: {
        title: "Earl's Production Evolution",
        type: 'episode',
        url: '/episode/2'
      },
      createdAt: "2025-01-15"
    },
    {
      id: 2,
      title: "Jazz Essentials",
      description: "Explore the soulful roots of jazz with this essential collection",
      category: 'genre',
      author: "Lauren",
      isFolder: true,
      episodeCount: 12,
      readTime: "60 min",
      tags: ["Jazz", "Classics", "History"],
      createdAt: "2025-01-10"
    },
    {
      id: 3,
      title: "Hip-Hop Legends",
      description: "Dive deep into the tracks that defined hip-hop culture",
      category: 'genre',
      author: "Marcus",
      isFolder: true,
      episodeCount: 15,
      readTime: "75 min",
      tags: ["Hip-Hop", "Legends", "Culture"],
      createdAt: "2025-01-08"
    },
    {
      id: 4,
      title: "Guide to DJing",
      description: "Learn the fundamentals of DJing and mixing",
      category: 'technical',
      author: "DJ Alex",
      isFolder: true,
      episodeCount: 6,
      readTime: "90 min",
      tags: ["Tutorial", "DJing", "Technical"],
      featuredContent: {
        title: "Beat Matching Basics",
        type: 'video',
        url: '/guides/djing/beat-matching'
      },
      createdAt: "2025-01-05"
    },
    {
      id: 5,
      title: "Being More Social",
      description: "Navigate social connections through music and community",
      category: 'social',
      author: "Sam",
      isFolder: true,
      episodeCount: 4,
      readTime: "30 min",
      tags: ["Social", "Community", "Lifestyle"],
      createdAt: "2025-01-01"
    },
    {
      id: 6,
      title: "Electronic Vibes",
      description: "Journey through electronic music's evolution",
      category: 'genre',
      author: "Riley",
      isFolder: true,
      episodeCount: 10,
      readTime: "55 min",
      tags: ["Electronic", "Techno", "House"],
      createdAt: "2024-12-28"
    }
  ];

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'artist', label: 'Artist Deep Dives', icon: Users, color: 'bg-blue-500' },
    { id: 'genre', label: 'Genre Exploration', icon: Folder, color: 'bg-purple-500' },
    { id: 'technical', label: 'How-To Guides', icon: FileText, color: 'bg-green-500' },
    { id: 'social', label: 'Social & Lifestyle', icon: Calendar, color: 'bg-orange-500' }
  ];

  const handleFolderClick = (guideId: number) => {
    setOpenFolder(openFolder === guideId ? null : guideId);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Enamorado Guides</h1>
          <p className="text-gray-400 mb-6 text-lg">
            Deep dives into artists, genres, and culture. Discover new music and expand your knowledge.
          </p>
          
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search guides, artists, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 text-lg py-3"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="text-sm"
            >
              All Guides
            </Button>
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-sm flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Guides Grid - macOS Folder Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((guide) => (
            <div key={guide.id} className="group">
              {/* Folder Container */}
              <div 
                className={`relative bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  openFolder === guide.id ? 'scale-105 shadow-2xl' : ''
                }`}
                onClick={() => handleFolderClick(guide.id)}
              >
                {/* Folder Tab */}
                <div className="absolute -top-2 left-4 bg-gray-700 text-white px-3 py-1 rounded-t-lg text-xs font-medium">
                  Folder {guide.id}
                </div>
                
                {/* Folder Icon */}
                <div className="flex items-center justify-center mb-4">
                  <Folder className="h-12 w-12 text-white/80" />
                </div>
                
                {/* Folder Content */}
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg mb-2">{guide.title}</h3>
                  <p className="text-white/80 text-sm mb-3 line-clamp-2">{guide.description}</p>
                  
                  <div className="flex items-center justify-center gap-4 text-white/60 text-xs mb-3">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {guide.episodeCount} episodes
                    </span>
                    <span>{guide.readTime}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {guide.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-white/60 text-xs">by {guide.author}</p>
                </div>
              </div>

              {/* Expanded Content (when folder is opened) */}
              {openFolder === guide.id && (
                <div className="mt-4 bg-gray-900 rounded-lg p-6 border border-gray-700 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Guide Contents</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFolder(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <p className="text-gray-400 mb-4">{guide.description}</p>
                  
                  {guide.featuredContent && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <h5 className="font-medium mb-2">Featured Content</h5>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{guide.featuredContent.title}</p>
                          <p className="text-xs text-gray-400 capitalize">{guide.featuredContent.type}</p>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={guide.featuredContent.url}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Explore
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/guide/${guide.id}`}>
                        <Folder className="h-4 w-4 mr-2" />
                        Open Guide
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No guides found matching your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}