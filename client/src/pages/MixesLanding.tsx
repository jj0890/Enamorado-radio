import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';

interface Mix {
  id: number;
  title: string;
  artist: string;
  description: string;
  thumbnailUrl: string;
  platform: 'soundcloud' | 'mixcloud' | 'audio' | 'mp3' | 'wav';
  url: string;
  duration?: string;
  genre: string[];
  featured?: boolean;
}

export default function MixesLanding() {
  const [currentMixIndex, setCurrentMixIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Featured mixes with real SoundCloud links
  const featuredMixes: Mix[] = [
    {
      id: 1,
      title: "454 presents: Florida man FM",
      artist: "Stream 454",
      description: "High energy footwork and juke tracks for the dance floor",
      thumbnailUrl: "",
      platform: "soundcloud",
      url: "https://on.soundcloud.com/dz0vf4V42uVnuzBe7j",
      duration: "42:33",
      genre: ["Footwork", "Juke", "Electronic"],
      featured: true
    },
    {
      id: 2,
      title: "Mix Collection",
      artist: "Various Artists",
      description: "Curated selection of electronic music",
      thumbnailUrl: "",
      platform: "soundcloud", 
      url: "https://on.soundcloud.com/sibo68x0qIQwOfpgiM",
      duration: "38:15",
      genre: ["Electronic", "House"],
      featured: true
    },
    {
      id: 3,
      title: "how did i do",
      artist: "Jarrad",
      description: "Eclectic mix spanning multiple genres and eras",
      thumbnailUrl: "https://i1.sndcdn.com/artworks-yTAoZ8kgHtg2A96q-WbqI7Q-t500x500.jpg",
      platform: "soundcloud",
      url: "https://soundcloud.com/jarradsubstack/how-did-i-do",
      duration: "61:42",
      genre: ["Electronic", "Experimental"],
      featured: true
    }
  ];

  const allMixes: Mix[] = [
    ...featuredMixes,
    // Additional mixes can be added here
  ];

  const scrollToMix = (index: number) => {
    setCurrentMixIndex(index);
    if (carouselRef.current) {
      const mixWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: index * mixWidth,
        behavior: 'smooth'
      });
    }
  };

  const nextMix = () => {
    const nextIndex = (currentMixIndex + 1) % featuredMixes.length;
    scrollToMix(nextIndex);
  };

  const prevMix = () => {
    const prevIndex = currentMixIndex === 0 ? featuredMixes.length - 1 : currentMixIndex - 1;
    scrollToMix(prevIndex);
  };

  const extractSoundCloudId = (url: string): string | null => {
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
  };

  const getPlatformEmbed = (mix: Mix) => {
    switch (mix.platform) {
      case 'soundcloud':
        const soundcloudId = extractSoundCloudId(mix.url);
        if (soundcloudId) {
          return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${soundcloudId}&color=%23ff0000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }
        return null;
      case 'mixcloud':
        return mix.url.replace('mixcloud.com', 'mixcloud.com/widget/iframe/?hide_cover=1&light=1');
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Back to Home */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">MIXES</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-mono">
            Curated collection of mixes from our community
          </p>
        </div>

        {/* Featured Mix Carousel */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 font-mono text-red-500">FEATURED MIXES</h2>
          
          <div className="relative">
            {/* Carousel Navigation */}
            <button
              onClick={prevMix}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextMix}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex overflow-x-hidden scroll-smooth"
            >
              {featuredMixes.map((mix, index) => (
                <div
                  key={mix.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Mix Cover/Embed */}
                      <div className="lg:w-1/2">
                        {mix.platform === 'soundcloud' ? (
                          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={mix.thumbnailUrl} 
                              alt={`${mix.title} by ${mix.artist}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ccircle cx='200' cy='200' r='60' fill='%23d1d5db'/%3E%3Cpath d='M200 140v120' stroke='%23374151' stroke-width='2'/%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                              <p className="text-gray-600 font-mono">Audio Player</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mix Info */}
                      <div className="lg:w-1/2 flex flex-col justify-center">
                        <h3 className="text-3xl font-bold mb-2 font-mono text-red-500">
                          {mix.title}
                        </h3>
                        <p className="text-xl text-gray-600 mb-4 font-mono">{mix.artist}</p>
                        
                        <p className="text-gray-600 mb-6 font-mono">
                          {mix.description}
                        </p>
                        
                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {mix.genre.map((g, i) => (
                            <span
                              key={i}
                              className="bg-red-500 text-white px-3 py-1 text-sm font-mono"
                            >
                              {g}
                            </span>
                          ))}
                          {mix.duration && (
                            <span className="bg-gray-600 text-white px-3 py-1 text-sm font-mono">
                              {mix.duration}
                            </span>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <a 
                            href={mix.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-red-500 hover:bg-red-600 text-white font-mono font-semibold py-3 px-6 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5 mr-2" />
                            Listen on {mix.platform === 'soundcloud' ? 'SoundCloud' : mix.platform}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {featuredMixes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToMix(index)}
                  className={`w-3 h-3 transition-colors ${
                    index === currentMixIndex ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* All Mixes Grid */}
        <section>
          <h2 className="text-3xl font-bold mb-8 font-mono text-red-500">ALL MIXES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allMixes.map((mix) => (
              <div
                key={mix.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-red-500 transition-colors group"
              >
                {/* Mix Thumbnail */}
                <div className="aspect-square bg-white rounded-lg mb-4 overflow-hidden relative">
                  {mix.thumbnailUrl ? (
                    <img 
                      src={mix.thumbnailUrl} 
                      alt={`${mix.title} by ${mix.artist}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <Play className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-xs font-mono">Audio Mix</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                      <Play className="h-4 w-4 mr-1" />
                      PLAY
                    </Button>
                  </div>
                </div>
                
                {/* Mix Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg leading-tight font-mono">
                    {mix.title}
                  </h3>
                  <p className="text-gray-600 font-mono">{mix.artist}</p>
                  
                  {/* Genre Tags */}
                  <div className="flex flex-wrap gap-1">
                    {mix.genre.slice(0, 2).map((genre, index) => (
                      <span
                        key={index}
                        className="bg-red-500 text-white px-2 py-1 text-xs font-mono"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  
                  {/* Platform Link */}
                  <a 
                    href={mix.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-mono text-gray-600 hover:text-red-500 gap-1 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {mix.platform.toUpperCase()}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}