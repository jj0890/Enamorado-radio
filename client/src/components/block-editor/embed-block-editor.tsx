import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { EmbedBlock } from "@shared/schema";

interface EmbedBlockEditorProps {
  block: EmbedBlock;
  onChange: (block: EmbedBlock) => void;
}

interface OEmbedResponse {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  embedHtml: string | null;
  description: string | null;
}

export default function EmbedBlockEditor({ block, onChange }: EmbedBlockEditorProps) {
  const [inputUrl, setInputUrl] = useState(block.url);

  const { data: oembed, isLoading, error, refetch } = useQuery<OEmbedResponse | null>({
    queryKey: ['/api/oembed', block.url],
    enabled: !!block.url && block.url.startsWith("http"),
    queryFn: async (): Promise<OEmbedResponse | null> => {
      if (!block.url) return null;
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(block.url)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleFetchEmbed = () => {
    if (!inputUrl) return;
    
    onChange({
      ...block,
      url: inputUrl,
      embedHtml: "",
      platform: "",
    });
  };

  // Update block when oembed data arrives
  if (oembed && (oembed.embedHtml !== block.embedHtml || oembed.platform !== block.platform)) {
    onChange({
      ...block,
      embedHtml: oembed.embedHtml || "",
      platform: oembed.platform || "",
    });
  }

  return (
    <div className="embed-block-editor space-y-4" data-testid="embed-block-editor">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="embedUrl" className="sr-only">Embed URL</Label>
          <Input
            id="embedUrl"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste YouTube, Spotify, SoundCloud, or other embed URL..."
            className="w-full"
            data-testid="input-url"
          />
        </div>
        <Button
          onClick={handleFetchEmbed}
          disabled={!inputUrl || isLoading}
          className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90"
          data-testid="fetch-embed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Embed"
          )}
        </Button>
      </div>

      {/* Embed Preview */}
      {block.url && (
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 bg-gray-50">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading embed...</span>
            </div>
          ) : block.embedHtml ? (
            <div className="relative">
              <div
                className="w-full [&>iframe]:w-full [&>iframe]:max-h-[400px]"
                dangerouslySetInnerHTML={{ __html: block.embedHtml }}
              />
              {block.platform && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {block.platform}
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-center">
              <p className="text-red-600 mb-2">Could not load embed</p>
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--editorial)] underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open link directly
              </a>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 text-center">
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--editorial)] underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {block.url}
              </a>
              <p className="text-gray-500 text-sm mt-2">
                Embed preview not available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Supported Platforms */}
      {!block.url && (
        <div className="text-center text-sm text-gray-500">
          <p>Supports YouTube, Spotify, SoundCloud, Vimeo, Twitter, and more</p>
        </div>
      )}
    </div>
  );
}
