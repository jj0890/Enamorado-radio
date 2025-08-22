import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, User, Calendar, Tags, ExternalLink } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function GuideDetail() {
  const { slug } = useParams();

  const { data: guide, isLoading } = useQuery({
    queryKey: ["/api/guides", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading guide...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Guide not found</div>
            <Link href="/explore">
              <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white font-mono">
                Back to Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StickyRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/explore"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Link>
        </div>

        {/* Guide Header */}
        <div className="mb-12">
          {/* Cover Image */}
          {guide.coverImageUrl && (
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-8">
              <img 
                src={guide.coverImageUrl} 
                alt={guide.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Guide Info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-red-500 text-white px-3 py-1 rounded font-mono text-sm uppercase">
                {guide.guideType}
              </span>
              {guide.isFeatured && (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded font-mono text-sm font-bold">
                  FEATURED
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">
              {guide.title}
            </h1>
            
            <div className="flex items-center text-gray-600 font-mono text-lg mb-4">
              <User className="w-5 h-5 mr-2" />
              {guide.authorName}
            </div>

            <div className="text-sm font-mono text-gray-500 mb-6">
              Published {new Date(guide.publishedAt).toLocaleDateString()} • 
              Updated {new Date(guide.updatedAt).toLocaleDateString()}
              {guide.viewCount > 0 && ` • ${guide.viewCount} views`}
            </div>

            {/* Tags */}
            {guide.tags && guide.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mb-6">
                <Tags className="w-4 h-4 text-gray-400" />
                {guide.tags.map((tag: string) => (
                  <span 
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded font-mono text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-700 font-mono text-lg leading-relaxed">
              {guide.description}
            </p>
          </div>
        </div>

        {/* Guide Introduction */}
        {guide.intro && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">Introduction</h2>
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 font-mono leading-relaxed whitespace-pre-line">
                {guide.intro}
              </div>
            </div>
          </div>
        )}

        {/* Guide Sections */}
        {guide.sections && guide.sections.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">Guide Sections</h2>
            <div className="space-y-8">
              {guide.sections.map((section: any, index: number) => (
                <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold font-mono text-gray-900 mb-4">
                    {section.heading}
                  </h3>
                  <p className="text-gray-700 font-mono mb-4">
                    {section.description}
                  </p>
                  {section.episodeId && (
                    <Link href={`/episode/${section.episodeId}`}>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-mono">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Listen to Episode
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon Placeholder */}
        {(!guide.sections || guide.sections.length === 0) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">Guide Content</h2>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
              <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <div className="text-blue-900 font-mono mb-2">Guide content coming soon</div>
              <p className="text-blue-700 font-mono text-sm">
                This guide is being developed and will include curated episodes, 
                recommendations, and detailed insights into {guide.title.toLowerCase()}.
              </p>
            </div>
          </div>
        )}

        {/* Related Actions */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-mono text-gray-900 mb-2">Explore More Guides</h3>
              <p className="text-gray-600 font-mono text-sm">
                Discover more curated content and thematic entry points
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/explore">
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  More Guides
                </Button>
              </Link>
              <Link href="/latest">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                  Latest Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}