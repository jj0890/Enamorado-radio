import { useState } from 'react';
import { Link } from 'wouter';
import { Play, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Guide {
  id: number;
  title: string;
  description: string;
  author: string;
  episodeCount: number;
  tags: string[];
}

export default function Guides() {
  // Focus only on artist/genre guides - submission guides should be in submission flow
  const guides: Guide[] = [
    {
      id: 1,
      title: "Enamorado Guide to Earl Sweatshirt",
      description: "Deep dive into Earl's artistic evolution and discography",
      author: "Jarrad",
      episodeCount: 8,
      tags: ["Hip-Hop", "Underground", "Introspective"]
    },
    {
      id: 2,
      title: "Enamorado Guide to Jazz Essentials",
      description: "Explore the soulful roots of jazz with this essential collection",
      author: "Lauren",
      episodeCount: 12,
      tags: ["Jazz", "Classics"]
    },
    {
      id: 3,
      title: "Enamorado Guide to Hip-Hop Classics",
      description: "Dive deep into the tracks that defined hip-hop culture",
      author: "Marcus",
      episodeCount: 15,
      tags: ["Hip-Hop", "Legends"]
    },
    {
      id: 4,
      title: "Enamorado Guide to Electronic Vibes",
      description: "Journey through electronic music's evolution",
      author: "Riley",
      episodeCount: 10,
      tags: ["Electronic", "Techno"]
    },
    {
      id: 5,
      title: "Enamorado Guide to Indie Hits",
      description: "The indie gems that shaped alternative music",
      author: "Sam",
      episodeCount: 6,
      tags: ["Indie", "Alternative"]
    },
    {
      id: 6,
      title: "Enamorado Guide to Ambient Sounds",
      description: "Atmospheric music for deep listening and relaxation",
      author: "Alex",
      episodeCount: 9,
      tags: ["Ambient", "Experimental"]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 text-black min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Curated Genres</h1>
          <p className="text-gray-600 mb-6 text-lg">
            Deep dives into artists and genres. Discover new music and expand your knowledge.
          </p>
        </div>

        {/* macOS Style Folder Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {guides.map((guide, index) => (
            <Link key={guide.id} href={`/guide/${guide.id}`}>
              <div className="group cursor-pointer">
                {/* macOS Folder Design */}
                <div className="relative w-full aspect-square">
                  {/* Folder Base */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-lg shadow-lg transform transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
                    {/* Folder Tab */}
                    <div className="absolute -top-1 left-3 right-12 h-4 bg-gradient-to-b from-blue-400 to-blue-500 rounded-t-md shadow-sm">
                      <div className="absolute top-1 left-2 right-2 h-1 bg-blue-300 rounded-sm opacity-60"></div>
                    </div>
                    
                    {/* Folder Icon Area */}
                    <div className="absolute top-8 left-4 right-4 bottom-4 flex flex-col">
                      {/* Small Files/Documents Icon */}
                      <div className="flex justify-end mb-2">
                        <div className="w-6 h-6 bg-white/20 rounded-sm flex items-center justify-center">
                          <FileText className="h-3 w-3 text-white/80" />
                        </div>
                      </div>
                      
                      {/* Folder Content */}
                      <div className="flex-1 flex flex-col justify-center text-center">
                        <h3 className="text-white font-bold text-sm mb-1 leading-tight">
                          {guide.title}
                        </h3>
                        <div className="text-white/80 text-xs mb-2">
                          {guide.episodeCount} episodes
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 justify-center">
                          {guide.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-white/70 text-xs bg-white/20 px-1 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Folder Number Label */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                </div>
                
                {/* Folder Label */}
                <div className="mt-3 text-center">
                  <p className="text-gray-700 font-medium text-sm">{guide.title}</p>
                  <p className="text-gray-500 text-xs">by {guide.author}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Empty State */}
        {guides.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-lg">
              No guides available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}