import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Navigation from "@/components/Navigation";
import { ArrowLeft, ExternalLink, Share2, Music } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterviewContent {
  id: number;
  title: string;
  type?: string;                  // interview | community-spotlight | essay | photoshoot
  description?: string | null;
  content?: string | null;        // HTML body (Q&A, prose)
  coverImage?: string | null;
  images?: string[] | null;       // photo gallery — shown below embed
  interviewee?: string | null;
  intervieweeRole?: string | null;
  intervieweeImage?: string | null;
  interviewer?: string | null;
  author?: string | null;         // essay-style author fallback
  tags?: string[] | null;
  publishedAt?: string | null;
  externalUrl?: string | null;
  externalType?: string | null;   // soundcloud | mixcloud | spotify | youtube | substack | medium | other
  sourceSubmissionId?: number | null;
  magazineContentId?: number | null;
}

// ── Embed helpers ─────────────────────────────────────────────────────────────

// Platforms that embed inline alongside content
const EMBED_PLATFORMS = new Set(["soundcloud", "mixcloud", "spotify", "youtube"]);
// Platforms that link out (no inline content)
const LINK_PLATFORMS = new Set(["substack", "medium", "other"]);

function buildEmbedSrc(url: string, platform: string): string | null {
  if (!url) return null;
  switch (platform) {
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23333333&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`;
    case "mixcloud":
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${encodeURIComponent(url)}`;
    case "spotify": {
      // Convert open.spotify.com/... to embed URL
      const embed = url.replace("open.spotify.com/", "open.spotify.com/embed/");
      return embed;
    }
    case "youtube": {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    }
    default:
      return null;
  }
}

function platformLabel(externalType?: string | null): string {
  switch (externalType) {
    case "soundcloud": return "SoundCloud";
    case "mixcloud":   return "Mixcloud";
    case "spotify":    return "Spotify";
    case "youtube":    return "YouTube";
    case "substack":   return "Substack";
    case "medium":     return "Medium";
    default:           return "External Site";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmbedPlayer({ url, platform }: { url: string; platform: string }) {
  const src = buildEmbedSrc(url, platform);
  if (!src) return null;

  const isAudio = platform === "soundcloud" || platform === "mixcloud";
  const isVideo = platform === "youtube" || platform === "spotify";

  return (
    <div className="mb-10 border border-paper-border bg-paper-warm">
      <div className="px-5 py-3 border-b border-paper-border flex items-center gap-2">
        <Music className="w-3 h-3 text-olive" />
        <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          {platformLabel(platform)}
        </span>
      </div>
      <iframe
        src={src}
        width="100%"
        height={isVideo ? 360 : isAudio && platform === "soundcloud" ? 166 : 120}
        allow="autoplay"
        className="block"
        style={{ border: "none" }}
        loading="lazy"
        title={`${platformLabel(platform)} player`}
      />
    </div>
  );
}

function ExternalLinkCTA({
  url,
  type,
}: {
  url: string;
  type?: string | null;
}) {
  const label = platformLabel(type);
  return (
    <div className="border border-paper-border p-10 text-center mb-10">
      <ExternalLink className="w-10 h-10 text-olive mx-auto mb-5" />
      <p className="font-display font-700 text-2xl uppercase text-foreground mb-3">
        Read on {label}
      </p>
      <p
        className="font-serif italic text-ink-muted mb-7 max-w-sm mx-auto leading-relaxed"
        style={{ fontSize: "1.1rem" }}
      >
        This piece is published externally. Click below to read the full version.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-foreground text-background font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-olive transition-colors"
      >
        Open in {label} <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function PhotoGallery({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <div className="mb-12">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-4">
        Photography
      </p>
      <div
        className={
          images.length === 1
            ? "w-full"
            : images.length === 2
            ? "grid grid-cols-2 gap-3"
            : "grid grid-cols-2 md:grid-cols-3 gap-3"
        }
      >
        {images.map((src, i) => (
          <div
            key={i}
            className={`overflow-hidden bg-paper-cool border border-paper-border ${
              images.length > 2 && i === 0 ? "col-span-2 md:col-span-1" : ""
            }`}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover aspect-[4/3]"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Prose styles injected once ────────────────────────────────────────────────

const proseStyles = `
  .interview-prose p {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.125rem;
    line-height: 1.85;
    margin-bottom: 1.5rem;
    color: var(--editorial-body, #333);
  }
  .interview-prose h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2.25rem);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: var(--editorial-display, #111);
    margin-top: 3rem;
    margin-bottom: 0.75rem;
    line-height: 1.05;
  }
  .interview-prose h3 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--olive, #6b7c3a);
    margin-top: 2.5rem;
    margin-bottom: 0.4rem;
  }
  .interview-prose blockquote {
    border-left: 3px solid var(--olive, #6b7c3a);
    padding-left: 1.5rem;
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: 1.25rem;
    line-height: 1.65;
    color: var(--ink-soft, #555);
    margin: 2.5rem 0;
  }
  .interview-prose a {
    color: var(--olive, #6b7c3a);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .interview-prose strong { color: var(--ink, #111); font-weight: 600; }
  .interview-prose hr { border-color: var(--paper-border, #e5e5e5); margin: 3rem 0; }
  .interview-prose ul, .interview-prose ol {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.125rem;
    line-height: 1.85;
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InterviewTemplate() {
  const [, params] = useRoute("/editorial/interview/:id");
  const contentId = params?.id ? parseInt(params.id) : null;

  const { data: content, isLoading } = useQuery<InterviewContent>({
    queryKey: [`/api/editorial/content/${contentId}`],
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-editorial mx-auto px-4 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted animate-pulse">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-editorial mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-black text-5xl uppercase text-foreground mb-4">
            Not Found
          </h1>
          <Link href="/editorial">
            <span className="font-mono text-xs uppercase tracking-widest text-olive hover:underline cursor-pointer flex items-center gap-1 justify-center">
              <ArrowLeft className="w-3 h-3" /> Back to Editorial
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const isSpotlight = content.type === "community-spotlight";
  const subjectName = content.interviewee || content.author || content.title;
  const formattedDate = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Determine embed vs external link
  const hasEmbed =
    content.externalUrl &&
    content.externalType &&
    EMBED_PLATFORMS.has(content.externalType);
  const hasExternalLink =
    content.externalUrl &&
    (!content.externalType || LINK_PLATFORMS.has(content.externalType));

  // Sanitize body HTML
  const safeHtml = content.content
    ? DOMPurify.sanitize(content.content, {
        ALLOWED_TAGS: [
          "p", "br", "strong", "em", "b", "i", "u", "s",
          "h1", "h2", "h3", "h4", "h5", "h6",
          "ul", "ol", "li",
          "blockquote", "hr",
          "a", "span", "div",
          "img",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
      })
    : "";

  const images = content.images?.filter(Boolean) ?? [];
  const backHref = isSpotlight ? "/spotlight" : "/editorial";
  const backLabel = isSpotlight ? "Spotlight" : "Interviews";
  const categoryLabel = isSpotlight ? "Spotlight" : "Interview";

  return (
    <div className="min-h-screen bg-background">
      <style>{proseStyles}</style>
      <Navigation />

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="border-b border-paper-border">
        <div className="max-w-site mx-auto px-4 sm:px-6 pt-10 pb-12">
          <Link href={backHref}>
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer mb-8 block">
              <ArrowLeft className="w-3 h-3" /> {backLabel}
            </span>
          </Link>

          {/* Category + tags */}
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-xs uppercase tracking-widest text-olive border border-olive px-2 py-0.5">
              {categoryLabel}
            </span>
            {content.tags?.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="font-mono text-xs uppercase tracking-widest text-ink-faint border border-paper-border px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Subject name */}
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">
            {isSpotlight ? "A Spotlight on" : "A conversation with"}
          </p>
          <h1
            className="font-display font-black uppercase leading-none text-foreground"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              letterSpacing: "-0.01em",
              maxWidth: "900px",
            }}
          >
            {subjectName}
          </h1>

          {content.intervieweeRole && (
            <p className="font-mono text-xs uppercase tracking-widest text-olive mt-3 mb-3">
              {content.intervieweeRole}
            </p>
          )}

          {content.description && (
            <p
              className="font-serif italic text-ink-muted leading-relaxed mt-2"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", maxWidth: "680px" }}
            >
              {content.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-7 font-mono text-xs uppercase tracking-widest text-ink-faint">
            {content.interviewer && <span>By {content.interviewer}</span>}
            {content.interviewer && <span>·</span>}
            {formattedDate && <time>{formattedDate}</time>}
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="ml-auto flex items-center gap-1 text-ink-faint hover:text-olive transition-colors"
              title="Copy link"
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
          </div>
        </div>
      </header>

      {/* ── COVER IMAGE ─────────────────────────────────────────────── */}
      {(content.intervieweeImage || content.coverImage) && (
        <div className="w-full max-h-[520px] overflow-hidden border-b border-paper-border">
          <img
            src={content.coverImage || content.intervieweeImage!}
            alt={subjectName || ""}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <main className="max-w-editorial mx-auto px-4 py-12 md:py-16">

        {/* No-image fallback card */}
        {!content.intervieweeImage && !content.coverImage && (
          <div className="flex items-center gap-5 border border-paper-border p-6 mb-10 bg-paper-warm">
            <div className="w-16 h-16 bg-paper-cool border border-paper-border flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-2xl uppercase text-ink-muted">
                {(subjectName || "?").charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-display font-800 text-2xl uppercase leading-none text-foreground">
                {subjectName}
              </p>
              {content.intervieweeRole && (
                <p className="font-mono text-xs uppercase tracking-widest text-olive mt-1">
                  {content.intervieweeRole}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Inline media embed (SoundCloud, Mixcloud, Spotify, YouTube) */}
        {hasEmbed && (
          <EmbedPlayer url={content.externalUrl!} platform={content.externalType!} />
        )}

        {/* ── External link CTA (Substack, Medium, other) */}
        {hasExternalLink && (
          <ExternalLinkCTA url={content.externalUrl!} type={content.externalType} />
        )}

        {/* ── Photo gallery (from images array) */}
        {images.length > 0 && <PhotoGallery images={images} />}

        {/* ── Q&A / prose body */}
        {safeHtml && (
          <div className="interview-prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          </div>
        )}

        {/* Fallback when there's no body but a description */}
        {!safeHtml && content.description && !hasExternalLink && (
          <div className="interview-prose">
            <p>{content.description}</p>
          </div>
        )}
      </main>

      {/* ── FOOTER NAV ──────────────────────────────────────────────── */}
      <div className="border-t border-paper-border py-8">
        <div className="max-w-editorial mx-auto px-4 flex items-center justify-between">
          <Link href={backHref}>
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer">
              <ArrowLeft className="w-3 h-3" /> Back to {backLabel}
            </span>
          </Link>
          {isSpotlight && (
            <Link href="/open-calls">
              <span className="font-mono text-xs uppercase tracking-widest text-olive hover:underline cursor-pointer">
                Apply to be featured →
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
