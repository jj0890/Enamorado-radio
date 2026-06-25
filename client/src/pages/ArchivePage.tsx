import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch, useLocation } from "wouter";
import { Search, Music, ExternalLink, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

interface Mix {
  id: number;
  title: string;
  genre?: string;
  submitterName?: string;
  contributorName?: string;
  description?: string;
  artUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  status: string;
  createdAt?: string;
  submittedAt?: string;
}

interface GenreData {
  all: Array<{ id: number; name: string; slug: string; category: string }>;
  byCategory: Record<string, Array<{ id: number; name: string; slug: string; category: string }>>;
}

function MixCard({ mix }: { mix: Mix }) {
  const artwork = mix.artUrl || mix.thumbnailUrl;
  const contributor = mix.contributorName || mix.submitterName;

  return (
    <div className="group border border-charcoal-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 hover:border-charcoal-300 dark:hover:border-charcoal-600 transition-colors">
      {/* Artwork */}
      <div className="aspect-square bg-charcoal-100 dark:bg-charcoal-800 overflow-hidden relative">
        {artwork ? (
          <img
            src={artwork}
            alt={mix.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-8 h-8 text-charcoal-400" />
          </div>
        )}
        {mix.status === "featured" && (
          <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-widest bg-burnt-orange-500 text-white px-1.5 py-0.5">
            Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-ui font-semibold text-sm text-charcoal-900 dark:text-cream-100 leading-tight line-clamp-2 mb-1">
          {mix.title}
        </p>
        {contributor && (
          <p className="font-mono text-xs text-charcoal-500 dark:text-charcoal-400 truncate">{contributor}</p>
        )}
        {mix.genre && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-burnt-orange-500 mt-1 truncate">
            {mix.genre}
          </p>
        )}
        {mix.url && (
          <a
            href={mix.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-charcoal-400 hover:text-charcoal-700 dark:hover:text-cream-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Listen
          </a>
        )}
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [q, setQ] = useState("");
  const [activeGenre, setActiveGenre] = useState<string>("");

  const { data: genreData } = useQuery<GenreData>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const r = await fetch("/api/genres");
      if (!r.ok) return { all: [], byCategory: {} };
      const json = await r.json();
      // genreRoutes wraps in { ok, data } — unwrap if present
      return json.data ?? json;
    },
    staleTime: 5 * 60 * 1000,
  });

  const searchParams = new URLSearchParams();
  if (q.trim()) searchParams.set("q", q.trim());
  if (activeGenre) searchParams.set("genre", activeGenre);

  const { data: mixes = [], isLoading } = useQuery<Mix[]>({
    queryKey: ["/api/mixes", q, activeGenre],
    queryFn: async () => {
      const r = await fetch(`/api/mixes?${searchParams.toString()}`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Collect unique genre slugs present in the current result set for quick-filter display
  const allGenres = genreData?.all ?? [];
  // Show top-level genre categories as filter tabs — pull first 16 most common
  const genreOptions = allGenres.filter(g => g.category !== "Moods").slice(0, 20);

  const clearFilters = () => {
    setQ("");
    setActiveGenre("");
  };

  const hasFilters = q.trim() || activeGenre;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-10 pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-charcoal-900 dark:text-cream-100 mb-1">
            Archive
          </h1>
          <p className="font-mono text-sm text-charcoal-500 dark:text-charcoal-400">
            {mixes.length} {mixes.length === 1 ? "mix" : "mixes"}
            {activeGenre ? ` in ${activeGenre}` : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by title, artist, genre…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-100 font-mono text-sm rounded-none focus:outline-none focus:border-charcoal-500 placeholder:text-charcoal-400"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre filter chips */}
        {genreOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveGenre("")}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                !activeGenre
                  ? "bg-charcoal-900 dark:bg-cream-100 text-white dark:text-charcoal-900 border-charcoal-900 dark:border-cream-100"
                  : "border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-charcoal-500"
              }`}
            >
              All
            </button>
            {genreOptions.map(g => (
              <button
                key={g.slug}
                onClick={() => setActiveGenre(activeGenre === g.slug ? "" : g.slug)}
                className={`font-mono text-xs px-3 py-1 border transition-colors ${
                  activeGenre === g.slug
                    ? "bg-burnt-orange-500 text-white border-burnt-orange-500"
                    : "border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:border-burnt-orange-400"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <div className="mb-6">
            <button
              onClick={clearFilters}
              className="font-mono text-xs text-charcoal-500 hover:text-charcoal-900 dark:hover:text-cream-100 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-charcoal-100 dark:bg-charcoal-800">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-square bg-charcoal-50 dark:bg-charcoal-900 animate-pulse" />
            ))}
          </div>
        ) : mixes.length === 0 ? (
          <div className="py-24 text-center">
            <Music className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="font-mono text-sm text-charcoal-500">
              {hasFilters ? "No mixes match your search." : "No mixes yet."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 font-mono text-xs text-burnt-orange-500 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-charcoal-100 dark:bg-charcoal-800">
            {mixes.map(mix => (
              <MixCard key={mix.id} mix={mix} />
            ))}
          </div>
        )}
      </div>

      <StickyRadioPlayer />
    </div>
  );
}
