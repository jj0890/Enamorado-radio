/**
 * Playlist Validation Service
 *
 * Validates playlist URLs for Spotify, YouTube, and SoundCloud.
 * Layered on top of the existing oembed-resolver.ts (title/thumbnail/embed URL)
 * with Spotify REST API supplementation for track counts.
 *
 * Spotify credentials are expected in env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 * YouTube track counts require YOUTUBE_API_KEY; gracefully degrades without it.
 */

import { resolveOEmbed } from '../lib/oembed-resolver';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlaylistPlatform = 'spotify' | 'youtube' | 'soundcloud';

export interface PlaylistMetadata {
  title: string;
  trackCount: number | null; // null = could not determine
  thumbnail?: string;
  author?: string;
  embedUrl?: string;
  externalUrl: string;
}

export interface ValidationResult {
  isValid: boolean;
  platform?: PlaylistPlatform;
  externalId?: string;
  metadata?: PlaylistMetadata;
  error?: string;
}

// ── ID extraction ─────────────────────────────────────────────────────────────

const PATTERNS: Record<PlaylistPlatform, RegExp> = {
  spotify: /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
  youtube: /(?:youtube\.com\/playlist\?(?:.*&)?list=|youtu\.be\/.*[?&]list=)([a-zA-Z0-9_-]+)/,
  soundcloud: /soundcloud\.com\/([^/?#]+)\/sets\/([^/?#]+)/,
};

export function detectPlaylistPlatform(url: string): PlaylistPlatform | null {
  if (!url) return null;
  for (const [platform, pattern] of Object.entries(PATTERNS) as [PlaylistPlatform, RegExp][]) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

export function extractPlaylistId(url: string, platform: PlaylistPlatform): string | null {
  const match = url.match(PATTERNS[platform]);
  if (!match) return null;
  // SoundCloud: combine user + slug → "user/sets/slug"
  if (platform === 'soundcloud') return `${match[1]}/sets/${match[2]}`;
  return match[1];
}

// ── Spotify token cache ───────────────────────────────────────────────────────

let _spotifyToken: { value: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (_spotifyToken && _spotifyToken.expiresAt > Date.now() + 30_000) {
    return _spotifyToken.value;
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.error('[PlaylistValidator] Spotify token fetch failed:', res.status);
    return null;
  }

  const data = await res.json();
  _spotifyToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return _spotifyToken.value;
}

// ── Platform-specific metadata fetchers ──────────────────────────────────────

async function fetchSpotifyMetadata(
  playlistId: string,
  externalUrl: string
): Promise<PlaylistMetadata> {
  // Always get title/thumbnail/embedUrl via oEmbed (no credentials needed)
  const oembed = await resolveOEmbed(externalUrl);

  // Supplement with track count from REST API if we have credentials
  let trackCount: number | null = null;
  const token = await getSpotifyToken();
  if (token) {
    try {
      const apiRes = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}?fields=tracks.total,name,owner.display_name`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        trackCount = apiData.tracks?.total ?? null;
      }
    } catch (err) {
      console.warn('[PlaylistValidator] Spotify REST API error, using oEmbed only:', err);
    }
  }

  return {
    title: oembed.title ?? 'Spotify Playlist',
    trackCount,
    thumbnail: oembed.thumbnail,
    author: oembed.authorName,
    embedUrl: oembed.embedUrl,
    externalUrl,
  };
}

async function fetchYouTubeMetadata(
  playlistId: string,
  externalUrl: string
): Promise<PlaylistMetadata> {
  // oEmbed gives title + thumbnail for YouTube playlists (no API key needed)
  const oembed = await resolveOEmbed(externalUrl);

  // Supplement with track count via YouTube Data API v3 if key available
  let trackCount: number | null = null;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const apiRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails,snippet&id=${playlistId}&key=${apiKey}`
      );
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const item = apiData.items?.[0];
        if (!item) throw new Error('Playlist not found or private');
        trackCount = item.contentDetails?.itemCount ?? null;
      }
    } catch (err) {
      console.warn('[PlaylistValidator] YouTube API error, using oEmbed only:', err);
    }
  }

  const embedUrl =
    oembed.embedUrl ?? `https://www.youtube.com/embed/videoseries?list=${playlistId}`;

  return {
    title: oembed.title ?? 'YouTube Playlist',
    trackCount,
    thumbnail: oembed.thumbnail,
    author: oembed.authorName,
    embedUrl,
    externalUrl,
  };
}

async function fetchSoundCloudMetadata(
  _setId: string,
  externalUrl: string
): Promise<PlaylistMetadata> {
  // SoundCloud oEmbed returns title, author, thumbnail, embed HTML — no API key needed
  const oembed = await resolveOEmbed(externalUrl);

  return {
    title: oembed.title ?? 'SoundCloud Set',
    trackCount: null, // oEmbed doesn't expose track count; would need SoundCloud API app
    thumbnail: oembed.thumbnail,
    author: oembed.authorName,
    embedUrl: oembed.embedUrl,
    externalUrl,
  };
}

// ── Result cache (24 h in-process) ───────────────────────────────────────────

const _cache = new Map<string, { result: ValidationResult; expiresAt: number }>();

// ── Main entry point ──────────────────────────────────────────────────────────

export async function validatePlaylist(url: string): Promise<ValidationResult> {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const normalised = url.trim();

  // Cache hit
  const cached = _cache.get(normalised);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const platform = detectPlaylistPlatform(normalised);
  if (!platform) {
    return {
      isValid: false,
      error: 'URL does not match a supported playlist format (Spotify, YouTube, SoundCloud)',
    };
  }

  const externalId = extractPlaylistId(normalised, platform);
  if (!externalId) {
    return { isValid: false, error: `Could not extract ${platform} playlist ID from URL` };
  }

  try {
    let metadata: PlaylistMetadata;
    switch (platform) {
      case 'spotify':
        metadata = await fetchSpotifyMetadata(externalId, normalised);
        break;
      case 'youtube':
        metadata = await fetchYouTubeMetadata(externalId, normalised);
        break;
      case 'soundcloud':
        metadata = await fetchSoundCloudMetadata(externalId, normalised);
        break;
    }

    const result: ValidationResult = { isValid: true, platform, externalId, metadata };
    _cache.set(normalised, { result, expiresAt: Date.now() + 86_400_000 }); // 24 h
    return result;
  } catch (err: any) {
    const result: ValidationResult = {
      isValid: false,
      platform,
      externalId,
      error: err.message ?? 'Validation failed',
    };
    // Cache failures for 5 min to avoid hammering APIs on bad URLs
    _cache.set(normalised, { result, expiresAt: Date.now() + 300_000 });
    return result;
  }
}
