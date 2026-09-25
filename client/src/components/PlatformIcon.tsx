/**
 * PlatformIcon — canonical branded SVG icons for every streaming platform.
 *
 * SVG paths sourced from Simple Icons (simpleicons.org), the same dataset
 * that react-icons/si uses. Inlined here for:
 *   • Zero runtime overhead (no icon-library JS to parse)
 *   • Consistent sizing / coloring API across all consumers
 *   • Single import point — no more scattered react-icons imports per file
 *
 * Usage:
 *   <PlatformIcon platform="spotify" size={20} />
 *   <PlatformIcon platform="soundcloud" size={16} branded />   // uses official brand colour
 *   <PlatformIcon platform="apple-music" className="w-5 h-5 text-white" />
 */

import { Music } from 'lucide-react';

export type Platform =
  | 'spotify'
  | 'soundcloud'
  | 'apple-music'
  | 'apple_music'
  | 'youtube'
  | 'mixcloud'
  | 'bandcamp'
  | 'tidal'
  | 'substack'
  | 'instagram'
  | 'x'
  | 'facebook'
  | 'unknown';

interface PlatformIconProps {
  platform: Platform | string;
  /** px size — applied to width & height. Default 20 */
  size?: number;
  /** Additional class names (e.g. Tailwind sizing / colour overrides) */
  className?: string;
  /** If true, fill uses the official brand colour instead of currentColor */
  branded?: boolean;
}

// ─── Brand colours (official hex from brand guidelines) ────────────────────
export const BRAND_COLORS: Record<string, string> = {
  spotify:      '#1DB954',
  soundcloud:   '#FF5500',
  'apple-music':'#FC3C44',
  apple_music:  '#FC3C44',
  youtube:      '#FF0000',
  mixcloud:     '#5000FF',
  bandcamp:     '#1DA0C3',
  tidal:        '#000000',
  substack:     '#FF6719',
  instagram:    '#E4405F',
  x:            '#000000',
  facebook:     '#1877F2',
};

// ─── SVG path data (viewBox 24 24 unless noted) ─────────────────────────────
// All paths from simpleicons.org — CC0 licensed

const PATHS: Record<string, { d: string; viewBox?: string }> = {
  spotify: {
    d: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  },
  soundcloud: {
    // SoundCloud waveform logo
    d: 'M11.56 8.87V17h8.76c.82-.01 1.68-.69 1.68-1.62 0-.83-.57-1.55-1.36-1.65v-.08c0-1.7-1.38-3.09-3.08-3.09-.36 0-.71.07-1.03.19A3.12 3.12 0 0 0 13.42 8.5c-.1 0-.2.01-.3.02a2.2 2.2 0 0 0-1.56.35zm-1.06.3c-.1-.02-.2-.02-.3-.02-.82 0-1.5.6-1.6 1.4l-.19 3.59.19 2.56c.1.8.78 1.4 1.6 1.4.82 0 1.5-.6 1.6-1.4l.21-2.56-.21-3.59c-.07-.55-.53-.98-1.1-1.01zm-3.4.8c-.77 0-1.4.63-1.4 1.4v4.74c0 .77.63 1.4 1.4 1.4.77 0 1.4-.63 1.4-1.4V11.37c0-.77-.63-1.4-1.4-1.4zm-2.9 1.54c-.65 0-1.18.53-1.18 1.18v2.48c0 .65.53 1.18 1.18 1.18.65 0 1.18-.53 1.18-1.18V12.69c0-.65-.53-1.18-1.18-1.18zm-2.67.98C.66 12.49 0 13.15 0 13.97v1.26C0 16.05.66 16.71 1.53 16.71c.87 0 1.53-.66 1.53-1.48v-1.26c0-.82-.66-1.48-1.53-1.48z',
    viewBox: '0 0 24 17',
  },
  'apple-music': {
    d: 'M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a5.495 5.495 0 0 0-.37 1.548c-.05.34-.06.684-.079 1.026-.007.14-.013.28-.013.42v9.576c0 .14.006.28.013.42.019.342.029.686.079 1.026a5.494 5.494 0 0 0 .37 1.548c.565 1.328 1.53 2.25 2.865 2.78.703.278 1.446.358 2.191.404.152.009.303.016.455.026h12.029c.14 0 .281-.006.421-.013.341-.019.684-.029 1.025-.079.362-.055.712-.146 1.049-.294.99-.44 1.724-1.163 2.179-2.17.256-.56.364-1.155.41-1.76.037-.485.048-.97.062-1.456v-9.58c-.015-.487-.025-.972-.062-1.457zM12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm6.5-10.25a1.25 1.25 0 0 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm-6.5 1.25a5 5 0 1 0 0 10A5 5 0 0 0 12 9zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  },
  apple_music: {
    d: 'M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a5.495 5.495 0 0 0-.37 1.548c-.05.34-.06.684-.079 1.026-.007.14-.013.28-.013.42v9.576c0 .14.006.28.013.42.019.342.029.686.079 1.026a5.494 5.494 0 0 0 .37 1.548c.565 1.328 1.53 2.25 2.865 2.78.703.278 1.446.358 2.191.404.152.009.303.016.455.026h12.029c.14 0 .281-.006.421-.013.341-.019.684-.029 1.025-.079.362-.055.712-.146 1.049-.294.99-.44 1.724-1.163 2.179-2.17.256-.56.364-1.155.41-1.76.037-.485.048-.97.062-1.456v-9.58c-.015-.487-.025-.972-.062-1.457zM12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm6.5-10.25a1.25 1.25 0 0 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm-6.5 1.25a5 5 0 1 0 0 10A5 5 0 0 0 12 9zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  },
  youtube: {
    d: 'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  },
  mixcloud: {
    d: 'M18.75 12c-.37 0-.713.104-1.006.28A4.5 4.5 0 0 0 13.5 9.75a4.492 4.492 0 0 0-3.544 1.724A2.25 2.25 0 0 0 8.25 15H18.75a1.5 1.5 0 0 0 0-3zM7.5 12.75a.75.75 0 0 1 0-1.5h.188a5.987 5.987 0 0 1 5.812-4.5 5.988 5.988 0 0 1 5.54 3.75H19.5a3 3 0 1 1 0 6H8.25a3.75 3.75 0 0 1-.75-7.426V9zm-1.5 3a.75.75 0 0 1 0-1.5H6a.75.75 0 0 1 0 1.5H6zm-3-1.5a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5H3z',
  },
  bandcamp: {
    d: 'M0 18.75l7.437-13.5H24l-7.438 13.5z',
  },
  tidal: {
    d: 'M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 16.004l4.004-4.004 4.004 4.004L20.016 12l-4.004-4.004-4.004 4.004-4.004-4.004L3.996 12z',
  },
  substack: {
    d: 'M22.539 8.242H1.46V6.816h21.08v1.426zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v1.426h21.08V0z',
  },
  instagram: {
    d: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.059 1.277.261 2.148.558 2.913a5.885 5.885 0 0 0 1.384 2.126A5.868 5.868 0 0 0 4.14 23.37c.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.059 2.148-.261 2.913-.558a5.898 5.898 0 0 0 2.126-1.384 5.86 5.86 0 0 0 1.384-2.126c.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947 0-3.259-.014-3.667-.072-4.947-.059-1.277-.262-2.149-.558-2.913a5.89 5.89 0 0 0-1.384-2.126A5.847 5.847 0 0 0 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 0 1-.899 1.382 3.744 3.744 0 0 1-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 0 1-1.379-.899 3.644 3.644 0 0 1-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.88 0 1.441 1.441 0 0 1 2.88 0z',
  },
  x: {
    d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  facebook: {
    d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PlatformIcon({ platform, size = 20, className = '', branded = false }: PlatformIconProps) {
  const key = platform?.toLowerCase().replace(/ /g, '-') as Platform;
  const entry = PATHS[key];
  const brandColor = branded ? (BRAND_COLORS[key] ?? 'currentColor') : 'currentColor';

  if (!entry) {
    // Unknown platform — fallback to generic music note
    return <Music style={{ width: size, height: size }} className={className} />;
  }

  const vb = entry.viewBox ?? '0 0 24 24';

  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      fill={brandColor}
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      <path d={entry.d} />
    </svg>
  );
}

// ─── Helper: detect platform from URL ────────────────────────────────────────

export function platformFromUrl(url?: string): Platform {
  if (!url) return 'unknown';
  const u = url.toLowerCase();
  if (u.includes('open.spotify.com') || u.includes('spotify.com')) return 'spotify';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('music.apple.com')) return 'apple-music';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('mixcloud.com')) return 'mixcloud';
  if (u.includes('bandcamp.com')) return 'bandcamp';
  if (u.includes('tidal.com')) return 'tidal';
  if (u.includes('substack.com')) return 'substack';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('x.com') || u.includes('twitter.com')) return 'x';
  return 'unknown';
}

// ─── Convenience: platform badge (icon + label) ───────────────────────────────

export function PlatformBadge({
  platform,
  size = 14,
  showLabel = true,
  branded = false,
  className = '',
}: {
  platform: Platform | string;
  size?: number;
  showLabel?: boolean;
  branded?: boolean;
  className?: string;
}) {
  const labels: Record<string, string> = {
    spotify: 'Spotify',
    soundcloud: 'SoundCloud',
    'apple-music': 'Apple Music',
    apple_music: 'Apple Music',
    youtube: 'YouTube',
    mixcloud: 'Mixcloud',
    bandcamp: 'Bandcamp',
    tidal: 'TIDAL',
    substack: 'Substack',
    instagram: 'Instagram',
    x: 'X',
    facebook: 'Facebook',
    unknown: '',
  };

  const label = labels[platform] ?? platform;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <PlatformIcon platform={platform} size={size} branded={branded} />
      {showLabel && label && (
        <span className="font-mono text-[10px] uppercase tracking-widest leading-none">
          {label}
        </span>
      )}
    </span>
  );
}

export default PlatformIcon;
