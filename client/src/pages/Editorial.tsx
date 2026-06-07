import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Play, ArrowRight, Search, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { FeatureWithContent } from "@shared/schema";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";

// Humanise content type for display
function typeLabel(contentType?: string) {
  const map: Record<string, string> = {
    essay: "Essay",
    interview: "Interview",
    video_essay: "Video",
    photoshoot: "Visual",
    playlist: "Playlist",
    artPdf: "Art",
    link: "Link",
  };
  return map[contentType ?? ""] ?? "Editorial";
}

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Essay", value: "essay" },
  { label: "Interview", value: "interview" },
  { label: "Visual", value: "photoshoot" },
  { label: "Video", value: "video_essay" },
  { label: "Playlist", value: "playlist" },
];

// Single article tile — no shadows, just type label + title + excerpt
function ArticleTile({
  content,
  feature,
}: {
  content: any;
  feature?: any;
}) {
  const coverSrc =
    content.coverImageUrl ||
    (content.videoUrl && extractYouTubeId(content.videoUrl)
      ? getYouTubeThumbnail(extractYouTubeId(content.videoUrl)!, "maxres")
      : null) ||
    content.gallery?.[0]?.src;

  const isHero = feature?.featureType === "hero";

  // Contributor display — prefers contributors junction data, falls back to authors[]
  const contributors: Array<{ handle?: string; name?: string }> =
    content.contributors ?? [];
  const authorNames: string[] = content.authors ?? [];

  return (
    <a
      href={`/editorial/${content.slug}`}
      className="group block"
      data-testid={`article-tile-${content.id}`}
    >
      {/* Cover image */}
      {coverSrc ? (
        <div
          className={`relative overflow-hidden bg-cream-200 mb-4 ${
            isHero ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        >
          <img
            src={coverSrc}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {content.videoUrl && extractYouTubeId(content.videoUrl) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`bg-cream-200 flex items-center justify-center mb-4 ${
            isHero ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        >
          <BookOpen className="w-10 h-10 text-charcoal-400" />
        </div>
      )}

      {/* Meta */}
      <p className="text-xs font-mono tracking-widest uppercase text-burnt-orange-500 mb-2">
        {typeLabel(content.contentType)}
        {contributors.length > 0 ? (
          <span className="text-charcoal-400 normal-case tracking-normal font-normal">
            {" "}—{" "}
            {contributors.map((c, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {c.handle ? (
                  <a
                    href={`/contributors/${c.handle}`}
                    className="hover:text-burnt-orange-500 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.name ?? c.handle}
                  </a>
                ) : (
                  c.name ?? c.handle
                )}
              </span>
            ))}
          </span>
        ) : authorNames.length > 0 ? (
          <span className="text-charcoal-400 normal-case tracking-normal font-normal">
            {" "}— {authorNames.join(", ")}
          </span>
        ) : null}
      </p>

      {/* Title */}
      <h3
        className={`font-serif text-charcoal-900 leading-tight mb-2 group-hover:text-burnt-orange-500 transition-colors ${
          isHero ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
      >
        {content.title}
      </h3>

      {/* Excerpt */}
      {content.excerpt && (
        <p
          className={`font-crimson text-charcoal-600 leading-relaxed ${
            isHero ? "text-lg line-clamp-3" : "text-base line-clamp-2"
          }`}
        >
          {content.excerpt}
        </p>
      )}
    </a>
  );
}

export default function Editorial() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // committed on submit
  const [activeType, setActiveType] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isFiltering = activeSearch !== "" || activeType !== "";

  // Featured feed — shown when no filter is active
  const { data: features = [], isLoading: loadingFeatured } = useQuery<
    FeatureWithContent[]
  >({
    queryKey: ["/api/features-with-content"],
    enabled: !isFiltering,
  });

  // Search/filter feed — shown when a search or type filter is active
  const searchParams = new URLSearchParams();
  if (activeSearch) searchParams.set("search", activeSearch);
  if (activeType) searchParams.set("contentType", activeType);

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<
    any[]
  >({
    queryKey: ["/api/published-content", activeSearch, activeType],
    queryFn: () =>
      fetch(`/api/published-content?${searchParams}`).then((r) => r.json()),
    enabled: isFiltering,
  });

  // Featured feed derived values
  const heroFeatures = features.filter(
    (f) => f.feature.featureType === "hero" && f.content
  );
  const mainFeatures = features.filter(
    (f) => f.feature.featureType === "main" && f.content
  );
  const heroItem = heroFeatures[0] ?? mainFeatures[0];
  const heroContent = heroItem?.content;
  const gridItems = heroFeatures.length > 0 ? mainFeatures : mainFeatures.slice(1);

  const isLoading = isFiltering ? loadingSearch : loadingFeatured;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearch(search.trim());
  }

  function clearFilters() {
    setSearch("");
    setActiveSearch("");
    setActiveType("");
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      <StickyRadioPlayer />
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 pb-32">
        {/* ── Masthead ── */}
        <div className="pt-12 pb-6">
          <div className="border-t-2 border-charcoal-900 pt-4">
            <div className="flex items-baseline justify-between">
              <h1 className="font-serif text-5xl md:text-6xl text-charcoal-900 tracking-tight">
                Editorial
              </h1>
              <span className="font-mono text-xs text-charcoal-400 uppercase tracking-widest hidden sm:block">
                Enamorado Radio
              </span>
            </div>
            <p className="font-crimson text-lg text-charcoal-500 mt-2 italic">
              Long-form writing, interviews, and commissioned features
            </p>
          </div>

          {/* ── Search + type filter bar ── */}
          <div className="mt-6 space-y-3">
            <form onSubmit={submitSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles and excerpts…"
                  className="w-full pl-9 pr-4 py-2 border border-charcoal-200 bg-white font-crimson text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-charcoal-900 text-sm"
                />
              </div>
              <button
                type="submit"
                className="font-mono text-xs uppercase tracking-wider bg-charcoal-900 text-white px-4 py-2 hover:bg-burnt-orange-500 transition-colors"
              >
                Search
              </button>
              {isFiltering && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-mono text-xs uppercase tracking-wider border border-charcoal-300 text-charcoal-600 px-3 py-2 hover:border-charcoal-900 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </form>

            {/* Content type pills */}
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setActiveType(f.value)}
                  className={`font-mono text-xs uppercase tracking-wider px-3 py-1 border transition-colors ${
                    activeType === f.value
                      ? "bg-charcoal-900 text-white border-charcoal-900"
                      : "border-charcoal-300 text-charcoal-600 hover:border-charcoal-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-charcoal-300 mt-4" />
        </div>

        {isLoading ? (
          <div className="py-24 text-center font-crimson text-xl text-charcoal-400 italic">
            Loading…
          </div>
        ) : isFiltering ? (
          /* ── Search / filter results ── */
          searchResults.length === 0 ? (
            <div className="py-24 text-center max-w-lg mx-auto">
              <div className="border-t border-b border-charcoal-300 py-12">
                <p className="font-serif text-2xl text-charcoal-700 mb-3">
                  Nothing found.
                </p>
                <p className="font-crimson text-lg text-charcoal-500 italic mb-6">
                  Try a different search or{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="underline hover:text-charcoal-900"
                  >
                    browse all pieces
                  </button>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-mono text-xs text-charcoal-400 uppercase tracking-wider mb-8">
                {searchResults.length} piece{searchResults.length !== 1 ? "s" : ""}
                {activeSearch && ` matching "${activeSearch}"`}
                {activeType && ` · ${typeLabel(activeType)}`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
                {searchResults.map((item) => (
                  <div key={item.id} className="border-t border-charcoal-200 pt-8">
                    <ArticleTile content={item} />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : features.length === 0 ? (
          /* ── Empty featured state ── */
          <div className="py-24 text-center max-w-lg mx-auto">
            <div className="border-t border-b border-charcoal-300 py-12">
              <p className="font-serif text-2xl text-charcoal-700 mb-3">
                The first issue is being assembled.
              </p>
              <p className="font-crimson text-lg text-charcoal-500 italic mb-8">
                Check back soon, or submit your own work to be part of it.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 font-mono text-sm text-burnt-orange-500 hover:text-burnt-orange-600 transition-colors uppercase tracking-wider"
              >
                Submit a piece
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ── Featured feed ── */
          <>
            {heroContent && (
              <div className="mb-14 pb-14 border-b border-charcoal-200">
                <ArticleTile content={heroContent} feature={heroItem?.feature} />
              </div>
            )}

            {gridItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
                {gridItems.map((f) => {
                  if (!f.content) return null;
                  return (
                    <div key={f.content.id} className="border-t border-charcoal-200 pt-8">
                      <ArticleTile content={f.content} feature={f.feature} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Contribute CTA ── */}
            <div className="mt-24 border-t-2 border-charcoal-900 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-serif text-xl text-charcoal-900">
                  Write for Enamorado
                </p>
                <p className="font-crimson text-base text-charcoal-500 italic mt-0.5">
                  Essays, interviews, visual work — pitch us anything.
                </p>
              </div>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 font-mono text-sm bg-charcoal-900 text-white px-5 py-2.5 hover:bg-burnt-orange-500 transition-colors uppercase tracking-wider flex-shrink-0"
              >
                Submit a piece
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
