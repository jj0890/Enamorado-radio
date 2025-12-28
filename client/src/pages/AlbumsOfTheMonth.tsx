import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
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
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch albums from API
  const { data: albumsData, isLoading: isLoadingAlbums, error: albumsError } = useQuery({
    queryKey: ['/api/albums'],
    queryFn: async () => {
      const response = await fetch('/api/albums?page=1&limit=12');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      return response.json();
    }
  });

  const albums = albumsData?.albums || [];

  // Enrich albums with real artwork when albums are loaded
  useEffect(() => {
    if (albums.length === 0) return;

    const loadAlbumArtwork = async () => {
      console.log('[Albums] Starting artwork enrichment...');
      setEnrichmentFailed(false);
      
      const albumsToEnrich = albums.map((album: any) => ({
        id: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        spotifyUrl: album.spotifyUrl,
        releaseYear: album.releaseYear
      }));

      try {
        const enriched = await enrichMultipleAlbums(albumsToEnrich);
        console.log('[Albums] Enrichment complete:', enriched);
        
        // Merge back with original album data using title + artist matching for better reliability
        const updatedAlbums = albums.map((album: any) => {
          const enrichedData = enriched.find(e => 
            e.title.toLowerCase() === album.title.toLowerCase() && 
            e.artist.toLowerCase() === album.artist.toLowerCase()
          );
          return {
            ...album,
            id: parseInt(album.id), // Ensure ID is number for consistency
            coverUrl: enrichedData?.coverUrl || '/default-cover.jpg', // No AI fallback
            spotifyUrl: enrichedData?.spotifyUrl || album.spotifyUrl || 
              `https://open.spotify.com/search/${encodeURIComponent(album.artist + " " + album.title)}`
          };
        });
        
        setEnrichedAlbums(updatedAlbums);
      } catch (error) {
        console.error('[Albums] Enrichment failed:', error);
        setEnrichmentFailed(true);
        // Fallback to original album data with default covers
        const fallbackAlbums = albums.map((album: any) => ({
          ...album,
          id: parseInt(album.id),
          coverUrl: '/default-cover.jpg', // No AI fallback
          spotifyUrl: album.spotifyUrl || 
            `https://open.spotify.com/search/${encodeURIComponent(album.artist + " " + album.title)}`
        }));
        setEnrichedAlbums(fallbackAlbums);
      }
    };

    loadAlbumArtwork();
  }, [albums]);

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
        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-navy transition-colors font-mono"
          >
            ← Back to Home
          </Link>
        </div>
        
        {/* NTS-Style Header */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-wide mb-4 font-mono">
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
              {isLoadingAlbums ? (
                // Loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="border-r-2 border-b-2 border-black p-6 bg-gray-50">
                    <div className="aspect-square mb-4 bg-gray-200 flex items-center justify-center">
                      <Disc className="w-16 h-16 text-gray-400 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : (
                (enrichedAlbums.length > 0 ? enrichedAlbums : albums).map((album: any, index: number) => (
                <div
                  key={album.id}
                  className="border-r-2 border-b-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                  onMouseEnter={() => handleAlbumHover(album.id)}
                  onMouseLeave={() => handleAlbumHover(null)}
                  onClick={() => setSelectedAlbum(album)}
                >
                  {/* Album Cover */}
                  <div className="aspect-square mb-4 relative overflow-hidden bg-white">
                    {album.coverUrl && album.coverUrl !== '/default-cover.jpg' ? (
                      <img 
                        src={album.coverUrl} 
                        alt={`${album.title} by ${album.artist}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace with disc icon fallback when image fails
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                                <div class="text-center text-gray-400">
                                  <svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                                  </svg>
                                  <p class="text-xs font-mono">No Cover Art</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Disc className="w-16 h-16 mx-auto mb-2" />
                          <p className="text-xs font-mono">No Cover Art</p>
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
                  
                  {/* Album Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg uppercase tracking-wide leading-tight">
                      {album.title}
                    </h3>
                    
                    <p className="text-base font-medium">
                      {album.artist}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 pt-2">
                      {album.genre.map((g: string, genreIndex: number) => (
                        <span key={genreIndex} className="text-xs font-mono bg-black text-white px-2 py-1">
                          {g}
                        </span>
                      ))}
                      <span className="text-xs font-mono bg-black text-white px-2 py-1">
                        {album.releaseYear ?? "Unknown Year"}
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
                ))
              )}
            </div>
            
            {/* Error UI */}
            {enrichmentFailed && (
              <div className="text-navy font-mono text-sm mt-4 p-4 border-2 border-red-200 bg-red-50">
                ⚠️ Some album artwork couldn't be loaded from MusicBrainz.
              </div>
            )}
            
            {albumsError && (
              <div className="text-navy font-mono text-sm mt-4 p-4 border-2 border-red-200 bg-red-50">
                ⚠️ Failed to load albums. Please try again later.
              </div>
            )}
          </div>
        </div>

        {/* Selected Album Detail - Clean Style */}
        {selectedAlbum && (
          <div className="bg-red-50 border-2 border-navy p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={selectedAlbum.coverUrl} 
                  alt={`${selectedAlbum.title} by ${selectedAlbum.artist}`}
                  className="w-full max-w-xs mx-auto border-2 border-gray-200"
                />
              </div>
              <div className="md:w-2/3">
                <h3 className="text-3xl font-bold mb-2 font-mono text-navy">{selectedAlbum.title}</h3>
                <p className="text-xl text-gray-600 mb-4 font-mono">{selectedAlbum.artist}</p>
                <p className="text-gray-600 mb-4 text-lg leading-relaxed font-mono">{selectedAlbum.description}</p>
                
                <div className="flex gap-2 mb-6">
                  {selectedAlbum.genre.map((genre, index) => (
                    <span key={index} className="bg-navy text-white px-3 py-1 text-sm font-mono">
                      {genre}
                    </span>
                  ))}
                  <span className="bg-gray-600 text-white px-3 py-1 text-sm font-mono">
                    {selectedAlbum.releaseYear}
                  </span>
                </div>
                
                {/* Streaming Links */}
                <div className="flex flex-wrap gap-3">
                  {selectedAlbum.spotifyUrl && (
                    <a 
                      href={selectedAlbum.spotifyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-navy hover:bg-navy-dark text-white px-6 py-2 font-mono transition-colors flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Spotify
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Section */}
        <div className="border-t-2 border-gray-300 pt-8">
          <h2 className="text-2xl font-semibold mb-4 font-mono text-navy">Previous Months</h2>
          <p className="text-gray-600 mb-6 font-mono">
            albums for your listening pleasure. Explore our curated picks below or dive into our archive to discover past selections.
          </p>
          <a 
            href="/editorial-picks"
            className="inline-flex items-center bg-navy hover:bg-navy-dark text-white px-6 py-3 font-mono transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Editorial Picks Archive
          </a>
        </div>
      </div>
    </div>
  );
}