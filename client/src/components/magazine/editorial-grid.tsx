// client/src/components/editorial-grid.tsx
import React, { useEffect, useState } from "react";
import { fetchOEmbed } from "@/lib/oembed";
import PDFThumb from "@/components/PDFThumb";
import { isValidYouTubeUrl, getYouTubeThumbnail, extractYouTubeId } from "@/lib/youtube-utils";
import { Video, Play, FileText, Image as ImageIcon, Link2 } from "lucide-react";
import { getPlatformIcon } from "@/components/content-type-detector";
import { Badge } from "@/components/ui/badge";
import { getContributorUrl, formatContributorDisplay } from "@/lib/contributor-helpers";

// Helper functions
function detectPlatform(url: string): string | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('music.apple.com')) return 'apple-music';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('substack.com')) return 'substack';
  if (url.includes('docs.google.com')) return 'google-docs';
  return null;
}

function getKindIcon(kind: string) {
  switch (kind) {
    case 'video_essay':
      return <Video className="w-8 h-8 text-red-400" />;
    case 'art':
      return <ImageIcon className="w-8 h-8 text-orange-400" />;
    case 'writing':
      return <FileText className="w-8 h-8 text-blue-400" />;
    case 'link':
      return <Link2 className="w-8 h-8 text-green-400" />;
    default:
      return <FileText className="w-8 h-8 text-gray-400" />;
  }
}

// Map contentType to display category for filtering
function mapContentTypeToCategory(contentType: string | undefined, kind: string): string {
  // If kind is already set, use it
  if (kind === 'art' || kind === 'playlist' || kind === 'writing' || kind === 'video_essay' || kind === 'link') {
    return kind;
  }
  
  // Map contentType to category
  switch (contentType) {
    case 'essay':
    case 'interview':
      return 'writing';
    case 'video_essay':
      return 'writing'; // Video essays are also under writing
    case 'photoshoot':
    case 'artPdf':
      return 'art';
    case 'playlist':
      return 'playlist';
    case 'link':
      return 'link';
    default:
      return kind || 'writing';
  }
}

type EditorialRow = {
  id: string;
  kind: "art" | "playlist" | "writing" | "link" | "video_essay";
  title: string;
  description?: string;
  authorName?: string;
  authorHandle?: string;
  submittedAt?: string;
  thumbnail?: string | null;
  files?: { url: string; type: string }[];
  sources?: { substackUrl?: string; videoUrl?: string };
  likes?: number;
  editorial?: { promoted: boolean; slug?: string };
  contentType?: string;
  videoUrl?: string;
};

interface EditorialGridProps {
  selectedCategory?: string;
  searchTerm?: string;
}

export default function EditorialGrid({ selectedCategory = 'all', searchTerm = '' }: EditorialGridProps) {
  const [rows, setRows] = useState<EditorialRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch both published editorial content AND promoted community submissions
      const [publishedRes, promotedRes] = await Promise.all([
        fetch("/api/published-content"),
        fetch("/api/editorial-promoted")
      ]);
      
      const published: EditorialRow[] = publishedRes.ok ? await publishedRes.json() : [];
      const promoted: EditorialRow[] = promotedRes.ok ? await promotedRes.json() : [];
      
      // Deduplicate by id (in case content appears in both sources)
      const seenIds = new Set();
      const deduplicated = [...published, ...promoted].filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });
      
      const j: EditorialRow[] = deduplicated;
      
      // Lazily fill thumbnails for external links and YouTube videos  
      const withThumbs = await Promise.all(j.map(async (it) => {
        // Handle Substack thumbnails
        if (!it.thumbnail && it.sources?.substackUrl) {
          const m = await fetchOEmbed(it.sources.substackUrl);
          if (m?.thumbnail) it.thumbnail = m.thumbnail;
        }
        
        // Handle YouTube video thumbnails for video essays
        if (!it.thumbnail && (it.videoUrl || it.sources?.videoUrl)) {
          const videoUrl = it.videoUrl || it.sources?.videoUrl;
          if (videoUrl && isValidYouTubeUrl(videoUrl)) {
            const videoId = extractYouTubeId(videoUrl);
            if (videoId) {
              it.thumbnail = getYouTubeThumbnail(videoId, 'high');
              // Mark as video essay if not already set
              if (!it.kind || it.kind === 'writing') {
                it.kind = 'video_essay';
              }
            }
          }
        }
        
        // Handle art submissions with files (PDF/images) 
        if (!it.thumbnail && it.files && it.files.length > 0) {
          const firstFile = it.files[0];
          // For images, use the file URL directly as thumbnail
          if (firstFile.type && firstFile.type.startsWith('image/')) {
            it.thumbnail = firstFile.url;
          }
          // For PDFs, we'll handle them in the render component with PDFThumb
        }
        
        // Handle photoshoots with gallery array
        if (!it.thumbnail && (it as any).gallery && (it as any).gallery.length > 0) {
          it.thumbnail = (it as any).gallery[0].src;
        }
        
        // Fallback: use coverImageUrl as thumbnail
        if (!it.thumbnail && (it as any).coverImageUrl) {
          it.thumbnail = (it as any).coverImageUrl;
        }
        
        return it;
      }));
      
      setRows(withThumbs);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[var(--cream)] border border-[var(--light-grey)] rounded-lg p-6 animate-pulse">
            <div className="h-32 bg-[var(--cream)] border border-[var(--light-grey)] rounded mb-4"></div>
            <div className="h-4 bg-[var(--cream)] border border-[var(--light-grey)] rounded mb-2"></div>
            <div className="h-4 bg-[var(--cream)] border border-[var(--light-grey)] rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Filter rows based on category and search
  const filteredRows = rows.filter(row => {
    const category = mapContentTypeToCategory(row.contentType, row.kind);
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    const matchesSearch = !searchTerm || 
      row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.description && row.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="grid" style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: 24
    }}>
      {filteredRows.map(r => <EditorialCard key={r.id} row={r} />)}
    </section>
  );
}

function EditorialCard({ row }: { row: EditorialRow }) {
  const href = `/entry/${row.id}?from=editorials`;
  const hasFiles = row.files && row.files.length > 0;
  const isPdf = hasFiles && row.files![0].type.includes("pdf");
  const isImage = hasFiles && row.files![0].type.startsWith("image/");
  const hasSubstack = row.sources?.substackUrl;
  const isVideoEssay = row.kind === 'video_essay' || row.contentType === 'video_essay';
  const hasYouTubeVideo = (row.videoUrl || row.sources?.videoUrl) && isValidYouTubeUrl(row.videoUrl || row.sources?.videoUrl || '');
  
  // Detect platform from external URLs for provider badge
  const platform = (row.sources?.substackUrl && detectPlatform(row.sources.substackUrl)) ||
                  (row.videoUrl && detectPlatform(row.videoUrl)) ||
                  (row.sources?.videoUrl && detectPlatform(row.sources.videoUrl)) ||
                  null;
  const kindIcon = getKindIcon(row.kind || 'writing');

  return (
    <a href={href}
       data-testid={`card-editorial-${row.id}`}
       className="article-card group block rounded-xl overflow-hidden bg-white no-underline text-inherit shadow-sm cursor-pointer"
       style={{ textDecoration: "none", color: "inherit" }}>
      <div className="article-card__image" style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: isVideoEssay && !row.thumbnail ? "linear-gradient(135deg,#ef4444,#991b1b)" : "var(--cream)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* PDF Thumbnail */}
        {isPdf && hasFiles && (
          <PDFThumb 
            url={row.files![0].url} 
            className="w-full h-full object-cover" 
            dpi={1.2} 
          />
        )}
        
        {/* Image */}
        {isImage && hasFiles && (
          <img 
            src={row.files![0].url} 
            alt="" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        )}
        
        {/* YouTube Video Thumbnail */}
        {hasYouTubeVideo && row.thumbnail && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img 
              src={row.thumbnail} 
              alt="" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
            {/* Video Play Overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                background: "rgba(239, 68, 68, 0.9)",
                borderRadius: "50%",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Play style={{ width: "24px", height: "24px", color: "white", marginLeft: "2px" }} fill="white" />
              </div>
            </div>
            {/* Video Essay Badge - Enhanced */}
            <div style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(8px)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              zIndex: 20
            }}>
              <Video style={{ width: "14px", height: "14px" }} />
              VIDEO ESSAY
            </div>
          </div>
        )}
        
        {/* External Content Thumbnail (Substack, etc.) - only if not a video essay */}
        {!isPdf && !isImage && !hasYouTubeVideo && row.thumbnail && (
          <img 
            src={row.thumbnail} 
            alt={row.title}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Fallback with Kind Icon */}
        {!isPdf && !isImage && !row.thumbnail && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            {kindIcon}
            <span className="text-sm font-medium mt-2 text-center px-4">
              {isVideoEssay ? "Video Essay" :
               row.kind === "writing" ? "Editorial" :
               row.kind === "art" ? "Visual Art" : "Content"}
            </span>
          </div>
        )}
        
        {/* Platform Badge - Only show if not a video essay (which already has its own badge) */}
        {platform && !hasYouTubeVideo && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-sm">
              <div className="flex items-center gap-1">
                {getPlatformIcon(platform)}
                <span className="text-xs font-medium">
                  {platform === 'substack' ? 'Substack' :
                   platform === 'youtube' ? 'YouTube' :
                   platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
              </div>
            </Badge>
          </div>
        )}
        
        {/* Read Article Overlay */}
        <div className="article-card__overlay">
          <span className="article-card__cta">
            {isVideoEssay ? 'Watch Video →' : 'Read Article →'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className={`card-title-serif leading-tight mb-1 line-clamp-2 transition-colors ${
          isVideoEssay ? 'text-gray-900 text-lg group-hover:text-[var(--editorial)]' : 'text-gray-900 text-lg group-hover:text-[var(--editorial)]'
        }`}>
          {row.title}
        </h3>
        {row.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
            {row.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`article-tag mb-1 ${isVideoEssay ? 'article-tag--featured' : 'article-tag--editorial'}`}>
              <span className="flex items-center gap-1">
                {isVideoEssay && <Video className="w-3 h-3" />}
                {isVideoEssay ? "VIDEO ESSAY" : "EDITORIAL"}
              </span>
            </span>
            {(row.authorName || row.authorHandle) && (
              row.authorHandle ? (
                <a
                  href={getContributorUrl(row.authorHandle)}
                  className="article-metadata text-xs hover:text-[var(--editorial)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  by {formatContributorDisplay(row.authorHandle)}
                </a>
              ) : (
                <span className="article-metadata text-xs">
                  By {row.authorName}
                </span>
              )
            )}
          </div>
          <div className="article-metadata text-xs">
            ♥ {row.likes || 0}
          </div>
        </div>
      </div>
    </a>
  );
}