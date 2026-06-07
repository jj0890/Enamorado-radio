import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Play, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { FeatureWithContent } from "@shared/schema";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";

// Humanise content type for display
function typeLabel(contentType?: string) {
  const map: Record<string, string> = {
    essay: "Essay",
    interview: "Interview",
    video_essay: "Video",
    photoshoot: "Visual",
    playlist: "Playlist",
    artPdf: "Art",
    link: "Link",
  };
  return map[contentType ?? ""] ?? "Editorial";
}

// Single article tile — no shadows, just type label + title + excerpt
function ArticleTile({ content, feature }: { content: any; feature: any }) {
  const coverSrc =
    content.coverImageUrl ||
    (content.videoUrl && extractYouTubeId(content.videoUrl)
      ? getYouTubeThumbnail(extractYouTubeId(content.videoUrl)!, "maxres")
      : null) ||
    content.gallery?.[0]?.src;

  const isHero = feature?.featureType === "hero";

  return (
    <a
      href={`/content/${content.slug}`}
      className="group block"
      data-testid={`article-tile-${content.id}`}
    >
      {/* Cover image */}
      {coverSrc ? (
        <div
          className={`relative overflow-hidden bg-cream-200 mb-4 ${
            isHero ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        >
          <img
            src={coverSrc}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {content.videoUrl && extractYouTubeId(content.videoUrl) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`bg-cream-200 flex items-center justify-center mb-4 ${
            isHero ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        >
          <BookOpen className="w-10 h-10 text-charcoal-400" />
        </div>
      )}

      {/* Meta */}
      <p className="text-xs font-mono tracking-widest uppercase text-burnt-orange-500 mb-2">
        {typeLabel(content.contentType)}
        {content.authors?.length > 0 && (
          <span className="text-charcoal-400 normal-case tracking-normal font-normal">
            {" "}— {content.authors.join(", ")}
          </span>
        )}
      </p>

      {/* Title */}
      <h3
        className={`font-serif text-charcoal-900 leading-tight mb-2 group-hover:text-burnt-orange-500 transition-colors ${
          isHero ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
      >
        {content.title}
      </h3>

      {/* Excerpt */}
      {content.excerpt && (
        <p
          className={`font-crimson text-charcoal-600 leading-relaxed ${
            isHero ? "text-lg line-clamp-3" : "text-base line-clamp-2"
          }`}
        >
          {content.excerpt}
        </p>
      )}
    </a>
  );
}

export default function Editorial() {
  const { data: features = [], isLoading } = useQuery<FeatureWithContent[]>({
    queryKey: ["/api/features-with-content"],
  });

  const heroFeatures = features.filter(
    (f) => f.feature.featureType === "hero" && f.content
  );
  const mainFeatures = features.filter(
    (f) => f.feature.featureType === "main" && f.content
  );

  const heroItem = heroFeatures[0] ?? mainFeatures[0];
  const heroContent = heroItem?.content;

  // Everything that isn't the hero goes in the grid
  const gridItems =
    heroFeatures.length > 0
      ? mainFeatures
      : mainFeatures.slice(1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      <StickyRadioPlayer />
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 pb-32">
        {/* ── Masthead ── */}
        <div className="pt-12 pb-8">
          <div className="border-t-2 border-charcoal-900 pt-4">
            <div className="flex items-baseline justify-between">
              <h1 className="font-serif text-5xl md:text-6xl text-charcoal-900 tracking-tight">
                Editorial
              </h1>
              <span className="font-mono text-xs text-charcoal-400 uppercase tracking-widest hidden sm:block">
                Enamorado Radio
              </span>
            </div>
            <p className="font-crimson text-lg text-charcoal-500 mt-2 italic">
              Long-form writing, interviews, and commissioned features
            </p>
          </div>
          <div className="border-b border-charcoal-300 mt-4" />
        </div>

        {isLoading ? (
          <div className="py-24 text-center font-crimson text-xl text-charcoal-400 italic">
            Loading…
          </div>
        ) : features.length === 0 ? (
          /* Empty state — editorial-tone, not a web-app error message */
          <div className="py-24 text-center max-w-lg mx-auto">
            <div className="border-t border-b border-charcoal-300 py-12">
              <p className="font-serif text-2xl text-charcoal-700 mb-3">
                The first issue is being assembled.
              </p>
              <p className="font-crimson text-lg text-charcoal-500 italic mb-8">
                Check back soon, or submit your own work to be part of it.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 font-mono text-sm text-burnt-orange-500 hover:text-burnt-orange-600 transition-colors uppercase tracking-wider"
              >
                Submit a piece
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero article ── */}
            {heroContent && (
              <div className="mb-14 pb-14 border-b border-charcoal-200">
                <ArticleTile content={heroContent} feature={heroItem?.feature} />
              </div>
            )}

            {/* ── Article grid ── */}
            {gridItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
                {gridItems.map((f) => {
                  if (!f.content) return null;
                  return (
                    <div key={f.content.id} className="border-t border-charcoal-200 pt-8">
                      <ArticleTile content={f.content} feature={f.feature} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Contribute CTA ── inline, not a sidebar ── */}
            <div className="mt-24 border-t-2 border-charcoal-900 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-serif text-xl text-charcoal-900">
                  Write for Enamorado
                </p>
                <p className="font-crimson text-base text-charcoal-500 italic mt-0.5">
                  Essays, interviews, visual work — pitch us anything.
                </p>
              </div>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 font-mono text-sm bg-charcoal-900 text-white px-5 py-2.5 hover:bg-burnt-orange-500 transition-colors uppercase tracking-wider flex-shrink-0"
              >
                Submit a piece
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
