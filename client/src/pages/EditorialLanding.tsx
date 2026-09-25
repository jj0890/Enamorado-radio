import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import { ArrowRight, Calendar } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EditorialCategory =
  | "all"
  | "interviews"
  | "essays"
  | "photoshoots"
  | "music"
  | "community";

const CATEGORY_TABS: { value: EditorialCategory; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "interviews",  label: "Interviews" },
  { value: "essays",      label: "Essays" },
  { value: "photoshoots", label: "Photoshoots" },
  { value: "music",       label: "Music" },
  { value: "community",   label: "Community" },
];

// Maps category tab → the kind/contentType strings that match
const CATEGORY_MATCH: Record<string, string[]> = {
  interviews:  ["interview"],
  essays:      ["essay", "writing", "substack", "scene-report"],
  photoshoots: ["photoshoot", "photo_essay", "photo-essay", "art"],
  music:       ["mix-feature", "music", "playlist", "mix"],
  community:   ["community-spotlight", "community", "community_voice"],
};

interface EditorialItem {
  id: string | number;
  kind: string;
  contentType?: string;
  title: string;
  description?: string;
  authorName?: string;
  authorHandle?: string;
  submittedAt?: string;
  thumbnail?: string | null;
  editorial?: { promoted: boolean; slug?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str?: string) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function entryHref(item: EditorialItem): string {
  if (String(item.id).startsWith("mc-") && item.editorial?.slug) {
    return `/entry/${item.editorial.slug}?from=editorials`;
  }
  return `/entry/${item.id}?from=editorials`;
}

// Normalise to a predictable slug for matching
function normalise(s?: string) {
  return (s || "").toLowerCase().replace(/[_\s]/g, "-");
}

function matchesCategory(item: EditorialItem, cat: EditorialCategory): boolean {
  if (cat === "all") return true;
  const targets = CATEGORY_MATCH[cat] || [];
  const kind = normalise(item.kind);
  const ct   = normalise(item.contentType);
  return targets.some(t => kind.includes(t) || ct.includes(t));
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeCfg { label: string; cls: string }

function typeBadge(item: EditorialItem): BadgeCfg {
  const k = normalise(item.kind || item.contentType);
  if (k.includes("interview"))  return { label: "Interview",  cls: "bg-foreground text-background" };
  if (k.includes("photo"))      return { label: "Photoshoot", cls: "border border-paper-border text-ink-muted" };
  if (k.includes("essay") || k.includes("writing"))
                                return { label: "Essay",      cls: "bg-olive text-white" };
  if (k.includes("mix") || k.includes("music") || k.includes("playlist"))
                                return { label: "Music",      cls: "bg-olive-subtle text-olive-dark border border-olive-mid" };
  if (k.includes("community"))  return { label: "Community",  cls: "bg-paper-cool text-ink-soft border border-paper-border" };
  if (k.includes("art"))        return { label: "Visual",     cls: "border border-paper-border text-ink-muted" };
  return { label: item.kind || "Editorial", cls: "border border-paper-border text-ink-muted" };
}

// ── Hero (full-bleed) ─────────────────────────────────────────────────────────

function HeroArticle({ item }: { item: EditorialItem }) {
  const href  = entryHref(item);
  const badge = typeBadge(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div className="group relative w-full overflow-hidden" style={{ height: "clamp(420px, 60vh, 680px)" }}>
        {/* Image layer */}
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}

        {/* Gradient overlay — bottom-up so text is always legible */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(25,30,21,0.90) 0%, rgba(25,30,21,0.50) 45%, rgba(25,30,21,0.10) 100%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 pb-8 sm:pb-12">
          {/* Badge + date */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={[
                "font-mono text-xs uppercase tracking-widest px-2 py-0.5",
                badge.cls.includes("bg-foreground")
                  ? "bg-paper text-ink"
                  : "bg-white/10 text-white border border-white/20",
              ].join(" ")}
            >
              {badge.label}
            </span>
            {item.submittedAt && (
              <span className="font-mono text-xs text-white/60">{formatDate(item.submittedAt)}</span>
            )}
          </div>

          {/* Title */}
          <h2
            className="font-display font-black uppercase leading-none text-white mb-4 group-hover:text-olive-light transition-colors"
            style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", letterSpacing: "-0.01em" }}
          >
            {item.title}
          </h2>

          {/* Description */}
          {item.description && (
            <p className="font-serif italic text-white/75 mb-4 line-clamp-2 max-w-2xl" style={{ fontSize: "1.05rem" }}>
              {item.description}
            </p>
          )}

          {/* Author + CTA */}
          <div className="flex items-center justify-between">
            {author && (
              <span className="font-mono text-xs uppercase tracking-widest text-white/60">{author}</span>
            )}
            <span className="font-mono text-xs uppercase tracking-widest text-white flex items-center gap-1.5 group-hover:text-olive-light transition-colors ml-auto">
              Read <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Featured card (horizontal split, secondary position) ─────────────────────

function FeaturedCard({ item }: { item: EditorialItem }) {
  const href  = entryHref(item);
  const badge = typeBadge(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div className="group flex flex-col sm:flex-row border border-paper-border hover:border-olive transition-colors cursor-pointer">
        <div className="sm:w-2/5 shrink-0 overflow-hidden bg-paper-cool aspect-video sm:aspect-auto">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 min-h-[200px]"
            />
          ) : (
            <div className="w-full h-full min-h-[200px] bg-paper-warm flex items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">No Image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8 bg-background flex-1">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`font-mono text-xs uppercase tracking-widest px-2 py-0.5 ${badge.cls}`}>
                {badge.label}
              </span>
              {item.submittedAt && (
                <span className="font-mono text-xs text-ink-faint flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.submittedAt)}
                </span>
              )}
            </div>
            <h3
              className="font-display font-black uppercase leading-none text-foreground group-hover:text-olive transition-colors mb-3"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              {item.title}
            </h3>
            {item.description && (
              <p className="font-serif italic text-ink-muted leading-relaxed line-clamp-3" style={{ fontSize: "0.95rem" }}>
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            {author && (
              <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">{author}</span>
            )}
            <span className="font-mono text-xs uppercase tracking-widest text-ink-faint flex items-center gap-1 group-hover:text-olive transition-colors ml-auto">
              Read <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard({ item }: { item: EditorialItem }) {
  const href  = entryHref(item);
  const badge = typeBadge(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div className="group border border-paper-border hover:border-olive transition-colors cursor-pointer flex flex-col h-full">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-paper-cool shrink-0">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-paper-warm flex items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">No Image</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className={`font-mono text-xs uppercase tracking-widest px-1.5 py-0.5 ${badge.cls}`}>
              {badge.label}
            </span>
            {item.submittedAt && (
              <span className="font-mono text-xs text-ink-faint flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(item.submittedAt)}
              </span>
            )}
          </div>
          <h3
            className="font-display font-black uppercase leading-none text-foreground group-hover:text-olive transition-colors mb-3"
            style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="font-serif italic text-ink-muted text-sm leading-relaxed line-clamp-3 flex-1" style={{ fontSize: "0.9rem" }}>
              {item.description}
            </p>
          )}
          {author && (
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-3">{author}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditorialLanding() {
  const [, params] = useRoute("/editorial/:category?");
  const activeCategory = (params?.category as EditorialCategory) || "all";

  const { data: published = [], isLoading: loadingPublished } = useQuery<EditorialItem[]>({
    queryKey: ["/api/published-content"],
    queryFn: async () => {
      const r = await fetch("/api/published-content");
      return r.ok ? r.json() : [];
    },
    refetchOnWindowFocus: false,
  });

  const { data: promoted = [], isLoading: loadingPromoted } = useQuery<EditorialItem[]>({
    queryKey: ["/api/editorial-promoted"],
    queryFn: async () => {
      const r = await fetch("/api/editorial-promoted");
      return r.ok ? r.json() : [];
    },
    refetchOnWindowFocus: false,
  });

  const isLoading = loadingPublished || loadingPromoted;

  // Deduplicate, promoted first
  const seen = new Set<string | number>();
  const allContent = [...promoted, ...published].filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Active filter
  const filtered = allContent.filter(item => matchesCategory(item, activeCategory));

  // Hero = first promoted item (or first overall if no promoted)
  const heroItem    = activeCategory === "all" ? (promoted[0] || allContent[0]) : filtered[0];
  const gridItems   = activeCategory === "all"
    ? allContent.filter(i => i.id !== heroItem?.id)
    : filtered.filter(i => i.id !== heroItem?.id);

  // Secondary featured (first of gridItems when there's a hero)
  const secondaryItem = heroItem && gridItems.length > 0 ? gridItems[0] : null;
  const remainingItems = secondaryItem ? gridItems.slice(1) : gridItems;

  const isEmpty = !isLoading && filtered.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="w-full bg-paper-cool animate-pulse" style={{ height: "clamp(420px, 60vh, 680px)" }} />
      ) : heroItem ? (
        <HeroArticle item={heroItem} />
      ) : (
        /* Page header — only shows when no content to hero */
        <header className="border-b border-paper-border">
          <div className="max-w-site mx-auto px-4 sm:px-6 pt-12 pb-8">
            <h1
              className="font-display font-black uppercase leading-none text-foreground"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.01em" }}
            >
              Editorial
            </h1>
            <p className="font-serif italic text-ink-muted mt-4 max-w-xl" style={{ fontSize: "1.1rem" }}>
              Real people, real tastes, real music — stories from San Antonio and beyond.
            </p>
          </div>
        </header>
      )}

      {/* ── CATEGORY TABS ────────────────────────────────────────────── */}
      <div className="border-b border-paper-border bg-background sticky top-0 z-10">
        <nav className="max-w-site mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
          {CATEGORY_TABS.map(({ value, label }) => (
            <Link key={value} href={value === "all" ? "/editorial" : `/editorial/${value}`}>
              <button
                className={[
                  "font-mono text-xs uppercase tracking-widest px-4 py-3.5 border-b-2 whitespace-nowrap transition-colors",
                  activeCategory === value
                    ? "border-olive text-olive"
                    : "border-transparent text-ink-muted hover:text-foreground hover:border-paper-border",
                ].join(" ")}
              >
                {label}
              </button>
            </Link>
          ))}
        </nav>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <main className="max-w-site mx-auto px-4 sm:px-6 py-10">

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-paper-border">
                <div className="aspect-[4/3] bg-paper-cool animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-16 bg-paper-cool animate-pulse" />
                  <div className="h-6 bg-paper-cool animate-pulse" />
                  <div className="h-4 bg-paper-cool animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="py-24 text-center border border-paper-border">
            <h2 className="font-display font-black text-5xl uppercase text-foreground mb-3">Coming Soon</h2>
            <p className="font-serif italic text-ink-muted max-w-sm mx-auto" style={{ fontSize: "1.05rem" }}>
              {activeCategory === "all"
                ? "Editorial content is on its way. Check back soon."
                : `No ${activeCategory} published yet — check back soon.`}
            </p>
            <Link href="/submit">
              <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-olive mt-8 hover:underline cursor-pointer">
                Submit Your Work <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        ) : (
          <>
            {/* Secondary featured (horizontal) */}
            {secondaryItem && (
              <div className="mb-8">
                <FeaturedCard item={secondaryItem} />
              </div>
            )}

            {/* Grid */}
            {remainingItems.length > 0 && (
              <>
                {secondaryItem && (
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="font-display font-800 text-2xl uppercase tracking-wide text-foreground">
                      Latest
                    </h2>
                    <div className="flex-1 h-px bg-paper-border" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {remainingItems.map(item => (
                    <GridCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}

            {/* If only the hero exists and no others */}
            {!secondaryItem && !remainingItems.length && heroItem && (
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint text-center py-12">
                More coming soon
              </p>
            )}
          </>
        )}
      </main>

      {/* ── SUBMIT CTA ───────────────────────────────────────────────── */}
      <section className="bg-foreground text-background">
        <div className="max-w-site mx-auto px-4 sm:px-6 py-16 sm:py-20 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2
              className="font-display font-black uppercase leading-none mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Got a story to tell?
            </h2>
            <p className="font-serif italic opacity-70 leading-relaxed" style={{ fontSize: "1.05rem" }}>
              Writers, photographers, and artists — we're looking for authentic voices
              and thoughtful contributions from the San Antonio underground.
            </p>
          </div>
          <div className="sm:text-right flex sm:flex-col sm:items-end gap-4 flex-wrap">
            <Link href="/submit">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest border border-background/40 px-5 py-3 hover:border-background hover:text-white transition-colors cursor-pointer">
                Submit Your Work <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link href="/about/editorial">
              <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                About Our Editorial <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
