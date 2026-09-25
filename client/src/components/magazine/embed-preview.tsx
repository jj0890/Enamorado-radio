import { getEmbed, extractPlatformUrl, type EmbedData } from "@/lib/embed-utils";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedPreviewProps {
  links?: { spotify?: string; appleMusic?: string; soundcloud?: string; youtube?: string };
  externalUrl?: string | null;
  className?: string;
  compact?: boolean;
}

export default function EmbedPreview({ links, externalUrl, className = "", compact = false }: EmbedPreviewProps) {
  const url = extractPlatformUrl(links, externalUrl || undefined);
  const embedData = url ? getEmbed(url) : null;
  
  if (!embedData) {
    return null;
  }
  
  // For compact mode or unsupported providers, show a link button
  if (compact || embedData.provider === 'link') {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className={className}
        data-testid="embed-external-link"
      >
        <a href={url!} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open on {embedData.provider === 'link' ? 'platform' : embedData.provider}
        </a>
      </Button>
    );
  }
  
  // Full embed for supported providers
  return (
    <div className={`embed-preview ${className}`} data-testid={`embed-${embedData.provider}`}>
      <iframe
        src={embedData.embedUrl}
        width="100%"
        height={embedData.height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-presentation"
        title={`${embedData.provider} embed`}
        className="rounded-lg"
      />
    </div>
  );
}
