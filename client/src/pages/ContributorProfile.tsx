import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import {
  ArrowLeft,
  User,
  MapPin,
  Globe,
  Music,
  ListMusic,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ScrollText,
  Mic,
  Feather,
  Newspaper,
  Star,
} from 'lucide-react';
import {
  SiInstagram,
  SiX,
  SiSoundcloud,
  SiBandcamp,
  SiSpotify
} from 'react-icons/si';
import Navigation from '@/components/Navigation';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

// Type for social links
interface SocialLinks {
  instagram?: string;
  twitter?: string;
  soundcloud?: string;
  bandcamp?: string;
  spotify?: string;
}

// Type for photoshoot gallery item
interface PhotoshootGalleryItem {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
}

interface ProfileAlbum {
  rank: number;
  mbId: string;
  title: string;
  artist: string;
  year?: string;
  coverUrl: string | null;
}

// Enhanced contributor interface with all new schema fields
interface ContributorWithSubmissions {
  id: number;
  handle: string;
  displayName: string;
  email?: string;
  residentId?: number | null;

  // Profile info
  bio?: string;
  tagline?: string;
  location?: string;
  role?: string;
  roleLabels?: string[];
  links?: Array<{ label: string; url: string }>;
  avatarUrl?: string;
  websiteUrl?: string;

  // Album taste
  albums?: ProfileAlbum[];

  // Social (old + new)
  socialHandle?: string; // deprecated
  socialLinks?: SocialLinks;

  // Profile showcase
  photoshootGallery?: PhotoshootGalleryItem[];
  recommendedPlaylistUrl?: string;
  recommendedPlaylistPlatform?: string;

  // Status
  isResident?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Submissions
  submissions: {
    mixes: Array<{
      id: number;
      title: string;
      genre: string;
      artwork_url?: string;
      artUrl?: string;
      submittedAt?: string;
    }>;
    playlists: Array<{
      id: number;
      title: string;
      artworkUrl?: string;
      submittedAt?: string;
    }>;
    // Future: editorial content via contentContributors junction
    editorial?: Array<{
      id: number;
      title: string;
      slug: string;
      excerpt?: string;
      coverImageUrl?: string;
      contentType: string;
      role: string;
      publishedAt?: string;
    }>;
    total: number;
  };
}

// Role display mapping
const roleLabels: Record<string, string> = {
  dj: 'DJ',
  writer: 'Writer',
  photographer: 'Photographer',
  curator: 'Curator',
  artist: 'Artist',
  producer: 'Producer',
  other: 'Contributor',
};

// Detect DSP from URL
function detectPlatform(url: string): string {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('music.apple.com')) return 'apple';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('tidal.com')) return 'tidal';
  return 'other';
}

// Playlist embed component
function PlaylistEmbed({ url, platform: explicitPlatform }: { url: string; platform?: string }) {
  const platform = explicitPlatform || detectPlatform(url);

  const getEmbedUrl = (): string | null => {
    if (!url) return null;

    // Spotify
    if (platform === 'spotify') {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`;
      }
    }

    // Apple Music
    if (platform === 'apple') {
      return url.replace('music.apple.com', 'embed.music.apple.com');
    }

    // YouTube playlist (youtube.com/playlist?list=... or youtu.be share)
    if (platform === 'youtube') {
      const listMatch = url.match(/[?&]list=([^&]+)/);
      if (listMatch) {
        return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&modestbranding=1&rel=0`;
      }
    }

    // SoundCloud
    if (platform === 'soundcloud') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23cc4a00&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    }

    // Tidal
    if (platform === 'tidal') {
      const idMatch = url.match(/playlist\/([a-z0-9-]+)/i);
      if (idMatch) {
        return `https://embed.tidal.com/playlists/${idMatch[1]}`;
      }
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  const embedHeight: Record<string, number> = {
    spotify: 352,
    youtube: 315,
    apple: 175,
    soundcloud: 300,
    tidal: 315,
  };

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-burnt-orange-500 hover:text-burnt-orange-600 transition-colors"
      >
        <Music className="w-5 h-5" />
        Listen on {platform || 'external platform'}
        <ExternalLink className="w-4 h-4" />
      </a>
    );
  }

  return (
    <iframe
      src={embedUrl}
      width="100%"
      height={embedHeight[platform] ?? 200}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg"
    />
  );
}

// Photoshoot gallery component with lightbox-style navigation
function PhotoshootGallery({ images }: { images: PhotoshootGalleryItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const current = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-[4/5] bg-cream-200 dark:bg-gray-800 rounded-lg overflow-hidden group">
        <img
          src={current.src}
          alt={current.alt || 'Photoshoot image'}
          className="w-full h-full object-cover"
        />

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-900"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-charcoal-800 dark:text-cream-100" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-900"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-charcoal-800 dark:text-cream-100" />
            </button>
          </>
        )}

        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded-full text-sm font-mono text-charcoal-700 dark:text-cream-200">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Caption and credit */}
      {(current.caption || current.credit) && (
        <div className="text-center space-y-1">
          {current.caption && (
            <p className="text-charcoal-700 dark:text-cream-300 font-body text-sm italic">
              {current.caption}
            </p>
          )}
          {current.credit && (
            <p className="text-charcoal-500 dark:text-cream-400 font-accent text-xs uppercase tracking-wider">
              Photo: {current.credit}
            </p>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                i === currentIndex
                  ? 'ring-2 ring-burnt-orange-500 opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.src}
                alt={img.alt || `Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Social links component
function SocialLinksDisplay({
  socialLinks,
  socialHandle,
  websiteUrl
}: {
  socialLinks?: SocialLinks;
  socialHandle?: string;
  websiteUrl?: string;
}) {
  // Merge old socialHandle with new socialLinks for backwards compatibility
  const links = {
    instagram: socialLinks?.instagram || socialHandle?.replace('@', ''),
    twitter: socialLinks?.twitter,
    soundcloud: socialLinks?.soundcloud,
    bandcamp: socialLinks?.bandcamp,
    spotify: socialLinks?.spotify,
  };

  const hasAnyLink = Object.values(links).some(Boolean) || websiteUrl;

  if (!hasAnyLink) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {links.instagram && (
        <a
          href={`https://instagram.com/${links.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="Instagram"
        >
          <SiInstagram className="w-5 h-5" />
        </a>
      )}
      {links.twitter && (
        <a
          href={`https://x.com/${links.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="X (Twitter)"
        >
          <SiX className="w-5 h-5" />
        </a>
      )}
      {links.soundcloud && (
        <a
          href={links.soundcloud.includes('soundcloud.com') ? links.soundcloud : `https://soundcloud.com/${links.soundcloud}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="SoundCloud"
        >
          <SiSoundcloud className="w-5 h-5" />
        </a>
      )}
      {links.bandcamp && (
        <a
          href={links.bandcamp.includes('bandcamp.com') ? links.bandcamp : `https://${links.bandcamp}.bandcamp.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="Bandcamp"
        >
          <SiBandcamp className="w-5 h-5" />
        </a>
      )}
      {links.spotify && (
        <a
          href={links.spotify.includes('spotify.com') ? links.spotify : `https://open.spotify.com/artist/${links.spotify}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="Spotify"
        >
          <SiSpotify className="w-5 h-5" />
        </a>
      )}
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
          title="Website"
        >
          <Globe className="w-5 h-5" />
        </a>
      )}
    </div>
  );
}

// Maps DB contentType values to display labels and icons
const CONTENT_TYPE_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  review:    { label: 'Reviews',    Icon: Star },
  essay:     { label: 'Essays',     Icon: ScrollText },
  interview: { label: 'Interviews', Icon: Mic },
  poem:      { label: 'Poems',      Icon: Feather },
  feature:   { label: 'Features',   Icon: Newspaper },
  article:   { label: 'Articles',   Icon: FileText },
};

// Paginated grid wrapper — manages local show-more state
function ContentGrid<T>({
  items,
  renderItem,
  columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  pageSize = 8,
}: {
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
  columns?: string;
  pageSize?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, pageSize);
  const hiddenCount = items.length - pageSize;

  return (
    <div>
      <div className={`grid ${columns} gap-4`}>
        {visible.map((item, idx) => renderItem(item, idx))}
      </div>
      {items.length > pageSize && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-5 flex items-center gap-1.5 text-xs font-accent uppercase tracking-wider text-charcoal-500 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

export default function ContributorProfile() {
  const [, params] = useRoute('/contributors/:handle');
  const handle = params?.handle;

  const { data: contributor, isLoading, error } = useQuery<ContributorWithSubmissions>({
    queryKey: ['/api/contributors', handle],
    queryFn: async () => {
      const response = await fetch(`/api/contributors/${handle}`);
      if (!response.ok) throw new Error('Contributor not found');
      return response.json();
    },
    enabled: !!handle,
    refetchOnWindowFocus: false,
  });

  const { data: auth } = useQuery<{ authenticated: boolean; residentId?: number }>({
    queryKey: ['/api/resident/auth'],
    queryFn: () => fetch('/api/resident/auth').then(r => r.json()),
    retry: false,
  });

  const isOwner =
    auth?.authenticated &&
    contributor?.residentId != null &&
    auth.residentId === contributor.residentId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col lg:flex-row gap-8 mb-12">
              <div className="lg:w-1/3">
                <div className="aspect-square bg-cream-300 dark:bg-gray-800 rounded-lg" />
              </div>
              <div className="lg:w-2/3 space-y-4">
                <div className="h-4 bg-cream-300 dark:bg-gray-800 w-24 rounded" />
                <div className="h-10 bg-cream-300 dark:bg-gray-800 w-64 rounded" />
                <div className="h-6 bg-cream-300 dark:bg-gray-800 w-48 rounded" />
                <div className="h-20 bg-cream-300 dark:bg-gray-800 w-full rounded" />
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-cream-300 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-display text-charcoal-900 dark:text-cream-100 mb-4">
              Contributor Not Found
            </h1>
            <p className="text-charcoal-600 dark:text-cream-400 mb-8 font-body">
              @{handle} doesn't have a profile yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-burnt-orange-500 hover:text-burnt-orange-600 font-ui"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getArtwork = (item: any): string | null => {
    return item.artwork_url || item.artUrl || item.artworkUrl || null;
  };

  const initials = contributor.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasPhotoshoot = contributor.photoshootGallery && contributor.photoshootGallery.length > 0;
  const hasPlaylist = !!contributor.recommendedPlaylistUrl;
  const hasEditorial = contributor.submissions.editorial && contributor.submissions.editorial.length > 0;
  const hasAlbums = (contributor.albums ?? []).length > 0;

  const displayRoles: string[] = contributor.roleLabels && contributor.roleLabels.length > 0
    ? contributor.roleLabels
    : contributor.role ? [roleLabels[contributor.role] || contributor.role] : [];

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-charcoal-600 dark:text-cream-400 hover:text-charcoal-900 dark:hover:text-cream-100 mb-8 font-ui text-sm"
          data-testid="link-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Hero section - Two column layout with photo gallery or avatar */}
        <header className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16">
          {/* Left: Photo gallery or avatar */}
          <div className="lg:w-2/5">
            {hasPhotoshoot ? (
              <PhotoshootGallery images={contributor.photoshootGallery!} />
            ) : (
              <div className="aspect-square bg-cream-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Avatar className="w-48 h-48 border-4 border-white dark:border-gray-700 shadow-lg">
                  <AvatarImage src={contributor.avatarUrl} alt={contributor.displayName} />
                  <AvatarFallback className="text-5xl bg-burnt-orange-500 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Right: Profile info */}
          <div className="lg:w-3/5 flex flex-col justify-center">
            {/* Role badges */}
            {displayRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {displayRoles.map((r) => (
                  <Badge
                    key={r}
                    variant="outline"
                    className="font-accent text-xs uppercase tracking-wider border-burnt-orange-500 text-burnt-orange-600 dark:text-burnt-orange-400"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            )}

            {/* Name */}
            <h1
              className="text-4xl md:text-5xl font-display font-bold text-charcoal-900 dark:text-cream-100 mb-2"
              data-testid="text-contributor-name"
            >
              {contributor.displayName}
            </h1>

            {/* Handle + Location */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span
                className="text-lg text-charcoal-500 dark:text-cream-400 font-mono"
                data-testid="text-contributor-handle"
              >
                @{contributor.handle}
              </span>
              {contributor.location && (
                <span className="flex items-center gap-1.5 text-charcoal-600 dark:text-cream-400 font-ui text-sm">
                  <MapPin className="w-4 h-4" />
                  {contributor.location}
                </span>
              )}
            </div>

            {/* Tagline */}
            {contributor.tagline && (
              <p className="text-xl text-charcoal-700 dark:text-cream-300 font-body italic mb-4">
                "{contributor.tagline}"
              </p>
            )}

            {/* Bio */}
            {contributor.bio && (
              <p
                className="text-charcoal-700 dark:text-cream-300 font-body leading-relaxed mb-6 max-w-2xl"
                data-testid="text-contributor-bio"
              >
                {contributor.bio}
              </p>
            )}

            {/* Social links + Stats */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <SocialLinksDisplay
                socialLinks={contributor.socialLinks}
                socialHandle={contributor.socialHandle}
                websiteUrl={contributor.websiteUrl}
              />

              <div className="flex items-center gap-4">
                <span
                  className="text-sm text-charcoal-500 dark:text-cream-400 font-mono"
                  data-testid="text-submission-count"
                >
                  {contributor.submissions.total} contribution{contributor.submissions.total !== 1 ? 's' : ''}
                </span>
                {isOwner && (
                  <Link
                    href="/profile/setup"
                    className="text-sm text-burnt-orange-500 hover:text-burnt-orange-600 dark:text-burnt-orange-400 dark:hover:text-burnt-orange-300 font-ui underline underline-offset-2 transition-colors"
                    data-testid="link-edit-profile"
                  >
                    Edit profile
                  </Link>
                )}
              </div>
            </div>

            {/* Generic links (from profile setup) */}
            {contributor.links && contributor.links.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {contributor.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-charcoal-600 dark:text-cream-400 hover:text-burnt-orange-500 dark:hover:text-burnt-orange-400 transition-colors underline underline-offset-2"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Top Albums Section */}
        {hasAlbums && (
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold text-charcoal-900 dark:text-cream-100 mb-6">
              Top Albums
            </h2>
            <div className="grid grid-cols-5 gap-1">
              {(contributor.albums ?? []).map((album) => (
                <a
                  key={album.rank}
                  href={`https://music.apple.com/search?term=${encodeURIComponent(`${album.title} ${album.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square bg-charcoal-900 dark:bg-gray-950 overflow-hidden block"
                  title={`${album.title} — ${album.artist}`}
                >
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-charcoal-600 dark:text-cream-500/30" />
                    </div>
                  )}
                  {/* Hover overlay — three-level editorial hierarchy */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                    <p className="font-body text-[13px] font-semibold text-white leading-tight line-clamp-2">
                      {album.title}
                    </p>
                    <p className="font-accent text-[10px] tracking-wide text-white/60 mt-0.5 truncate uppercase">
                      {album.artist}{album.year ? ` · ${album.year}` : ''}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Playlist Section */}
        {hasPlaylist && (
          <section className="mb-16">
            <h2 className="text-2xl font-display font-semibold text-charcoal-900 dark:text-cream-100 mb-6">
              Recommended Listening
            </h2>
            <div className="max-w-2xl">
              <PlaylistEmbed
                url={contributor.recommendedPlaylistUrl!}
                platform={contributor.recommendedPlaylistPlatform}
              />
            </div>
          </section>
        )}

        {/* Content sections */}
        {contributor.submissions.total === 0 ? (
          <div className="text-center py-16 border border-dashed border-cream-400 dark:border-gray-700 rounded-lg bg-cream-50 dark:bg-gray-900">
            <User className="w-12 h-12 mx-auto text-charcoal-400 dark:text-cream-500 mb-4" />
            <p className="text-charcoal-600 dark:text-cream-400 font-body">
              No approved contributions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Editorial — split by content type, each gets its own paginated section */}
            {hasEditorial && (() => {
              const byType = contributor.submissions.editorial!.reduce<Record<string, typeof contributor.submissions.editorial>>((acc, piece) => {
                const key = piece.contentType || 'article';
                if (!acc[key]) acc[key] = [];
                acc[key]!.push(piece);
                return acc;
              }, {});

              return Object.entries(byType).map(([type, pieces]) => {
                const cfg = CONTENT_TYPE_CONFIG[type] ?? { label: type.replace(/_/g, ' '), Icon: FileText };
                const { label, Icon } = cfg;
                return (
                  <section key={type}>
                    <h2 className="flex items-center gap-3 text-2xl font-display font-semibold text-charcoal-900 dark:text-cream-100 mb-6">
                      <Icon className="w-6 h-6 text-burnt-orange-500" />
                      {label}
                    </h2>
                    <ContentGrid
                      items={pieces!}
                      pageSize={4}
                      columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      renderItem={(piece) => (
                        <Link
                          key={piece.id}
                          href={`/editorial/${piece.slug}`}
                          className="group relative block aspect-[3/4] bg-charcoal-900 dark:bg-gray-950 overflow-hidden"
                          data-testid={`card-editorial-${piece.id}`}
                        >
                          {piece.coverImageUrl ? (
                            <img
                              src={piece.coverImageUrl}
                              alt={piece.title}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                            />
                          ) : (
                            /* Typographic placeholder — title as cover */
                            <div className="w-full h-full flex flex-col justify-end p-4 bg-gradient-to-br from-charcoal-800 to-charcoal-900 dark:from-gray-800 dark:to-gray-950">
                              <p className="font-display text-base font-semibold text-white leading-snug line-clamp-4">
                                {piece.title}
                              </p>
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                            <p className="font-body text-[13px] font-semibold text-white leading-tight line-clamp-3">
                              {piece.title}
                            </p>
                            {piece.publishedAt && (
                              <p className="font-mono text-[10px] text-white/55 mt-1">
                                {new Date(piece.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}
                    />
                  </section>
                );
              });
            })()}

            {/* Mixes */}
            {contributor.submissions.mixes.length > 0 && (
              <section>
                <h2 className="flex items-center gap-3 text-2xl font-display font-semibold text-charcoal-900 dark:text-cream-100 mb-6">
                  <Music className="w-6 h-6 text-burnt-orange-500" />
                  Mixes
                </h2>
                <ContentGrid
                  items={contributor.submissions.mixes}
                  pageSize={8}
                  renderItem={(mix) => {
                    const artwork = getArtwork(mix);
                    return (
                      <Link
                        key={mix.id}
                        href={`/community/${mix.id}`}
                        className="group block"
                        data-testid={`card-mix-${mix.id}`}
                      >
                        <div className="aspect-square bg-charcoal-900 mb-3 overflow-hidden rounded-lg flex items-center justify-center">
                          {artwork ? (
                            <img
                              src={artwork}
                              alt={mix.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Music className="w-8 h-8 text-charcoal-600" />
                          )}
                        </div>
                        <h3 className="font-ui font-medium text-charcoal-900 dark:text-cream-100 truncate group-hover:text-burnt-orange-500 dark:group-hover:text-burnt-orange-400 transition-colors">
                          {mix.title}
                        </h3>
                        <p className="text-sm text-charcoal-500 dark:text-cream-400 font-mono">
                          {mix.genre}
                        </p>
                      </Link>
                    );
                  }}
                />
              </section>
            )}

            {/* Playlists */}
            {contributor.submissions.playlists.length > 0 && (
              <section>
                <h2 className="flex items-center gap-3 text-2xl font-display font-semibold text-charcoal-900 dark:text-cream-100 mb-6">
                  <ListMusic className="w-6 h-6 text-burnt-orange-500" />
                  Playlists
                </h2>
                <ContentGrid
                  items={contributor.submissions.playlists}
                  pageSize={8}
                  renderItem={(playlist) => {
                    const artwork = getArtwork(playlist);
                    return (
                      <Link
                        key={playlist.id}
                        href={`/community/${playlist.id}`}
                        className="group block"
                        data-testid={`card-playlist-${playlist.id}`}
                      >
                        <div className="aspect-square bg-charcoal-900 mb-3 overflow-hidden rounded-lg flex items-center justify-center">
                          {artwork ? (
                            <img
                              src={artwork}
                              alt={playlist.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ListMusic className="w-8 h-8 text-charcoal-600" />
                          )}
                        </div>
                        <h3 className="font-ui font-medium text-charcoal-900 dark:text-cream-100 truncate group-hover:text-burnt-orange-500 dark:group-hover:text-burnt-orange-400 transition-colors">
                          {playlist.title}
                        </h3>
                        <p className="text-sm text-charcoal-500 dark:text-cream-400 font-mono">
                          Playlist
                        </p>
                      </Link>
                    );
                  }}
                />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
