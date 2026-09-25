import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Palette, Music, Image, BookOpen, Video, FileText, Plus, Users } from "lucide-react";
import { RawContentRow, FeatureWithContent } from "@shared/schema";
import EmptyState from "./empty-state";
import { RoleGate } from "./role-gate";
import { Link } from "wouter";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { isPrelaunch } from "@/lib/config";
import { Edit, Crown } from "lucide-react";

const getContentIcon = (contentType: string) => {
  switch (contentType.toLowerCase()) {
    case 'essay':
      return <BookOpen className="w-6 h-6" />;
    case 'interview':
      return <FileText className="w-6 h-6" />;
    case 'video_essay':
      return <Video className="w-6 h-6" />;
    default:
      return <FileText className="w-6 h-6" />;
  }
};

const getContentTypeColor = (contentType: string) => {
  return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
};

// Extract effective thumbnail including YouTube video thumbnails for video essays
const getEffectiveThumbnail = (article: RawContentRow) => {
  // For video essays, prioritize YouTube thumbnail over generic cover images
  if (article?.contentType === 'video_essay' && article?.videoUrl) {
    const videoId = extractYouTubeId(article.videoUrl);
    if (videoId) {
      return getYouTubeThumbnail(videoId, 'high');
    }
  }
  
  // Fall back to cover image for non-video content or when YouTube thumbnail unavailable
  if (article?.coverImageUrl) return article.coverImageUrl;
  
  return null;
};

export default function FeaturedStories() {
  const { data: features = [], isLoading } = useQuery<FeatureWithContent[]>({
    queryKey: ['/api/features-with-content'],
  });

  // Hide section entirely if no featured content
  if (isLoading) {
    return (
      <section id="culture" className="py-24 lg:py-16 bg-white dark:bg-[var(--background)] border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--editorial)]" data-testid="loading-featured"></div>
            <p className="text-muted-foreground mt-4">Loading featured content...</p>
          </div>
        </div>
      </section>
    );
  }

  if (features.length === 0) {
    const siteInPrelaunch = isPrelaunch();
    
    return (
      <section id="culture" className="py-32 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-1 w-16 bg-[var(--editorial)]"></div>
              <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase">
                Editorial
              </p>
              <div className="h-1 w-16 bg-[var(--editorial)]"></div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-[var(--charcoal)] mb-6 tracking-tight">
              {siteInPrelaunch ? "Featured Stories" : "Featured Stories"}
            </h2>
            <p className="text-xl text-[var(--charcoal)]/60 max-w-2xl mx-auto mb-12 leading-relaxed">
              Curated editorial content showcasing diverse voices and creative work from our community
            </p>
            
            {/* Dual-state empty content: Public vs Admin views */}
            <RoleGate 
              adminOnly={true}
              fallback={
                <div className="max-w-md mx-auto bg-[var(--cream)] border border-dashed border-[var(--editorial)]/30 rounded-lg p-8">
                  <BookOpen className="w-12 h-12 text-[var(--editorial)]/60 mx-auto mb-4" />
                  <p className="text-lg text-[var(--charcoal)]/80 leading-relaxed">
                    We're curating our first featured stories. Check back soon to see editorial content showcasing the voices and creativity of our community.
                  </p>
                </div>
              }
            >
              {/* Admin view: Show management controls */}
              <div className="max-w-md mx-auto bg-[var(--cream)] border border-dashed border-[var(--editorial)]/30 rounded-lg p-8">
                <div className="flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-[var(--editorial)] mr-2" />
                  <Users className="w-8 h-8 text-[var(--editorial)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--charcoal)] mb-3">
                  Editorial Management
                </h3>
                <p className="text-[var(--charcoal)]/70 mb-6 leading-relaxed">
                  Create editorial content and feature it using the Feature Manager.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/admin/editorial">
                    <Button 
                      className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white"
                      data-testid="button-create-editorial"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Editorial
                    </Button>
                  </Link>
                  <Link href="/admin/curation">
                    <Button 
                      variant="outline"
                      className="border-[var(--editorial)] text-[var(--editorial)] hover:bg-[var(--editorial)] hover:text-white"
                      data-testid="button-feature-content"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Feature Content
                    </Button>
                  </Link>
                </div>
              </div>
            </RoleGate>
          </div>
        </div>
      </section>
    );
  }

  // Features are already sorted by position from API
  // Separate hero, main, and secondary features
  const heroFeatures = features.filter(f => f.feature.featureType === 'hero' && f.content);
  const mainFeatures = features.filter(f => f.feature.featureType === 'main' && f.content);
  const secondaryFeatures = features.filter(f => f.feature.featureType === 'secondary' && f.content);
  
  // Use first hero as primary, or fall back to first main feature
  const mainFeature = heroFeatures[0]?.content || mainFeatures[0]?.content;
  
  // Build secondary content - if we used a hero, show first 2 main features
  // If we used a main feature, show the next 2 main features
  const secondaryContent: RawContentRow[] = [];
  if (heroFeatures.length > 0) {
    // We used a hero, show first 2 main features
    secondaryContent.push(...mainFeatures.slice(0, 2).map(f => f.content).filter(Boolean) as RawContentRow[]);
  } else if (mainFeatures.length > 1) {
    // We used first main as primary, show next 2 main features
    secondaryContent.push(...mainFeatures.slice(1, 3).map(f => f.content).filter(Boolean) as RawContentRow[]);
  }
  // Fill remaining slots with secondary features if needed
  if (secondaryContent.length < 2) {
    const needed = 2 - secondaryContent.length;
    secondaryContent.push(...secondaryFeatures.slice(0, needed).map(f => f.content).filter(Boolean) as RawContentRow[]);
  }

  return (
    <section id="culture" className="py-32 bg-[var(--cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-1 w-16 bg-[var(--editorial)]"></div>
            <p className="text-[var(--editorial)] font-semibold text-sm tracking-[0.2em] uppercase">
              Editorial
            </p>
            <div className="h-1 w-16 bg-[var(--editorial)]"></div>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-[var(--charcoal)] mb-6 tracking-tight">Featured Stories</h2>
          <p className="text-xl text-[var(--charcoal)]/60 max-w-2xl mx-auto leading-relaxed">
            Curated editorial content showcasing diverse voices and creative work from our community
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {/* Large Featured Story */}
          {mainFeature && (
            <div className="block md:col-span-2 lg:col-span-2 relative">
              <a 
                href={`/entry/${mainFeature.slug}`}
                className="block group"
                data-testid={`featured-main-${mainFeature.id}`}
              >
              <Card className="bg-white border-0 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-96 overflow-hidden bg-white">
                  {getEffectiveThumbnail(mainFeature) ? (
                    <img 
                      src={getEffectiveThumbnail(mainFeature)!} 
                      alt={mainFeature.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      data-testid={`img-featured-${mainFeature.id}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="h-full bg-gradient-to-br from-[var(--muted)] to-[var(--slate)] flex items-center justify-center"
                    style={{ display: getEffectiveThumbnail(mainFeature) ? 'none' : 'flex' }}
                  >
                    {getContentIcon(mainFeature.contentType ?? '')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-[var(--editorial)]/10 text-[var(--editorial)] border-0 px-3 py-1">
                    {(mainFeature.contentType ?? '').replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-[var(--charcoal)] leading-tight tracking-tight" data-testid={`text-featured-title-${mainFeature.id}`}>
                  {mainFeature.title}
                </CardTitle>
                <CardDescription className="text-lg text-[var(--charcoal)]/60 leading-relaxed" data-testid={`text-featured-excerpt-${mainFeature.id}`}>
                  {mainFeature.excerpt || 'Editorial content showcasing community voices and creative work.'}
                </CardDescription>
                <div className="flex items-center space-x-3 pt-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[var(--charcoal)] text-white text-sm">
                      {(mainFeature.authors && mainFeature.authors[0] ? mainFeature.authors[0] : 'E').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[var(--charcoal)] text-sm font-semibold" data-testid={`text-featured-authors-${mainFeature.id}`}>
                      {mainFeature.authors && mainFeature.authors.length > 0 ? mainFeature.authors.join(', ') : 'Editorial Team'}
                    </p>
                    <p className="text-[var(--charcoal)]/50 text-xs">Enamorado Magazine</p>
                  </div>
                </div>
              </CardContent>
              </Card>
              </a>
            </div>
          )}
          
          {/* Smaller Featured Stories */}
          <div className="space-y-10">
            {secondaryContent.map((content) => (
              <div 
                key={content.id}
                className="block relative"
                data-testid={`featured-secondary-${content.id}`}
              >
                <a 
                  href={`/entry/${content.slug}`}
                  className="block group"
                >
                <Card className="bg-white border-0 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                <CardHeader className="p-0">
                  <div className="h-56 overflow-hidden bg-white">
                    {getEffectiveThumbnail(content) ? (
                      <img 
                        src={getEffectiveThumbnail(content)!} 
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        data-testid={`img-secondary-${content.id}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="h-full bg-gradient-to-br from-[var(--muted)] to-[var(--slate)] flex items-center justify-center"
                      style={{ display: getEffectiveThumbnail(content) ? 'none' : 'flex' }}
                    >
                      {getContentIcon(content.contentType ?? '')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Badge className="bg-[var(--editorial)]/10 text-[var(--editorial)] border-0 px-3 py-1">
                    {(content.contentType ?? '').replace('_', ' ')}
                  </Badge>
                  <CardTitle className="text-xl font-bold text-[var(--charcoal)] leading-tight tracking-tight" data-testid={`text-secondary-title-${content.id}`}>
                    {content.title}
                  </CardTitle>
                  <CardDescription className="text-[var(--charcoal)]/60 leading-relaxed line-clamp-2" data-testid={`text-secondary-excerpt-${content.id}`}>
                    {content.excerpt || 'Editorial content showcasing community voices and creative work.'}
                  </CardDescription>
                </CardContent>
                </Card>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}