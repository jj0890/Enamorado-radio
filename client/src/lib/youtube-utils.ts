// YouTube utility functions for validation and URL handling
import { z } from "zod";

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const patterns = [
    /(?:youtube\.com\/(?:[^/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return extractYouTubeId(url) !== null;
}

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

export function generateEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    privacyEnhanced?: boolean;
    startTime?: number;
    modestBranding?: boolean;
    showRelated?: boolean;
  } = {}
): string {
  const {
    autoplay = false,
    privacyEnhanced = true,
    startTime,
    modestBranding = true,
    showRelated = false,
  } = options;
  const domain = privacyEnhanced ? 'youtube-nocookie.com' : 'youtube.com';
  const params = new URLSearchParams({
    modestbranding: modestBranding ? '1' : '0',
    rel: showRelated ? '1' : '0',
    showinfo: '0',
    iv_load_policy: '3',
    ...(autoplay ? { autoplay: '1' } : {}),
    ...(startTime ? { start: startTime.toString() } : {}),
  });
  return `https://www.${domain}/embed/${videoId}?${params.toString()}`;
}

export interface YouTubeVideoInfo {
  id: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  title?: string;
  author?: string;
}

export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return {
    id: videoId,
    url,
    embedUrl: generateEmbedUrl(videoId),
    thumbnailUrl: getYouTubeThumbnail(videoId, 'high'),
  };
}

export function formatVideoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const youtubeUrlSchema = z
  .string()
  .min(1, "YouTube URL is required")
  .refine(isValidYouTubeUrl, {
    message:
      "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)",
  });

export const videoUrlSchema = z
  .string()
  .optional()
  .refine((url) => !url || isValidYouTubeUrl(url), {
    message: "Please enter a valid YouTube URL",
  });
