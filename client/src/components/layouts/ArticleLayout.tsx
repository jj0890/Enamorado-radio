import Navigation from "@/components/Navigation";
import { Share2, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import YouTubeEmbed from "@/components/youtube-embed";

interface FeaturedEmbed {
  type: string;
  url: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

interface RelatedMediaItem {
  type: 'mix' | 'episode' | 'album';
  id: number;
  title: string;
  coverImage?: string;
}

interface OEmbedMeta {
  platform?: string | null;
  title?: string | null;
  thumbnail?: string | null;
  embedUrl?: string | null;
  embedHtml?: string | null;
  description?: string | null;
}

interface VideoContent {
  videoUrl: string;
  title: string;
  description?: string;
}

interface ArticleLayoutProps {
  content: {
    title: string;
    authors?: string[];
    coAuthors?: string[];
    intervieweeRole?: string;
    excerpt?: string;
    body?: string;
    coverImageUrl?: string;
    publishedAt?: string;
    contentType?: string;
    originChannel?: string;
    tags?: string[];
    featuredEmbed?: FeaturedEmbed;
    relatedMedia?: RelatedMediaItem[];
  };
  onShare: () => void;
  formatDate: (d: string) => string;
  estimateReadingTime: (t: string) => number;
  videoContent?: VideoContent;
  oembed?: OEmbedMeta | null;
  labelForPlatform?: (platform?: string | null, kind?: string) => string;
}

function typeLabel(contentType?: string): string {
  if (!contentType) return "Editorial";
  const t = contentType.toLowerCase().replace(/_/g, "-");
  if (t.includes("interview")) return "Interview";
  if (t.includes("essay")) return "Essay";
  if (t.includes("photo")) return "Photoshoot";
  if (t.includes("mix") || t.includes("music")) return "Music";
  if (t.includes("community")) return "Community";
  if (t.includes("video")) return "Video Essay";
  return "Editorial";
}

function embedLabel(type: string): string {
  if (type === "soundcloud") return "SoundCloud";
  if (type === "spotify") return "Spotify";
  if (type === "bandcamp") return "Bandcamp";
  if (type === "youtube") return "YouTube";
  return type.toUpperCase();
}

function relatedHref(item: RelatedMediaItem): string {
  if (item.type === "episode") return `/episode/${item.id}`;
  if (item.type === "mix") return "/mixes";
  return "/albums";
}

export default function ArticleLayout({
  content,
  onShare,
  formatDate,
  estimateReadingTime,
  videoContent,
  oembed,
}: ArticleLayoutProps) {
  const isEditorial = content.originChannel !== "community";
  const backPath = isEditorial ? "/editorial" : "/community";
  const backLabel = isEditorial ? "Editorial" : "Community";
  const label = isEditorial ? typeLabel(content.contentType) : "Community";

  const allAuthors = [
    ...(content.authors || []),
    ...(content.coAuthors || []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Full-bleed cover image */}
      {content.coverImageUrl && !videoContent && (
        <div
          className="w-full relative overflow-hidden"
          style={{ height: "clamp(280px, 45vw, 560px)" }}
        >
          <img
            src={content.coverImageUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "40%",
              background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* Reading column */}
      <div className="mx-auto px-5" style={{ maxWidth: "var(--container-editorial)" }}>

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 pt-8 pb-6" style={{ color: "var(--editorial-meta)" }}>
          <Link
            href={backPath}
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {backLabel}
          </Link>
          {isEditorial && label !== "Editorial" && (
            <>
              <span className="font-mono text-xs" style={{ opacity: 0.4 }}>/</span>
              <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
            </>
          )}
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

        {/* Excerpt */}
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
          {allAuthors.length > 0 && (
            <span>
              {content.contentType === "interview" && content.coAuthors?.length === 0
                ? `Interview by ${allAuthors.join(", ")}`
                : `By ${allAuthors.join(", ")}`}
              {content.intervieweeRole && (
                <span style={{ opacity: 0.6 }}> · {content.intervieweeRole}</span>
              )}
            </span>
          )}
          {content.publishedAt && <span>{formatDate(content.publishedAt)}</span>}
          {content.body && <span>{estimateReadingTime(content.body)} min read</span>}
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
                style={{
                  border: "1px solid var(--editorial-rule)",
                  color: "var(--editorial-meta)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Featured music embed card */}
        {content.featuredEmbed && (
          <a
            href={content.featuredEmbed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-4 no-underline group"
            style={{
              padding: "14px 16px",
              border: "1px solid var(--editorial-rule)",
              background: "var(--paper-cool)",
            }}
          >
            {content.featuredEmbed.artwork && (
              <img
                src={content.featuredEmbed.artwork}
                alt=""
                className="w-12 h-12 object-cover shrink-0"
                style={{ borderRadius: "var(--radius)" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <span
                className="font-mono text-[10px] uppercase tracking-widest block mb-0.5"
                style={{ color: "var(--editorial-meta)" }}
              >
                {embedLabel(content.featuredEmbed.type)}
              </span>
              <p
                className="font-display font-700 uppercase text-sm leading-tight truncate"
                style={{ color: "var(--editorial-display)" }}
              >
                {content.featuredEmbed.title || content.title}
              </p>
              {content.featuredEmbed.artist && (
                <p className="font-mono text-xs mt-0.5 truncate" style={{ color: "var(--editorial-meta)" }}>
                  {content.featuredEmbed.artist}
                </p>
              )}
            </div>
            <ExternalLink
              className="w-4 h-4 shrink-0 transition-colors"
              style={{ color: "var(--olive)" }}
            />
          </a>
        )}

        {/* Video embed (video essays) */}
        {videoContent && (
          <div className="mt-8 mb-6 -mx-5">
            <YouTubeEmbed videoUrl={videoContent.videoUrl} title={videoContent.title} />
          </div>
        )}

        {/* oEmbed (Spotify / SoundCloud / Substack / etc.) */}
        {oembed?.embedHtml && (
          <div className="mt-8 mb-6" dangerouslySetInnerHTML={{ __html: oembed.embedHtml }} />
        )}

        {/* Body */}
        {content.body && (
          <div
            className="prose mt-8"
            style={{ maxWidth: "none" }}
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        )}

        {/* Related listening */}
        {content.relatedMedia && content.relatedMedia.length > 0 && (
          <div className="mt-14 pb-16">
            <div style={{ height: "1px", background: "var(--editorial-rule)" }} />
            <p
              className="font-mono text-[10px] uppercase tracking-widest mt-6 mb-4"
              style={{ color: "var(--editorial-meta)" }}
            >
              Related listening
            </p>
            <div className="flex flex-col gap-0">
              {content.relatedMedia.map((item, i) => (
                <a
                  key={`${item.type}-${item.id}`}
                  href={relatedHref(item)}
                  className="flex items-center gap-3 group py-3 no-underline"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--editorial-rule)" : "none",
                  }}
                >
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt=""
                      className="w-10 h-10 object-cover shrink-0"
                      style={{ borderRadius: "var(--radius)" }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 shrink-0"
                      style={{ background: "var(--paper-cool)", borderRadius: "var(--radius)" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-mono text-[10px] uppercase tracking-widest block"
                      style={{ color: "var(--editorial-meta)" }}
                    >
                      {item.type}
                    </span>
                    <span
                      className="font-display font-700 uppercase text-sm leading-tight truncate block group-hover:text-olive transition-colors"
                      style={{ color: "var(--editorial-display)" }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs shrink-0" style={{ color: "var(--olive)" }}>→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {(!content.relatedMedia || content.relatedMedia.length === 0) && (
          <div className="mb-16 mt-10">
            <div style={{ height: "1px", background: "var(--editorial-rule)" }} />
          </div>
        )}
      </div>
    </div>
  );
}
