import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Music } from "lucide-react";
import LiveShowCard from "@/components/LiveShowCard";

// Components (use your alias/paths; adjust if different)
import RadioStreamPlayer from "@/components/RadioStreamPlayer";
import HeroStation from "@/components/HeroStation";
import { FeaturedMixCard } from "@/components/FeaturedMixCard";
import PublicMixCard from "@/components/PublicMixCard";
import ContentCard from "@/components/ContentCard";
import FeaturedHero from "@/components/FeaturedHero";
import Navigation from "@/components/Navigation";

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
  const [trackThumbnails, setTrackThumbnails] = useState<Record<number, string>>({});
  const [contentFilter, setContentFilter] = useState<'all' | 'mixes' | 'episodes'>('all');

  // --- DATA: Featured DJ submissions (for big centered feature) ---
  const { data: featuredSubmissions = [] } = useQuery<FeaturedSubmission[]>({
    queryKey: ["/api/public/mixes/featured"],
  });


  // --- DATA: Fresh mixes (unified endpoint for consistency) ---
  const { data: freshMixes = [] } = useQuery({
    queryKey: ["/api/community", { type: 'mix', limit: 12 }],
    queryFn: async () => {
      const r = await fetch("/api/community?type=mix&limit=12&sort=recent", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch mixes");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  // --- DATA: Fresh playlists ---
  const { data: freshPlaylists = [] } = useQuery({
    queryKey: ["/api/community", { type: 'playlist', limit: 6 }],
    queryFn: async () => {
      const r = await fetch("/api/community?type=playlist&limit=6&sort=recent", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch playlists");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  // --- DATA: All published episodes ---
  const { data: allEpisodes = [] } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: async () => {
      const r = await fetch("/api/episodes");
      if (!r.ok) throw new Error("Failed to fetch episodes");
      const episodes = await r.json();
      return episodes.filter((e: any) => e.status === 'published');
    },
    refetchOnWindowFocus: false,
  });

  // --- BLENDED FEED: Combine mixes, episodes, and playlists ---
  const blendedContent = useMemo(() => {
    const mixesWithType = freshMixes.map((mix: any) => ({
      ...mix,
      type: 'mix' as const,
      dateForSorting: new Date(mix.submittedAt || mix.date || 0).getTime(),
      isFeatured: mix.featureOnSite || false,
    }));

    const episodesWithType = allEpisodes.map((episode: any) => ({
      ...episode,
      type: 'episode' as const,
      dateForSorting: new Date(episode.airDate || 0).getTime(),
      isFeatured: episode.isFeatured || false,
    }));

    const playlistsWithType = freshPlaylists.map((playlist: any) => ({
      ...playlist,
      type: 'playlist' as const,
      dateForSorting: new Date(playlist.submittedAt || playlist.date || 0).getTime(),
      isFeatured: playlist.isFeatured || false,
    }));

    // Combine all items
    const combined = [...mixesWithType, ...episodesWithType, ...playlistsWithType];

    // Separate and sort featured items
    const allFeatured = combined
      .filter(item => item.isFeatured)
      .sort((a, b) => b.dateForSorting - a.dateForSorting);

    // Keep first 2 featured with styling, demote rest to regular cards
    const topFeaturedItems = allFeatured.slice(0, 2);
    const demotedFeaturedItems = allFeatured.slice(2).map(item => ({
      ...item,
      isFeatured: false, // Remove featured styling but keep in feed
    }));

    // Sort non-featured items
    const nonFeaturedItems = combined
      .filter(item => !item.isFeatured)
      .sort((a, b) => b.dateForSorting - a.dateForSorting);

    // Combine: top 2 featured first, then demoted featured, then non-featured
    const sorted = [...topFeaturedItems, ...demotedFeaturedItems, ...nonFeaturedItems];

    // Apply filter
    if (contentFilter === 'mixes') {
      return sorted.filter(item => item.type === 'mix').slice(0, 12);
    } else if (contentFilter === 'episodes') {
      return sorted.filter(item => item.type === 'episode').slice(0, 12);
    } else {
      // Show all content
      return sorted.slice(0, 12);
    }
  }, [freshMixes, allEpisodes, freshPlaylists, contentFilter]);

  // --- DATA: Upcoming schedule ---
  const { data: upcomingShows = [] } = useQuery({
    queryKey: ["/api/schedule", { upcoming: true }],
    queryFn: async () => {
      const r = await fetch("/api/schedule?upcoming=true&limit=3");
      if (!r.ok) throw new Error("Failed to fetch schedule");
      return r.json();
    },
    refetchInterval: 60000, // Refresh every minute
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-black dark:text-white transition-colors">
      <Navigation />
      <main className="pb-28">
        {/* HERO - Live Show Card */}
        <LiveShowCard />

        <div className="px-4 max-w-7xl mx-auto">
        {/* Upcoming Shows Widget */}
        {upcomingShows.length > 0 && (
          <section className="py-8 mt-8 bg-cream dark:bg-gray-900 -mx-4 px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-6">
                Coming Up Next
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {upcomingShows.map((show: any) => {
                  // Defensive: handle both scheduledAt and scheduledAirDate
                  const scheduledTime = show.scheduledAt ?? show.scheduledAirDate;
                  if (!scheduledTime) return null;
                  
                  const scheduledDate = new Date(scheduledTime);
                  const now = new Date();
                  const isToday = scheduledDate.toDateString() === now.toDateString();
                  const timeString = scheduledDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  const dateString = isToday ? 'Today' : scheduledDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  
                  // Defensive: handle both hostName and residentName
                  const displayName = show.hostName ?? show.residentName ?? 'Resident DJ';
                  
                  return (
                    <div 
                      key={show.id}
                      className="bg-white dark:bg-black border-2 border-black dark:border-gray-700 p-5 hover:border-navy dark:hover:border-navy transition-all"
                      data-testid={`upcoming-show-${show.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-navy text-white px-3 py-1 text-xs font-mono font-bold">
                          {dateString} • {timeString}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold font-mono mb-2 text-gray-900 dark:text-white">
                        {show.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {displayName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Latest From the Community - Blended Feed */}
        {blendedContent.length > 0 && (
          <section id="latest" className="py-12 mt-8 scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-5xl font-bold font-serif text-gray-900 dark:text-white">
                Latest from the Community
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setContentFilter('all')}
                className={`px-4 py-2 rounded font-mono text-sm transition-all border ${
                  contentFilter === 'all'
                    ? 'bg-navy dark:bg-navy text-white dark:text-white border-navy'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => setContentFilter('mixes')}
                className={`px-4 py-2 rounded font-mono text-sm transition-all border ${
                  contentFilter === 'mixes'
                    ? 'bg-navy dark:bg-navy text-white dark:text-white border-navy'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                data-testid="filter-mixes"
              >
                Mixes
              </button>
              <button
                onClick={() => setContentFilter('episodes')}
                className={`px-4 py-2 rounded font-mono text-sm transition-all border ${
                  contentFilter === 'episodes'
                    ? 'bg-navy dark:bg-navy text-white dark:text-white border-navy'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                data-testid="filter-episodes"
              >
                Episodes
              </button>
            </div>

            {/* Featured Hero - Show first featured item prominently */}
            {blendedContent[0]?.isFeatured && (
              <FeaturedHero item={blendedContent[0]} />
            )}

            {/* Section Break + Header */}
            <div className="pt-10 pb-6">
              <h2 className="text-2xl md:text-3xl font-bold font-mono text-gray-900 dark:text-white">
                Latest from the Community
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mt-2">
                Recent mixes, episodes, and playlists from our contributors
              </p>
            </div>

            {/* Regular Grid - Skip first if it was featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {blendedContent
                .slice(blendedContent[0]?.isFeatured ? 1 : 0)
                .map((item: any) => (
                  <ContentCard 
                    key={`${item.type}-${item.id}`} 
                    content={{ ...item, isFeatured: false }} 
                    type={item.type} 
                  />
                ))}
            </div>
          </section>
        )}

        {/* About Section with CTA */}
        <section className="max-w-3xl mx-auto my-16 text-center border-t border-b border-gray-200 dark:border-gray-800 py-12">
          <h3 className="font-serif text-3xl text-gray-900 dark:text-white mb-4">About Enamorado Radio</h3>
          <p className="text-gray-700 dark:text-gray-300 font-mono text-lg mb-6 leading-relaxed">
            Listener-driven internet radio from San Antonio. We feature community mixes, community programming, and themed shows—all dedicated to the music we are enamored with.
          </p>
          <Link 
            href="/submit-mix" 
            className="inline-block bg-navy text-white px-6 py-3 font-mono hover:bg-navy-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            data-testid="button-submit-mix-cta"
          >
            Submit a Mix →
          </Link>
        </section>

        {/* Explore tiles (from your “clean” page) */}
        <section className="mb-16">
          <div className="text-center pt-16 pb-8 mb-8">
            <h2 className="text-4xl font-bold mb-4 font-serif text-gray-900 dark:text-white">Explore</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-mono">
              Discover curated content, join our community, and contribute to the station
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/albums"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-white">Albums of the Month</h3>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-4">
                  Hand-selected favorites from our editorial team.
                </p>
                <div className="text-navy font-mono text-sm group-hover:text-red-600 transition-colors">
                  Explore Picks →
                </div>
              </div>
            </Link>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors block focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-white">Community Programming Applications</h3>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-4">
                  Apply for a regular slot and become part of our programming lineup.
                </p>
                <div className="text-navy font-mono text-sm group-hover:text-red-600 transition-colors">
                  Apply for Season 1 →
                </div>
              </div>
            </a>

            <Link
              href="/submit-mix"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900 dark:text-white">Submit a Mix</h3>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mb-4">
                  Share your DJ mixes with our community.
                </p>
                <div className="text-navy font-mono text-sm group-hover:text-red-600 transition-colors">
                  Submit Mix →
                </div>
              </div>
            </Link>
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
              <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-black p-8 md:p-12 hover:border-navy transition-all duration-300">
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
                    <div className="inline-block bg-navy text-white px-3 py-1 text-xs font-mono mb-4">
                      From Albums of the Month
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-2 font-mono group-hover:text-navy transition-colors" data-testid="text-featured-album-title">
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
                      <span className="text-navy font-mono text-sm group-hover:underline">
                        View All Picks →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}
        </div>

      </main>
    </div>
  );
}
