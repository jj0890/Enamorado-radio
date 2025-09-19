import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Settings, Star, Users, Music, Heart, Play, Calendar, Compass } from "lucide-react";

// Components (use your alias/paths; adjust if different)
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import RadioStreamPlayer from "@/components/RadioStreamPlayer";
import { FeaturedMixCard } from "@/components/FeaturedMixCard";
import PublicMixCard from "@/components/PublicMixCard";
import SimpleSongForm from "@/components/SimpleSongForm";
import LastFmDebugPanel from "@/components/LastFmDebugPanel";

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
  const [showDebugPanel, setShowDebugPanel] = useState(false);
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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Bottom sticky player (keep if you’ve been using it) */}
      <StickyRadioPlayer />

      {/* Top utility/info bar (optional, small) */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2 text-sm font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">ENAMORADO RADIO</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">SAN ANTONIO</span>
          </div>
        </div>
      </div>

      {/* Main header / nav */}
      <header className="fixed top-10 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  EPISODES
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
                <Link href="/submit-mix" className="text-gray-600 hover:text-red-500 transition-colors">
                  SUBMIT
                </Link>
              </nav>
            </div>
            <button
              onClick={() => setShowDebugPanel(true)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Debug Panel"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-32 pb-28 px-4 max-w-7xl mx-auto">
        {/* HERO */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 font-mono text-red-500">ENAMORADO RADIO</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 font-mono">
            A space dedicated to the things we are enamored with.
          </p>

          {/* Quick Actions (kept from your first homepage) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link
              href="/latest"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">LATEST</h3>
                <p className="text-gray-600 font-mono text-sm">Recent episodes and mixes</p>
              </div>
            </Link>

            <Link
              href="/explore"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">EXPLORE</h3>
                <p className="text-gray-600 font-mono text-sm">Curated guides and themes</p>
              </div>
            </Link>

            <Link
              href="/schedule"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">SCHEDULE</h3>
                <p className="text-gray-600 font-mono text-sm">Upcoming shows and events</p>
              </div>
            </Link>

            <Link
              href="/submit-mix"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">SUBMIT</h3>
                <p className="text-gray-600 font-mono text-sm">Share your mix</p>
              </div>
            </Link>
          </div>
        </section>


        {/* About Blurb – centered, compact */}
        <section className="max-w-3xl mx-auto mt-6 mb-12 text-center">
          <h3 className="font-mono text-2xl text-red-500 mb-2">About Enamorado Radio</h3>
          <p className="text-gray-700 font-mono">
            Listener-driven internet radio from San Antonio. Dedicated to the music we are enamored with, we feature community mixes,
            resident shows, and themed programming. Submit a mix, suggest a track, or just tune in.
          </p>
        </section>

        {/* Explore tiles (from your “clean” page) */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-mono text-red-500">EXPLORE</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-mono">
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

        {/* Fresh From the Community — uses the SAME card as /mixes */}
        {freshMixes.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold font-mono text-red-500">
                FRESH FROM THE COMMUNITY
              </h2>
              <Link href="/mixes" className="text-red-500 hover:text-red-600 font-mono">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      {showDebugPanel && (
        <LastFmDebugPanel isOpen={showDebugPanel} onClose={() => setShowDebugPanel(false)} />
      )}
    </div>
  );
}
