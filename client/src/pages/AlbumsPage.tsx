import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Disc } from "lucide-react";

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
          <Disc className="w-12 h-12 animate-spin mx-auto mb-4 text-red-500" />
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
          <Link href="/" className="text-red-500 hover:underline font-mono mt-4 inline-block">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="min-h-screen bg-[#FEFCF9]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <Disc className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h1 className="text-4xl font-bold font-mono text-gray-900 mb-4">Albums of the Month</h1>
            <p className="font-mono text-gray-600 mb-8">
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
                className="inline-block bg-red-500 text-white px-6 py-3 rounded font-mono hover:bg-red-600 transition-colors"
                data-testid="button-suggest-album"
              >
                Submit Album Suggestion
              </Link>
            </div>

            <Link href="/" className="text-red-500 hover:underline font-mono mt-8 inline-block">
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
            <Disc className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl font-bold font-mono text-red-500">Albums of the Month</h1>
          </div>
          <p className="font-mono text-gray-600">Curated monthly album picks from our community</p>
        </div>

        {/* Latest Pick Featured */}
        {latestPickDetails && (
          <Card className="mb-10 border-2 border-red-500" data-testid="featured-pick">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-mono">{latestPickDetails.title}</CardTitle>
                <Badge className="bg-red-500 text-white">
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
                    <div className="absolute -top-2 -left-2 z-10 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono">
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
                          <div className="text-xs text-red-500 font-mono mt-2 flex items-center gap-1">
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
            className="inline-block bg-red-500 text-white px-6 py-3 rounded font-mono hover:bg-red-600 transition-colors"
          >
            Submit Album Suggestion
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-red-500 hover:underline font-mono">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
