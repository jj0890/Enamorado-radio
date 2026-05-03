import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import PublicMixCard from "@/components/PublicMixCard";
import { Music, Headphones, Play, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// Inline episode row — matches EpisodesBrowser style
function EpisodeRow({ episode }: { episode: any }) {
  const artwork = episode.artworkUrl || episode.artUrl ||
    `https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop`;

  return (
    <Link href={`/episode/${episode.id}`}>
      <div className="group flex gap-4 py-4 border-b border-gray-100 hover:bg-cream-50 transition-colors cursor-pointer px-2 -mx-2 rounded">
        <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100">
          <img src={artwork} alt={episode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-charcoal-900 text-sm leading-tight line-clamp-1 group-hover:text-burnt-orange-500 transition-colors">
              {episode.title}
            </h3>
            <span className="text-xs text-charcoal-400 font-mono whitespace-nowrap flex-shrink-0">
              {new Date(episode.airDate || episode.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-0.5">{episode.hostName || episode.host}</p>
          {episode.duration ? (
            <span className="flex items-center gap-1 text-xs text-charcoal-400 font-mono mt-1">
              <Clock className="w-3 h-3" />
              {formatDuration(episode.duration)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function GenrePage() {
  const [, params] = useRoute<{ slug: string }>("/genre/:slug");
  const { slug } = params || { slug: "" };

  const { data: mixes = [], isLoading: mixesLoading } = useQuery({
    queryKey: ["/api/mixes", { genreSlug: slug }],
    queryFn: async () => {
      const r = await fetch(`/api/mixes?genre=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load mixes");
      return r.json();
    },
  });

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({
    queryKey: ["/api/episodes", { genreSlug: slug }],
    queryFn: async () => {
      const r = await fetch(`/api/episodes?genre=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const isLoading = mixesLoading || episodesLoading;
  const totalItems = mixes.length + episodes.length;
  // Humanise the slug: "deep-house" → "Deep House"
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-white text-charcoal-900">
      <StickyRadioPlayer />
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* Header */}
        <div className="pt-10 pb-8 border-b border-black">
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-burnt-orange-500" />
            <span className="text-xs font-mono text-charcoal-400 uppercase tracking-widest">Genre</span>
          </div>
          <h1 className="text-4xl font-bold font-mono text-charcoal-900 tracking-tight">{title}</h1>

          {!isLoading && (
            <div className="flex items-center gap-4 mt-3 text-sm text-charcoal-500 font-mono">
              {mixes.length > 0 && (
                <span className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {mixes.length} {mixes.length === 1 ? 'mix' : 'mixes'}
                </span>
              )}
              {episodes.length > 0 && (
                <span className="flex items-center gap-1">
                  <Headphones className="w-4 h-4" />
                  {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-charcoal-400 font-mono text-sm">Loading {title}…</div>
        ) : totalItems === 0 ? (
          <div className="py-20 text-center">
            <Music className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
            <p className="font-mono text-charcoal-500 text-sm mb-6">
              No {title.toLowerCase()} content yet — be the first to submit
            </p>
            <Link href="/submit-mix">
              <Button className="bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-mono">
                Submit a Mix
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Mixes section */}
            {mixes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold font-mono text-charcoal-900">Mixes</h2>
                  <span className="text-xs font-mono text-charcoal-400">{mixes.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mixes.map((mix: any) => (
                    <PublicMixCard key={mix.id} mix={mix} />
                  ))}
                </div>
              </div>
            )}

            {/* Episodes section */}
            {episodes.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-charcoal-200">
                  <h2 className="text-lg font-bold font-mono text-charcoal-900">Episodes</h2>
                  <span className="text-xs font-mono text-charcoal-400">{episodes.length}</span>
                </div>
                <div>
                  {episodes.map((ep: any) => (
                    <EpisodeRow key={ep.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
