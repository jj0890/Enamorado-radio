// client/src/pages/entry.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Clock, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { isValidYouTubeUrl } from "@/components/youtube-embed";

// Layout Components
import ArticleLayout from "@/components/layouts/ArticleLayout";
import GalleryLayout from "@/components/layouts/GalleryLayout";
import MediaLayout from "@/components/layouts/MediaLayout";

type OEmbedMeta = {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  embedHtml: string | null;
  description: string | null;
};

type Links = {
  spotify?: string;
  appleMusic?: string;
  soundcloud?: string;
  youtube?: string;
};

interface FeaturedEmbed {
  type: string; // 'soundcloud' | 'spotify' | 'bandcamp' | 'youtube' | 'other'
  url: string;
  title?: string;
  artist?: string;
  artwork?: string;
}

interface RelatedMediaItem {
  type: 'mix' | 'episode' | 'album';
  id: number;
  title: string;
  coverImage?: string;
}

interface Content {
  // NOTE: make id a string so it works for both editorial (uuid) and community (timestamp-rand)
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  authors: string[];
  coAuthors?: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  status: string;
  contentType: string; // 'essay' | 'interview' | 'video_essay' | 'music' | 'community'
  publishedAt?: string;
  featuredRank?: number;
  isHero: boolean;
  issueId?: number;
  createdAt: string;
  tags?: string[];
  intervieweeRole?: string;

  // Editorial-specific rich fields
  featuredEmbed?: FeaturedEmbed;
  relatedMedia?: RelatedMediaItem[];
  imageCaptions?: Record<string, { caption: string; altText: string }>;
  credits?: Record<string, string>;

  // SEO overrides from admin
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  // Extended fields when coming from Community
  isFromCommunity?: boolean;
  kind?: "art" | "playlist" | "writing" | "link";
  authorName?: string;
  submitterHandle?: string;
  authorHandle?: string;
  externalUrl?: string | null;
  links?: Links;                 // 🔹 keep raw platform links
  files?: { url: string; type: string; name?: string }[];
  originalExcerpt?: string;
  fullText?: string;
  originalAuthor?: string;
  originalDate?: string;
  likes?: number;
}

interface Issue {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  publishedAt?: string;
}

function firstLink(links?: Links | null): string | null {
  if (!links) return null;
  return (
    links.spotify?.trim() ||
    links.appleMusic?.trim() ||
    links.soundcloud?.trim() ||
    links.youtube?.trim() ||
    null
  );
}

export default function EntryPage() {
  const params = useParams();
  const slug = params?.slug;

  // Extract referrer from query params to determine back button destination
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from'); // 'editorials' or 'community'

  // Detect editorial project IDs (ep-123 format)
  const epMatch = slug?.match(/^ep-(\d+)$/);
  const isEpId = !!epMatch;
  const epId = epMatch?.[1];

  // Fetch editorial project by ID when slug is ep-123 format
  const { data: epContent, isLoading: isLoadingEp, error: epError } = useQuery<Content>({
    queryKey: [`/api/editorial/projects/${epId}`],
    enabled: isEpId && !!epId,
    queryFn: async () => {
      const r = await fetch(`/api/editorial/projects/${epId}`);
      if (!r.ok) throw new Error('Editorial project not found');
      const p = await r.json();
      const isYtEmbed = p.featuredEmbed?.type === 'youtube' && p.featuredEmbed?.url;
      const isYtExternal = p.externalUrl && isValidYouTubeUrl(p.externalUrl);
      return {
        id: `ep-${p.id}`,
        title: p.title,
        slug: p.slug || `ep-${p.id}`,
        excerpt: p.description,
        body: p.content,
        authors: [p.author || p.interviewee].filter(Boolean) as string[],
        coAuthors: p.coAuthors || [],
        intervieweeRole: p.intervieweeRole,
        coverImageUrl: p.coverImage,
        files: (p.images || []).map((url: string) => ({
          url,
          type: 'image/jpeg',
          name: p.imageCaptions?.[url]?.altText || undefined,
        })),
        imageCaptions: p.imageCaptions,
        credits: p.credits,
        videoUrl: isYtEmbed ? p.featuredEmbed!.url : (isYtExternal ? p.externalUrl : undefined),
        featuredEmbed: !isYtEmbed && p.featuredEmbed?.url ? p.featuredEmbed : undefined,
        relatedMedia: p.relatedMedia || [],
        tags: p.tags || [],
        status: p.status,
        contentType: p.type || 'editorial',
        publishedAt: p.publishedAt,
        isHero: p.status === 'featured',
        createdAt: p.createdAt,
        externalUrl: p.externalUrl,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        ogImage: p.ogImage,
      } as Content;
    },
  });

  // Slug-based lookup: tries magazine content, then falls through to community
  const { data: editorialContent, isLoading: isLoadingEditorial, error: editorialError } = useQuery<Content>({
    queryKey: [`/api/content/slug/${slug}`],
    enabled: !!slug && !isEpId,
  });

  const { data: communityContent, isLoading: isLoadingCommunity } = useQuery<Content>({
    queryKey: [`/api/community/${slug}`],
    enabled: !!slug && !isEpId && !!editorialError && !isLoadingEditorial,
    queryFn: async () => {
      const response = await fetch(`/api/community/${slug}`);
      if (!response.ok) throw new Error('Community item not found');
      const data = await response.json();
      return {
        ...data,
        contentType: 'community',
        isFromCommunity: true,
        authors: [data.authorName || data.name || 'Anonymous'],
        excerpt: data.description || data.about,
        body: data.description || data.about,
        slug: String(data.id),
        status: 'published',
        isHero: false,
        createdAt: data.submittedAt || data.createdAt,
      } as Content;
    },
  });

  const finalContent = epContent || editorialContent || communityContent;
  const isLoading = isLoadingEp || isLoadingEditorial || isLoadingCommunity;
  const error = finalContent ? null : (epError || editorialError);

  // Transform gallery array to files format for GalleryLayout (must be before early returns)
  const contentWithFiles = useMemo(() => {
    if (!finalContent) return finalContent;
    if ((finalContent as any).gallery && !finalContent.files) {
      return {
        ...finalContent,
        files: (finalContent as any).gallery.map((item: { src: string; alt: string }) => ({
          url: item.src,
          type: 'image/jpeg',
          name: item.alt
        }))
      };
    }
    return finalContent;
  }, [finalContent]);

  const { data: issue } = useQuery({
    queryKey: ["/api/issues", finalContent?.issueId],
    queryFn: async () => {
      if (!finalContent?.issueId) return null;
      const r = await fetch(`/api/issues/${finalContent.issueId}`);
      if (!r.ok) return null;
      return (await r.json()) as Issue;
    },
    enabled: !!finalContent?.issueId,
  });

  // oEmbed for externalUrl (Spotify/SoundCloud/YouTube/Apple/Substack/etc.)
  const [oembed, setOembed] = useState<OEmbedMeta | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!finalContent) return;
      const url = finalContent.externalUrl || firstLink((finalContent as Content).links);
      if (!url) {
        setOembed(null);
        return;
      }
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const meta: OEmbedMeta = await res.json();
        if (active) setOembed(meta);
      } catch {
        if (active) setOembed(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [finalContent?.externalUrl, (finalContent as Content | undefined)?.links]);

  // SEO — full OG + Twitter card + Schema.org Article
  useEffect(() => {
    if (!finalContent) return;
    const c = finalContent as Content;
    const headline = c.metaTitle || c.title;
    const desc = c.metaDescription || c.excerpt || `${c.title} — Enamorado`;
    const img = c.ogImage || c.coverImageUrl;

    document.title = `${headline} | Enamorado`;

    function setMeta(key: string, value: string, isName = false) {
      const attr = isName ? 'name' : 'property';
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    }

    // Canonical URL
    const canonicalHref = window.location.origin + window.location.pathname;
    let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalHref);

    setMeta('description', desc, true);
    setMeta('og:type', 'article');
    setMeta('og:title', headline);
    setMeta('og:description', desc);
    setMeta('og:url', canonicalHref);
    if (img) setMeta('og:image', img);
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', headline, true);
    setMeta('twitter:description', desc, true);
    if (img) setMeta('twitter:image', img, true);

    // Schema.org Article structured data
    const schemaId = '__article_schema__';
    let schemaEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!schemaEl) {
      schemaEl = document.createElement('script');
      schemaEl.id = schemaId;
      schemaEl.type = 'application/ld+json';
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: c.title,
      description: desc,
      datePublished: c.publishedAt || c.createdAt,
      author: c.authors.map(a => ({ '@type': 'Person', name: a })),
      ...(img && { image: img }),
      publisher: {
        '@type': 'Organization',
        name: 'Enamorado',
        url: window.location.origin,
      },
    });

    return () => {
      document.title = 'Enamorado | Independent Culture';
      document.getElementById(schemaId)?.remove();
      document.head.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [finalContent]);

  const handleShare = async () => {
    if (!finalContent) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: finalContent.title,
          text: finalContent.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
      }
    } catch {
      await navigator.clipboard?.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const estimateReadingTime = (text: string) => {
    const words = (text || "").split(/\s+/).filter(Boolean).length;
    return Math.ceil(words / 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--cream)]">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !finalContent) {
    return (
      <div className="min-h-screen bg-[var(--cream)]">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-4">Content Not Found</h1>
            <p className="text-[var(--charcoal)]/70 mb-8">
              The content you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isVideoEssay =
    finalContent.contentType === "video_essay" && finalContent.videoUrl && isValidYouTubeUrl(finalContent.videoUrl);

  const isCommunity = !!(finalContent as Content).isFromCommunity;
  const communityKind = (finalContent as Content).kind;

  // Determine origin channel for back button - prioritize fromPage query param over content source
  const originChannel: 'editorial' | 'community' = fromPage === 'editorials' ? 'editorial'
                      : fromPage === 'community' ? 'community'
                      : isCommunity ? 'community'
                      : 'editorial';

  // Layout Selection Logic
  const getLayoutType = (c: Content): 'article' | 'gallery' | 'episode' => {
    if (isCommunity) {
      switch (communityKind) {
        case 'art': return 'gallery';
        case 'playlist': return 'episode';
        default: return 'article';
      }
    } else {
      switch (c.contentType) {
        case 'photoshoot': return 'gallery';
        case 'music': return 'episode';
        case 'video_essay':
        case 'essay':
        case 'interview':
        default: return 'article';
      }
    }
  };

  const layoutType = getLayoutType(finalContent);

  // Common props for all layouts
  const commonProps = {
    content: { ...(contentWithFiles || finalContent), originChannel },
    onShare: handleShare,
    formatDate,
    estimateReadingTime,
  };

  // Render appropriate layout
  if (layoutType === 'gallery') {
    return (
      <GalleryLayout
        {...commonProps}
        oembed={oembed}
        labelForPlatform={labelForPlatform}
      />
    );
  }

  if (layoutType === 'episode') {
    return (
      <MediaLayout
        {...commonProps}
        oembed={oembed}
        labelForPlatform={labelForPlatform}
      />
    );
  }

  return (
    <ArticleLayout
      {...commonProps}
      videoContent={isVideoEssay ? {
        videoUrl: finalContent.videoUrl!,
        title: finalContent.title,
        description: finalContent.excerpt
      } : undefined}
      oembed={oembed}
      labelForPlatform={labelForPlatform}
    />
  );
}

function labelForPlatform(platform?: string | null, kind?: string) {
  if (!platform && kind === "playlist") return "Open playlist";
  if (!platform) return "Open";
  if (platform === "spotify") return "Listen on Spotify";
  if (platform === "soundcloud") return "Listen on SoundCloud";
  if (platform === "youtube") return "Watch on YouTube";
  if (platform === "apple-music") return "Open in Apple Music";
  if (platform === "substack") return "Read on Substack";
  return "Open";
}