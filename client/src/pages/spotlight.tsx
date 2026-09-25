import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Sparkles, Camera, FileText, Mic2, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType =
  | "community-spotlight"
  | "interview"
  | "essay"
  | "photoshoot"
  | "mix-feature";

interface SpotlightProject {
  id: number;
  title: string;
  type: ContentType | string;
  status: string;
  description?: string | null;
  coverImage?: string | null;
  interviewee?: string | null;
  intervieweeRole?: string | null;
  author?: string | null;
  publishedAt?: string | Date | null;
  externalUrl?: string | null;
  externalType?: string | null;
  tags?: string[] | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Route to the correct editorial template based on type */
function contentHref(project: SpotlightProject): string {
  if (project.externalUrl) return project.externalUrl;
  switch (project.type) {
    case "essay":
      return `/editorial/essay/${project.id}`;
    case "photoshoot":
      return `/editorial/photoshoot/${project.id}`;
    case "interview":
    case "community-spotlight":
    default:
      return `/editorial/interview/${project.id}`;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "community-spotlight": return "Spotlight";
    case "interview":           return "Interview";
    case "essay":               return "Essay";
    case "photoshoot":          return "Photoshoot";
    case "mix-feature":         return "Mix";
    default:                    return "Feature";
  }
}

function TypeIcon({ type, className = "w-3.5 h-3.5" }: { type: string; className?: string }) {
  switch (type) {
    case "photoshoot":          return <Camera className={className} />;
    case "essay":               return <FileText className={className} />;
    case "interview":           return <Mic2 className={className} />;
    case "mix-feature":         return <Music2 className={className} />;
    case "community-spotlight":
    default:                    return <Sparkles className={className} />;
  }
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS: { key: ContentType | "all"; label: string }[] = [
  { key: "all",                label: "All"        },
  { key: "community-spotlight",label: "Spotlights" },
  { key: "interview",          label: "Interviews" },
  { key: "essay",              label: "Essays"     },
  { key: "photoshoot",         label: "Photos"     },
  { key: "mix-feature",        label: "Mixes"      },
];

// ── Spotlight card ────────────────────────────────────────────────────────────

function SpotlightCard({ project }: { project: SpotlightProject }) {
  const href      = contentHref(project);
  const isExternal = !!project.externalUrl;
  const subject   = project.interviewee || project.author || project.title;
  const label     = typeLabel(project.type);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group block bg-background border border-paper-border overflow-hidden hover:border-olive hover:shadow-sm transition-all duration-200"
    >
      {/* Cover image */}
      {project.coverImage ? (
        <div className="aspect-[4/3] overflow-hidden bg-paper-cool">
          <img
            src={project.coverImage}
            alt={subject}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-paper-cool flex items-center justify-center border-b border-paper-border">
          <TypeIcon type={project.type} className="w-10 h-10 text-ink-faint" />
        </div>
      )}

      <div className="p-5">
        {/* Type chip */}
        <div className="flex items-center gap-1.5 mb-3">
          <TypeIcon type={project.type} className="w-3 h-3 text-olive" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-olive">
            {label}
          </span>
        </div>

        {/* Subject name / title */}
        <h2 className="font-display font-800 uppercase text-foreground text-xl leading-tight mb-1 group-hover:text-olive transition-colors">
          {subject}
        </h2>

        {/* Role / subtitle */}
        {project.intervieweeRole && (
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-3">
            {project.intervieweeRole}
          </p>
        )}

        {/* Description */}
        {project.description && (
          <p className="text-sm text-ink-muted line-clamp-2 mb-4 font-serif italic leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Date + arrow */}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
            {project.publishedAt
              ? format(new Date(project.publishedAt), "MMM d, yyyy")
              : ""}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-olive group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </a>
  );
}

// ── Hero card (first result gets bigger treatment) ────────────────────────────

function HeroCard({ project }: { project: SpotlightProject }) {
  const href      = contentHref(project);
  const isExternal = !!project.externalUrl;
  const subject   = project.interviewee || project.author || project.title;
  const label     = typeLabel(project.type);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group grid md:grid-cols-2 gap-0 border border-paper-border overflow-hidden hover:border-olive hover:shadow-md transition-all duration-200 mb-10"
    >
      {/* Image half */}
      <div className="aspect-[4/3] md:aspect-auto overflow-hidden bg-paper-cool">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={subject}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full min-h-[240px] flex items-center justify-center">
            <TypeIcon type={project.type} className="w-14 h-14 text-ink-faint" />
          </div>
        )}
      </div>

      {/* Text half */}
      <div className="p-8 md:p-10 flex flex-col justify-center bg-background">
        <div className="flex items-center gap-1.5 mb-4">
          <TypeIcon type={project.type} className="w-3 h-3 text-olive" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-olive">
            {label}
          </span>
        </div>

        <h2
          className="font-display font-black uppercase text-foreground leading-none mb-3 group-hover:text-olive transition-colors"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          {subject}
        </h2>

        {project.intervieweeRole && (
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-4">
            {project.intervieweeRole}
          </p>
        )}

        {project.description && (
          <p className="font-serif italic text-ink-muted leading-relaxed mb-6" style={{ fontSize: "1.05rem" }}>
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-faint">
          {project.publishedAt && (
            <span>{format(new Date(project.publishedAt), "MMMM d, yyyy")}</span>
          )}
          <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:text-olive group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </a>
  );
}

// ── Application CTA ───────────────────────────────────────────────────────────

function ApplyCTA() {
  return (
    <div className="mt-20 border-t border-paper-border pt-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-4">
            Be featured
          </p>
          <h2
            className="font-display font-black uppercase text-foreground leading-none mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            Want in?
          </h2>
          <p className="text-ink-muted leading-relaxed mb-8 font-serif italic" style={{ fontSize: "1.05rem" }}>
            We feature people doing interesting things in and around the San Antonio
            music scene — collectors, promoters, producers, photographers, writers,
            the people who make the culture. No industry credentials required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/open-calls">
              <Button className="bg-foreground text-background hover:bg-olive transition-colors font-mono text-xs uppercase tracking-widest px-6 h-10">
                View open calls
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="outline" className="border-paper-border hover:border-olive font-mono text-xs uppercase tracking-widest px-6 h-10">
                Submit work
              </Button>
            </Link>
          </div>
        </div>

        {/* What to expect */}
        <div className="border border-paper-border p-8 bg-paper-warm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-5">
            What to expect
          </p>
          <ul className="space-y-4">
            {[
              { label: "Interviews",   desc: "Q&A conversations about your practice and perspective." },
              { label: "Essays",       desc: "Long-form pieces in your own voice, on your own terms." },
              { label: "Photoshoots",  desc: "Visual features with editorial photography." },
              { label: "Mix features", desc: "Deep-dives into a mix or playlist you put together." },
            ].map(({ label, desc }) => (
              <li key={label} className="flex gap-3">
                <span className="font-mono text-xs text-olive uppercase tracking-widest shrink-0 pt-0.5">
                  {label}
                </span>
                <span className="text-sm text-ink-muted font-serif italic leading-relaxed">{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SpotlightPage() {
  const [activeFilter, setActiveFilter] = useState<ContentType | "all">("all");

  const { data: spotlights = [], isLoading } = useQuery<SpotlightProject[]>({
    queryKey: ["/api/editorial/spotlights", activeFilter],
    queryFn: async () => {
      const url =
        activeFilter === "all"
          ? "/api/editorial/spotlights"
          : `/api/editorial/spotlights?type=${activeFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch spotlights");
      return res.json();
    },
  });

  const [hero, ...rest] = spotlights;

  // Only show filter tabs that have at least one item (compute from unfiltered data)
  const { data: allSpotlights = [] } = useQuery<SpotlightProject[]>({
    queryKey: ["/api/editorial/spotlights", "all"],
    queryFn: async () => {
      const res = await fetch("/api/editorial/spotlights");
      if (!res.ok) throw new Error("Failed to fetch spotlights");
      return res.json();
    },
  });

  const typesWithContent = new Set(allSpotlights.map((s) => s.type));
  const visibleFilters = FILTERS.filter(
    (f) => f.key === "all" || typesWithContent.has(f.key)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">

        {/* ── Breadcrumb ── */}
        <div className="mb-8">
          <Link href="/editorial">
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer">
              <ArrowLeft className="w-3 h-3" /> Editorial
            </span>
          </Link>
        </div>

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-ink-faint" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Enamorado Radio
            </span>
          </div>
          <h1
            className="font-display font-black uppercase text-foreground leading-none mb-4"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.01em" }}
          >
            Spotlight
          </h1>
          <p className="font-serif italic text-ink-muted max-w-2xl leading-relaxed" style={{ fontSize: "1.1rem" }}>
            People, music, and ideas from the San Antonio scene — in whatever form fits the story.
            Interviews, essays, photoshoots, mixes.
          </p>
        </div>

        {/* ── Filter tabs ── */}
        {visibleFilters.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-paper-border">
            {visibleFilters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={[
                  "font-mono text-xs uppercase tracking-widest px-4 py-1.5 border transition-colors",
                  activeFilter === key
                    ? "border-olive bg-olive text-background"
                    : "border-paper-border text-ink-muted hover:border-olive hover:text-olive",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-0 border border-paper-border animate-pulse">
              <div className="aspect-[4/3] bg-paper-cool" />
              <div className="p-10 space-y-4">
                <div className="h-3 w-16 bg-paper-cool rounded" />
                <div className="h-8 w-2/3 bg-paper-cool rounded" />
                <div className="h-4 w-40 bg-paper-cool rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-paper-border animate-pulse">
                  <div className="aspect-[4/3] bg-paper-cool" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-16 bg-paper-cool rounded" />
                    <div className="h-5 w-40 bg-paper-cool rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : spotlights.length === 0 ? (
          <div className="text-center py-24 border border-paper-border bg-paper-warm">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-ink-faint" />
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">
              {activeFilter === "all" ? "First feature coming soon" : `No ${typeLabel(activeFilter)} features yet`}
            </p>
            <p className="text-sm text-ink-muted">
              {activeFilter !== "all" ? (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="text-olive hover:underline"
                >
                  View all features →
                </button>
              ) : (
                "Submit via an open call to be considered."
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Hero — first item gets the wide 50/50 treatment */}
            {hero && <HeroCard project={hero} />}

            {/* Grid — everything else */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((project) => (
                  <SpotlightCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </>
        )}

        <ApplyCTA />
      </div>
    </div>
  );
}
