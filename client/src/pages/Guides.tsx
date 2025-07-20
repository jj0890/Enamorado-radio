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
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* NTS-Style Header */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-wide mb-4">
            CURATED GENRES
          </h1>
          <p className="text-lg max-w-2xl">
            Deep dives into artists and genres curated by our editorial team.
          </p>
        </div>

        {/* NTS-Style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
          {guides.map((guide, index) => (
            <Link key={guide.id} href={`/guide/${guide.id}`}>
              <div className="border-r-2 border-b-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer">
                {/* Image Area */}
                <div className="aspect-square bg-gray-100 mb-4 flex items-center justify-center text-6xl">
                  🎵
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg uppercase tracking-wide leading-tight">
                    {guide.title.replace('Enamorado Guide to ', '')}
                  </h3>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {guide.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 pt-2">
                    {guide.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="text-xs font-mono bg-black text-white px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 font-mono pt-2">
                    {guide.episodeCount} EPISODES • BY {guide.author.toUpperCase()}
                  </div>
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