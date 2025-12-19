import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Disc, ChevronRight, Star, Sparkles } from "lucide-react";
import { top10Albums2025 } from "@/data/top10Albums2025";

interface AlbumSuggestion {
  id: number;
  artist: string;
  title: string;
  releaseYear?: number;
  coverArtUrl?: string;
  spotifyUrl?: string;
}

interface AlbumPickItem {
  id: number;
  suggestionId: number;
  rank: number;
  blurb?: string;
  album: AlbumSuggestion;
}

interface AlbumPick {
  id: number;
  month: string;
  title: string;
  description?: string;
  publishedAt: string;
  items: AlbumPickItem[];
}

export default function AlbumsPage() {
  const { data: picks = [], isLoading, error } = useQuery<AlbumPick[]>({
    queryKey: ["/api/albums/published"],
    queryFn: async () => {
      const res = await fetch("/api/albums/published");
      if (!res.ok) throw new Error("Failed to load album picks");
      return res.json();
    },
  });

  // Get the most recent pick for featured display
  const latestPick = picks[0];

  // Get the detailed view of the latest pick
  const { data: latestPickDetails } = useQuery<AlbumPick>({
    queryKey: ["/api/albums/published", latestPick?.month],
    queryFn: async () => {
      if (!latestPick) return null;
      const res = await fetch(`/api/albums/published/${latestPick.month}`);
      if (!res.ok) throw new Error("Failed to load pick details");
      return res.json();
    },
    enabled: !!latestPick,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center">
        <div className="text-center">
          <Disc className="w-12 h-12 animate-spin mx-auto mb-4 text-navy" />
          <p className="font-mono text-gray-600">Loading Albums of the Month...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-red-600">Failed to load album picks</p>
          <Link href="/" className="text-navy hover:underline font-mono mt-4 inline-block">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="min-h-screen bg-[#FEFCF9]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="pt-16 pb-8 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Disc className="w-8 h-8 text-navy" />
              <h1 className="text-4xl font-bold font-mono text-navy">Albums</h1>
            </div>
            <p className="font-mono text-gray-600">Year-end lists and curated monthly picks from our community</p>
          </div>

          {/* Top 10 Albums 2025 Feature Banner */}
          <Link href="/albums/top-10-2025">
            <div 
              className="relative mb-12 rounded-xl overflow-hidden cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #003F87 0%, #001F43 60%, #000 100%)'
              }}
              data-testid="feature-top10-2025"
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-0.5">
                  {top10Albums2025.albums.slice(0, 10).map((album, i) => (
                    <div 
                      key={i}
                      className="bg-cover bg-center"
                      style={{ backgroundImage: `url(${album.coverArtUrl})` }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="relative z-10 p-8 md:p-12">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-4 bg-white/20 text-white border-white/30 font-mono">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {top10Albums2025.year} YEAR IN REVIEW
                    </Badge>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono mb-4">
                      {top10Albums2025.title}
                    </h2>
                    
                    <p className="text-white/70 font-mono text-sm md:text-base max-w-xl mb-6">
                      Our most anticipated albums from {top10Albums2025.year}. An immersive scroll experience through the sounds that defined our year.
                    </p>
                    
                    <Button 
                      className="bg-white text-navy hover:bg-white/90 font-mono group-hover:translate-x-1 transition-transform"
                      data-testid="button-view-top10"
                    >
                      Explore the list
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-1 text-white/40">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Monthly Picks Coming Soon */}
          <div className="text-center py-16">
            <div className="flex items-center gap-3 justify-center mb-6">
              <Calendar className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold font-mono text-gray-600">Albums of the Month</h2>
            </div>
            <p className="font-mono text-gray-500 mb-8">
              Our curated monthly album picks are coming soon. Check back later!
            </p>
            
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg border-2 border-gray-200">
              <h3 className="text-xl font-bold font-mono text-gray-900 mb-2">
                Have an album to suggest?
              </h3>
              <p className="font-mono text-gray-600 mb-4 text-sm">
                Help us curate our first monthly picks by submitting your album suggestions
              </p>
              <Link 
                href="/submit-album" 
                className="inline-block bg-navy text-white px-6 py-3 rounded font-mono hover:bg-navy-dark transition-colors"
                data-testid="button-suggest-album"
              >
                Submit Album Suggestion
              </Link>
            </div>

            <Link href="/" className="text-navy hover:underline font-mono mt-8 inline-block">
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="pt-16 pb-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Disc className="w-8 h-8 text-navy" />
            <h1 className="text-4xl font-bold font-mono text-navy">Albums</h1>
          </div>
          <p className="font-mono text-gray-600">Year-end lists and curated monthly picks from our community</p>
        </div>

        {/* Top 10 Albums 2025 Feature Banner */}
        <Link href="/albums/top-10-2025">
          <div 
            className="relative mb-12 rounded-xl overflow-hidden cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #003F87 0%, #001F43 60%, #000 100%)'
            }}
            data-testid="feature-top10-2025"
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-0.5">
                {top10Albums2025.albums.slice(0, 10).map((album, i) => (
                  <div 
                    key={i}
                    className="bg-cover bg-center"
                    style={{ backgroundImage: `url(${album.coverArtUrl})` }}
                  />
                ))}
              </div>
            </div>
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-4 bg-white/20 text-white border-white/30 font-mono">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {top10Albums2025.year} YEAR IN REVIEW
                  </Badge>
                  
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-mono mb-4">
                    {top10Albums2025.title}
                  </h2>
                  
                  <p className="text-white/70 font-mono text-sm md:text-base max-w-xl mb-6">
                    Our most anticipated albums from {top10Albums2025.year}. An immersive scroll experience through the sounds that defined our year.
                  </p>
                  
                  <Button 
                    className="bg-white text-navy hover:bg-white/90 font-mono group-hover:translate-x-1 transition-transform"
                    data-testid="button-view-top10"
                  >
                    Explore the list
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="hidden md:flex items-center gap-1 text-white/40">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Monthly Picks Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-navy" />
          <h2 className="text-2xl font-bold font-mono text-navy">Albums of the Month</h2>
        </div>

        {/* Latest Pick Featured */}
        {latestPickDetails && (
          <Card className="mb-10 border-2 border-navy" data-testid="featured-pick">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-mono">{latestPickDetails.title}</CardTitle>
                <Badge className="bg-navy text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  {latestPickDetails.month}
                </Badge>
              </div>
              {latestPickDetails.description && (
                <p className="text-gray-600 font-mono mt-2">{latestPickDetails.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestPickDetails.items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative"
                    data-testid={`album-item-${item.album.id}`}
                  >
                    <div className="absolute -top-2 -left-2 z-10 bg-navy text-white w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono">
                      {item.rank}
                    </div>
                    {item.album.spotifyUrl ? (
                      <a
                        href={item.album.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded-lg overflow-hidden bg-white transition-shadow hover:shadow-lg"
                        data-testid={`link-spotify-album-${item.album.id}`}
                      >
                        {item.album.coverArtUrl ? (
                          <img
                            src={item.album.coverArtUrl}
                            alt={`${item.album.title} cover`}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <Disc className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="p-3">
                          <div className="font-mono font-semibold text-sm truncate">
                            {item.album.title}
                          </div>
                          <div className="text-sm text-gray-600 font-mono truncate">
                            {item.album.artist}
                          </div>
                          {item.album.releaseYear && (
                            <div className="text-xs text-gray-500 font-mono">
                              {item.album.releaseYear}
                            </div>
                          )}
                          {item.blurb && (
                            <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">
                              {item.blurb}
                            </p>
                          )}
                          <div className="text-xs text-navy font-mono mt-2 flex items-center gap-1">
                            🎵 Listen on Spotify
                          </div>
                        </div>
                      </a>
                    ) : (
                      <div className="border rounded-lg overflow-hidden bg-white transition-shadow hover:shadow-lg">
                        {item.album.coverArtUrl ? (
                          <img
                            src={item.album.coverArtUrl}
                            alt={`${item.album.title} cover`}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <Disc className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="p-3">
                          <div className="font-mono font-semibold text-sm truncate">
                            {item.album.title}
                          </div>
                          <div className="text-sm text-gray-600 font-mono truncate">
                            {item.album.artist}
                          </div>
                          {item.album.releaseYear && (
                            <div className="text-xs text-gray-500 font-mono">
                              {item.album.releaseYear}
                            </div>
                          )}
                          {item.blurb && (
                            <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">
                              {item.blurb}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous Picks */}
        {picks.length > 1 && (
          <div>
            <h2 className="text-2xl font-bold font-mono text-gray-900 mb-6">Previous Picks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {picks.slice(1).map((pick) => (
                <Card key={pick.id} className="hover:shadow-lg transition-shadow" data-testid={`pick-${pick.month}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-mono">{pick.title}</CardTitle>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {pick.month}
                      </Badge>
                    </div>
                    {pick.description && (
                      <p className="text-sm text-gray-600 font-mono mt-1">{pick.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 font-mono">
                      Published {new Date(pick.publishedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submit Suggestion CTA */}
        <div className="mt-12 text-center p-8 bg-white rounded-lg border-2 border-gray-200">
          <h3 className="text-xl font-bold font-mono text-gray-900 mb-2">
            Have an album to suggest?
          </h3>
          <p className="font-mono text-gray-600 mb-4">
            Submit your album suggestions and help shape our monthly picks
          </p>
          <Link 
            href="/submit-album" 
            className="inline-block bg-navy text-white px-6 py-3 rounded font-mono hover:bg-navy-dark transition-colors"
          >
            Submit Album Suggestion
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-navy hover:underline font-mono">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
