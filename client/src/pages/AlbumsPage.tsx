import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Disc, ChevronRight, Sparkles, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

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

interface CommunityAlbum {
  id: number;
  artist: string;
  title: string;
  releaseYear?: number;
  coverArtUrl?: string;
  spotifyUrl?: string;
  submitterName?: string;
  reason?: string;
  likeCount: number;
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

  const { data: communityAlbums = [] } = useQuery<CommunityAlbum[]>({
    queryKey: ["/api/albums/community"],
    queryFn: async () => {
      const res = await fetch("/api/albums/community");
      if (!res.ok) return [];
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
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Disc className="w-12 h-12 animate-spin mx-auto mb-4 text-burnt-orange-500" />
            <p className="font-mono text-charcoal-600">Loading Albums...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="font-mono text-red-600">Failed to load album picks</p>
            <Link href="/" className="text-charcoal-900 hover:underline font-mono mt-4 inline-block">
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-charcoal-900">
      <StickyRadioPlayer />
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Header */}
        <div className="pt-10 pb-8 border-b border-black">
          <div className="flex items-center gap-3 mb-1">
            <Disc className="w-5 h-5 text-burnt-orange-500" />
            <span className="text-xs font-mono text-charcoal-400 uppercase tracking-widest">Music</span>
          </div>
          <h1 className="text-4xl font-bold font-mono text-charcoal-900 tracking-tight">Albums</h1>
          <p className="text-charcoal-500 mt-2 text-sm">
            Year-end lists, editorial picks, and community recommendations
          </p>
        </div>

        {/* Top 10 Albums 2025 Feature Banner */}
        <div className="mt-8 mb-10">
          <Link href="/albums/top-10-2025">
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
              data-testid="feature-top10-2025"
            >
              <div className="relative z-10 p-8 md:p-12">
                <Badge className="mb-4 bg-white/20 text-white border-white/30 font-mono">
                  <Sparkles className="w-3 h-3 mr-1" />
                  2025 YEAR IN REVIEW
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white font-mono mb-3">
                  Top 10 Albums of 2025
                </h2>
                <p className="text-white/70 font-mono text-sm max-w-xl mb-6">
                  An immersive scroll through the sounds that defined our year.
                </p>
                <Button
                  className="bg-white text-charcoal-900 hover:bg-white/90 font-mono group-hover:translate-x-1 transition-transform"
                  data-testid="button-view-top10"
                >
                  Explore the list
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Two-lane layout: Our Picks + Community Picks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── Left lane: Editorial Picks ── */}
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-charcoal-200">
              <Calendar className="w-4 h-4 text-charcoal-500" />
              <h2 className="text-xl font-bold font-mono text-charcoal-900">Our Picks</h2>
              <span className="text-xs font-mono text-charcoal-400 ml-auto">Editorial</span>
            </div>

            {picks.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-charcoal-200 rounded-lg">
                <p className="text-charcoal-400 font-mono text-sm">Monthly picks coming soon</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Latest Pick Featured */}
                {latestPickDetails && (
                  <Card className="border border-charcoal-200" data-testid="featured-pick">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-mono">{latestPickDetails.title}</CardTitle>
                        <Badge variant="outline" className="font-mono text-xs border-charcoal-300">
                          {latestPickDetails.month}
                        </Badge>
                      </div>
                      {latestPickDetails.description && (
                        <p className="text-charcoal-500 font-mono text-xs mt-1">{latestPickDetails.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {latestPickDetails.items.slice(0, 4).map((item) => (
                          <div key={item.id} className="group relative" data-testid={`album-item-${item.album.id}`}>
                            <div className="absolute -top-2 -left-2 z-10 bg-charcoal-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs">
                              {item.rank}
                            </div>
                            {item.album.spotifyUrl ? (
                              <a href={item.album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                className="block border border-charcoal-100 rounded overflow-hidden bg-white hover:shadow-md transition-shadow"
                                data-testid={`link-spotify-album-${item.album.id}`}
                              >
                                {item.album.coverArtUrl ? (
                                  <img src={item.album.coverArtUrl} alt={item.album.title} className="w-full aspect-square object-cover" />
                                ) : (
                                  <div className="w-full aspect-square bg-cream-100 flex items-center justify-center">
                                    <Disc className="w-8 h-8 text-charcoal-300" />
                                  </div>
                                )}
                                <div className="p-2">
                                  <div className="font-mono font-semibold text-xs truncate">{item.album.title}</div>
                                  <div className="text-xs text-charcoal-500 font-mono truncate">{item.album.artist}</div>
                                </div>
                              </a>
                            ) : (
                              <div className="border border-charcoal-100 rounded overflow-hidden bg-white">
                                {item.album.coverArtUrl ? (
                                  <img src={item.album.coverArtUrl} alt={item.album.title} className="w-full aspect-square object-cover" />
                                ) : (
                                  <div className="w-full aspect-square bg-cream-100 flex items-center justify-center">
                                    <Disc className="w-8 h-8 text-charcoal-300" />
                                  </div>
                                )}
                                <div className="p-2">
                                  <div className="font-mono font-semibold text-xs truncate">{item.album.title}</div>
                                  <div className="text-xs text-charcoal-500 font-mono truncate">{item.album.artist}</div>
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
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono text-charcoal-500 uppercase tracking-wider">Archive</h3>
                    {picks.slice(1).map((pick) => (
                      <div key={pick.id} className="flex items-center justify-between py-3 border-b border-charcoal-100" data-testid={`pick-${pick.month}`}>
                        <div>
                          <div className="font-mono font-semibold text-sm text-charcoal-900">{pick.title}</div>
                          {pick.description && <div className="text-xs text-charcoal-400 font-mono mt-0.5">{pick.description}</div>}
                        </div>
                        <Badge variant="outline" className="font-mono text-xs border-charcoal-300 flex-shrink-0">
                          {pick.month}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right lane: Community Picks ── */}
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-charcoal-200">
              <Heart className="w-4 h-4 text-burnt-orange-500" />
              <h2 className="text-xl font-bold font-mono text-charcoal-900">Community Loves</h2>
              <span className="text-xs font-mono text-charcoal-400 ml-auto">Listener picks</span>
            </div>

            {communityAlbums.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-charcoal-200 rounded-lg">
                <p className="text-charcoal-400 font-mono text-sm mb-3">No community picks yet</p>
                <Link href="/submit-album" className="text-xs font-mono text-burnt-orange-500 hover:underline">
                  Suggest an album →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {communityAlbums.map((album, index) => (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 py-3 border-b border-charcoal-100 group"
                    data-testid={`community-album-${album.id}`}
                  >
                    {/* Rank */}
                    <div className="w-6 text-center font-mono text-xs text-charcoal-400 flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Art */}
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-cream-100">
                      {album.coverArtUrl ? (
                        <img src={album.coverArtUrl} alt={album.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc className="w-5 h-5 text-charcoal-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm text-charcoal-900 truncate group-hover:text-burnt-orange-500 transition-colors">
                        {album.title}
                      </div>
                      <div className="text-xs text-charcoal-500 font-mono truncate">{album.artist}</div>
                      {album.releaseYear && (
                        <div className="text-xs text-charcoal-400 font-mono">{album.releaseYear}</div>
                      )}
                    </div>

                    {/* Like count + Spotify */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs font-mono text-burnt-orange-500">
                        <Heart className="w-3 h-3 fill-burnt-orange-500" />
                        {album.likeCount}
                      </div>
                      {album.spotifyUrl && (
                        <a
                          href={album.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-charcoal-400 hover:text-charcoal-900 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Spotify ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Suggestion CTA */}
        <div className="mt-16 border-t border-charcoal-100 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-mono text-charcoal-900 mb-1">Got a rec?</h3>
            <p className="font-mono text-charcoal-500 text-sm">Submit an album suggestion for the community to vote on</p>
          </div>
          <Link href="/submit-album">
            <Button className="bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-mono">
              Suggest an Album
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
