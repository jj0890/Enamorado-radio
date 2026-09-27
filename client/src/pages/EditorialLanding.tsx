import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import { ArrowRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EditorialCategory = "all" | "interviews" | "essays" | "photoshoots" | "music" | "community";

const CATEGORY_TABS: { value: EditorialCategory; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "interviews",  label: "Interviews" },
  { value: "essays",      label: "Essays" },
  { value: "photoshoots", label: "Photoshoots" },
  { value: "music",       label: "Music" },
  { value: "community",   label: "Community" },
];

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

interface MagazineIssue {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  issueNumber?: number;
  articles?: { id: number; title: string; contentType?: string; position?: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str?: string) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function entryHref(item: EditorialItem): string {
  if (String(item.id).startsWith("mc-") && item.editorial?.slug)
    return `/entry/${item.editorial.slug}?from=editorials`;
  return `/entry/${item.id}?from=editorials`;
}

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

function typeLabel(item: EditorialItem): string {
  const k = normalise(item.kind || item.contentType);
  if (k.includes("interview"))  return "Interview";
  if (k.includes("photo"))      return "Photoshoot";
  if (k.includes("essay") || k.includes("writing")) return "Essay";
  if (k.includes("mix") || k.includes("music") || k.includes("playlist")) return "Music";
  if (k.includes("community"))  return "Community";
  if (k.includes("art"))        return "Visual";
  return item.kind || "Editorial";
}

// ── Featured Issue Zone ───────────────────────────────────────────────────────

function IssueZone({ issue }: { issue: MagazineIssue }) {
  const articles = issue.articles || [];

  return (
    <section className="border-b border-paper-border">
      <div
        className="max-w-site mx-auto px-6 sm:px-10 lg:px-16"
        style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}
      >
        {/* Issue eyebrow */}
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-10">
          {issue.issueNumber ? `Issue ${String(issue.issueNumber).padStart(3, "0")}` : "Current Issue"}
          {issue.publishedAt ? ` · ${formatDate(issue.publishedAt)}` : ""}
        </p>

        <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-start">
          {/* Left — title, description, TOC */}
          <div>
            <h1
              className="font-display font-black uppercase leading-none text-foreground mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
            >
              {issue.title}
            </h1>

            {issue.description && (
              <p
                className="font-serif italic text-ink-muted leading-relaxed mb-12 max-w-lg"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)" }}
              >
                {issue.description}
              </p>
            )}

            {/* In This Issue */}
            {articles.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-6">
                  In This Issue
                </p>
                <ol className="space-y-4">
                  {articles.map((a, i) => (
                    <li key={a.id} className="flex items-baseline gap-5 group">
                      <span
                        className="font-mono text-xs text-ink-faint shrink-0 tabular-nums"
                        style={{ minWidth: "1.5rem" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display font-black uppercase text-foreground leading-tight group-hover:text-olive transition-colors" style={{ fontSize: "1.05rem" }}>
                        {a.title}
                      </span>
                      {a.contentType && (
                        <span className="font-mono text-xs uppercase tracking-widest text-ink-faint shrink-0 ml-auto">
                          {a.contentType}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Right — cover image */}
          {issue.coverImageUrl && (
            <div className="lg:w-72 xl:w-80 shrink-0">
              <img
                src={issue.coverImageUrl}
                alt={issue.title}
                className="w-full object-cover"
                style={{ aspectRatio: "3/4" }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Hero Article ──────────────────────────────────────────────────────────────

function HeroArticle({ item }: { item: EditorialItem }) {
  const href   = entryHref(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div
        className="group relative w-full overflow-hidden cursor-pointer"
        style={{ height: "clamp(480px, 65vh, 720px)" }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}

        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(25,30,21,0.92) 0%, rgba(25,30,21,0.45) 50%, rgba(25,30,21,0.08) 100%)" }}
        />

        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-12 sm:pb-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 mb-5">
            {typeLabel(item)}
            {item.submittedAt ? ` · ${formatDate(item.submittedAt)}` : ""}
          </p>

          <h2
            className="font-display font-black uppercase leading-none text-white mb-5 group-hover:text-olive-light transition-colors max-w-3xl"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)", letterSpacing: "-0.01em" }}
          >
            {item.title}
          </h2>

          {item.description && (
            <p
              className="font-serif italic text-white/70 mb-6 max-w-xl line-clamp-2"
              style={{ fontSize: "1.05rem" }}
            >
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-6">
            {author && (
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/50">{author}</span>
            )}
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-white flex items-center gap-1.5 group-hover:text-olive-light transition-colors ml-auto">
              Read <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Article Row (replaces FeaturedCard — cleaner, more sparse) ────────────────

function ArticleRow({ item }: { item: EditorialItem }) {
  const href   = entryHref(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div className="group flex gap-8 sm:gap-10 items-start py-8 border-b border-paper-border cursor-pointer hover:border-olive/40 transition-colors">
        {/* Image */}
        {item.thumbnail && (
          <div className="w-28 sm:w-40 shrink-0 overflow-hidden bg-paper-cool">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full aspect-[4/3] object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-3">
            {typeLabel(item)}
            {item.submittedAt ? ` · ${formatDate(item.submittedAt)}` : ""}
          </p>
          <h3
            className="font-display font-black uppercase leading-tight text-foreground group-hover:text-olive transition-colors mb-3"
            style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", letterSpacing: "-0.01em" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="font-serif italic text-ink-muted leading-relaxed line-clamp-2" style={{ fontSize: "0.95rem" }}>
              {item.description}
            </p>
          )}
          {author && (
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-4">{author}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────────────

function GridCard({ item }: { item: EditorialItem }) {
  const href   = entryHref(item);
  const author = item.authorName || item.authorHandle;

  return (
    <Link href={href}>
      <div className="group cursor-pointer flex flex-col h-full">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-paper-cool shrink-0">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-paper-warm" />
          )}
        </div>

        {/* Body */}
        <div className="pt-5 pb-2 flex flex-col flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint mb-3">
            {typeLabel(item)}
            {item.submittedAt ? ` · ${formatDate(item.submittedAt)}` : ""}
          </p>
          <h3
            className="font-display font-black uppercase leading-tight text-foreground group-hover:text-olive transition-colors mb-3"
            style={{ fontSize: "clamp(1.05rem, 2vw, 1.3rem)", letterSpacing: "-0.005em" }}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="font-serif italic text-ink-muted leading-relaxed line-clamp-2 flex-1" style={{ fontSize: "0.9rem" }}>
              {item.description}
            </p>
          )}
          {author && (
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-4">{author}</p>
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

  const { data: issues = [] } = useQuery<MagazineIssue[]>({
    queryKey: ["/api/magazine/issues"],
    queryFn: async () => {
      const r = await fetch("/api/magazine/issues");
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

  const filtered   = allContent.filter(item => matchesCategory(item, activeCategory));
  const heroItem   = activeCategory === "all" ? (promoted[0] || allContent[0]) : filtered[0];
  const restItems  = filtered.filter(i => i.id !== heroItem?.id);

  // Latest issue (most recently published)
  const featuredIssue = issues.length > 0
    ? issues.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))[0]
    : null;

  const isEmpty = !isLoading && filtered.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ── FEATURED ISSUE or HERO ARTICLE ─────────────────────────── */}
      {activeCategory === "all" && featuredIssue ? (
        <IssueZone issue={featuredIssue} />
      ) : isLoading ? (
        <div className="w-full bg-paper-cool animate-pulse" style={{ height: "clamp(480px, 65vh, 720px)" }} />
      ) : heroItem ? (
        <HeroArticle item={heroItem} />
      ) : null}

      {/* ── FILTER + CONTENT ────────────────────────────────────────── */}
      <div className="max-w-site mx-auto px-6 sm:px-10 lg:px-16">

        {/* Quiet category filter */}
        <nav
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto border-b border-paper-border"
          style={{ paddingTop: "3rem", paddingBottom: "1.25rem" }}
        >
          {CATEGORY_TABS.map(({ value, label }) => (
            <Link key={value} href={value === "all" ? "/editorial" : `/editorial/${value}`}>
              <span
                className={[
                  "font-mono text-xs uppercase tracking-[0.18em] whitespace-nowrap transition-colors cursor-pointer pb-1 border-b",
                  activeCategory === value
                    ? "text-foreground border-foreground"
                    : "text-ink-faint border-transparent hover:text-ink-muted",
                ].join(" ")}
              >
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div style={{ paddingTop: "3.5rem", paddingBottom: "5rem" }}>
          {isLoading ? (
            <div className="space-y-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-8 items-start py-8 border-b border-paper-border">
                  <div className="w-40 shrink-0 aspect-[4/3] bg-paper-cool animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-20 bg-paper-cool animate-pulse" />
                    <div className="h-7 bg-paper-cool animate-pulse w-3/4" />
                    <div className="h-4 bg-paper-cool animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="py-32 text-center">
              <h2
                className="font-display font-black uppercase text-foreground mb-4"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                Coming Soon
              </h2>
              <p className="font-serif italic text-ink-muted max-w-sm mx-auto" style={{ fontSize: "1.05rem" }}>
                {activeCategory === "all"
                  ? "Editorial content is on its way."
                  : `No ${activeCategory} published yet.`}
              </p>
              <Link href="/submit">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-olive mt-10 hover:underline cursor-pointer">
                  Submit Your Work <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          ) : (
            <>
              {/* Top articles as rows (more breathing room, magazine list feel) */}
              {restItems.slice(0, 4).map(item => (
                <ArticleRow key={item.id} item={item} />
              ))}

              {/* Remaining as grid */}
              {restItems.length > 4 && (
                <>
                  <div className="flex items-center gap-6 mt-16 mb-10">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint shrink-0">More</p>
                    <div className="flex-1 h-px bg-paper-border" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {restItems.slice(4).map(item => (
                      <GridCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── SUBMIT CTA ───────────────────────────────────────────────── */}
      <section className="bg-foreground text-background">
        <div
          className="max-w-site mx-auto px-6 sm:px-10 lg:px-16 grid sm:grid-cols-2 gap-12 items-center"
          style={{ paddingTop: "clamp(4rem, 8vw, 6rem)", paddingBottom: "clamp(4rem, 8vw, 6rem)" }}
        >
          <div>
            <h2
              className="font-display font-black uppercase leading-none mb-5"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", letterSpacing: "-0.01em" }}
            >
              Got a story to tell?
            </h2>
            <p className="font-serif italic opacity-60 leading-relaxed" style={{ fontSize: "1.05rem" }}>
              Writers, photographers, artists — we're looking for authentic voices
              from the San Antonio underground.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-5">
            <Link href="/submit">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] border border-background/40 px-6 py-3.5 hover:border-background transition-colors cursor-pointer">
                Submit Your Work <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link href="/about/editorial">
              <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.18em] opacity-40 hover:opacity-80 transition-opacity cursor-pointer">
                About Our Editorial <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
