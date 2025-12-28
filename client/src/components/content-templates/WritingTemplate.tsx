// client/src/components/content-templates/WritingTemplate.tsx
import { ExternalLink, Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/like-button";
import { Separator } from "@/components/ui/separator";
import SubstackEmbed from "@/components/substack-embed";
import GlobalMetaBar from "@/components/global-meta-bar";
import BlockRenderer from "@/components/block-renderer";
import DOMPurify from "dompurify";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import type { EditorialSection } from "@shared/schema";

interface FileItem {
  url: string;
  type?: string;
  mime?: string;
  name?: string;
}

interface Content {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  sections?: EditorialSection[];
  authors: string[];
  coverImageUrl?: string;
  originChannel?: string;
  provider?: string;
  embedUrl?: string;
  externalUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  likes?: number;
  publishedAt?: string;
  originalDate?: string;
  originalAuthor?: string;
  originalExcerpt?: string;
  files?: FileItem[];
}

interface OEmbedMeta {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  description: string | null;
}

interface WritingTemplateProps {
  content: Content;
  oembed?: OEmbedMeta | null;
  layout?: 'pane' | 'full';
  onShare?: () => void;
  formatDate?: (date: string) => string;
  estimateReadingTime?: (text: string) => number;
  isPreview?: boolean;
}

export default function WritingTemplate({ 
  content, 
  oembed, 
  layout = 'full', 
  onShare,
  formatDate,
  estimateReadingTime,
  isPreview = false
}: WritingTemplateProps) {
  const isCommunity = content.originChannel === 'community';
  const platform = content.provider || oembed?.platform;
  const isSubstack = platform === 'substack' || platform === 'gdocs';
  
  // Get cover image - try coverImageUrl first, then first image from files array
  const getHeroImage = (): string | undefined => {
    if (content.coverImageUrl) return content.coverImageUrl;
    
    // Look for first image in files array
    if (content.files && content.files.length > 0) {
      const imageFile = content.files.find(f => 
        f.type?.startsWith('image/') || 
        f.mime?.startsWith('image/') ||
        f.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      if (imageFile) return imageFile.url;
    }
    
    // Fallback to oEmbed thumbnail
    if (oembed?.thumbnail) return oembed.thumbnail;
    
    return undefined;
  };
  
  const heroImage = getHeroImage();

  // Get reading metadata
  const publishDate = content.publishedAt || content.originalDate;
  const readingTime = estimateReadingTime && content.body ? estimateReadingTime(content.body) : null;
  
  // Process body content to add drop cap to first paragraph
  const processBodyWithDropCap = (html: string): string => {
    // Find the first <p> tag and add drop-cap class
    return html.replace(/<p>/, '<p class="drop-cap">');
  };

  if (layout === 'pane') {
    // 40/60 split: left meta card with cover image, right reading pane
    return (
      <div className="h-full flex bg-[var(--cream)]">
        {/* Left: Meta Card with Cover Image (40%) */}
        <div className="w-2/5 p-6 flex flex-col overflow-y-auto">
          {/* Cover Image - prominent at top of left panel */}
          {heroImage && (
            <div className="mb-6 -mx-6 -mt-6" data-testid="pane-cover-image">
              <img
                src={heroImage}
                alt={content.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--charcoal)] mb-4 leading-tight" data-testid="pane-title">
              {content.title}
            </h1>
            
            {/* Global Meta Bar */}
            <GlobalMetaBar
              externalUrl={content.externalUrl}
              authors={content.originalAuthor ? [content.originalAuthor] : content.authors}
              attributionType={content.originalAuthor ? 'authored' : (isCommunity ? 'submitted' : 'authored')}
              publishedAt={publishDate}
              isCommunity={isCommunity}
              customPlatform={content.externalUrl ? undefined : (platform?.toUpperCase() || 'WRITING')}
              showShare={false}
              className="mb-4"
            />
            
            {/* Reading Time */}
            {readingTime && (
              <div className="flex items-center gap-1 text-sm text-[var(--charcoal)]/60 mb-4">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </div>
            )}
            
            {/* Excerpt */}
            {(content.originalExcerpt || content.excerpt) && (
              <p className="text-[var(--charcoal)]/70 mb-4 leading-relaxed text-sm line-clamp-4">
                {content.originalExcerpt || content.excerpt}
              </p>
            )}
          </div>
          
          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--light-grey)]">
            {isCommunity && (
              <LikeButton id={content.id} initial={content.likes || 0} />
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare} data-testid="share-button">
                Share
              </Button>
            )}
          </div>
        </div>
        
        {/* Right: Reading Pane (60%) */}
        <div className="w-3/5 bg-white border-l overflow-y-auto">
          <div className="p-6">
            {isSubstack ? (
              <SubstackEmbed
                url={content.externalUrl || ""}
                title={oembed?.title || content.title}
                author={content.originalAuthor || content.authors?.[0] || "Unknown"}
                date={publishDate || ""}
                category="article"
                preview={oembed?.description || content.originalExcerpt || content.excerpt}
                embedded={true}
              />
            ) : content.sections && content.sections.length > 0 ? (
              /* Block-based editorial content in pane view */
              <BlockRenderer sections={content.sections} className="prose-lg" />
            ) : content.body ? (
              <div className="prose prose-lg max-w-none">
                <div
                  className="font-serif text-[18px] leading-[1.7] text-[var(--charcoal)]
                  [&>p]:mb-6 [&>p]:text-[18px] [&>p]:leading-[1.7]
                  [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-6
                  [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-4
                  [&>blockquote]:border-l-4 [&>blockquote]:border-orange-300 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:my-8
                  [&>ul]:my-6 [&>ol]:my-6 [&>li]:mb-2
                  [&>a]:text-orange-600 [&>a]:underline"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(content.body, {
                      ALLOWED_TAGS: [
                        "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
                        "blockquote", "ul", "ol", "li", "a", "img",
                      ],
                      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
                      ALLOW_DATA_ATTR: false,
                    }),
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">Content preview not available</p>
                {content.externalUrl && (
                  <Button asChild variant="outline">
                    <a
                      href={content.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Full Article
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full page: article layout with hero image
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      
      {/* Hero Image - Full width at top */}
      {heroImage && (
        <div className="w-full bg-white pt-16" data-testid="article-hero-image">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <img
              src={heroImage}
              alt={content.title}
              className="w-full max-h-[70vh] object-contain rounded-lg"
              style={{
                aspectRatio: content.coverWidth && content.coverHeight 
                  ? `${content.coverWidth}/${content.coverHeight}` 
                  : 'auto',
              }}
            />
          </div>
        </div>
      )}
      
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!heroImage ? 'pt-20' : 'pt-8'}`}>
        <article>
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--charcoal)] mb-8 leading-tight" data-testid="article-title">
              {content.title}
            </h1>
            
            {/* Global Meta Bar */}
            <GlobalMetaBar
              externalUrl={content.externalUrl}
              authors={content.originalAuthor ? [content.originalAuthor] : content.authors}
              attributionType={content.originalAuthor ? 'authored' : (isCommunity ? 'submitted' : 'authored')}
              publishedAt={publishDate}
              isCommunity={isCommunity}
              customPlatform={content.externalUrl ? undefined : (platform?.toUpperCase() || 'WRITING')}
              showShare={!!onShare}
              onShare={onShare}
              className="mb-6"
            />
            
            {/* Reading Time */}
            {readingTime && (
              <div className="flex items-center gap-2 text-base text-[var(--charcoal)]/60" data-testid="reading-time">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </div>
            )}
          </header>
          
          {/* Content */}
          <div className="mb-12" data-testid="article-content">
            {isSubstack ? (
              <SubstackEmbed
                url={content.externalUrl || ""}
                title={oembed?.title || content.title}
                author={content.originalAuthor || content.authors?.[0] || "Unknown"}
                date={publishDate || ""}
                category="article"
                preview={oembed?.description || content.originalExcerpt || content.excerpt}
                embedded={false}
              />
            ) : content.sections && content.sections.length > 0 ? (
              /* Block-based editorial content */
              <BlockRenderer sections={content.sections} />
            ) : content.body ? (
              <div className="prose prose-xl max-w-none">
                <div
                  className="font-serif text-[19px] leading-[1.8] text-[var(--charcoal)] max-w-[65ch] mx-auto
                  [&>p]:mb-8 [&>p]:text-[19px] [&>p]:leading-[1.8]
                  [&>p.drop-cap]:text-[20px] [&>p.drop-cap]:leading-[1.85] [&>p.drop-cap]:mb-10
                  [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-16 [&>h2]:mb-6 [&>h2]:leading-[1.2]
                  [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mt-12 [&>h3]:mb-5 [&>h3]:leading-[1.3]
                  [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--editorial)] [&>blockquote]:pl-8 [&>blockquote]:italic [&>blockquote]:text-[21px] [&>blockquote]:my-12 [&>blockquote]:leading-[1.75] [&>blockquote]:text-[var(--charcoal)]/80
                  [&>ul]:my-8 [&>ol]:my-8 [&>li]:mb-3 [&>li]:text-[19px] [&>li]:leading-[1.8]
                  [&>a]:text-[var(--editorial)] [&>a]:underline [&>a]:decoration-2 [&>a]:underline-offset-2 [&>a]:transition-colors [&>a]:hover:text-[var(--editorial)]/80"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(processBodyWithDropCap(content.body), {
                      ALLOWED_TAGS: [
                        "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
                        "blockquote", "ul", "ol", "li", "a", "img",
                      ],
                      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
                      ALLOW_DATA_ATTR: false,
                    }),
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-6">
                  {platform === 'gdocs' 
                    ? 'This writing is hosted on Google Docs' 
                    : platform === 'pdf'
                    ? 'This is a PDF document'
                    : isCommunity
                    ? 'Full content is available on the submitter\'s platform'
                    : 'Full content available at the source'}
                </p>
                {content.externalUrl && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <a
                      href={content.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      {platform === 'gdocs' 
                        ? 'Open in Google Docs' 
                        : platform === 'pdf'
                        ? 'View PDF'
                        : 'Read Full Article'}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t">
            {isCommunity && (
              <LikeButton id={content.id} initial={content.likes || 0} />
            )}
          </div>
          
          <Separator className="my-12" />

          {/* Back Navigation */}
          {!isPreview && (
            <div className="text-center">
              <Link href={isCommunity ? "/community" : "/editorials"}>
                <Button variant="outline" className="inline-flex items-center space-x-2" data-testid="back-navigation">
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isCommunity ? "Back to Community" : "Back to Editorials"}</span>
                </Button>
              </Link>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}