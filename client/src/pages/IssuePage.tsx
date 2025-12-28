import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Download, FileText, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import { cn } from "@/lib/utils";

interface Issue {
  id: number | string;
  title: string;
  slug: string;
  description?: string;
  season?: string; // e.g., "Summer 2025"
  editorialIntro?: string; // Editor's letter
  coverImageUrl?: string;
  pdfUrl?: string;
  status: string;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface IssueContentItem {
  id: string;
  issueId: string;
  contentId: string;
  position: number;
  content: Content | null;
}

interface Content {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  authors: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  contentType: string;
  publishedAt?: string;
  featuredRank?: number;
  createdAt: string;
}

export default function IssuePage() {
  const params = useParams();
  const slug = params?.slug;

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['/api/issues/slug', slug],
    queryFn: async (): Promise<Issue> => {
      const response = await fetch(`/api/issues/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Issue not found');
      }
      const data = await response.json();
      return data as Issue;
    },
    enabled: !!slug,
  });

  // Fetch contents using the new issue contents API (sorted by position)
  const { data: issueContents } = useQuery<IssueContentItem[]>({
    queryKey: ['/api/issues', issue?.id, 'contents'],
    queryFn: async () => {
      if (!issue?.id) return [];
      const response = await fetch(`/api/issues/${issue.id}/contents`);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!issue?.id,
  });

  // Extract actual contents from issue contents (already sorted by position)
  const contents = issueContents
    ?.filter(ic => ic.content !== null)
    .map(ic => ic.content) as Content[] | undefined;

  // SEO meta tags
  useEffect(() => {
    if (issue) {
      document.title = `${issue.title} | Enamorado`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', issue.description || `${issue.title} - A magazine issue from Enamorado`);
      }
      
      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${issue.title} | Enamorado`);
      }
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', issue.description || `${issue.title} - A magazine issue from Enamorado`);
      }
      
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && issue.coverImageUrl) {
        ogImage.setAttribute('content', issue.coverImageUrl);
      }
    }
    
    return () => {
      // Reset title on unmount
      document.title = 'Enamorado | Independent Culture';
    };
  }, [issue]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video_essay':
        return '🎬';
      case 'interview':
        return '💬';
      case 'essay':
      default:
        return '📝';
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'video_essay':
        return 'Video Essay';
      case 'interview':
        return 'Interview';
      case 'essay':
      default:
        return 'Essay';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--cream)]">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="h-96 bg-gray-200 rounded"></div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-[var(--cream)]">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-[var(--charcoal)] mb-4">Issue Not Found</h1>
            <p className="text-[var(--charcoal)]/70 mb-8">
              The magazine issue you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/archive">
              <Button>Back to Archive</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8" data-testid="breadcrumb-nav">
            <div className="flex items-center space-x-2 text-sm text-[var(--charcoal)]/60">
              <Link href="/" className="hover:text-[var(--editorial)] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/archive" className="hover:text-[var(--editorial)] transition-colors">
                Archive
              </Link>
              <span>/</span>
              <span className="text-[var(--charcoal)]">{issue.title}</span>
            </div>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Issue Cover and Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24" data-testid="issue-cover">
                {/* Issue Cover */}
                {issue.coverImageUrl ? (
                  <div className="relative group mb-6">
                    <img
                      src={issue.coverImageUrl}
                      alt={`${issue.title} cover`}
                      className="w-full h-auto rounded-lg shadow-xl group-hover:shadow-2xl transition-shadow duration-300"
                    />
                    {issue.featured && (
                      <Badge className="absolute top-4 right-4 bg-[var(--editorial)] text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-[var(--slate)] to-[var(--light-grey)] rounded-lg flex items-center justify-center mb-6">
                    <div className="text-center text-[var(--charcoal)]/50">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">{issue.title}</p>
                    </div>
                  </div>
                )}

                {/* Issue Info */}
                <div className="space-y-4">
                  <div>
                    {issue.season && (
                      <p className="text-sm font-medium text-[var(--editorial)] uppercase tracking-wider mb-2" data-testid="issue-season">
                        {issue.season}
                      </p>
                    )}
                    <h1 className="text-3xl font-bold text-[var(--charcoal)] mb-2 font-serif" data-testid="issue-title">
                      {issue.title}
                    </h1>
                    {issue.description && (
                      <p className="text-[var(--charcoal)]/70 leading-relaxed" data-testid="issue-description">
                        {issue.description}
                      </p>
                    )}
                  </div>

                  {issue.publishedAt && (
                    <div className="flex items-center space-x-2 text-sm text-[var(--charcoal)]/60" data-testid="issue-date">
                      <Calendar className="w-4 h-4" />
                      <span>Published {formatDate(issue.publishedAt)}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {issue.pdfUrl && (
                      <Button 
                        asChild 
                        className="w-full bg-[var(--editorial)] hover:bg-[var(--editorial)]/90"
                        data-testid="download-pdf-button"
                      >
                        <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                    )}
                    
                    <div className="text-center">
                      <div className="text-sm text-[var(--charcoal)]/60">
                        {contents?.length || 0} articles in this issue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="lg:col-span-2">
              {/* Editorial Introduction */}
              {issue.editorialIntro && (
                <div className="mb-12 p-8 bg-white/60 backdrop-blur-sm rounded-lg border border-[var(--light-grey)]" data-testid="editorial-intro">
                  <h3 className="text-lg font-semibold text-[var(--editorial)] mb-4 uppercase tracking-wider">
                    From the Editor
                  </h3>
                  <div className="prose prose-lg max-w-none text-[var(--charcoal)]/80 font-serif leading-relaxed whitespace-pre-wrap">
                    {issue.editorialIntro}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--charcoal)] mb-2 font-serif">
                  Table of Contents
                </h2>
                <p className="text-[var(--charcoal)]/70">
                  Explore the stories, essays, and features in this issue
                </p>
              </div>

              {contents && contents.length > 0 ? (
                <div className="space-y-6" data-testid="table-of-contents">
                  {contents.map((content: Content, index: number) => (
                    <Card key={content.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-[var(--light-grey)]">
                      <CardContent className="p-0">
                        <div className="flex items-start space-x-4 p-6">
                          {/* Content number */}
                          <div className="flex-shrink-0 w-8 h-8 bg-[var(--editorial)] text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          
                          {/* Thumbnail */}
                          {content.coverImageUrl && (
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={content.coverImageUrl}
                                alt={content.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Content details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-lg">{getContentTypeIcon(content.contentType)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getContentTypeLabel(content.contentType)}
                                  </Badge>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-[var(--charcoal)] group-hover:text-[var(--editorial)] transition-colors mb-2">
                                  <Link href={`/entry/${content.slug}`} className="hover:underline">
                                    {content.title}
                                  </Link>
                                </h3>
                                
                                {content.authors.length > 0 && (
                                  <p className="text-sm text-[var(--charcoal)]/60 mb-2">
                                    By {content.authors.join(', ')}
                                  </p>
                                )}
                                
                                {content.excerpt && (
                                  <p className="text-sm text-[var(--charcoal)]/70 line-clamp-2">
                                    {content.excerpt}
                                  </p>
                                )}
                              </div>
                              
                              <Button 
                                asChild 
                                variant="ghost" 
                                size="sm"
                                className="flex-shrink-0 ml-4"
                              >
                                <Link href={`/entry/${content.slug}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Read
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-content-message">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--charcoal)]/30" />
                  <h3 className="text-lg font-medium text-[var(--charcoal)] mb-2">No Content Available</h3>
                  <p className="text-[var(--charcoal)]/60">
                    This issue doesn't have any published content yet.
                  </p>
                </div>
              )}

              <Separator className="my-12" />

              {/* Back Navigation */}
              <div className="text-center">
                <Link href="/archive">
                  <Button variant="outline" className="inline-flex items-center space-x-2" data-testid="back-to-archive">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Archive</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}