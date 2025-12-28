// client/src/components/content-templates/PlaylistTemplate.tsx
import { ExternalLink, ArrowLeft } from "lucide-react";
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
  authors?: string[];
  coverImageUrl?: string;
  originChannel?: string;
  provider?: string;
  embedUrl?: string;
  externalUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  likes?: number;
  submittedBy?: string;
  tags?: string[];
  trackCount?: number;
  duration?: string;
}

interface OEmbedMeta {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  embedHtml: string | null;
  description: string | null;
}

interface PlaylistTemplateProps {
  content: Content;
  oembed?: OEmbedMeta | null;
  layout?: 'pane' | 'full';
  onShare?: () => void;
  formatDate?: (date: string) => string;
  estimateReadingTime?: (text: string) => number;
  labelForPlatform?: (platform?: string, kind?: string) => string;
}

export default function PlaylistTemplate({ 
  content, 
  oembed, 
  layout = 'full', 
  onShare,
  formatDate,
  estimateReadingTime,
  labelForPlatform 
}: PlaylistTemplateProps) {
  const isCommunity = content.originChannel === 'community';
  const embedUrl = content.embedUrl || oembed?.embedUrl;
  const embedHtml = oembed?.embedHtml;
  const platform = content.provider || oembed?.platform;
  const isAppleMusic = platform === 'apple-music' || platform === 'apple' || embedUrl?.includes('embed.music.apple.com');
  
  // Get platform-specific embed height (larger heights for better visual experience)
  const getEmbedHeight = (platform?: string) => {
    switch (platform) {
      case 'spotify': return 500;
      case 'soundcloud': return 500;
      case 'apple': return 500;
      default: return 400;
    }
  };

  // Get platform label
  const getPlatformLabel = (platform?: string) => {
    switch (platform) {
      case 'spotify': return 'Listen on Spotify';
      case 'soundcloud': return 'Listen on SoundCloud';
      case 'apple': return 'Open in Apple Music';
      default: return 'Open Playlist';
    }
  };

  // Get cover image from multiple sources
  const getCoverImage = () => {
    return content.coverImageUrl || oembed?.thumbnail || null;
  };

  // Get curator info
  const getCurator = () => {
    if (content.authors && content.authors.length > 0) {
      return content.authors[0];
    }
    return content.submittedBy || null;
  };

  if (layout === 'pane') {
    // Desktop: 35/65 split (compact meta left, spacious player right)
    return (
      <div className="h-full flex flex-col md:flex-row bg-[var(--cream)]">
        {/* Meta Card - Mobile: full width stacked second. Desktop: 35% left */}
        <div className="w-full md:w-[35%] p-6 flex flex-col overflow-y-auto md:order-1 order-2">
          
          {/* Cover Image - compact display */}
          <div className="mb-6">
            {getCoverImage() ? (
              <div className="w-full aspect-square max-w-[200px] mx-auto lg:mx-0">
                <img
                  src={getCoverImage()!}
                  alt={content.title}
                  className="w-full h-full object-contain rounded-lg shadow-md"
                  data-testid="playlist-cover"
                />
              </div>
            ) : (
              <div 
                className="w-full aspect-square max-w-[200px] mx-auto lg:mx-0 bg-gradient-to-br from-orange-200 to-orange-400 rounded-lg shadow-md flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {content.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm text-white/80">No Cover</div>
                </div>
              </div>
            )}
          </div>


          {/* Title + Chips */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                PLAYLIST
              </Badge>
              {platform && (
                <Badge variant="outline" className="text-xs">
                  {platform.toUpperCase()}
                </Badge>
              )}
              {isCommunity && (
                <Badge variant="outline" className="text-xs">COMMUNITY</Badge>
              )}
            </div>
            
            <h1 className="text-xl font-bold text-[var(--charcoal)] leading-tight">
              {content.title}
            </h1>
          </div>

          {/* Curator Row */}
          {getCurator() && (
            <div className="flex items-center mb-4 pb-4 border-b">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-gray-600">
                  {getCurator()!.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-[var(--charcoal)]/70">
                  Curated by <span className="font-medium">{getCurator()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          {content.externalUrl && (
            <Button
              asChild
              className="w-full mb-3 bg-orange-600 hover:bg-orange-700"
            >
              <a
                href={content.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="playlist-cta"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {getPlatformLabel(platform)}
              </a>
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="flex gap-2 mb-4">
            {onShare && (
              <Button variant="outline" size="sm" className="flex-1">
                Share
              </Button>
            )}
            {isCommunity && (
              <LikeButton id={content.id} initial={content.likes || 0} />
            )}
          </div>

          {/* Curator Notes */}
          {content.excerpt && (
            <div className="mb-4">
              <p className="text-sm text-[var(--charcoal)]/80 leading-relaxed line-clamp-3">
                {content.excerpt}
              </p>
            </div>
          )}

          {/* Metadata Chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            {content.trackCount && (
              <Badge variant="outline" className="text-xs">
                {content.trackCount} tracks
              </Badge>
            )}
            {content.duration && (
              <Badge variant="outline" className="text-xs">
                {content.duration}
              </Badge>
            )}
            {content.tags && content.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Player Pane - Mobile: full width stacked first. Desktop: 65% right (more spacious) */}
        <div className="w-full md:w-[65%] bg-white md:border-l overflow-hidden flex flex-col md:order-2 order-1 min-h-[320px] md:min-h-[600px]">
          {embedHtml ? (
            <div 
              className={`w-full h-full flex items-center justify-center ${isAppleMusic ? 'p-0' : 'p-4'}`}
              data-testid="playlist-embed"
            >
              {isAppleMusic ? (
                /* Apple Music: Crop horizontally to show track list with song artwork - hide main album art */
                <div className="w-full h-full overflow-hidden">
                  <div 
                    className="h-full [&>iframe]:h-full [&>iframe]:border-0"
                    style={{ 
                      width: 'calc(100% + 270px)', 
                      marginLeft: '-270px',
                    }}
                    dangerouslySetInnerHTML={{ __html: embedHtml }}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full max-w-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-full"
                  dangerouslySetInnerHTML={{ __html: embedHtml }}
                />
              )}
            </div>
          ) : embedUrl ? (
            isAppleMusic ? (
              /* Apple Music fallback: Crop horizontally to show track list with song artwork */
              <div className="w-full h-full overflow-hidden">
                <iframe
                  src={embedUrl}
                  title={content.title}
                  className="h-full border-0"
                  style={{ 
                    width: 'calc(100% + 270px)', 
                    marginLeft: '-270px',
                  }}
                  allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                  loading="lazy"
                  data-testid="playlist-embed-fallback"
                />
              </div>
            ) : (
              <iframe
                src={embedUrl}
                title={content.title}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                loading="lazy"
                data-testid="playlist-embed-fallback"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Playback not available here</h3>
                  <p className="text-gray-500 mb-6">This playlist can't be embedded, but you can still listen on the original platform.</p>
                </div>
                {content.externalUrl && (
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <a
                      href={content.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
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

  // Full page layout: embed at top, meta below
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Hero Embed */}
        <div className="mb-8">
          {embedHtml ? (
            <div 
              className="w-full rounded-lg overflow-hidden shadow-lg"
              data-testid="playlist-embed-full"
            >
              <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
            </div>
          ) : embedUrl ? (
            <div 
              className="w-full rounded-lg overflow-hidden shadow-lg"
              style={{ height: getEmbedHeight(platform) }}
            >
              <iframe
                src={embedUrl}
                title={content.title}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                loading="lazy"
                data-testid="playlist-embed-full-fallback"
              />
            </div>
          ) : content.coverImageUrl ? (
            <div className="w-full aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
              <img
                src={content.coverImageUrl}
                alt={content.title}
                className="w-full h-full object-cover"
                style={{
                  aspectRatio: content.coverWidth && content.coverHeight 
                    ? `${content.coverWidth}/${content.coverHeight}` 
                    : '3/2',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : null}
        </div>
        
        {/* Meta below */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {platform?.toUpperCase() || 'PLAYLIST'}
              </Badge>
              {isCommunity && (
                <Badge variant="outline">COMMUNITY</Badge>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-4">
              {content.title}
            </h1>
            
            {content.authors && content.authors.length > 0 && (
              <p className="text-lg text-[var(--charcoal)]/70 mb-6">
                Curated by {content.authors.join(', ')}
              </p>
            )}
          </div>
          
          {content.excerpt && (
            <div className="prose prose-lg max-w-none">
              <p className="text-[var(--charcoal)]/80 leading-relaxed">
                {content.excerpt}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-4 pt-6">
            {content.externalUrl && (
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700"
              >
                <a
                  href={content.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="playlist-cta-full"
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
          <div className="text-center">
            <Link href={isCommunity ? "/community" : "/editorials"}>
              <Button variant="outline" className="inline-flex items-center space-x-2" data-testid="back-navigation">
                <ArrowLeft className="w-4 h-4" />
                <span>{isCommunity ? "Back to Community" : "Back to Editorials"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}