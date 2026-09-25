import { useState } from 'react';
import { Play, ExternalLink, X } from 'lucide-react';
import { detectPlaylistPlatform, normalizeSpotifyEmbed, normalizeAppleMusicEmbed } from '@/lib/embed-utils';

interface FeaturedMixCardProps {
  mix: {
    id: number;
    title: string;
    name: string;
    genre: string;
    about: string;
    url: string;
    artUrl?: string;
    metadata?: {
      imageUrl?: string;
      platform?: string;
      artist?: string;
    };
  };
}

/** Build an autoplay-enabled embed src from a public URL */
function buildEmbedSrc(url: string): string | null {
  if (!url) return null;
  const platform = detectPlaylistPlatform(url);
  switch (platform) {
    case 'soundcloud':
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23537A28&auto_play=true&hide_related=true&show_comments=false&show_user=true`;
    case 'mixcloud': {
      try {
        const path = new URL(url).pathname;
        return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(path)}`;
      } catch {
        return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=${encodeURIComponent(url)}`;
      }
    }
    case 'youtube': {
      const ytMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` : null;
    }
    case 'spotify':
      return normalizeSpotifyEmbed(url);
    case 'apple-music':
    case 'apple_music':
      return normalizeAppleMusicEmbed(url);
    default:
      return null;
  }
}

export function FeaturedMixCard({ mix }: FeaturedMixCardProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const embedSrc = buildEmbedSrc(mix.url);

  const imageUrl =
    mix.artUrl ||
    mix.metadata?.imageUrl ||
    `https://via.placeholder.com/400x400/191E15/F6F4EF?text=${encodeURIComponent(mix.name)}`;

  return (
    <div className="border border-paper-border hover:border-ink/30 transition-all duration-200">

      {/* Embed player — shown when user clicks Play */}
      {showEmbed && embedSrc && (
        <div className="border-b border-paper-border relative">
          <button
            onClick={() => setShowEmbed(false)}
            className="absolute top-2 right-2 z-10 p-1 bg-background/80 hover:bg-background border border-paper-border text-ink-muted hover:text-foreground transition-colors"
            title="Close player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <iframe
            src={embedSrc}
            width="100%"
            height={166}
            allow="autoplay"
            className="block"
            style={{ border: 'none' }}
            title={mix.title}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-0">
        {/* Artwork */}
        <div className="relative sm:w-56 md:w-64 shrink-0 overflow-hidden bg-paper-cool aspect-square sm:aspect-auto">
          <img
            src={imageUrl}
            alt={mix.title}
            className="w-full h-full object-cover"
          />
          {showEmbed && (
            <div className="absolute inset-0 bg-olive/20 flex items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-widest text-white bg-olive px-3 py-1">
                Now Playing
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between p-5 sm:p-6 bg-background flex-1">
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                {mix.genre}
              </span>
              {mix.metadata?.platform && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                    via {mix.metadata.platform}
                  </span>
                </>
              )}
            </div>

            <h3
              className="font-display font-700 uppercase leading-tight text-foreground"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
            >
              {mix.title}
            </h3>

            <p className="font-mono text-xs uppercase tracking-widest text-olive">
              {mix.name}
            </p>

            <p className="font-body text-sm text-ink-muted leading-relaxed line-clamp-3">
              {mix.about}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {embedSrc ? (
              <button
                onClick={() => setShowEmbed((v) => !v)}
                className={[
                  "flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors",
                  showEmbed
                    ? "bg-olive text-white"
                    : "bg-foreground text-background hover:bg-olive",
                ].join(" ")}
              >
                <Play className="w-3 h-3" fill="currentColor" />
                {showEmbed ? 'Playing' : 'Play Mix'}
              </button>
            ) : (
              /* No embeddable URL — link out directly */
              <a
                href={mix.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase tracking-widest bg-foreground text-background hover:bg-olive transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Listen
              </a>
            )}

            <a
              href={mix.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-paper-border text-ink-muted hover:border-ink hover:text-foreground transition-colors"
              title="Open source"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
