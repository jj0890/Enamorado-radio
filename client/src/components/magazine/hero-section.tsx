import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Crown, ExternalLink } from "lucide-react";
import { Content } from "@shared/schema";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { isPrelaunch, useAdminStatus } from "@/lib/config";
import { useHasEditorialContent, useHasArchiveContent } from "@/lib/content-checker";
import { useQuery } from "@tanstack/react-query";

type Issue = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  coverImageUrl?: string;
  description?: string;
  publishedAt?: string;
};

type FeatureWithContent = {
  feature: {
    id: number;
    entityType: "content" | "issue";
    entityId: string;
    featureType: "hero" | "main" | "secondary";
    position: number;
    isActive: boolean;
  };
  content?: Content;
  issue?: Issue;
};

export default function HeroSection() {
  // Use Feature Manager to get hero content
  const { data: featuresWithContent = [], isLoading } = useQuery<FeatureWithContent[]>({
    queryKey: ['/api/features-with-content'],
  });
  
  // Find the hero feature - can be content OR issue
  const heroFeature = featuresWithContent.find(f => f.feature.featureType === 'hero');
  const heroContent = heroFeature?.content ? [heroFeature.content] : [];
  const heroIssue = heroFeature?.issue;
  
  const { isAdmin } = useAdminStatus();
  
  // Fetch all published content as fallback
  const { data: allPublishedContent = [] } = useQuery<Content[]>({
    queryKey: ['/api/published-content'],
  });
  
  // Check content availability for pre-launch mode
  const hasEditorialContent = useHasEditorialContent();
  const hasArchiveContent = useHasArchiveContent();
  const siteInPrelaunch = isPrelaunch();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get the first hero content (should only be one at a time)
  const heroArticle = heroContent[0];
  
  // Use first published content as fallback for visuals
  const fallbackContent = allPublishedContent[0];

  // Extract YouTube thumbnail for video essays if no cover image
  const getEffectiveThumbnail = (article: Content) => {
    if (article?.coverImageUrl) return article.coverImageUrl;
    
    if (article?.contentType === 'video_essay' && article?.videoUrl) {
      const videoId = extractYouTubeId(article.videoUrl);
      if (videoId) {
        return getYouTubeThumbnail(videoId, 'high');
      }
    }
    
    // Check gallery for photoshoots
    if ((article as any)?.gallery?.length > 0) {
      return (article as any).gallery[0].src;
    }
    
    return null;
  };

  const effectiveThumbnail = heroArticle ? getEffectiveThumbnail(heroArticle) : null;
  const fallbackThumbnail = fallbackContent ? getEffectiveThumbnail(fallbackContent) : null;

  // Loading state
  if (isLoading) {
    return (
      <section id="featured" className="pt-20 pb-20 bg-background min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--editorial)]" data-testid="loading-hero"></div>
            <p className="text-muted-foreground mt-4">Loading featured content...</p>
          </div>
        </div>
      </section>
    );
  }

  // Render issue hero if an issue is set as hero
  if (heroIssue) {
    return (
      <section id="featured" className="pt-20 pb-20 bg-white min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:col-span-1 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-[var(--editorial)]"></div>
                  <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase" data-testid="hero-type">
                    Featured Issue
                  </p>
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold text-[var(--charcoal)] leading-[0.95] tracking-tight" data-testid={`hero-title-issue-${heroIssue.id}`}>
                  {heroIssue.title}
                </h1>
                <p className="text-2xl lg:text-3xl text-[var(--charcoal)]/70 font-light leading-relaxed max-w-xl" data-testid={`hero-description-issue-${heroIssue.id}`}>
                  {heroIssue.description || 'Explore this curated collection of stories, art, and voices.'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href={`/issues/${heroIssue.slug}`}>
                  <Button 
                    className="bg-[var(--editorial)] text-white hover:bg-[var(--editorial)]/90 transition-all duration-300 text-lg px-10 py-7 font-medium"
                    size="lg"
                    data-testid={`button-read-issue-${heroIssue.id}`}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Explore Issue
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative lg:col-span-1">
              <Link href={`/issues/${heroIssue.slug}`}>
                <div className="bg-[var(--cream)] h-[600px] rounded-2xl flex items-center justify-center transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden group">
                  {heroIssue.coverImageUrl ? (
                    <img 
                      src={heroIssue.coverImageUrl}
                      alt={heroIssue.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      data-testid={`hero-image-issue-${heroIssue.id}`}
                    />
                  ) : (
                    <div className="text-center px-8">
                      <div className="w-48 h-64 bg-[var(--charcoal)] rounded-lg shadow-2xl mb-6 mx-auto flex items-center justify-center transform rotate-3 transition-transform duration-300 group-hover:rotate-0">
                        <div className="text-center text-white">
                          <BookOpen className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">ISSUE</h3>
                          <p className="text-sm opacity-80">{heroIssue.title}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback hero when no content or issue is marked as hero
  if (!heroArticle) {
    return (
      <section id="featured" className="pt-20 pb-20 bg-white min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="lg:col-span-1 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-[var(--editorial)]"></div>
                  <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase">
                    Independent Culture Magazine
                  </p>
                </div>
                <h1 className="text-7xl lg:text-8xl font-bold text-[var(--charcoal)] leading-[0.95] tracking-tight">
                  Enamorado
                </h1>
                <p className="text-2xl lg:text-3xl text-[var(--charcoal)]/70 font-light leading-relaxed max-w-xl">
                  A carefully curated gallery celebrating diverse voices across art, fashion, photography, and culture.
                </p>
                {isAdmin && (
                  <div className="bg-orange-50 border-l-4 border-[var(--editorial)] p-4 rounded-r-lg">
                    <p className="text-sm text-neutral-700">
                      <strong>No featured story selected.</strong> To feature content here, go to <Link href="/admin/curation" className="text-[var(--editorial)] underline hover:text-[var(--editorial)]/80">Homepage Layout</Link> and mark a story as "Hero".
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Pre-launch CTAs: when no editorials, prioritize community and submit */}
                {siteInPrelaunch && !hasEditorialContent ? (
                  <>
                    <Button 
                      onClick={() => scrollToSection('community')}
                      className="bg-[var(--editorial)] text-white hover:bg-[var(--editorial)]/90 transition-all duration-300 text-lg px-10 py-7 font-medium"
                      size="lg"
                      data-testid="button-explore-community"
                    >
                      Explore Community
                    </Button>
                    <Link href="/submit">
                      <Button 
                        variant="outline"
                        className="border-2 border-[var(--charcoal)] text-[var(--charcoal)] hover:bg-[var(--charcoal)] hover:text-white transition-all duration-300 text-lg px-10 py-7 font-medium"
                        size="lg"
                        data-testid="button-submit-work"
                      >
                        Submit Your Work
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Standard CTAs when content exists */}
                    <Button 
                      onClick={() => scrollToSection('culture')}
                      className="bg-[var(--editorial)] text-white hover:bg-[var(--editorial)]/90 transition-all duration-300 text-lg px-10 py-7 font-medium"
                      size="lg"
                      data-testid="button-explore-stories"
                    >
                      Explore Stories
                    </Button>
                    {/* Only show archive button if archive has content */}
                    {(!siteInPrelaunch || hasArchiveContent) && (
                      <Button 
                        variant="outline"
                        className="border-2 border-[var(--charcoal)] text-[var(--charcoal)] hover:bg-[var(--charcoal)] hover:text-white transition-all duration-300 text-lg px-10 py-7 font-medium"
                        size="lg"
                        data-testid="button-browse-archive"
                      >
                        Browse Archive
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="relative lg:col-span-1">
              {/* Show real featured content image when available, fallback to About card */}
              {fallbackThumbnail && fallbackContent ? (
                <Link href={`/entry/${fallbackContent.slug}`}>
                  <div className="bg-[var(--cream)] h-[600px] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-3xl">
                    {/* Image area */}
                    <div className="flex-1 overflow-hidden">
                      <img 
                        src={fallbackThumbnail}
                        alt={fallbackContent.title || 'Featured content'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        data-testid="fallback-featured-image"
                      />
                    </div>
                    {/* Solid info bar at bottom - always readable */}
                    <div className="bg-[var(--charcoal)] p-6 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--editorial)]">
                          {fallbackContent.contentType?.replace('_', ' ') || 'Featured'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1 leading-tight" data-testid="fallback-content-title">
                        {fallbackContent.title}
                      </h3>
                      {fallbackContent.authors && fallbackContent.authors.length > 0 && (
                        <p className="text-sm text-white/70 mb-3">
                          by {fallbackContent.authors.join(', ')}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--editorial)] group-hover:underline transition-colors">
                        <span>Read Article</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : siteInPrelaunch ? (
                <div className="bg-[var(--cream)] h-[400px] lg:h-[500px] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--editorial)]/5 to-transparent"></div>
                  <div className="relative text-center px-8">
                    {/* Smaller, more refined magazine stack */}
                    <div className="mb-6 flex justify-center">
                      <div className="relative w-28 h-36">
                        {/* Back magazine - tilted right */}
                        <div className="absolute top-2 left-4 w-20 h-28 bg-[var(--charcoal)] rounded-md shadow-lg flex items-center justify-center transform rotate-6">
                          <div className="text-white text-center">
                            <BookOpen className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-[7px] font-bold tracking-wider">ISSUE 01</div>
                          </div>
                        </div>
                        {/* Front magazine - tilted left */}
                        <div className="absolute top-0 left-0 w-20 h-28 bg-[var(--editorial)] rounded-md shadow-xl flex items-center justify-center transform -rotate-6">
                          <div className="text-white text-center">
                            <BookOpen className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-[7px] font-bold tracking-wider">ENAMORADO</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[var(--charcoal)] text-base font-semibold mb-1">Building Our First Issue</p>
                    <p className="text-[var(--charcoal)]/60 text-xs max-w-[180px] mx-auto leading-relaxed">Curating stories, art, and voices from our community</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--cream)] h-[600px] rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="text-center px-8">
                    <a
                      href="https://issuu.com/marine-zine/docs/octopus_zine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-transform duration-300 hover:scale-105 cursor-pointer"
                      data-testid="octopus-zine-link"
                    >
                      <div className="w-48 h-64 bg-[var(--charcoal)] rounded-lg shadow-2xl mb-6 mx-auto flex items-center justify-center transform rotate-3 transition-transform duration-300 hover:rotate-0">
                        <div className="text-center text-white">
                          <h3 className="text-xl font-bold mb-2">OCTOPUS ZINE</h3>
                          <p className="text-xs opacity-80">MARINE ZINE</p>
                          <div className="mt-4 space-y-1">
                            <div className="w-16 h-0.5 bg-white/40 mx-auto"></div>
                            <div className="w-12 h-0.5 bg-white/40 mx-auto"></div>
                            <div className="w-20 h-0.5 bg-white/40 mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </a>
                    <p className="text-[var(--charcoal)] text-lg font-medium mb-2">Community Inspiration</p>
                    <p className="text-[var(--editorial)] text-sm">First Issue Coming Soon • Click to Preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Dynamic hero content display
  return (
    <section id="featured" className="pt-20 pb-20 bg-white min-h-[85vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="lg:col-span-1 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-[var(--editorial)]"></div>
                <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase" data-testid="hero-type">
                  Featured {( heroArticle.contentType ?? "" ).replace('_', ' ')}
                </p>
              </div>
              <h1 className="text-6xl lg:text-7xl font-bold text-[var(--charcoal)] leading-[0.95] tracking-tight" data-testid={`hero-title-${heroArticle.id}`}>
                {heroArticle.title}
              </h1>
              <p className="text-2xl lg:text-3xl text-[var(--charcoal)]/70 font-light leading-relaxed max-w-xl" data-testid={`hero-excerpt-${heroArticle.id}`}>
                {heroArticle.excerpt || 'Community voices exploring identity, creativity, and the spaces between digital and physical worlds.'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span data-testid={`hero-authors-${heroArticle.id}`}>
                  By {heroArticle.authors && heroArticle.authors.length > 0 ? heroArticle.authors.join(', ') : 'Editorial Team'}
                </span>
                {heroArticle.publishedAt && (
                  <>
                    <span>•</span>
                    <span>{new Date(heroArticle.publishedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href={`/entry/${heroArticle.slug}`}>
                <Button 
                  className="bg-[var(--editorial)] text-white hover:bg-[var(--editorial)]/90 transition-all duration-300 text-lg px-10 py-7 font-medium"
                  size="lg"
                  data-testid={`button-read-hero-${heroArticle.id}`}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Read Full Article
                </Button>
              </Link>
              {heroArticle.videoUrl && (
                <Button 
                  onClick={() => heroArticle.videoUrl && window.open(heroArticle.videoUrl, '_blank')}
                  variant="outline"
                  className="border-2 border-[var(--charcoal)] text-[var(--charcoal)] hover:bg-[var(--charcoal)] hover:text-white transition-all duration-300 text-lg px-10 py-7 font-medium"
                  size="lg"
                  data-testid={`button-watch-video-${heroArticle.id}`}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Watch Video
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative lg:col-span-1">
            <Link href={`/entry/${heroArticle.slug}`}>
              <div className="bg-[var(--cream)] h-[600px] rounded-2xl flex items-center justify-center transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden group">
                {effectiveThumbnail ? (
                  <img 
                    src={effectiveThumbnail}
                    alt={heroArticle.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    data-testid={`hero-image-${heroArticle.id}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--cream)] to-white"
                  style={{ display: effectiveThumbnail ? 'none' : 'flex' }}
                >
                  <div className="text-center px-8">
                    <div className="w-48 h-64 bg-[var(--charcoal)] rounded-lg shadow-2xl mb-6 mx-auto flex items-center justify-center transform rotate-3 transition-transform duration-300 group-hover:rotate-0">
                      <div className="text-center text-white">
                        <BookOpen className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">{(heroArticle.contentType ?? "").toUpperCase()}</h3>
                        <p className="text-sm opacity-80">FEATURED CONTENT</p>
                        <div className="mt-4 space-y-1">
                          <div className="w-16 h-0.5 bg-white/40 mx-auto"></div>
                          <div className="w-12 h-0.5 bg-white/40 mx-auto"></div>
                          <div className="w-20 h-0.5 bg-white/40 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[var(--charcoal)] text-lg font-medium mb-2">Hero Article</p>
                    <p className="text-[var(--editorial)] text-sm">Featured by Editorial Team</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}