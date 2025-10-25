import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Users, Music, Heart, Play, Calendar, Compass } from "lucide-react";
import { HeroOption3_FullWidth } from "./HomePageAlt";

// Components (use your alias/paths; adjust if different)
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import RadioStreamPlayer from "@/components/RadioStreamPlayer";
import { FeaturedMixCard } from "@/components/FeaturedMixCard";
import PublicMixCard from "@/components/PublicMixCard";
import SimpleSongForm from "@/components/SimpleSongForm";
import ThemeToggle from "@/components/ThemeToggle";

// Optional util (only needed if your FeaturedMixCard wants it)
import { getTrackThumbnail } from "@/utils/soundcloud";

// Updated to match server response format
interface FeaturedSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  artUrl?: string;
  metadata?: any;
  submittedAt: string;
  featureOnSite?: boolean;
}

export default function Home() {
  const [showSongSubmission, setShowSongSubmission] = useState(false);
  const [trackThumbnails, setTrackThumbnails] = useState<Record<number, string>>({});

  // --- DATA: Featured DJ submissions (for big centered feature) ---
  const { data: featuredSubmissions = [] } = useQuery<FeaturedSubmission[]>({
    queryKey: ["/api/public/mixes/featured"],
  });

  // --- DATA: Fresh mixes (same cards as /mixes) ---
  const { data: freshMixes = [] } = useQuery({
    queryKey: ["/api/public/mixes", { limit: 6 }],
    queryFn: async () => {
      const r = await fetch("/api/public/mixes?limit=6", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch mixes");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  // --- DATA: Current month's album pick for featured section ---
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const { data: currentMonthPick } = useQuery({
    queryKey: ["/api/albums/published", getCurrentMonth()],
    queryFn: async () => {
      const currentMonth = getCurrentMonth();
      const r = await fetch(`/api/albums/published/${currentMonth}`);
      if (!r.ok) {
        if (r.status === 404) return null; // No pick for current month
        throw new Error("Failed to fetch current month pick");
      }
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  // If your FeaturedMixCard wants thumbnails (SoundCloud/Mixcloud helpers)
  useEffect(() => {
    if (!featuredSubmissions.length) return;
    (async () => {
      const thumbs: Record<number, string> = {};
      for (const sub of featuredSubmissions) {
        try {
          const t = await getTrackThumbnail(sub);
          if (t) thumbs[sub.id] = t;
        } catch (err) {
          console.warn("thumbnail error", sub.id, err);
        }
      }
      setTrackThumbnails(thumbs);
    })();
  }, [featuredSubmissions]);

  const featuredSubmission = featuredSubmissions[0];

  // Rotate featured album based on day of month
  const getFeaturedAlbum = () => {
    if (!currentMonthPick || !currentMonthPick.items || currentMonthPick.items.length === 0) {
      return null;
    }
    const dayOfMonth = new Date().getDate();
    const index = (dayOfMonth - 1) % currentMonthPick.items.length;
    return currentMonthPick.items[index];
  };

  const featuredAlbum = getFeaturedAlbum();

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors">
      {/* Bottom sticky player (keep if you’ve been using it) */}
      <StickyRadioPlayer />

      {/* Top utility/info bar (optional, small) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-2 text-sm font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">ENAMORADO RADIO</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 dark:text-gray-400">SAN ANTONIO</span>
          </div>
        </div>
      </div>

      {/* Main header / nav */}
      <header className="fixed top-10 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/episodes" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  EPISODES
                </Link>
                <Link href="/schedule" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
                <Link href="/submit-mix" className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  SUBMIT
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-32 pb-28 px-4 max-w-7xl mx-auto">
        {/* HERO - Full Width Banner */}
        <HeroOption3_FullWidth />

        {/* About Blurb – centered, compact */}
        <section className="max-w-3xl mx-auto mt-6 mb-12 text-center">
          <h3 className="font-mono text-2xl text-red-500 mb-2">About Enamorado Radio</h3>
          <p className="text-gray-700 dark:text-gray-300 font-mono">
            Listener-driven internet radio from San Antonio. Dedicated to the music we are enamored with, we feature community mixes,
            resident shows, and themed programming. Submit a mix, suggest a track, or just tune in.
          </p>
        </section>

        {/* Explore tiles (from your “clean” page) */}
        <section className="mb-16">
          <div className="text-center pt-16 pb-8 mb-8">
            <h2 className="text-3xl font-bold mb-4 font-mono text-red-500">EXPLORE</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-mono">
              Discover curated content, join our community, and contribute to the station
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/albums"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">EDITORIAL/STAFF PICKS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Hand-selected favorites from our editorial team.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  EXPLORE PICKS →
                </div>
              </div>
            </Link>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">RESIDENT APPLICATIONS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Apply for a regular slot and become part of our programming lineup.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  APPLY FOR SEASON 1 →
                </div>
              </div>
            </a>

            <Link
              href="/submit-mix"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">SUBMIT A MIX</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Share your DJ mixes with our community.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  SUBMIT MIX →
                </div>
              </div>
            </Link>

            <button
              onClick={() => setShowSongSubmission(true)}
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer text-left w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">SONG SUGGESTIONS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Suggest tracks for rotation. Community picks may be featured.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  SUGGEST SONGS →
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Featured Album from Albums of the Month */}
        {featuredAlbum && currentMonthPick && (
          <section className="mb-16">
            <Link 
              href="/albums" 
              className="block group"
              data-testid="link-featured-album"
            >
              <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-black p-8 md:p-12 hover:border-red-500 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Album Artwork */}
                  <div className="w-full md:w-64 h-64 flex-shrink-0">
                    {featuredAlbum.album.coverArtUrl ? (
                      <img
                        src={featuredAlbum.album.coverArtUrl}
                        alt={`${featuredAlbum.album.title} by ${featuredAlbum.album.artist}`}
                        className="w-full h-full object-cover border-2 border-black shadow-lg"
                        data-testid={`img-featured-album-${featuredAlbum.album.id}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 border-2 border-black flex items-center justify-center">
                        <Music className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-block bg-red-500 text-white px-3 py-1 text-xs font-mono mb-4">
                      FROM ALBUMS OF THE MONTH
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-2 font-mono group-hover:text-red-500 transition-colors" data-testid="text-featured-album-title">
                      {featuredAlbum.album.title}
                    </h3>
                    <p className="text-xl text-gray-600 mb-4 font-mono" data-testid="text-featured-album-artist">
                      {featuredAlbum.album.artist}
                      {featuredAlbum.album.releaseYear && ` (${featuredAlbum.album.releaseYear})`}
                    </p>
                    {featuredAlbum.album.reason && (
                      <p className="text-gray-700 mb-4 font-mono italic max-w-2xl" data-testid="text-featured-album-reason">
                        "{featuredAlbum.album.reason}"
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                      <span className="inline-block bg-black text-white px-4 py-2 text-sm font-mono">
                        #{featuredAlbum.rank} in {currentMonthPick.title}
                      </span>
                      {featuredAlbum.album.spotifyUrl && (
                        <a
                          href={featuredAlbum.album.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-green-500 text-white px-4 py-2 text-sm font-mono hover:bg-green-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          data-testid="button-spotify-featured"
                        >
                          🎵 Listen on Spotify
                        </a>
                      )}
                      <span className="text-red-500 font-mono text-sm group-hover:underline">
                        View All Picks →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Fresh From the Community — uses the SAME card as /mixes */}
        {freshMixes.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between pt-16 pb-8 mb-8">
              <h2 className="text-3xl font-bold font-mono text-red-500">
                FRESH FROM THE COMMUNITY
              </h2>
              <Link href="/mixes" className="text-red-500 hover:text-red-600 font-mono">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {freshMixes.map((mix: any) => (
                <PublicMixCard key={mix.id} mix={mix} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {showSongSubmission && (
        <SimpleSongForm isOpen={showSongSubmission} onClose={() => setShowSongSubmission(false)} />
      )}
    </div>
  );
}
