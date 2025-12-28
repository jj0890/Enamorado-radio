// client/src/components/content-templates/LinkTemplate.tsx
import { ExternalLink, Globe, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/like-button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface Content {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
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
}

interface OEmbedMeta {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  description: string | null;
}

interface LinkTemplateProps {
  content: Content;
  oembed?: OEmbedMeta | null;
  layout?: 'pane' | 'full';
  onShare?: () => void;
  formatDate?: (date: string) => string;
  estimateReadingTime?: (text: string) => number;
  labelForPlatform?: (platform?: string, kind?: string) => string;
  isPreview?: boolean;
}

export default function LinkTemplate({ 
  content, 
  oembed, 
  layout = 'full', 
  onShare,
  formatDate,
  estimateReadingTime,
  labelForPlatform,
  isPreview = false
}: LinkTemplateProps) {
  const isCommunity = content.originChannel === 'community';
  const platform = content.provider || oembed?.platform;
  const linkUrl = content.externalUrl || content.embedUrl;
  
  // Get platform label
  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case 'external': return 'Visit Website';
      default: return 'Open Link';
    }
  };

  // Extract domain from URL for display
  const getDomain = (url?: string) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  if (layout === 'pane') {
    // 40/60 split: left meta card, right rich preview or big CTA
    return (
      <div className="h-full flex bg-[var(--cream)]">
        {/* Left: Meta Card (40%) */}
        <div className="w-2/5 p-6 flex flex-col">
          <div className="flex-1">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                LINK
              </Badge>
              {isCommunity && (
                <Badge variant="outline" className="ml-2">COMMUNITY</Badge>
              )}
              {getDomain(linkUrl) && (
                <Badge variant="outline" className="ml-2">
                  {getDomain(linkUrl)}
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--charcoal)] mb-4 leading-tight">
              {oembed?.title || content.title}
            </h1>
            
            {/* Author and meta info */}
            <div className="mb-4 space-y-2">
              {content.authors?.length > 0 && (
                <p className="text-[var(--charcoal)]/70">
                  Shared by {content.authors.join(', ')}
                </p>
              )}
              {content.publishedAt && formatDate && (
                <div className="flex items-center gap-1 text-sm text-[var(--charcoal)]/60">
                  <Calendar className="w-4 h-4" />
                  {formatDate(content.publishedAt)}
                </div>
              )}
            </div>
            
            {/* Description */}
            {(oembed?.description || content.excerpt) && (
              <p className="text-[var(--charcoal)]/80 mb-6 leading-relaxed">
                {oembed?.description || content.excerpt}
              </p>
            )}
            
            {/* CTA Button */}
            {linkUrl && (
              <Button
                asChild
                className="w-full mb-4 bg-orange-600 hover:bg-orange-700"
              >
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-cta"
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
        
        {/* Right: Rich Preview or Big CTA (60%) */}
        <div className="w-3/5 bg-white border-l">
          {/* Rich preview with thumbnail */}
          {(oembed?.thumbnail || content.coverImageUrl) && linkUrl ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 relative">
                <img
                  src={oembed?.thumbnail || content.coverImageUrl!}
                  alt={oembed?.title || content.title}
                  className="w-full h-full object-cover"
                  style={{
                    aspectRatio: content.coverWidth && content.coverHeight 
                      ? `${content.coverWidth}/${content.coverHeight}` 
                      : 'auto',
                    objectFit: 'contain'
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Open
                    </a>
                  </Button>
                </div>
              </div>
              
              {/* Preview footer */}
              <div className="p-4 border-t bg-gray-50">
                <h3 className="font-medium text-[var(--charcoal)] mb-1 line-clamp-2">
                  {oembed?.title || content.title}
                </h3>
                {getDomain(linkUrl) && (
                  <p className="text-sm text-[var(--charcoal)]/60 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getDomain(linkUrl)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Big CTA when no preview available
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-[var(--charcoal)] mb-4">
                  {oembed?.title || content.title}
                </h3>
                {(oembed?.description || content.excerpt) && (
                  <p className="text-[var(--charcoal)]/70 mb-6 leading-relaxed">
                    {oembed?.description || content.excerpt}
                  </p>
                )}
                {linkUrl && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-cta-large"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      {getPlatformLabel(platform)}
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

  // Full page: minimal page layout
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary">LINK</Badge>
            {isCommunity && (
              <Badge variant="outline">COMMUNITY</Badge>
            )}
            {getDomain(linkUrl) && (
              <Badge variant="outline">{getDomain(linkUrl)}</Badge>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-6 leading-tight">
            {oembed?.title || content.title}
          </h1>
          
          {/* Meta info */}
          <div className="space-y-3 mb-8">
            {content.authors?.length > 0 && (
              <p className="text-lg text-[var(--charcoal)]/70">
                Shared by {content.authors.join(', ')}
              </p>
            )}
            {content.publishedAt && formatDate && (
              <div className="flex items-center justify-center gap-2 text-[var(--charcoal)]/60">
                <Calendar className="w-5 h-5" />
                {formatDate(content.publishedAt)}
              </div>
            )}
          </div>
        </header>
        
        {/* Preview card */}
        {linkUrl && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-lg border shadow-lg overflow-hidden">
              {/* Preview image */}
              {(oembed?.thumbnail || content.coverImageUrl) && (
                <div className="aspect-[2/1] relative">
                  <img
                    src={oembed?.thumbnail || content.coverImageUrl!}
                    alt={oembed?.title || content.title}
                    className="w-full h-full object-cover"
                    style={{
                      aspectRatio: content.coverWidth && content.coverHeight 
                        ? `${content.coverWidth}/${content.coverHeight}` 
                        : '2/1',
                      objectFit: 'contain'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Card content */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[var(--charcoal)] mb-3">
                  {oembed?.title || content.title}
                </h2>
                
                {(oembed?.description || content.excerpt) && (
                  <p className="text-[var(--charcoal)]/70 mb-4 leading-relaxed">
                    {oembed?.description || content.excerpt}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  {getDomain(linkUrl) && (
                    <div className="flex items-center gap-2 text-sm text-[var(--charcoal)]/60">
                      <Globe className="w-4 h-4" />
                      {getDomain(linkUrl)}
                    </div>
                  )}
                  
                  <Button
                    asChild
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-cta-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {getPlatformLabel(platform)}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Body content */}
        {content.body && (
          <div className="prose prose-lg max-w-none mb-12 text-center">
            <div
              className="text-[var(--charcoal)]/80 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: content.body,
              }}
            />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t">
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
  );
}