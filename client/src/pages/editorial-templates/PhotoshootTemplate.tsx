import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Share2, Heart, Bookmark, ExternalLink } from "lucide-react";
import CoverFlow from "@/components/CoverFlow";

interface PhotoshootContent {
  id: number;
  title: string;
  description: string;
  content: string; // HTML content
  coverImage?: string;
  images?: string[]; // Gallery images
  layoutStyle?: string; // vertical-scroll, grid, masonry
  tags?: string[];
  publishedAt: string;
  author?: string;
  photographer?: string;
  credits?: Record<string, string>;
  externalUrl?: string; // External link (Substack, Medium, etc.)
  externalType?: string; // Platform type
}

export default function PhotoshootTemplate() {
  const [, params] = useRoute("/editorial/photoshoot/:id");
  const contentId = params?.id ? parseInt(params.id) : null;

  const { data: content, isLoading } = useQuery<PhotoshootContent>({
    queryKey: [`/api/editorial/content/${contentId}`],
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-serif text-white mb-4">Content Not Found</h1>
          <Link href="/editorial">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Editorial
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const layoutStyle = content.layoutStyle || "vertical-scroll";

  // Cover Flow Layout
  if (layoutStyle === "coverflow") {
    const cfItems = (content.images ?? []).map((src, i) => ({ src, caption: `${i + 1}` }));
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <header className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <Link href="/editorial">
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white"><Heart className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-white"><Share2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </header>

        <div className="pt-32 pb-12 px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            {content.photographer && (
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">
                Photography by {content.photographer}
              </p>
            )}
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 leading-tight">{content.title}</h1>
            <p className="text-lg text-gray-400 mb-6">{content.description}</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge className="bg-white/10 text-white border-white/20">Photoshoot</Badge>
              {content.tags?.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-white border-white/20">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        <CoverFlow items={cfItems} aspectRatio="portrait" />

        {content.content && (
          <div className="px-6 md:px-12 py-16">
            <article className="max-w-3xl mx-auto">
              <div className="prose prose-lg prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
            </article>
          </div>
        )}

        {content.credits && Object.keys(content.credits).length > 0 && (
          <div className="px-6 py-12 border-t border-white/10">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-6">Credits</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(content.credits).map(([role, name]) => (
                  <div key={role}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{role}</p>
                    <p className="text-white font-medium mt-1">{name as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vertical Scroll Layout (WeFolk-inspired)
  if (layoutStyle === "vertical-scroll") {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />

        {/* Fixed Header - Minimal */}
        <header className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <Link href="/editorial">
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* External Link Notice */}
        {content.externalUrl ? (
          <div className="pt-32 px-6">
            <div className="max-w-4xl mx-auto my-24 p-12 bg-gradient-to-br from-pink-900 to-orange-900 rounded-xl border-2 border-pink-500">
              <div className="text-center">
                <ExternalLink className="w-16 h-16 text-pink-300 mx-auto mb-6" />
                <h3 className="text-2xl font-serif text-white mb-4">
                  View this photoshoot on {content.externalType === 'substack' ? 'Substack' : content.externalType === 'medium' ? 'Medium' : 'external site'}
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  This photoshoot is published externally. Click below to view the full gallery.
                </p>
                <a href={content.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
                    View on {content.externalType === 'substack' ? 'Substack' : content.externalType === 'medium' ? 'Medium' : 'External Site'}
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Title Section with Metadata */}
            <div className="pt-32 pb-12 px-6 md:px-12">
              <div className="max-w-5xl mx-auto">
                {content.photographer && (
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">
                    Photography by {content.photographer}
                  </p>
                )}
                <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
                  {content.title}
                </h1>
                <p className="text-xl text-gray-400 max-w-3xl mb-8">
                  {content.description}
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-white/10 text-white border-white/20">Photoshoot</Badge>
                  {content.tags?.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-white border-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical Image Scroll - Editorial Style */}
            <div className="space-y-16 md:space-y-24 pb-16">
              {content.images && content.images.length > 0 ? (
                content.images.map((image, index) => {
                  // Alternate between full-width, large, and medium sizes for rhythm
                  let widthClass = "w-full";
                  let containerClass = "";

                  if (index % 3 === 0) {
                    // Full bleed
                    widthClass = "w-full";
                    containerClass = "";
                  } else if (index % 3 === 1) {
                    // Large centered
                    widthClass = "w-[90%]";
                    containerClass = "flex justify-center";
                  } else {
                    // Medium centered
                    widthClass = "w-[75%]";
                    containerClass = "flex justify-center";
                  }

                  return (
                    <div key={index} className={containerClass}>
                      <img
                        src={image}
                        alt={`${content.title} - Image ${index + 1}`}
                        className={`${widthClass} h-auto object-cover`}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="px-6">
                  <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-24 text-center">
                    <p className="text-gray-500">No gallery images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Article Section - Optional text below images */}
            {content.content && (
              <div className="px-6 md:px-12 py-16 bg-gradient-to-b from-black to-gray-950">
                <article className="max-w-3xl mx-auto">
                  <div
                    className="prose prose-lg prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content.content }}
                  />
                </article>
              </div>
            )}

            {/* Credits Section */}
            {content.credits && Object.keys(content.credits).length > 0 && (
              <div className="px-6 md:px-12 py-16 bg-gray-950 border-t border-white/10">
                <div className="max-w-5xl mx-auto">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-8">
                    Credits
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {Object.entries(content.credits).map(([role, name]) => (
                      <div key={role}>
                        <p className="text-xs font-mono uppercase tracking-wider text-gray-600 mb-1">
                          {role}
                        </p>
                        <p className="text-sm text-white">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Grid Layout (Traditional)
  if (layoutStyle === "grid") {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navigation />

        {/* Hero Section */}
        <div className="relative w-full h-[60vh] bg-gray-900">
          {content.coverImage && (
            <>
              <img
                src={content.coverImage}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">
                {content.title}
              </h1>
              <p className="text-xl text-white/90">{content.description}</p>
            </div>
          </div>
        </div>

        {/* Grid Gallery */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          {content.externalUrl ? (
            <div className="my-12 p-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950 dark:to-orange-950 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <div className="text-center">
                <ExternalLink className="w-12 h-12 text-pink-600 dark:text-pink-400 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-gray-900 dark:text-white mb-3">
                  View this photoshoot externally
                </h3>
                <a href={content.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
                    View Gallery
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {content.images?.map((image, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image}
                    alt={`${content.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Article Content */}
          {content.content && (
            <div className="mt-16 prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
          )}

          {/* Credits */}
          {content.credits && Object.keys(content.credits).length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-4">
                Credits
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(content.credits).map(([role, name]) => (
                  <div key={role}>
                    <p className="font-semibold text-gray-900 dark:text-white">{role}</p>
                    <p className="text-gray-600 dark:text-gray-400">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Masonry Layout (Pinterest-style) - fallback to grid for now
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif mb-8">{content.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-12">{content.description}</p>
        {/* Masonry layout to be implemented */}
        <p className="text-center text-gray-500">Masonry layout coming soon</p>
      </div>
    </div>
  );
}
