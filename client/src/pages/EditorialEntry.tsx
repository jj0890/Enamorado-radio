import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";

function typeLabel(contentType?: string) {
  const map: Record<string, string> = {
    essay: "Essay",
    interview: "Interview",
    video_essay: "Video Essay",
    photoshoot: "Visual Work",
    playlist: "Playlist",
    artPdf: "Art",
    link: "Link",
  };
  return map[contentType ?? ""] ?? "Editorial";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EditorialEntry() {
  const [, params] = useRoute("/editorial/:slug");
  const slug = params?.slug;

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["/api/content", slug],
    queryFn: async () => {
      const res = await fetch(`/api/content/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
        <StickyRadioPlayer />
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center font-crimson text-xl text-charcoal-400 italic">
          Loading…
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
        <StickyRadioPlayer />
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="font-serif text-2xl text-charcoal-700 mb-4">
            This piece couldn't be found.
          </p>
          <Link
            href="/editorial"
            className="font-mono text-sm text-burnt-orange-500 hover:underline uppercase tracking-wider"
          >
            ← Back to Editorial
          </Link>
        </div>
      </div>
    );
  }

  const youtubeId =
    content.videoUrl ? extractYouTubeId(content.videoUrl) : null;
  const coverSrc =
    content.coverImageUrl ||
    (youtubeId ? getYouTubeThumbnail(youtubeId, "maxres") : null);

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "#FAF6F0" }}>
      <StickyRadioPlayer />
      <Navigation />

      <article className="max-w-2xl mx-auto px-4">
        {/* Back link */}
        <div className="pt-10 pb-8">
          <Link
            href="/editorial"
            className="inline-flex items-center gap-2 font-mono text-xs text-charcoal-400 hover:text-charcoal-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" />
            Editorial
          </Link>
        </div>

        {/* Header */}
        <header className="border-t-2 border-charcoal-900 pt-6 mb-8">
          {/* Content type */}
          <p className="font-mono text-xs tracking-widest uppercase text-burnt-orange-500 mb-4">
            {typeLabel(content.contentType)}
          </p>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal-900 leading-tight mb-4">
            {content.title}
          </h1>

          {/* Excerpt / subheadline */}
          {content.excerpt && (
            <p className="font-crimson text-xl text-charcoal-600 italic leading-relaxed mb-6">
              {content.excerpt}
            </p>
          )}

          {/* Byline */}
          <div className="flex items-center gap-4 text-sm border-t border-charcoal-200 pt-4">
            {content.authors?.length > 0 && (
              <span className="font-mono text-charcoal-700 text-xs uppercase tracking-wider">
                By {content.authors.join(", ")}
              </span>
            )}
            {content.publishedAt && (
              <span className="font-mono text-charcoal-400 text-xs">
                {formatDate(content.publishedAt)}
              </span>
            )}
          </div>
        </header>

        {/* Cover image or video */}
        {youtubeId ? (
          <div className="mb-10 aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={content.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : coverSrc ? (
          <figure className="mb-10 -mx-4 sm:mx-0">
            <img
              src={coverSrc}
              alt={content.title}
              className="w-full object-cover"
            />
            {content.credits && (
              <figcaption className="mt-2 px-4 sm:px-0 font-mono text-xs text-charcoal-400 italic">
                {content.credits}
              </figcaption>
            )}
          </figure>
        ) : null}

        {/* Body — TipTap HTML rendered with @tailwindcss/typography */}
        {content.body && (
          <div
            className="prose prose-lg prose-stone max-w-none
              prose-headings:font-serif prose-headings:text-charcoal-900
              prose-p:font-crimson prose-p:text-charcoal-700 prose-p:leading-relaxed prose-p:text-lg
              prose-a:text-burnt-orange-500 prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-burnt-orange-500 prose-blockquote:not-italic prose-blockquote:font-crimson prose-blockquote:text-xl prose-blockquote:text-charcoal-600
              prose-strong:text-charcoal-900 prose-strong:font-semibold"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        )}

        {/* Photoshoot gallery */}
        {content.contentType === "photoshoot" && content.galleryUrls && (
          <div className="mt-10 space-y-6">
            {(typeof content.galleryUrls === "string"
              ? content.galleryUrls.split("\n")
              : content.galleryUrls
            )
              .filter(Boolean)
              .map((url: string, i: number) => (
                <figure key={i}>
                  <img
                    src={url.trim()}
                    alt={`${content.title} — ${i + 1}`}
                    className="w-full"
                  />
                </figure>
              ))}
            {content.credits && (
              <p className="font-mono text-xs text-charcoal-400 italic">
                {content.credits}
              </p>
            )}
          </div>
        )}

        {/* PDF viewer */}
        {content.contentType === "artPdf" && content.pdfUrl && (
          <div className="mt-10">
            <a
              href={content.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-sm bg-charcoal-900 text-white px-5 py-3 hover:bg-burnt-orange-500 transition-colors uppercase tracking-wider"
            >
              View PDF
              <ExternalLink className="w-4 h-4" />
            </a>
            {content.artistCredit && (
              <p className="font-crimson text-sm text-charcoal-500 italic mt-3">
                {content.artistCredit}
              </p>
            )}
          </div>
        )}

        {/* External link */}
        {(content.contentType === "link" ||
          content.contentType === "playlist") &&
          content.externalUrl && (
            <div className="mt-10 border-t border-charcoal-200 pt-6">
              <a
                href={content.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-sm text-burnt-orange-500 hover:text-burnt-orange-600 uppercase tracking-wider transition-colors"
              >
                Open link
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

        {/* Footer rule */}
        <div className="mt-16 border-t-2 border-charcoal-900 pt-6 flex items-center justify-between">
          <Link
            href="/editorial"
            className="font-mono text-xs text-charcoal-400 hover:text-charcoal-900 transition-colors uppercase tracking-wider"
          >
            ← All editorial
          </Link>
          <Link
            href="/submit"
            className="font-mono text-xs text-burnt-orange-500 hover:text-burnt-orange-600 transition-colors uppercase tracking-wider"
          >
            Submit a piece →
          </Link>
        </div>
      </article>
    </div>
  );
}
