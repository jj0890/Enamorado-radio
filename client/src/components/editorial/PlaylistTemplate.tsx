import { ExternalLink, ListMusic, Play } from 'lucide-react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { ContentItem } from '@shared/schema';
import { useAudioManager } from '@/lib/audioManager';

interface PlaylistTemplateProps {
  content: ContentItem & { type: 'playlist' };
  tracks?: Array<{
    position: number;
    artist: string;
    title: string;
    album?: string;
    duration?: string;
  }>;
}

function getPlatform(url: string) {
  if (url.includes('spotify.com'))  return 'Spotify';
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('apple.com'))    return 'Apple Music';
  return 'External Link';
}

export default function PlaylistTemplate({ content, tracks = [] }: PlaylistTemplateProps) {
  const { playUserSelectedMix, currentTrack, isPlaying } = useAudioManager();

  const getCuratorName = () => {
    if ('curatorName' in content) return (content as any).curatorName;
    if ('name' in content) return (content as any).name;
    return 'Unknown Curator';
  };

  const formattedDate = content.submittedAt
    ? (content.submittedAt instanceof Date ? content.submittedAt : new Date(content.submittedAt as string))
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const platform = content.url ? getPlatform(content.url) : null;
  const isCurrentlyPlaying = (currentTrack as any)?.id === content.id && isPlaying;

  const handlePlay = () => {
    if ((content as any).url) {
      playUserSelectedMix({
        id: (content as any).id,
        title: content.title,
        name: getCuratorName(),
        url: (content as any).url,
        metadata: { imageUrl: content.artworkUrl },
      } as any);
    }
  };

  return (
    <article className="min-h-screen bg-background">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <header className="border-b border-paper-border">
        <div className="max-w-site mx-auto px-4 sm:px-6 pt-10 pb-12">
          {/* Back nav */}
          <Link href="/mixes">
            <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer mb-8 block">
              <ArrowLeft className="w-3 h-3" /> Back to Mixes
            </span>
          </Link>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Artwork */}
            <div className="sm:w-56 md:w-64 shrink-0">
              <div className="aspect-square bg-paper-cool border border-paper-border overflow-hidden">
                {content.artworkUrl ? (
                  <img src={content.artworkUrl} alt={content.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-12 h-12 text-ink-faint" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Type label */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-olive border border-olive px-2 py-0.5">
                  Playlist
                </span>
                {platform && (
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-faint border border-paper-border px-2 py-0.5">
                    via {platform}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-display font-black uppercase leading-none text-foreground"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', letterSpacing: '-0.01em' }}
              >
                {content.title}
              </h1>

              {/* Curator */}
              <p className="font-mono text-xs uppercase tracking-widest text-olive mt-3 mb-5">
                Curated by {getCuratorName()}
              </p>

              {/* Description — EB Garamond italic */}
              {content.description && (
                <p className="font-serif italic text-ink-muted leading-relaxed mb-6 max-w-xl"
                  style={{ fontSize: '1.1rem' }}>
                  {content.description}
                </p>
              )}

              {/* Meta + actions */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">{formattedDate}</span>
                {tracks.length > 0 && (
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                    {tracks.length} tracks
                  </span>
                )}
              </div>

              {/* Play + external link */}
              <div className="flex items-center gap-3 mt-6">
                {content.url && (
                  <button
                    onClick={handlePlay}
                    disabled={isCurrentlyPlaying}
                    className={[
                      'flex items-center gap-2 px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors',
                      isCurrentlyPlaying
                        ? 'bg-olive text-white cursor-default'
                        : 'bg-foreground text-background hover:bg-olive',
                    ].join(' ')}
                  >
                    <Play className="w-3 h-3" fill="currentColor" />
                    {isCurrentlyPlaying ? 'Playing' : 'Play Mix'}
                  </button>
                )}
                {content.url && (
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted border border-paper-border px-4 py-2 hover:border-olive hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in {platform}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TRACKLIST ────────────────────────────────────────────────── */}
      <div className="max-w-site mx-auto px-4 sm:px-6 py-10">
        {tracks.length > 0 ? (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-display font-800 text-2xl uppercase tracking-wide text-foreground">
                Tracklist
              </h2>
              <div className="flex-1 h-px bg-paper-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                {tracks.length} tracks
              </span>
            </div>

            <div className="border border-paper-border divide-y divide-paper-border">
              {tracks.map((track) => (
                <div
                  key={track.position}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-paper-warm transition-colors"
                >
                  <span className="font-mono text-xs text-ink-faint w-6 text-right shrink-0 pt-0.5">
                    {track.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-700 text-base uppercase leading-none text-foreground truncate">
                      {track.title}
                    </p>
                    <p className="font-serif italic text-sm text-ink-muted mt-0.5 truncate"
                      style={{ fontSize: '0.9rem' }}>
                      {track.artist}
                      {track.album && ` — ${track.album}`}
                    </p>
                  </div>
                  {track.duration && (
                    <span className="font-mono text-xs text-ink-faint shrink-0">{track.duration}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* No tracklist — link to original */
          content.url && (
            <div className="border border-paper-border p-8 text-center">
              <p className="font-serif italic text-ink-muted mb-5" style={{ fontSize: '1.05rem' }}>
                Full tracklist available on {platform}.
              </p>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-olive transition-colors"
              >
                View on {platform} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )
        )}

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-paper-border flex items-center justify-between">
          <Link href="/community?type=playlist">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-olive transition-colors cursor-pointer flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> More Playlists
            </span>
          </Link>
          <Link href="/submit-playlist">
            <span className="font-mono text-xs uppercase tracking-widest text-olive hover:underline cursor-pointer">
              Submit a Playlist
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
