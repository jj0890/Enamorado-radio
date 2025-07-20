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
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 text-black min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header with Editorial Typography */}
        <div className="mb-16">
          <h1 className="font-serif text-6xl font-light mb-6 text-gray-900 tracking-tight leading-tight">
            Curated<br />Genres
          </h1>
          <p className="text-gray-700 text-xl font-light max-w-2xl leading-relaxed">
            Deep dives into artists and genres curated by our editorial team. Each guide features hand-picked episodes, articles, and discoveries.
          </p>
        </div>

        {/* Asymmetric Folder Grid */}
        <div className="grid grid-cols-12 gap-8 auto-rows-min">
          {guides.map((guide, index) => {
            // Create asymmetric sizing pattern
            const isLarge = index === 0; // Featured guide
            const isMedium = index % 3 === 1;
            const spanClass = isLarge ? 'col-span-6' : isMedium ? 'col-span-4' : 'col-span-3';
            const heightClass = isLarge ? 'h-80' : isMedium ? 'h-64' : 'h-52';
            
            // Vary folder colors beyond purple
            const folderColors = [
              'from-emerald-500 via-emerald-600 to-green-700', // Earl - signature green
              'from-blue-500 via-indigo-600 to-purple-700',   // Jazz - classic blue
              'from-orange-500 via-red-600 to-pink-700',      // Hip-Hop - warm
              'from-gray-600 via-slate-700 to-gray-800',      // Electronic - modern
              'from-yellow-500 via-orange-600 to-red-700',    // Indie - bright
              'from-purple-600 via-violet-700 to-indigo-800'  // Ambient - deep
            ];
            
            return (
              <div key={guide.id} className={`${spanClass} ${isLarge ? 'row-span-2' : ''}`}>
                <Link href={`/guide/${guide.id}`}>
                  <div className="group cursor-pointer h-full">
                    {/* macOS Folder with Varied Design */}
                    <div className={`relative w-full ${heightClass}`}>
                      {/* Folder Base with Editorial Colors */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${folderColors[index % folderColors.length]} rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl ${isLarge ? 'shadow-2xl' : ''}`}>
                        {/* Folder Tab - Varied Positions */}
                        <div className={`absolute -top-1 ${index % 2 === 0 ? 'left-3 right-12' : 'left-6 right-8'} h-4 bg-gradient-to-b from-blue-400 to-blue-500 rounded-t-md shadow-sm`}>
                          <div className="absolute top-1 left-2 right-2 h-1 bg-blue-300 rounded-sm opacity-60"></div>
                        </div>
                        
                        {/* Folder Content with Varied Typography */}
                        <div className="absolute inset-4 flex flex-col">
                          {/* Episode Count Badge */}
                          <div className="flex justify-end mb-3">
                            <div className="px-2 py-1 bg-black/20 rounded text-white/90 text-xs font-medium">
                              {guide.episodeCount} ep
                            </div>
                          </div>
                          
                          {/* Title with Editorial Typography */}
                          <div className="flex-1 flex flex-col justify-center">
                            <h3 className={`text-white font-bold mb-2 leading-tight ${
                              isLarge ? 'text-xl' : isMedium ? 'text-base' : 'text-sm'
                            }`}>
                              {guide.title.replace('Enamorado Guide to ', '')}
                            </h3>
                            
                            {/* Description for larger cards */}
                            {isLarge && (
                              <p className="text-white/90 text-sm mb-3 leading-relaxed">
                                {guide.description}
                              </p>
                            )}
                            
                            {/* Tags with Varied Styling */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {guide.tags.slice(0, isLarge ? 3 : 2).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            {/* Author */}
                            <div className="text-white/70 text-xs font-medium">
                              Curated by {guide.author}
                            </div>
                          </div>
                        </div>
                        
                        {/* Folder Number with Varied Position */}
                        <div className={`absolute ${index % 2 === 0 ? 'top-2 right-2' : 'top-3 right-3'} w-6 h-6 bg-black/30 text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                          {index + 1}
                        </div>
                      </div>
                    </div>
                    
                    {/* Varied Label Styling */}
                    <div className={`mt-4 ${isLarge ? 'text-left' : 'text-center'}`}>
                      <p className={`text-gray-800 font-medium ${isLarge ? 'text-base' : 'text-sm'} leading-tight`}>
                        {guide.title}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">by {guide.author}</p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
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