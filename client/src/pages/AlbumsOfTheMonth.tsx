import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, ExternalLink, ChevronLeft, ChevronRight, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  description: string;
  genre: string[];
  releaseYear: number;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  bandcampUrl?: string;
  featured: boolean;
  month: string;
  year: number;
}

export default function AlbumsOfTheMonth() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isVinylVisible, setIsVinylVisible] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock data - would come from API
  const albums: Album[] = [
    {
      id: 1,
      title: "Burning Desire",
      artist: "MIKE",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      description: "A raw, introspective journey through consciousness and community.",
      genre: ["Hip-Hop", "Experimental"],
      releaseYear: 2024,
      spotifyUrl: "https://open.spotify.com/album/example1",
      appleMusicUrl: "https://music.apple.com/album/example1",
      featured: true,
      month: "January",
      year: 2025
    },
    {
      id: 2,
      title: "Getz/Gilberto",
      artist: "Stan Getz & João Gilberto",
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
      description: "The quintessential bossa nova album that defined a generation.",
      genre: ["Jazz", "Bossa Nova"],
      releaseYear: 1964,
      spotifyUrl: "https://open.spotify.com/album/example2",
      appleMusicUrl: "https://music.apple.com/album/example2",
      featured: true,
      month: "January",
      year: 2025
    },
    {
      id: 3,
      title: "Love Deluxe",
      artist: "Sade",
      coverUrl: "https://images.unsplash.com/photo-1518367764-2a3e72e153c2?w=400&h=400&fit=crop",
      description: "Smooth sophistication meets emotional depth in this timeless classic.",
      genre: ["R&B", "Soul"],
      releaseYear: 1992,
      spotifyUrl: "https://open.spotify.com/album/example3",
      bandcampUrl: "https://sade.bandcamp.com/album/love-deluxe",
      featured: true,
      month: "January",
      year: 2025
    },
    {
      id: 4,
      title: "Breath from Another",
      artist: "Esthero",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      description: "Ethereal vocals meet downtempo beats in this underground masterpiece.",
      genre: ["Electronic", "Trip-Hop"],
      releaseYear: 1998,
      spotifyUrl: "https://open.spotify.com/album/example4",
      featured: true,
      month: "January",
      year: 2025
    }
  ];

  const handleAlbumHover = (albumId: number | null) => {
    setIsVinylVisible(albumId);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Editorial Header */}
        <div className="mb-20">
          <h1 className="font-serif text-7xl font-light mb-8 text-white tracking-tight leading-none">
            Albums of<br />the Month
          </h1>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <p className="text-neutral-300 text-xl font-light max-w-2xl leading-relaxed">
              Four standout albums selected by our editorial team. Each pick represents a moment in music worth preserving.
            </p>
            <div className="text-neutral-500 text-sm font-mono">
              JANUARY 2025 SELECTION
            </div>
          </div>
        </div>

        {/* Current Month Feature */}
        <div className="mb-20">
          <h2 className="font-serif text-3xl font-light mb-12 text-neutral-200">
            Current Selection
          </h2>
          
          {/* Cover Flow Style Gallery */}
          <div className="relative">
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Asymmetric Albums Layout */}
            <div className="grid grid-cols-12 gap-8 auto-rows-min">
              {albums.map((album, index) => {
                // Create varied sizing - featured album is larger
                const isFeatured = index === 0;
                const isLarge = index === 1;
                const spanClass = isFeatured ? 'col-span-6' : isLarge ? 'col-span-4' : 'col-span-3';
                const sizeClass = isFeatured ? 'w-full aspect-square' : isLarge ? 'w-full aspect-square' : 'w-full aspect-square';
                
                return (
                  <div
                    key={album.id}
                    className={`${spanClass} ${isFeatured ? 'row-span-2' : ''}`}
                  >
                    <div
                      className="relative group cursor-pointer"
                      onMouseEnter={() => handleAlbumHover(album.id)}
                      onMouseLeave={() => handleAlbumHover(null)}
                      onClick={() => setSelectedAlbum(album)}
                    >
                      {/* Album Cover with Varied Styling */}
                      <div className={`relative ${sizeClass} transform transition-all duration-500 group-hover:scale-[1.02]`}>
                        <img 
                          src={album.coverUrl} 
                          alt={`${album.title} by ${album.artist}`}
                          className={`w-full h-full object-cover shadow-2xl ${
                            isFeatured ? 'rounded-none' : 'rounded-lg'
                          }`}
                        />
                        
                        {/* Vinyl Record Effect - Only for Featured */}
                        {isFeatured && (
                          <div 
                            className={`absolute -right-8 top-1/2 -translate-y-1/2 w-64 h-64 bg-black rounded-full border-8 border-neutral-800 transition-all duration-500 ${
                              isVinylVisible === album.id ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                            }`}
                            style={{
                              background: 'radial-gradient(circle, #1a1a1a 30%, #000 70%)',
                              boxShadow: 'inset 0 0 50px rgba(255,255,255,0.1)'
                            }}
                          >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-black rounded-full"></div>
                            </div>
                            <div className="absolute inset-4 rounded-full border border-neutral-600 opacity-30"></div>
                            <div className="absolute inset-8 rounded-full border border-neutral-600 opacity-20"></div>
                            <div className="absolute inset-12 rounded-full border border-neutral-600 opacity-10"></div>
                          </div>
                        )}
                        
                        {/* Editorial Badge for Featured */}
                        {isFeatured && (
                          <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 text-xs font-mono tracking-wide">
                            EDITOR'S CHOICE
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size={isFeatured ? "lg" : "default"} className="rounded-full bg-white text-black hover:bg-neutral-200">
                            <Play className="h-4 w-4 mr-2" />
                            Listen
                          </Button>
                        </div>
                      </div>
                      
                      {/* Album Info with Editorial Typography */}
                      <div className={`mt-6 ${isFeatured ? 'text-left' : 'text-center'}`}>
                        <h3 className={`font-bold mb-1 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                          {album.title}
                        </h3>
                        <p className={`text-neutral-400 mb-3 ${isFeatured ? 'text-lg' : 'text-base'}`}>
                          {album.artist}
                        </p>
                        
                        {/* Featured Description */}
                        {isFeatured && (
                          <p className="text-neutral-300 text-sm leading-relaxed mb-4 max-w-md">
                            {album.description}
                          </p>
                        )}
                        
                        <div className={`flex ${isFeatured ? 'justify-start' : 'justify-center'} gap-1 mb-3`}>
                          {album.genre.map((g, genreIndex) => (
                            <Badge key={genreIndex} variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                              {g}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                            {album.releaseYear}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Album Detail */}
        {selectedAlbum && (
          <div className="bg-gray-900 rounded-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={selectedAlbum.coverUrl} 
                  alt={`${selectedAlbum.title} by ${selectedAlbum.artist}`}
                  className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-3xl font-bold mb-2">{selectedAlbum.title}</h3>
                <p className="text-xl text-gray-300 mb-4">{selectedAlbum.artist}</p>
                <p className="text-gray-400 mb-4 text-lg leading-relaxed">{selectedAlbum.description}</p>
                
                <div className="flex gap-2 mb-6">
                  {selectedAlbum.genre.map((genre, index) => (
                    <Badge key={index} className="bg-purple-600">
                      {genre}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {selectedAlbum.releaseYear}
                  </Badge>
                </div>
                
                {/* Streaming Links */}
                <div className="flex flex-wrap gap-3">
                  {selectedAlbum.spotifyUrl && (
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                      <a href={selectedAlbum.spotifyUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Spotify
                      </a>
                    </Button>
                  )}
                  {selectedAlbum.appleMusicUrl && (
                    <Button asChild variant="outline">
                      <a href={selectedAlbum.appleMusicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apple Music
                      </a>
                    </Button>
                  )}
                  {selectedAlbum.bandcampUrl && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <a href={selectedAlbum.bandcampUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bandcamp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Section */}
        <div className="border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold mb-4">Previous Months</h2>
          <p className="text-gray-400 mb-6">
            albums for your listening pleasure. Explore our curated picks below or dive into our archive to discover past selections.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a href="/editorial-picks">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Editorial Picks Archive
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}