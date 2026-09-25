/**
 * Top-level re-export so magazine-entry.tsx can import from "@/components/youtube-embed"
 * The canonical implementation lives at @/components/magazine/youtube-embed.tsx
 */
export { default, VideoEssayEmbed } from "@/components/magazine/youtube-embed";
export { isValidYouTubeUrl } from "@/lib/youtube-utils";
