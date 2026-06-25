import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Search, Music, ExternalLink, X, Heart, Play, ChevronLeft, ChevronRight } from "lucide-react";
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
  likeCount: number;
  liked: boolean;
}

interface GenreData {
  all: Array<{ id: number; name: string; slug: string; category: string }>;
  byCategory: Record<string, Array<{ id: number; name: string; slug: string; category: string }>>;
}

function groupByMonth(mixes: Mix[]): Array<{ label: string; mixes: Mix[] }> {
  const groups = new Map<string, Mix[]>();
  for (const mix of mixes) {
    const raw = mix.createdAt || mix.submittedAt;
    const d = raw ? new Date(raw) : null;
    const label =
      d && !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Archive";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(mix);
  }
  return Array.from(groups.entries()).map(([label, mixes]) => ({ label, mixes }));
}

function MixCard({
  mix,
  onLike,
  pending,
}: {
  mix: Mix;
  onLike: (id: number) => void;
  pending: boolean;
}) {
  const artwork = mix.artUrl || mix.thumbnailUrl;
  const contributor = mix.contributorName || mix.submitterName;

  return (
    <div className="group relative bg-cream-50 border border-charcoal-100 hover:border-charcoal-300 transition-colors overflow-hidden">
      {/* Artwork */}
      <div className="aspect-square bg-charcoal-100 overflow-hidden relative">
        {artwork ? (
          <img
            src={artwork}
            alt={mix.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-8 h-8 text-charcoal-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 pointer-events-none">
          <p className="font-ui font-semibold text-sm text-cream-50 leading-tight line-clamp-2">
            {mix.title}
          </p>
          {contributor && (
            <p className="font-mono text-[10px] text-cream-200/70 truncate mt-0.5">{contributor}</p>
          )}
          {mix.genre && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-burnt-orange-400 mt-1 truncate">
              {mix.genre}
            </p>
          )}
        </div>

        {/* Featured badge */}
        {mix.status === "featured" && (
          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-widest bg-burnt-orange-500 text-white px-1.5 py-0.5 z-10">
            Featured
          </span>
        )}

        {/* Play button */}
        {mix.url && (
          <a
            href={mix.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-cream-50/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-cream-50 hover:scale-110 z-10 shadow-md"
            aria-label="Listen"
          >
            <Play className="w-4 h-4 text-charcoal-900 fill-charcoal-900 translate-x-px" />
          </a>
        )}
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-charcoal-100">
        <button
          onClick={() => onLike(mix.id)}
          disabled={pending}
          className={`flex items-center gap-1 text-[11px] font-mono transition-colors select-none ${
            mix.liked
              ? "text-burnt-orange-500"
              : "text-charcoal-400 hover:text-burnt-orange-500"
          }`}
          aria-label={mix.liked ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-3 h-3 transition-all duration-150 ${
              mix.liked ? "fill-burnt-orange-500 scale-110" : ""
            }`}
          />
          {mix.likeCount > 0 && <span>{mix.likeCount}</span>}
        </button>

        {mix.url && (
          <a
            href={mix.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-charcoal-300 hover:text-charcoal-700 transition-colors"
            aria-label="Open link"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function CoverFlowRow({
  mixes,
  onLike,
  pendingLikes,
}: {
  mixes: Mix[];
  onLike: (id: number) => void;
  pendingLikes: Set<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    if (!ref.current) return;
    const card = ref.current.querySelector<HTMLElement>("[data-card]");
    const cardW = (card?.offsetWidth ?? 220) + 12;
    ref.current.scrollBy({ left: dir * cardW, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="cover-flow-scroll flex overflow-x-auto gap-3 pl-4 pr-16 pb-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {mixes.map((mix) => (
          <div
            key={mix.id}
            data-card=""
            className="flex-shrink-0 w-[72vw] max-w-[260px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <MixCard mix={mix} onLike={onLike} pending={pendingLikes.has(mix.id)} />
          </div>
        ))}
      </div>

      {mixes.length > 1 && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-[calc(50%-28px)] -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-cream-50/95 border border-charcoal-200 text-charcoal-600 hover:bg-white hover:border-charcoal-400 transition-colors z-10 shadow-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-[calc(50%-28px)] -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-cream-50/95 border border-charcoal-200 text-charcoal-600 hover:bg-white hover:border-charcoal-400 transition-colors z-10 shadow-sm"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function ArchivePage() {
  const [q, setQ] = useState("");
  const [activeGenre, setActiveGenre] = useState<string>("");
  const [pendingLikes, setPendingLikes] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: genreData } = useQuery<GenreData>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const r = await fetch("/api/genres");
      if (!r.ok) return { all: [], byCategory: {} };
      const json = await r.json();
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

  const likeMutation = useMutation({
    mutationFn: async (mixId: number) => {
      const r = await fetch(`/api/likes/mix/${mixId}`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to like");
      return r.json() as Promise<{ liked: boolean; count: number }>;
    },
    onMutate: (mixId) => {
      setPendingLikes((prev) => new Set(prev).add(mixId));
      const prev = queryClient.getQueryData<Mix[]>(["/api/mixes", q, activeGenre]);
      queryClient.setQueryData<Mix[]>(["/api/mixes", q, activeGenre], (old = []) =>
        old.map((m) =>
          m.id === mixId
            ? { ...m, liked: !m.liked, likeCount: m.liked ? m.likeCount - 1 : m.likeCount + 1 }
            : m
        )
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/mixes", q, activeGenre], ctx.prev);
    },
    onSettled: (_data, _err, mixId) => {
      setPendingLikes((prev) => {
        const s = new Set(prev);
        s.delete(mixId);
        return s;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mixes"] });
    },
  });

  const allGenres = genreData?.all ?? [];
  const genreOptions = allGenres.filter((g) => g.category !== "Moods").slice(0, 20);
  const clearFilters = () => { setQ(""); setActiveGenre(""); };
  const hasFilters = q.trim() || activeGenre;
  const monthGroups = groupByMonth(mixes);

  return (
    <div className="min-h-screen bg-cream-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-10 pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-charcoal-900 mb-1">Archive</h1>
          <p className="font-mono text-sm text-charcoal-500">
            {mixes.length} {mixes.length === 1 ? "mix" : "mixes"}
            {activeGenre ? ` · ${activeGenre}` : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by title, artist, genre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 border border-charcoal-200 bg-white text-charcoal-900 font-mono text-sm rounded-none focus:outline-none focus:border-charcoal-500 placeholder:text-charcoal-400"
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

        {/* Genre chips */}
        {genreOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveGenre("")}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                !activeGenre
                  ? "bg-charcoal-900 text-white border-charcoal-900"
                  : "border-charcoal-200 text-charcoal-600 hover:border-charcoal-500"
              }`}
            >
              All
            </button>
            {genreOptions.map((g) => (
              <button
                key={g.slug}
                onClick={() => setActiveGenre(activeGenre === g.slug ? "" : g.slug)}
                className={`font-mono text-xs px-3 py-1 border transition-colors ${
                  activeGenre === g.slug
                    ? "bg-burnt-orange-500 text-white border-burnt-orange-500"
                    : "border-charcoal-200 text-charcoal-600 hover:border-burnt-orange-400"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className="mb-6">
            <button
              onClick={clearFilters}
              className="font-mono text-xs text-charcoal-500 hover:text-charcoal-900 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-charcoal-100 animate-pulse" />
            ))}
          </div>
        ) : mixes.length === 0 ? (
          <div className="py-24 text-center">
            <Music className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="font-mono text-sm text-charcoal-500">
              {hasFilters ? "No mixes match your search." : "No mixes yet."}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 font-mono text-xs text-burnt-orange-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {monthGroups.map(({ label, mixes: groupMixes }) => (
              <section key={label}>
                {/* Month header */}
                <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-charcoal-100">
                  <h2 className="font-mono text-xs font-semibold text-charcoal-900 uppercase tracking-widest">
                    {label}
                  </h2>
                  <span className="font-mono text-xs text-charcoal-400">
                    {groupMixes.length} {groupMixes.length === 1 ? "mix" : "mixes"}
                  </span>
                </div>

                {/* Mobile: coverflow scroll */}
                <div className="md:hidden -mx-4">
                  <CoverFlowRow
                    mixes={groupMixes}
                    onLike={(id) => likeMutation.mutate(id)}
                    pendingLikes={pendingLikes}
                  />
                </div>

                {/* Desktop: grid */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupMixes.map((mix) => (
                    <MixCard
                      key={mix.id}
                      mix={mix}
                      onLike={(id) => likeMutation.mutate(id)}
                      pending={pendingLikes.has(mix.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <StickyRadioPlayer />
    </div>
  );
}
