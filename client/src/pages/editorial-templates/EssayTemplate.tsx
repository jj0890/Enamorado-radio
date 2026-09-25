import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Navigation from "@/components/Navigation";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";

interface EssayContent {
  id: number;
  title: string;
  description: string;
  content: string;
  coverImage?: string;
  author: string;
  authorBio?: string;
  authorImage?: string;
  tags?: string[];
  publishedAt: string;
  readingTime?: number;
  externalUrl?: string;
  externalType?: string;
  relatedContent?: Array<{
    id: number;
    title: string;
    excerpt: string;
    image?: string;
  }>;
}

export default function EssayTemplate() {
  const [, params] = useRoute("/editorial/essay/:id");
  const contentId = params?.id ? parseInt(params.id) : null;

  const { data: content, isLoading } = useQuery<EssayContent>({
    queryKey: [`/api/editorial/content/${contentId}`],
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-editorial mx-auto px-4 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-editorial mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-black text-5xl uppercase text-foreground mb-4">Not Found</h1>
          <Link href="/editorial">
            <span className="font-mono text-xs uppercase tracking-widest text-olive hover:underline cursor-pointer flex items-center gap-1 justify-center">
              <ArrowLeft className="w-3 h-3" /> Back to Editorial
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(content.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const platformLabel =
    content.externalType === "substack" ? "Substack" :
    content.externalType === "medium" ? "Medium" :
    "External Site";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ── ARTICLE HERO ─────────────────────────────────────────────── */}
      <header className="border-b border-paper-border">
        <div className="max-w-site mx-auto px-4 sm:px-6 pt-10 pb-12">
          {/* Back nav */}
          <Link href="/editorial">
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer mb-8 block">
              <ArrowLeft className="w-3 h-3" /> Essays
            </span>
          </Link>

          {/* Category + Tags row */}
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-xs uppercase tracking-widest text-olive border border-olive px-2 py-0.5">
              Essay
            </span>
            {content.tags?.slice(0, 2).map((tag, i) => (
              <span key={i} className="font-mono text-xs uppercase tracking-widest text-ink-faint border border-paper-border px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          {/* Title — giant Barlow Condensed */}
          <h1
            className="font-display font-black uppercase leading-none text-foreground"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.01em", maxWidth: "900px" }}
          >
            {content.title}
          </h1>

          {/* Kicker — EB Garamond italic */}
          {content.description && (
            <p className="font-serif italic text-ink-muted leading-relaxed mt-5"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", maxWidth: "680px" }}>
              {content.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-7 font-mono text-xs uppercase tracking-widest text-ink-faint">
            <span>By {content.author}</span>
            <span>·</span>
            <time>{formattedDate}</time>
            {content.readingTime && (
              <>
                <span>·</span>
                <span>{content.readingTime} min read</span>
              </>
            )}
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

      {/* ── COVER IMAGE ──────────────────────────────────────────────── */}
      {content.coverImage && (
        <div className="w-full max-h-[520px] overflow-hidden border-b border-paper-border">
          <img
            src={content.coverImage}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <main className="max-w-editorial mx-auto px-4 py-12 md:py-16">
        {content.externalUrl ? (
          /* External link CTA */
          <div className="border border-paper-border p-10 text-center">
            <ExternalLink className="w-10 h-10 text-olive mx-auto mb-5" />
            <p className="font-display font-700 text-2xl uppercase text-foreground mb-3">
              Read on {platformLabel}
            </p>
            <p className="font-serif italic text-ink-muted mb-7 max-w-sm mx-auto leading-relaxed" style={{ fontSize: "1.1rem" }}>
              This essay is published externally. Click below to read the full piece.
            </p>
            <a
              href={content.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-olive transition-colors"
            >
              Open in {platformLabel} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          /* Prose content */
          <div className="prose prose-lg max-w-none">
            <style>{`
              .prose p {
                font-family: 'EB Garamond', Georgia, serif;
                font-size: 1.125rem;
                line-height: 1.85;
                margin-bottom: 1.65rem;
                color: var(--editorial-body);
              }
              .prose h2 {
                font-family: 'Barlow Condensed', sans-serif;
                font-size: clamp(1.6rem, 3vw, 2.25rem);
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: -0.01em;
                color: var(--editorial-display);
                margin-top: 3rem;
                margin-bottom: 0.75rem;
                line-height: 1.05;
              }
              .prose h3 {
                font-family: 'Barlow Condensed', sans-serif;
                font-size: 1.4rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: -0.01em;
                color: var(--editorial-display);
                margin-top: 2.25rem;
                margin-bottom: 0.5rem;
              }
              .prose blockquote {
                border-left: 3px solid var(--olive);
                padding-left: 1.5rem;
                font-family: 'EB Garamond', Georgia, serif;
                font-style: italic;
                font-size: 1.25rem;
                line-height: 1.65;
                color: var(--ink-soft);
                margin: 2.5rem 0;
              }
              .prose a {
                color: var(--olive);
                text-decoration: underline;
                text-underline-offset: 3px;
              }
              .prose strong {
                color: var(--ink);
                font-weight: 600;
              }
              .prose ul, .prose ol {
                font-family: 'EB Garamond', Georgia, serif;
                font-size: 1.125rem;
                line-height: 1.85;
                color: var(--editorial-body);
              }
              .prose li {
                margin-bottom: 0.4rem;
              }
              .prose hr {
                border-color: var(--paper-border);
                margin: 3rem 0;
              }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: content.content || `<p>${content.description || ""}</p>` }} />
          </div>
        )}

        {/* Author bio */}
        {content.authorBio && (
          <div className="mt-16 pt-8 border-t border-paper-border flex items-start gap-5">
            {content.authorImage ? (
              <img
                src={content.authorImage}
                alt={content.author}
                className="w-14 h-14 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-paper-cool border border-paper-border flex items-center justify-center flex-shrink-0">
                <span className="font-display font-black text-xl uppercase text-ink-muted">
                  {content.author.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-olive mb-2">
                About {content.author}
              </p>
              <p className="font-serif text-ink-muted leading-relaxed" style={{ fontSize: "1rem" }}>
                {content.authorBio}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── RELATED CONTENT ──────────────────────────────────────────── */}
      {content.relatedContent && content.relatedContent.length > 0 && (
        <section className="border-t border-paper-border bg-paper-warm py-14">
          <div className="max-w-site mx-auto px-4 sm:px-6">
            <h2 className="font-display font-black text-3xl uppercase text-foreground mb-8">
              Related Reading
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {content.relatedContent.map((item) => (
                <Link key={item.id} href={`/editorial/${item.id}`}>
                  <div className="border border-paper-border hover:border-olive transition-colors p-5 bg-background cursor-pointer">
                    {item.image && (
                      <div className="aspect-video overflow-hidden mb-4 bg-paper-cool">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-display font-800 text-xl uppercase leading-tight text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="font-serif text-sm italic text-ink-muted line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BACK NAV ─────────────────────────────────────────────────── */}
      <div className="border-t border-paper-border py-8">
        <div className="max-w-editorial mx-auto px-4">
          <Link href="/editorial">
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer">
              <ArrowLeft className="w-3 h-3" /> Back to All Editorial
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
