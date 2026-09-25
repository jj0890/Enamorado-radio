import { Calendar, User, Clock, Tag, Share2, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@shared/schema';

interface ReadingTemplateProps {
  content: ContentItem;
  wordCount?: number;
  estimatedReadingTime?: number;
  themes?: string[];
  relatedContent?: ContentItem[];
}

/**
 * Reading-optimized template for interviews, essays, and text-heavy content
 * Inspired by The Creative Independent's clean, focused reading experience
 *
 * Features:
 * - Single column layout (~700px max-width)
 * - Generous line height and spacing
 * - Minimal distractions
 * - Clear typography hierarchy
 * - Metadata cluster at top
 */
export default function ReadingTemplate({
  content,
  wordCount,
  estimatedReadingTime,
  themes = [],
  relatedContent = []
}: ReadingTemplateProps) {

  const getCreatorName = (): string => {
    const any = content as any;
    return any.name || any.hostName || any.authorName || any.artistName || any.curatorName || 'Unknown';
  };

  const formatDate = (dateInput: Date | string | null | undefined): string => {
    if (!dateInput) return '';
    const date = new Date(dateInput as string);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate reading time if not provided
  const readingTime = estimatedReadingTime || (wordCount ? Math.ceil(wordCount / 200) : null);

  return (
    <article className="max-w-2xl mx-auto px-4 py-8 md:py-16">
      {/* Header Section */}
      <header className="mb-12">
        {/* Subject Portrait (if applicable) */}
        {content.artworkUrl && (
          <div className="mb-8">
            <img
              src={content.artworkUrl}
              alt={getCreatorName()}
              className="w-48 h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content Type Badge */}
        <Badge
          variant="outline"
          className="mb-4 font-mono text-xs uppercase"
        >
          {content.type}
        </Badge>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          {content.title}
        </h1>

        {/* Metadata Cluster */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-mono border-t border-b border-gray-200 dark:border-gray-800 py-4">
          {/* Creator */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>by {getCreatorName()}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <time>{formatDate(content.submittedAt)}</time>
          </div>

          {/* Reading Time */}
          {readingTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
          )}

          {/* Word Count */}
          {wordCount && (
            <div className="flex items-center gap-2">
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          )}
        </div>

        {/* Themes/Tags */}
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {themes.map((theme, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="font-mono text-xs"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Bookmark className="w-4 h-4" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Description/Excerpt */}
        {content.description && (
          <p className="lead text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
            {content.description}
          </p>
        )}

        {/* Body Content */}
        <div className="space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
          {/* This will be replaced with actual content sections/blocks */}
          {/* For now, showing description as placeholder */}
          <p className="text-base md:text-lg">
            {content.description || 'Content will be displayed here using editorial blocks or rich text.'}
          </p>

          {/* Placeholder for editorial blocks */}
          <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-navy p-6 my-8">
            <p className="text-sm font-mono text-navy dark:text-navy-light">
              <strong>Note:</strong> This template will render editorial content blocks (text, images, pull quotes, Q&A sections) when integrated with your content management system.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Section (Creative Independent style) */}
      {relatedContent.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Related Content
          </h2>
          <div className="space-y-4">
            {relatedContent.map((item) => (
              <a
                key={item.id}
                href={`/community/${item.id}`}
                className="block p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description?.slice(0, 120)}...
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enjoyed this content? Explore more from our community.
        </p>
        <Button asChild>
          <a href="/community">Browse All Content</a>
        </Button>
      </footer>
    </article>
  );
}
