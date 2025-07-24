import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, ExternalLink, ChevronLeft, ChevronRight, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrichMultipleAlbums, type AlbumInfo } from '@/../../shared/musicApi';

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
  const [enrichedAlbums, setEnrichedAlbums] = useState<Album[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enrich albums with real artwork on component mount
  useEffect(() => {
    const loadAlbumArtwork = async () => {
      const albumsToEnrich = albums.map(album => ({
        id: album.id.toString(),
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        spotifyUrl: album.spotifyUrl
      }));

      const enriched = await enrichMultipleAlbums(albumsToEnrich);
      
      // Merge back with original album data
      const updatedAlbums = albums.map(album => {
        const enrichedData = enriched.find(e => e.id === album.id.toString());
        return {
          ...album,
          coverUrl: enrichedData?.coverUrl || album.coverUrl,
          spotifyUrl: enrichedData?.spotifyUrl || album.spotifyUrl
        };
      });
      
      setEnrichedAlbums(updatedAlbums);
    };

    loadAlbumArtwork();
  }, []);

  // Album data with real albums that exist in MusicBrainz
  const albums: Album[] = [
    {
      id: 1,
      title: "Kind of Blue",
      artist: "Miles Davis",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      description: "The quintessential jazz album that changed music forever.",
      genre: ["Jazz", "Modal Jazz"],
      releaseYear: 1959,
      spotifyUrl: "https://open.spotify.com/album/1weenld61qoidwYuZ1GESA",
      featured: true,
      month: "January",
      year: 2025
    },
    {
      id: 2,
      title: "The Velvet Underground & Nico",
      artist: "The Velvet Underground",
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
      description: "The album with the banana that launched a thousand art rock bands.",
      genre: ["Art Rock", "Experimental"],
      releaseYear: 1967,
      spotifyUrl: "https://open.spotify.com/album/4xwx0x7k6c5VuThz5qVqmV",
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
      spotifyUrl: "https://open.spotify.com/album/5th5BJGOc9RdyYKS9Kgm3A",
      featured: true,
      month: "January",
      year: 2025
    },
    {
      id: 4,
      title: "Breathe from Another",
      artist: "Esthero",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      description: "Ethereal vocals meet downtempo beats in this underground masterpiece.",
      genre: ["Electronic", "Trip-Hop"],
      releaseYear: 1998,
      spotifyUrl: "https://open.spotify.com/search/esthero%20breath%20from%20another",
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
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* NTS-Style Header */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-wide mb-4">
            ALBUMS OF THE MONTH
          </h1>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <p className="text-lg max-w-2xl">
              Four standout albums selected by our editorial team.
            </p>
            <div className="text-sm font-mono">
              JANUARY 2025 SELECTION
            </div>
          </div>
        </div>

        {/* Current Month Feature */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-8">
            CURRENT SELECTION
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

            {/* Clean Album Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
              {(enrichedAlbums.length > 0 ? enrichedAlbums : albums).map((album, index) => (
                <div
                  key={album.id}
                  className="border-r-2 border-b-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                  onMouseEnter={() => handleAlbumHover(album.id)}
                  onMouseLeave={() => handleAlbumHover(null)}
                  onClick={() => setSelectedAlbum(album)}
                >
                  {/* Album Cover */}
                  <div className="aspect-square mb-4 relative overflow-hidden">
                    <img 
                      src={album.coverUrl} 
                      alt={`${album.title} by ${album.artist}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                        <Play className="h-4 w-4 mr-1" />
                        PLAY
                      </Button>
                    </div>
                  </div>
                  
                  {/* Album Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg uppercase tracking-wide leading-tight">
                      {album.title}
                    </h3>
                    
                    <p className="text-base font-medium">
                      {album.artist}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 pt-2">
                      {album.genre.map((g, genreIndex) => (
                        <span key={genreIndex} className="text-xs font-mono bg-black text-white px-2 py-1">
                          {g}
                        </span>
                      ))}
                      <span className="text-xs font-mono bg-black text-white px-2 py-1">
                        {album.releaseYear}
                      </span>
                    </div>
                    
                    {/* Spotify Link */}
                    {album.spotifyUrl && (
                      <div className="pt-2">
                        <a 
                          href={album.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-gray-600 hover:text-black flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          SPOTIFY
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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