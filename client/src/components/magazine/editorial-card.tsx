import { Link } from "wouter";
import { Calendar } from "lucide-react";

/** Shape expected from community submissions / editorial-promoted API */
interface Submission {
  id: number | string;
  title: string;
  description?: string | null;
  category: string;
  submitterHandle?: string | null;
  createdAt?: string | Date | null;
  files?: string[] | null;
}

interface EditorialCardProps {
  submission: Submission;
  featured?: boolean;
}

/** Simple display helper — no external dependency needed */
function displayHandle(handle?: string | null) {
  if (!handle) return "";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  "creative-work":     "Creative Work",
  "conversation":      "Conversation",
  "local-moment":      "Local Moment",
  "essay":             "Essay",
  "interview":         "Interview",
  "photoshoot":        "Photoshoot",
  "playlist":          "Playlist",
  "community-piece":   "Community",
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.replace(/-/g, " ");
}

function formatDate(dateInput: string | Date) {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Featured card — full-width, pi.fyi "signal to noise" style ── */
function FeaturedEditorialCard({ submission }: { submission: Submission }) {
  const href = `/editorials/${submission.id}`;
  const image = submission.files?.[0];

  return (
    <Link href={href} data-testid={`editorial-card-featured-${submission.id}`}>
      <div className="group flex flex-col sm:flex-row gap-0 border border-paper-border hover:border-olive transition-colors duration-200 cursor-pointer">
        {/* Image — left on sm+ */}
        <div className="sm:w-1/2 shrink-0 overflow-hidden bg-paper-cool aspect-video sm:aspect-auto">
          {image ? (
            <img
              src={image}
              alt={submission.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-paper-warm">
              <span className="font-mono text-xs uppercase text-ink-faint tracking-widest">No Image</span>
            </div>
          )}
        </div>

        {/* Info — right */}
        <div className="flex flex-col justify-between p-7 sm:p-10 bg-background flex-1">
          <div>
            {/* Category + date */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-olive border border-olive px-2 py-0.5">
                {categoryLabel(submission.category)}
              </span>
              {submission.createdAt && (
                <span className="font-mono text-xs text-ink-faint flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(submission.createdAt)}
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              className="font-display font-black uppercase leading-none text-foreground group-hover:text-olive transition-colors mb-5"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
            >
              {submission.title}
            </h2>

            {/* Description — EB Garamond italic */}
            {submission.description && (
              <p className="font-serif italic text-ink-muted leading-relaxed line-clamp-4"
                style={{ fontSize: "1.05rem" }}>
                {submission.description}
              </p>
            )}
          </div>

          {/* Byline */}
          <p className="font-mono text-xs uppercase tracking-widest text-olive mt-6">
            {displayHandle(submission.submitterHandle)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Standard grid card ──────────────────────────────────────────── */
function StandardEditorialCard({ submission }: { submission: Submission }) {
  const href = `/editorials/${submission.id}`;
  const image = submission.files?.[0];

  return (
    <Link href={href} data-testid={`editorial-card-${submission.id}`}>
      <div className="group border border-paper-border hover:border-olive transition-colors duration-200 overflow-hidden cursor-pointer flex flex-col h-full">
        {/* Thumbnail */}
        <div className="aspect-[4/3] overflow-hidden bg-paper-cool shrink-0">
          {image ? (
            <img
              src={image}
              alt={submission.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-paper-warm">
              <span className="font-mono text-xs uppercase text-ink-faint tracking-widest">No Image</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-1">
          {/* Category + date */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-olive">
              {categoryLabel(submission.category)}
            </span>
            {submission.createdAt && (
              <span className="font-mono text-xs text-ink-faint">
                {formatDate(submission.createdAt)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-black uppercase text-xl leading-none text-foreground group-hover:text-olive transition-colors mb-3">
            {submission.title}
          </h3>

          {/* Description — EB Garamond */}
          {submission.description && (
            <p className="font-serif italic text-ink-muted text-sm leading-relaxed line-clamp-3 flex-1"
              style={{ fontSize: "0.95rem" }}>
              {submission.description}
            </p>
          )}

          {/* Byline */}
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-4">
            {displayHandle(submission.submitterHandle)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Public export — routes to featured or standard ─────────────── */
export default function EditorialCard({ submission, featured = false }: EditorialCardProps) {
  if (featured) return <FeaturedEditorialCard submission={submission} />;
  return <StandardEditorialCard submission={submission} />;
}
