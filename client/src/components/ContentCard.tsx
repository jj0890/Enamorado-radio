/**
 * ContentCard — Substack-style feed card.
 * Works for every content type: mix, episode, playlist, writing, artwork, article.
 *
 * Design rules:
 * - Image (3:2 ratio) or a type-coloured text block when no image — never a broken placeholder
 * - Type label · platform  (small, mono, muted)
 * - Title (bold, 2 lines)
 * - Author name
 * - Excerpt / description (2 lines of body text when available)
 */

import { Star, Disc, ListMusic, Music, PenLine, ImageIcon, BookOpen, Radio } from 'lucide-react';
import { ContentItem } from '@shared/schema';
import { Link } from 'wouter';

interface ContentCardProps {
  content: ContentItem;
  onGenreSelect?: (genre: string) => void;
  showFeaturedBadge?: boolean;
  /** Show a wider, hero-style layout (used for first card in a section) */
  hero?: boolean;
}

// Legacy interface — kept so existing callers don't break
interface LegacyContentCardProps {
  content: {
    id: number;
    title: string;
    artist?: string;
    name?: string;
    hostName?: string;
    genre?: string;
    url?: string;
    artwork?: string;
    artUrl?: string;
    artworkUrl?: string;
    date?: string;
    submittedAt?: string;
    airDate?: string;
    isFeatured?: boolean;
    metadata?: { imageUrl?: string; title?: string; artist?: string };
  };
  type: 'mix' | 'episode';
  onGenreSelect?: (genre: string) => void;
}

// ─── Per-type colour + icon ──────────────────────────────────────────────────

type KnownType = 'mix' | 'episode' | 'playlist' | 'art' | 'writing' | 'article' | 'track';

const TYPE_META: Record<KnownType, { label: string; bg: string; Icon: React.ComponentType<{ className?: string }> }> = {
  mix:      { label: 'Mix',     bg: 'bg-olive',       Icon: Disc },
  episode:  { label: 'Episode', bg: 'bg-navy',        Icon: Radio },
  playlist: { label: 'Playlist',bg: 'bg-purple-700',  Icon: ListMusic },
  art:      { label: 'Artwork', bg: 'bg-rose-700',    Icon: ImageIcon },
  writing:  { label: 'Writing', bg: 'bg-amber-700',   Icon: PenLine },
  article:  { label: 'Article', bg: 'bg-green-800',   Icon: BookOpen },
  track:    { label: 'Track',   bg: 'bg-blue-700',    Icon: Music },
};

function getMeta(type: string) {
  return TYPE_META[type as KnownType] ?? { label: type, bg: 'bg-gray-700', Icon: Music };
}

// ─── Platform label ──────────────────────────────────────────────────────────

function getPlatformLabel(url?: string): string | null {
  if (!url) return null;
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('mixcloud.com')) return 'Mixcloud';
  if (url.includes('open.spotify.com')) return 'Spotify';
  if (url.includes('music.apple.com')) return 'Apple Music';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (/\.(mp3|m4a|aac|ogg|wav)($|\?)/i.test(url)) return 'MP3';
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ContentCard(props: ContentCardProps | LegacyContentCardProps) {
  const { content, onGenreSelect } = props;
  const showFeaturedBadge = (props as ContentCardProps).showFeaturedBadge ?? false;
  const hero = (props as ContentCardProps).hero ?? false;

  const type: string =
    (props as LegacyContentCardProps).type ||
    ('type' in content ? (content.type as string) : 'mix');

  const meta = getMeta(type);
  const Icon = meta.Icon;

  // Artwork — try every field, accept only real URLs
  const rawArt =
    (content as any).artworkUrl ||
    (content as any).artwork ||
    (content as any).artUrl ||
    (content as any).metadata?.imageUrl ||
    (content as any).coverImageUrl;
  const artwork = rawArt && rawArt.trim() ? rawArt : null;

  // Description / excerpt
  const description: string =
    (content as any).description ||
    (content as any).about ||
    (content as any).excerpt ||
    '';

  // Creator name
  const creator: string =
    (content as any).name ||
    (content as any).hostName ||
    (content as any).authorName ||
    (content as any).curatorName ||
    (content as any).artistName ||
    (content as any).artist ||
    '';

  // Contributor handle for internal linking
  const handle: string | null = ('handle' in content ? (content as any).handle : null) || null;

  // Platform badge
  const url: string = (content as any).fileUrl || (content as any).streamUrl || (content as any).url || '';
  const platformLabel = getPlatformLabel(url);

  // Detail page URL
  const slug = ('slug' in content && (content as any).slug) ? (content as any).slug : null;
  const detailUrl = `/community/${slug ?? content.id}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Link
      href={detailUrl}
      className={[
        'group block bg-background border border-paper-border',
        'hover:border-ink/30 transition-all duration-200',
        hero ? 'flex flex-col sm:flex-row gap-0' : '',
      ].join(' ')}
      data-testid={`card-${type}-${content.id}`}
    >
      {/* ── Image / text-fallback ── */}
      <div
        className={[
          'relative overflow-hidden shrink-0',
          hero
            ? 'sm:w-80 md:w-96 aspect-[3/2] sm:aspect-auto'
            : 'aspect-[3/2] w-full',
        ].join(' ')}
      >
        {artwork ? (
          <>
            <img
              src={artwork}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* Staff pick badge */}
            {content.isFeatured && showFeaturedBadge && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-background/90 border border-paper-border px-2 py-1">
                <Star className="w-3 h-3 text-olive fill-olive" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">Staff pick</span>
              </div>
            )}
          </>
        ) : (
          /* No image — type-coloured text card, intentional not broken */
          <div className={`w-full h-full ${meta.bg} flex flex-col justify-between p-5`}>
            {content.isFeatured && showFeaturedBadge && (
              <div className="flex items-center gap-1 w-fit bg-white/20 px-2 py-1">
                <Star className="w-3 h-3 text-white fill-white" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white">Staff pick</span>
              </div>
            )}
            <div className="mt-auto">
              <p
                className="font-display font-black uppercase text-white leading-tight line-clamp-3"
                style={{ fontSize: hero ? 'clamp(1.4rem, 3vw, 2rem)' : 'clamp(1.1rem, 2.5vw, 1.6rem)' }}
              >
                {content.title}
              </p>
            </div>
            {/* type icon bottom right */}
            <Icon className="absolute bottom-4 right-4 w-8 h-8 text-white/20" />
          </div>
        )}
      </div>

      {/* ── Text block ── */}
      <div className={['flex flex-col justify-between p-5', hero ? 'flex-1' : ''].join(' ')}>
        {/* Type · Platform */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`font-mono text-[10px] uppercase tracking-widest text-white px-2 py-0.5 ${meta.bg}`}>
            {meta.label}
          </span>
          {platformLabel && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {platformLabel}
            </span>
          )}
          {content.genre && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {content.genre}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={[
            'font-display font-black uppercase text-foreground leading-tight line-clamp-2 mb-2',
            hero ? 'text-2xl md:text-3xl' : 'text-lg',
          ].join(' ')}
        >
          {content.title}
        </h3>

        {/* Creator */}
        {creator && (
          handle ? (
            <span
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/contributors/${handle}`; }}
              className="font-mono text-xs text-olive hover:underline cursor-pointer mb-2 block"
            >
              {creator}
            </span>
          ) : (
            <p className="font-mono text-xs text-ink-muted mb-2">{creator}</p>
          )
        )}

        {/* Excerpt — the key Substack ingredient */}
        {description && (
          <p className={[
            'font-body text-sm text-ink-muted leading-relaxed',
            hero ? 'line-clamp-4' : 'line-clamp-2',
          ].join(' ')}>
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
