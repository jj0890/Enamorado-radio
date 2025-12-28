// client/src/components/content-templates/VideoTemplate.tsx
import { ExternalLink, Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/like-button";
import { Separator } from "@/components/ui/separator";
import { VideoEssayEmbed, isValidYouTubeUrl } from "@/components/youtube-embed";
import DOMPurify from "dompurify";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface Content {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  authors: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  originChannel?: string;
  provider?: string;
  embedUrl?: string;
  externalUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  likes?: number;
  publishedAt?: string;
}

interface OEmbedMeta {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  description: string | null;
}

interface VideoTemplateProps {
  content: Content;
  oembed?: OEmbedMeta | null;
  layout?: 'pane' | 'full';
  onShare?: () => void;
  formatDate?: (date: string) => string;
  estimateReadingTime?: (text: string) => number;
  isPreview?: boolean;
}

export default function VideoTemplate({ 
  content, 
  oembed, 
  layout = 'full', 
  onShare,
  formatDate,
  estimateReadingTime,
  isPreview = false
}: VideoTemplateProps) {
  const isCommunity = content.originChannel === 'community';
  const platform = content.provider || oembed?.platform;
  const videoUrl = content.videoUrl || content.embedUrl || oembed?.embedUrl;
  const isYouTube = videoUrl && isValidYouTubeUrl(videoUrl);
  
  // Get platform label
  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case 'youtube': return 'Watch on YouTube';
      case 'vimeo': return 'Watch on Vimeo';
      default: return 'Watch Video';
    }
  };

  // Get reading metadata
  const publishDate = content.publishedAt;
  const readingTime = estimateReadingTime && content.body ? estimateReadingTime(content.body) : null;

  if (layout === 'pane') {
    // 40/60 split: left meta card, right video iframe
    return (
      <div className="h-full flex bg-[var(--cream)]">
        {/* Left: Meta Card (40%) */}
        <div className="w-2/5 p-6 flex flex-col">
          <div className="flex-1">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                {platform?.toUpperCase() || 'VIDEO'}
              </Badge>
              {isCommunity && (
                <Badge variant="outline" className="ml-2">COMMUNITY</Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--charcoal)] mb-4 leading-tight">
              {content.title}
            </h1>
            
            {/* Author and date info */}
            <div className="mb-4 space-y-2">
              {content.authors?.length > 0 && (
                <p className="text-[var(--charcoal)]/70">
                  by {content.authors.join(', ')}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-[var(--charcoal)]/60">
                {publishDate && formatDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(publishDate)}
                  </div>
                )}
                {readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {readingTime} min read
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            {content.excerpt && (
              <p className="text-[var(--charcoal)]/80 mb-6 leading-relaxed">
                {content.excerpt}
              </p>
            )}
            
            {/* CTA Button */}
            {(content.externalUrl || videoUrl) && (
              <Button
                asChild
                className="w-full mb-4 bg-orange-600 hover:bg-orange-700"
              >
                <a
                  href={content.externalUrl || videoUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="video-cta"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {getPlatformLabel(platform)}
                </a>
              </Button>
            )}
          </div>
          
          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isCommunity && (
              <LikeButton id={content.id} initial={content.likes || 0} />
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                Share
              </Button>
            )}
          </div>
        </div>
        
        {/* Right: Video Iframe (60%) */}
        <div className="w-3/5 bg-black border-l">
          {isYouTube ? (
            <VideoEssayEmbed
              videoUrl={videoUrl!}
              title={content.title}
              description={content.excerpt}
              className="w-full h-full"
            />
          ) : videoUrl ? (
            <iframe
              src={videoUrl}
              title={content.title}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; clipboard-write; picture-in-picture; fullscreen"
              loading="lazy"
              data-testid="video-embed"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <p className="text-gray-300 mb-4">Video not available</p>
                {content.externalUrl && (
                  <Button asChild variant="outline">
                    <a
                      href={content.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Watch Externally
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full page: hero video, transcript below
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Hero Video */}
        <div className="mb-8">
          {isYouTube ? (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <VideoEssayEmbed
                videoUrl={videoUrl!}
                title={content.title}
                description={content.excerpt}
                className="w-full h-full"
              />
            </div>
          ) : videoUrl ? (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
              <iframe
                src={videoUrl}
                title={content.title}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture; fullscreen"
                loading="lazy"
                data-testid="video-embed-full"
              />
            </div>
          ) : content.coverImageUrl ? (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <img
                src={content.coverImageUrl}
                alt={content.title}
                className="w-full h-full object-cover"
                style={{
                  aspectRatio: content.coverWidth && content.coverHeight 
                    ? `${content.coverWidth}/${content.coverHeight}` 
                    : '16/9',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : null}
        </div>
        
        {/* Meta below video */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary">
                {platform?.toUpperCase() || 'VIDEO'}
              </Badge>
              {isCommunity && (
                <Badge variant="outline">COMMUNITY</Badge>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-4 leading-tight">
              {content.title}
            </h1>
            
            {/* Author and meta info */}
            <div className="space-y-3 mb-8">
              {content.authors?.length > 0 && (
                <p className="text-xl text-[var(--charcoal)]/70">
                  by {content.authors.join(', ')}
                </p>
              )}
              <div className="flex items-center gap-6 text-[var(--charcoal)]/60">
                {publishDate && formatDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDate(publishDate)}
                  </div>
                )}
                {readingTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {readingTime} min read
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {content.excerpt && (
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-lg text-[var(--charcoal)]/80 leading-relaxed">
                {content.excerpt}
              </p>
            </div>
          )}
          
          {/* Transcript/Body content */}
          {content.body && (
            <div className="prose prose-lg max-w-none mb-12">
              <h2 className="text-2xl font-bold text-[var(--charcoal)] mb-6">Transcript</h2>
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
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t">
            {(content.externalUrl || videoUrl) && (
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700"
              >
                <a
                  href={content.externalUrl || videoUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="video-cta-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {getPlatformLabel(platform)}
                </a>
              </Button>
            )}
            
            {onShare && (
              <Button variant="outline" onClick={onShare}>
                Share
              </Button>
            )}
            
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
        </div>
      </div>
    </div>
  );
}