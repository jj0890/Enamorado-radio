import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface OEmbedMeta {
  platform?: string | null;
  title?: string | null;
  thumbnail?: string | null;
  embedUrl?: string | null;
  embedHtml?: string | null;
  description?: string | null;
}

interface MediaLayoutProps {
  content: {
    title: string;
    authors?: string[];
    excerpt?: string;
    coverImageUrl?: string;
    publishedAt?: string;
    contentType?: string;
    originChannel?: string;
    externalUrl?: string | null;
    kind?: string;
    links?: Record<string, string | undefined>;
  };
  onShare: () => void;
  formatDate: (d: string) => string;
  estimateReadingTime: (t: string) => number;
  oembed?: OEmbedMeta | null;
  labelForPlatform?: (platform?: string | null, kind?: string) => string;
}

export default function MediaLayout({
  content,
  onShare,
  formatDate,
  oembed,
  labelForPlatform,
}: MediaLayoutProps) {
  const backPath = content.originChannel === "community" ? "/community" : "/editorials";
  const primaryUrl = content.externalUrl;
  const platform = oembed?.platform;

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link href={backPath}>
            <Button variant="ghost" className="mb-6 text-[var(--charcoal)]/70">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-4 leading-tight">
            {content.title}
          </h1>

          {content.excerpt && (
            <p className="text-xl text-[var(--charcoal)]/70 mb-6">{content.excerpt}</p>
          )}

          <div className="flex items-center gap-4 mb-8 text-sm text-[var(--charcoal)]/60">
            {content.authors && content.authors.length > 0 && (
              <span>By {content.authors.join(", ")}</span>
            )}
            {content.publishedAt && <span>{formatDate(content.publishedAt)}</span>}
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Cover image */}
          {(oembed?.thumbnail ?? content.coverImageUrl) && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={oembed?.thumbnail ?? content.coverImageUrl ?? ""}
                alt={content.title}
                className="w-full h-auto object-contain max-h-80"
              />
            </div>
          )}

          {/* oEmbed HTML embed */}
          {oembed?.embedHtml && (
            <div
              className="mb-8"
              dangerouslySetInnerHTML={{ __html: oembed.embedHtml }}
            />
          )}

          {/* Fallback link */}
          {primaryUrl && !oembed?.embedHtml && (
            <div className="mb-8">
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--editorial)] text-white rounded-lg hover:bg-[var(--editorial)]/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {labelForPlatform ? labelForPlatform(platform, content.kind) : "Open"}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
