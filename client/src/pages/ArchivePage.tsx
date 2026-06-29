import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Search, Music, ExternalLink, X, Heart, Play, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

// Matches UIMix from server/lib/serializeMix.ts + like fields added by GET /api/mixes
interface Mix {
  id: number;
  title: string;
  artist: string;          // contributor / submitter name
  url: string;
  artwork: string | null;
  genre: string | null;
  platform: string | null; // 'soundcloud' | 'mixcloud' | 'audiocom' | 'file' | null
  status: "pending" | "approved" | "featured";
  date: string;            // ISO string (serialized from Date)
  likeCount: number;
  liked: boolean;
}

interface GenreData {
  all: Array<{ id: number; name: string; slug: string; category: string }>;
  byCategory: Record<string, Array<{ id: number; name: string; slug: string; category: string }>>;
}

// Deterministic accent color from contributor name — riyl.fm --tile-accent pattern
const ACCENT_PALETTE = [
  "#c2410c", // burnt-orange deep
  "#7c3aed", // violet
  "#0369a1", // blue
  "#047857", // green
  "#b45309", // amber
  "#be185d", // pink
  "#0f766e", // teal
  "#6d28d9", // purple
];
function accentFromName(name: string): string {
  if (!name) return ACCENT_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return ACCENT_PALETTE[Math.abs(h) % ACCENT_PALETTE.length];
}

// Build embed src from platform + url
function embedSrc(mix: Mix): string | null {
  if (!mix.url) return null;
  if (mix.platform === "soundcloud") {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(mix.url)}&color=%23e85d04&auto_play=true&hide_related=true&show_comments=false&show_user=false&visual=true`;
  }
  if (mix.platform === "mixcloud") {
    // extract path: https://www.mixcloud.com/artist/mix/ → /artist/mix/
    const path = mix.url.replace(/^https?:\/\/(?:www\.)?mixcloud\.com/, "");
    return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=${encodeURIComponent(path)}`;
  }
  // YouTube
  if (mix.url.includes("youtube.com") || mix.url.includes("youtu.be")) {
    const ytId =
      mix.url.match(/[?&]v=([^&]+)/)?.[1] ||
      mix.url.match(/youtu\.be\/([^?]+)/)?.[1];
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  }
  return null;
}

function groupByMonth(mixes: Mix[]): Array<{ label: string; mixes: Mix[] }> {
  const groups = new Map<string, Mix[]>();
  for (const mix of mixes) {
    const d = new Date(mix.date);
    const label = isNaN(d.getTime())
      ? "Archive"
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(mix);
  }
  return Array.from(groups.entries()).map(([label, mixes]) => ({ label, mixes }));
}

// ── NowPlaying embed bar ─────────────────────────────────────────────────────
function NowPlayingBar({ mix, onClose }: { mix: Mix; onClose: () => void }) {
  const src = embedSrc(mix);
  const accent = accentFromName(mix.artist);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-charcoal-200 bg-white shadow-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* accent stripe */}
      <div className="h-0.5 w-full" style={{ backgroundColor: accent }} />
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {mix.artwork && (
          <img src={mix.artwork} alt={mix.title} className="w-10 h-10 object-cover flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold text-charcoal-900 truncate">{mix.title}</p>
          <p className="font-mono text-[10px] text-charcoal-500 truncate">{mix.artist}</p>
        </div>
        {mix.url && (
          <a
            href={mix.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-charcoal-500 hover:text-charcoal-900 transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button
          onClick={onClose}
          className="text-charcoal-400 hover:text-charcoal-900 transition-colors flex-shrink-0"
          aria-label="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {src && (
        <iframe
          src={src}
          className="w-full"
          style={{ height: mix.platform === "soundcloud" ? 166 : mix.platform === "mixcloud" ? 60 : 200 }}
          allow="autoplay"
          frameBorder="0"
          title={mix.title}
        />
      )}
    </div>
  );
}

// ── MixCard ──────────────────────────────────────────────────────────────────
function MixCard({
  mix,
  onLike,
  pending,
  onPlay,
  isPlaying,
}: {
  mix: Mix;
  onLike: (id: number) => void;
  pending: boolean;
  onPlay: (mix: Mix) => void;
  isPlaying: boolean;
}) {
  const [heartKey, setHeartKey] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const accent = accentFromName(mix.artist);

  const handleLike = () => {
    if (!mix.liked) {
      setShowHeart(true);
      setHeartKey((k) => k + 1);
      setTimeout(() => setShowHeart(false), 700);
    }
    onLike(mix.id);
  };

  return (
    <div
      className="group relative bg-cream-50 border border-charcoal-100 hover:border-charcoal-300 transition-colors overflow-hidden"
      style={{ "--tile-accent": accent } as React.CSSProperties}
    >
      {/* Artwork */}
      <div className="aspect-square bg-charcoal-100 overflow-hidden relative">
        {mix.artwork ? (
          <img
            src={mix.artwork}
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
          <p className="font-mono font-semibold text-sm text-cream-50 leading-tight line-clamp-2">
            {mix.title}
          </p>
          {mix.artist && (
            <p className="font-mono text-[10px] text-cream-200/70 truncate mt-0.5">{mix.artist}</p>
          )}
          {mix.genre && (
            <p className="font-mono text-[10px] uppercase tracking-wider mt-1 truncate" style={{ color: accent }}>
              {mix.genre}
            </p>
          )}
        </div>

        {/* Featured badge */}
        {mix.status === "featured" && (
          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-widest text-white px-1.5 py-0.5 z-10" style={{ backgroundColor: accent }}>
            Featured
          </span>
        )}

        {/* Play button */}
        {(mix.url || embedSrc(mix)) && (
          <button
            onClick={() => onPlay(mix)}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-md ${
              isPlaying
                ? "opacity-100 scale-100"
                : "opacity-0 group-hover:opacity-100 hover:scale-110"
            } bg-cream-50/90 hover:bg-cream-50`}
            aria-label={isPlaying ? "Now playing" : "Play"}
          >
            {isPlaying ? (
              <span className="flex gap-0.5 items-end h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-charcoal-900 rounded-full"
                    style={{
                      height: `${8 + i * 4}px`,
                      animation: `bounce 0.6s ${i * 0.15}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </span>
            ) : (
              <Play className="w-4 h-4 text-charcoal-900 fill-charcoal-900 translate-x-px" />
            )}
          </button>
        )}
      </div>

      {/* Accent underline on hover — riyl.fm tile-accent pattern */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        style={{ backgroundColor: accent }}
      />

      {/* Footer strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-charcoal-100">
        <button
          onClick={handleLike}
          disabled={pending}
          className={`relative flex items-center gap-1 text-[11px] font-mono transition-colors select-none ${
            mix.liked ? "text-burnt-orange-500" : "text-charcoal-400 hover:text-burnt-orange-500"
          }`}
          aria-label={mix.liked ? "Unlike" : "Like"}
        >
          {/* Floating heart animation */}
          {showHeart && (
            <span key={heartKey} className="heart-float text-burnt-orange-500">
              <Heart className="w-3 h-3 fill-burnt-orange-500" />
            </span>
          )}
          <Heart
            className={`w-3 h-3 transition-all duration-150 ${mix.liked ? "fill-burnt-orange-500 scale-110" : ""}`}
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

// ── CoverFlowRow (mobile) ────────────────────────────────────────────────────
function CoverFlowRow({
  mixes,
  onLike,
  pendingLikes,
  onPlay,
  playingId,
}: {
  mixes: Mix[];
  onLike: (id: number) => void;
  pendingLikes: Set<number>;
  onPlay: (mix: Mix) => void;
  playingId: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    if (!ref.current) return;
    const card = ref.current.querySelector<HTMLElement>("[data-card]");
    ref.current.scrollBy({ left: dir * ((card?.offsetWidth ?? 220) + 12), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="cover-flow-scroll flex overflow-x-auto gap-3 pl-4 pr-16 pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {mixes.map((mix) => (
          <div
            key={mix.id}
            data-card=""
            className="flex-shrink-0 w-[72vw] max-w-[260px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <MixCard
              mix={mix}
              onLike={onLike}
              pending={pendingLikes.has(mix.id)}
              onPlay={onPlay}
              isPlaying={playingId === mix.id}
            />
          </div>
        ))}
      </div>
      {mixes.length > 1 && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-[calc(50%-28px)] -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-cream-50/95 border border-charcoal-200 text-charcoal-600 hover:bg-white transition-colors z-10 shadow-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-[calc(50%-28px)] -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-cream-50/95 border border-charcoal-200 text-charcoal-600 hover:bg-white transition-colors z-10 shadow-sm"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
type SortMode = "newest" | "popular";

export default function ArchivePage() {
  const [q, setQ] = useState("");
  const [activeGenre, setActiveGenre] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [pendingLikes, setPendingLikes] = useState<Set<number>>(new Set());
  const [playingMix, setPlayingMix] = useState<Mix | null>(null);
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
  if (sortMode === "popular") searchParams.set("sort", "popular");

  const { data: mixes = [], isLoading } = useQuery<Mix[]>({
    queryKey: ["/api/mixes", q, activeGenre, sortMode],
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
      const prev = queryClient.getQueryData<Mix[]>(["/api/mixes", q, activeGenre, sortMode]);
      queryClient.setQueryData<Mix[]>(["/api/mixes", q, activeGenre, sortMode], (old = []) =>
        old.map((m) =>
          m.id === mixId
            ? { ...m, liked: !m.liked, likeCount: m.liked ? m.likeCount - 1 : m.likeCount + 1 }
            : m
        )
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/mixes", q, activeGenre, sortMode], ctx.prev);
    },
    onSettled: (_data, _err, mixId) => {
      setPendingLikes((prev) => { const s = new Set(prev); s.delete(mixId); return s; });
      queryClient.invalidateQueries({ queryKey: ["/api/mixes"] });
    },
  });

  const handlePlay = useCallback((mix: Mix) => {
    setPlayingMix((prev) => (prev?.id === mix.id ? null : mix));
  }, []);

  const allGenres = genreData?.all ?? [];
  const genreOptions = allGenres.filter((g) => g.category !== "Moods").slice(0, 20);
  const clearFilters = () => { setQ(""); setActiveGenre(""); };
  const hasFilters = q.trim() || activeGenre;
  const hasAnyLikes = mixes.some((m) => m.likeCount > 0);
  const monthGroups = sortMode === "newest" ? groupByMonth(mixes) : [];

  return (
    <div className="min-h-screen bg-cream-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-10" style={{ paddingBottom: playingMix ? 260 : 128 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-charcoal-900 mb-1">Archive</h1>
            <p className="font-mono text-sm text-charcoal-500">
              {mixes.length} {mixes.length === 1 ? "mix" : "mixes"}
              {activeGenre ? ` · ${activeGenre}` : ""}
            </p>
          </div>
          {hasAnyLikes && (
            <div className="flex items-center border border-charcoal-200 divide-x divide-charcoal-200">
              {(["newest", "popular"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                    sortMode === mode
                      ? "bg-charcoal-900 text-white"
                      : "text-charcoal-500 hover:text-charcoal-900 bg-white"
                  }`}
                >
                  {mode === "newest" ? "Newest" : "Most Liked"}
                </button>
              ))}
            </div>
          )}
        </div>

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
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {genreOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveGenre("")}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                !activeGenre ? "bg-charcoal-900 text-white border-charcoal-900" : "border-charcoal-200 text-charcoal-600 hover:border-charcoal-500"
              }`}
            >All</button>
            {genreOptions.map((g) => (
              <button
                key={g.slug}
                onClick={() => setActiveGenre(activeGenre === g.slug ? "" : g.slug)}
                className={`font-mono text-xs px-3 py-1 border transition-colors ${
                  activeGenre === g.slug ? "bg-burnt-orange-500 text-white border-burnt-orange-500" : "border-charcoal-200 text-charcoal-600 hover:border-burnt-orange-400"
                }`}
              >{g.name}</button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className="mb-6">
            <button onClick={clearFilters} className="font-mono text-xs text-charcoal-500 hover:text-charcoal-900 underline underline-offset-2">
              Clear filters
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
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
              <button onClick={clearFilters} className="mt-2 font-mono text-xs text-burnt-orange-500 hover:underline">Clear filters</button>
            )}
          </div>
        ) : sortMode === "popular" ? (
          /* ── Popular: flat ranked list sorted by likeCount ── */
          <div className="space-y-0">
            {mixes.map((mix, index) => {
              const accent = accentFromName(mix.artist);
              return (
                <div
                  key={mix.id}
                  className="flex items-center gap-3 py-3 border-b border-charcoal-100 group"
                >
                  {/* Rank */}
                  <div className="w-7 text-right font-mono text-xs text-charcoal-400 flex-shrink-0 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* Art */}
                  <div className="w-11 h-11 flex-shrink-0 overflow-hidden bg-charcoal-100">
                    {mix.artwork ? (
                      <img src={mix.artwork} alt={mix.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-charcoal-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono font-semibold text-sm text-charcoal-900 truncate group-hover:underline underline-offset-2 cursor-pointer"
                      onClick={() => handlePlay(mix)}
                    >
                      {mix.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-charcoal-500 truncate">{mix.artist}</span>
                      {mix.genre && (
                        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: accent }}>
                          {mix.genre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Like + link */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => likeMutation.mutate(mix.id)}
                      disabled={pendingLikes.has(mix.id)}
                      className={`flex items-center gap-1 text-xs font-mono transition-colors ${
                        mix.liked ? "text-burnt-orange-500" : "text-charcoal-400 hover:text-burnt-orange-500"
                      }`}
                      aria-label={mix.liked ? "Unlike" : "Like"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${mix.liked ? "fill-burnt-orange-500" : ""}`} />
                      {mix.likeCount > 0 && <span className="tabular-nums">{mix.likeCount}</span>}
                    </button>
                    {mix.url && (
                      <a
                        href={mix.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-charcoal-300 hover:text-charcoal-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Newest: month-grouped grid ── */
          <div className="space-y-12">
            {monthGroups.map(({ label, mixes: groupMixes }) => (
              <section key={label}>
                <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-charcoal-100">
                  <h2 className="font-mono text-xs font-semibold text-charcoal-900 uppercase tracking-widest">{label}</h2>
                  <span className="font-mono text-xs text-charcoal-400">{groupMixes.length} {groupMixes.length === 1 ? "mix" : "mixes"}</span>
                </div>

                {/* Mobile coverflow */}
                <div className="md:hidden -mx-4">
                  <CoverFlowRow
                    mixes={groupMixes}
                    onLike={(id) => likeMutation.mutate(id)}
                    pendingLikes={pendingLikes}
                    onPlay={handlePlay}
                    playingId={playingMix?.id ?? null}
                  />
                </div>

                {/* Desktop grid */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupMixes.map((mix) => (
                    <MixCard
                      key={mix.id}
                      mix={mix}
                      onLike={(id) => likeMutation.mutate(id)}
                      pending={pendingLikes.has(mix.id)}
                      onPlay={handlePlay}
                      isPlaying={playingMix?.id === mix.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Now Playing bar */}
      {playingMix && <NowPlayingBar mix={playingMix} onClose={() => setPlayingMix(null)} />}

      <StickyRadioPlayer />
    </div>
  );
}
