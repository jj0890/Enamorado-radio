import Navigation from "@/components/Navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { Link } from "wouter";

interface OEmbedMeta {
  platform?: string | null;
  title?: string | null;
  thumbnail?: string | null;
  embedUrl?: string | null;
  embedHtml?: string | null;
  description?: string | null;
}

interface GalleryLayoutProps {
  content: {
    title: string;
    authors?: string[];
    excerpt?: string;
    coverImageUrl?: string;
    publishedAt?: string;
    contentType?: string;
    originChannel?: string;
    files?: { url: string; type: string; name?: string }[];
    imageCaptions?: Record<string, { caption: string; altText: string }>;
    credits?: Record<string, string>;
    tags?: string[];
  };
  onShare: () => void;
  formatDate: (d: string) => string;
  estimateReadingTime: (t: string) => number;
  oembed?: OEmbedMeta | null;
  labelForPlatform?: (platform?: string | null, kind?: string) => string;
}

const CREDIT_LABELS: Record<string, string> = {
  photographer: "Photography",
  stylist: "Styling",
  mua: "Make-up",
  wardrobe: "Wardrobe",
  location: "Location",
  art_direction: "Art Direction",
};

export default function GalleryLayout({ content, onShare, formatDate }: GalleryLayoutProps) {
  const isEditorial = content.originChannel !== "community";
  const backPath = isEditorial ? "/editorial" : "/community";
  const backLabel = isEditorial ? "Editorial" : "Community";

  const images = content.files?.filter(f => f.type.startsWith("image")) ?? [];
  const credits = content.credits ? Object.entries(content.credits).filter(([, v]) => v) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header — wide zone above the gallery */}
      <div
        className="mx-auto px-5 pt-8 pb-0"
        style={{ maxWidth: "var(--container-editorial)" }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pb-6" style={{ color: "var(--editorial-meta)" }}>
          <Link
            href={backPath}
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {backLabel}
          </Link>
          <span className="font-mono text-xs" style={{ opacity: 0.4 }}>/</span>
          <span className="font-mono text-xs uppercase tracking-widest">Photoshoot</span>
        </div>

        <div style={{ height: "1px", background: "var(--editorial-rule)" }} />

        {/* Title */}
        <h1
          className="mt-7 mb-5 font-display font-800 uppercase"
          style={{
            fontSize: "clamp(2.25rem, 5.5vw, 4rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            color: "var(--editorial-display)",
          }}
        >
          {content.title}
        </h1>

        {content.excerpt && (
          <p
            className="mb-6 italic"
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "1.2rem",
              lineHeight: 1.65,
              color: "var(--ink-soft)",
            }}
          >
            {content.excerpt}
          </p>
        )}

        <div style={{ height: "1px", background: "var(--editorial-rule)" }} />

        {/* Byline */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 font-mono text-xs uppercase tracking-widest"
          style={{ color: "var(--editorial-meta)" }}
        >
          {content.authors && content.authors.length > 0 && (
            <span>By {content.authors.join(", ")}</span>
          )}
          {content.publishedAt && <span>{formatDate(content.publishedAt)}</span>}
          <button
            onClick={onShare}
            className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        <div style={{ height: "1px", background: "var(--editorial-rule)" }} />

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {content.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ border: "1px solid var(--editorial-rule)", color: "var(--editorial-meta)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gallery — full-width, outside the reading column */}
      <div className="mt-8 px-4 sm:px-6">
        {images.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
            {images.map((file, i) => {
              const cap = content.imageCaptions?.[file.url];
              return (
                <div key={i} className="break-inside-avoid mb-3">
                  <img
                    src={file.url}
                    alt={cap?.altText || file.name || content.title}
                    className="w-full h-auto block"
                  />
                  {cap?.caption && (
                    <p
                      className="font-mono text-[10px] uppercase tracking-widest mt-1.5 px-0.5"
                      style={{ color: "var(--editorial-meta)" }}
                    >
                      {cap.caption}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : content.coverImageUrl ? (
          <div style={{ maxWidth: "var(--container-editorial)", margin: "0 auto" }}>
            <img
              src={content.coverImageUrl}
              alt={content.title}
              className="w-full h-auto block"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-24"
            style={{ color: "var(--editorial-meta)" }}
          >
            <p className="font-mono text-xs uppercase tracking-widest">No images available</p>
          </div>
        )}
      </div>

      {/* Credits + footer — back inside reading column */}
      {credits.length > 0 && (
        <div
          className="mx-auto px-5 mt-10"
          style={{ maxWidth: "var(--container-editorial)" }}
        >
          <div style={{ height: "1px", background: "var(--editorial-rule)" }} />
          <div className="py-6 flex flex-wrap gap-x-8 gap-y-3">
            {credits.map(([role, name]) => (
              <div key={role}>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                  style={{ color: "var(--editorial-meta)" }}
                >
                  {CREDIT_LABELS[role] || role}
                </p>
                <p
                  className="font-display font-700 uppercase text-sm"
                  style={{ color: "var(--editorial-display)" }}
                >
                  {name}
                </p>
              </div>
            ))}
          </div>
          <div style={{ height: "1px", background: "var(--editorial-rule)" }} />
        </div>
      )}

      <div className="mb-16" />
    </div>
  );
}
