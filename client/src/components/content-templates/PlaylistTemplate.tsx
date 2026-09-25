import { useState } from "react";
import { ExternalLink, Music2, Heart, Share2 } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  detectPlaylistPlatform,
  getEmbedUrl,
  getEmbedHeight,
  getPlatformDisplayName,
  getPlatformColor,
  isEmbeddablePlatform,
  type PlaylistPlatform,
} from "@/lib/embed-utils";

interface PlaylistTemplateProps {
  title: string;
  curatorName: string;
  playlistUrl: string;
  description?: string | null;
  artworkUrl?: string | null;
  tags?: string[] | null;
  platform?: string | null;
  metadata?: {
    embedUrl?: string;
    thumbnail?: string;
    title?: string;
  } | null;
  likes?: number;
  onLike?: () => void;
  showEmbed?: boolean;
}

function PlatformIconLocal({ platform, className }: { platform: PlaylistPlatform; className?: string }) {
  // Parse size from Tailwind class (e.g. "w-5 h-5" → 20, "w-8 h-8" → 32)
  const sizeMatch = className?.match(/w-(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 20;
  return <PlatformIcon platform={platform} size={size} branded className={className} />;
}

export default function PlaylistTemplate({
  title,
  curatorName,
  playlistUrl,
  description,
  artworkUrl,
  tags,
  platform: providedPlatform,
  metadata,
  likes = 0,
  onLike,
  showEmbed = true,
}: PlaylistTemplateProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  
  const platform = (providedPlatform as PlaylistPlatform) || detectPlaylistPlatform(playlistUrl);
  const embedUrl = metadata?.embedUrl || getEmbedUrl(playlistUrl, platform);
  const embedHeight = getEmbedHeight(platform);
  const canEmbed = isEmbeddablePlatform(platform);
  const thumbnail = artworkUrl || metadata?.thumbnail;
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };
  
  const handleShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: `Check out "${title}" curated by ${curatorName}`,
        url: playlistUrl,
      });
    } catch {
      await navigator.clipboard.writeText(playlistUrl);
    }
  };

  return (
    <div className="w-full space-y-4" data-testid="playlist-template">
      <div className="flex items-start gap-4">
        {thumbnail && (
          <div className="shrink-0">
            <img
              src={thumbnail}
              alt={title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg shadow-md"
              data-testid="playlist-artwork"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1"
              style={{
                backgroundColor: `${getPlatformColor(platform)}20`,
                color: getPlatformColor(platform),
                borderColor: getPlatformColor(platform),
              }}
              data-testid="platform-badge"
            >
              <PlatformIconLocal platform={platform} className="w-3 h-3" />
              {getPlatformDisplayName(platform)}
            </Badge>
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-foreground truncate" data-testid="playlist-title">
            {title}
          </h2>
          
          <p className="text-sm text-muted-foreground" data-testid="playlist-curator">
            Curated by {curatorName}
          </p>
          
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2" data-testid="playlist-description">
              {description}
            </p>
          )}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 5).map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs"
                  data-testid={`tag-${idx}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={isLiked ? "text-red-500" : "text-muted-foreground"}
          data-testid="button-like"
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          {likes + (isLiked ? 1 : 0)}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-muted-foreground"
          data-testid="button-share"
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
        
        <div className="flex-1" />
        
        <Button
          asChild
          variant="outline"
          size="sm"
          data-testid="button-open-external"
        >
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Open in {getPlatformDisplayName(platform)}
          </a>
        </Button>
      </div>
      
      {showEmbed && canEmbed && (
        <div 
          className="relative rounded-lg overflow-hidden bg-muted"
          style={{ minHeight: embedHeight }}
          data-testid="embed-container"
        >
          {!embedLoaded && !embedError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2">
                <PlatformIconLocal platform={platform} className="w-8 h-8 animate-pulse" />
                <span className="text-sm text-muted-foreground">Loading embed...</span>
              </div>
            </div>
          )}
          
          {embedError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <Music2 className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Unable to load embed. 
                  <a 
                    href={playlistUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Open directly
                  </a>
                </p>
              </div>
            </div>
          )}
          
          <iframe
            src={embedUrl}
            width="100%"
            height={embedHeight}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            onLoad={() => setEmbedLoaded(true)}
            onError={() => setEmbedError(true)}
            className={embedLoaded ? "opacity-100" : "opacity-0"}
            style={{ transition: "opacity 0.3s ease" }}
            data-testid="playlist-embed"
          />
        </div>
      )}
      
      {showEmbed && !canEmbed && (
        <div 
          className="relative rounded-lg overflow-hidden bg-muted p-8 text-center"
          data-testid="embed-fallback"
        >
          <PlatformIconLocal platform={platform} className="w-12 h-12 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            This playlist can't be embedded directly.
          </p>
          <Button asChild>
            <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in {getPlatformDisplayName(platform)}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export function PlaylistCard({
  title,
  curatorName,
  playlistUrl,
  artworkUrl,
  platform: providedPlatform,
  metadata,
  tags,
  likes = 0,
}: Omit<PlaylistTemplateProps, 'showEmbed'>) {
  const platform = (providedPlatform as PlaylistPlatform) || detectPlaylistPlatform(playlistUrl);
  const thumbnail = artworkUrl || metadata?.thumbnail;
  
  return (
    <a
      href={playlistUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      data-testid="playlist-card"
    >
      <div className="aspect-square relative bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlatformIconLocal platform={platform} className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge
            className="text-xs flex items-center gap-1"
            style={{
              backgroundColor: getPlatformColor(platform),
              color: 'white',
            }}
          >
            <PlatformIconLocal platform={platform} className="w-3 h-3" />
          </Badge>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {curatorName}
        </p>
        
        <div className="flex items-center justify-between mt-2">
          {tags && tags.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {tags[0]}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {likes}
          </span>
        </div>
      </div>
    </a>
  );
}
