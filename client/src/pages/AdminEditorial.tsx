import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout, { SectionHeader } from "@/components/admin-layout";
import AdminLogin from "@/components/admin-login";
import YouTubeEmbed from "@/components/youtube-embed";
import ContentReviewDrawer from "@/components/content-review-drawer";
import { QuickFeatureDialog } from "@/components/quick-feature-dialog";
import TiptapEditor from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye, ExternalLink, Video, PlayCircle, Search, FileText, Image, Music, Link as LinkIcon, SplitSquareVertical, Star, Crown, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { isValidYouTubeUrl, extractYouTubeId, getYouTubeThumbnail, parseYouTubeUrl } from "@/lib/youtube-utils";
import type { RawIssueRow } from "@shared/schema";

const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  authors: z.string().optional(),
  coverImageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]),
  scheduledAt: z.string().optional(),
  contentType: z.enum(["essay", "interview", "video_essay", "photoshoot", "playlist", "artPdf", "link"]),
  featuredRank: z.coerce.number().min(1).max(10).optional(),
  isHero: z.boolean(),
  issueId: z.coerce.number().optional(),
  
  // Type-specific fields
  externalUrl: z.string().optional(), // For playlist and link types
  galleryUrls: z.string().optional(), // For photoshoot (line-separated URLs)
  credits: z.string().optional(), // For photoshoot credits
  pdfUrl: z.string().optional(), // For artPdf type
  artistCredit: z.string().optional(), // For artPdf type
}).superRefine((data, ctx) => {
  // For video essays, YouTube URL is required
  if (data.contentType === "video_essay") {
    if (!data.videoUrl || !isValidYouTubeUrl(data.videoUrl)) {
      ctx.addIssue({
        code: "custom",
        message: "Video essays require a valid YouTube URL",
        path: ["videoUrl"],
      });
    }
  }
  
  // For playlists, external URL is required
  if (data.contentType === "playlist") {
    if (!data.externalUrl || data.externalUrl.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Playlist URL is required for playlist content",
        path: ["externalUrl"],
      });
    }
  }
  
  // For photoshoots, gallery URLs are required
  if (data.contentType === "photoshoot") {
    if (!data.galleryUrls || data.galleryUrls.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Gallery images are required for photoshoot content",
        path: ["galleryUrls"],
      });
    }
  }
  
  // For art/PDF, PDF URL is required
  if (data.contentType === "artPdf") {
    if (!data.pdfUrl || data.pdfUrl.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "PDF/Art file URL is required for art/PDF content",
        path: ["pdfUrl"],
      });
    }
  }
  
  // For links, external URL is required
  if (data.contentType === "link") {
    if (!data.externalUrl || data.externalUrl.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "External URL is required for link content",
        path: ["externalUrl"],
      });
    }
  }
  
  // For other types, validate YouTube URL if provided
  if (data.videoUrl && !isValidYouTubeUrl(data.videoUrl)) {
    ctx.addIssue({
      code: "custom",
      message: "Please enter a valid YouTube URL",
      path: ["videoUrl"],
    });
  }
});

type ContentFormData = z.infer<typeof contentFormSchema>;

type Content = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  authors: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  status: "draft" | "scheduled" | "published";
  contentType: "essay" | "interview" | "video_essay" | "photoshoot" | "playlist" | "artPdf" | "link";
  featuredRank?: number;
  isHero: boolean;
  issueId?: number;
  publishedAt?: string;
  scheduledAt?: string;
  previewToken?: string;
  reviewStatus?: "none" | "pending" | "approved" | "rejected";
  createdAt: string;

  // Type-specific fields
  externalUrl?: string;
  galleryUrls?: string;
  credits?: string;
  pdfUrl?: string;
  artistCredit?: string;
};

type ContentPayload = Omit<ContentFormData, "authors" | "galleryUrls"> & {
  authors: string[];
  gallery?: Array<{
    src: string;
    caption: string;
    credit: string;
    alt: string;
  }>;
};

type FilterType = "all" | "writing" | "visual" | "playlist" | "video";

const filterOptions = [
  { id: "all" as const, label: "All Content", icon: Eye },
  { id: "writing" as const, label: "Writing", icon: FileText },
  { id: "visual" as const, label: "Visual", icon: Image },
  { id: "playlist" as const, label: "Playlist", icon: Music },
  { id: "video" as const, label: "Video", icon: Video },
];

export default function AdminEditorial() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [reviewDrawerContent, setReviewDrawerContent] = useState<Content | null>(null);
  const [quickFeatureOpen, setQuickFeatureOpen] = useState(false);
  const [quickFeatureContent, setQuickFeatureContent] = useState<Content | null>(null);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    fetch("/api/admin/whoami")
      .then(r => r.json())
      .then(data => {
        // User is authenticated if they have a role and it's not "viewer"
        const isAuth = data?.username && data?.role && data.role !== "viewer";
        setIsAuthenticated(!!isAuth);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // Fetch content data
  const { data: content = [], isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
    enabled: isAuthenticated === true,
  });

  // Fetch issues for dropdown
  const { data: issues = [] } = useQuery<RawIssueRow[]>({
    queryKey: ["/api/issues"],
    enabled: isAuthenticated === true,
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: (data: ContentPayload) => apiRequest("POST", "/api/content", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      setShowCreateForm(false);
      toast({ title: "Content created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating content", description: error?.message, variant: "destructive" });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContentPayload }) => apiRequest("PATCH", `/api/content/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      setEditingContent(null);
      toast({ title: "Content updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating content", description: error?.message, variant: "destructive" });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      toast({ title: "Content deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting content", description: error?.message, variant: "destructive" });
    },
  });

  // Quick feature toggle mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => 
      apiRequest("PATCH", `/api/content/${id}`, { 
        featuredRank: featured ? 1 : null 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content", { featured: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      toast({ title: "Feature status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating feature", description: error?.message, variant: "destructive" });
    },
  });

  // Quick hero toggle mutation
  const toggleHeroMutation = useMutation({
    mutationFn: ({ id, isHero }: { id: string; isHero: boolean }) => 
      apiRequest("PATCH", `/api/content/${id}`, { isHero }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content", { hero: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      toast({ title: "Hero status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating hero status", description: error?.message, variant: "destructive" });
    },
  });

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  // Map contentType to filter category
  const mapContentTypeToFilter = (contentType: string): FilterType => {
    switch (contentType) {
      case 'essay':
      case 'interview':
        return 'writing';
      case 'video_essay':
        return 'video';
      case 'photoshoot':
      case 'artPdf':
        return 'visual';
      case 'playlist':
        return 'playlist';
      default:
        return 'all';
    }
  };
  
  // Filter content based on selected filter and search term
  const filteredContent = (content as Content[]).filter(item => {
    const matchesFilter = selectedFilter === 'all' || mapContentTypeToFilter(item.contentType) === selectedFilter;
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.excerpt && item.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Show login if not authenticated
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminLayout>
      <ContentReviewDrawer
        content={reviewDrawerContent}
        open={reviewDrawerOpen}
        onOpenChange={setReviewDrawerOpen}
      />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Editorial Content Management</h1>
            <div className="flex items-center gap-2">
              <Link href="/admin/editorial/new">
                <Button data-testid="button-create-content-split">
                  <SplitSquareVertical className="w-4 h-4 mr-2" />
                  Editor with Preview
                </Button>
              </Link>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-create-content">
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Content</DialogTitle>
                    <DialogDescription>
                      Create new editorial content including essays, interviews, and video essays.
                    </DialogDescription>
                  </DialogHeader>
                  <ContentForm
                    onSubmit={(data) => createContentMutation.mutate(data)}
                    isLoading={createContentMutation.isPending}
                    issues={issues}
                    generateSlug={generateSlug}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Search by title, excerpt, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant={selectedFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.id)}
                    className="flex items-center gap-2"
                    data-testid={`filter-${filter.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="text-neutral-600">Loading content...</div>
          ) : filteredContent.length === 0 ? (
            <div className="text-neutral-500">
              {content.length === 0 
                ? "No content found. Create your first piece!" 
                : "No content matches your filters. Try a different search or filter."}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContent.map((item: Content) => (
                <Card key={item.id} data-testid={`card-content-${item.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              item.status === "published" ? "default" :
                              item.status === "scheduled" ? "outline" : "secondary"
                            }
                            className={item.status === "scheduled" ? "text-amber-600 border-amber-400" : ""}
                            data-testid={`badge-status-${item.id}`}
                          >
                            {item.status === "scheduled" && <Clock className="w-3 h-3 mr-1 inline" />}
                            {item.status}
                            {item.status === "scheduled" && item.scheduledAt && (
                              <span className="ml-1 font-normal">
                                · {new Date(item.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </Badge>
                          {item.reviewStatus === "pending" && (
                            <Badge variant="outline" className="text-blue-600 border-blue-400">
                              Review pending
                            </Badge>
                          )}
                          <Badge variant="outline" data-testid={`badge-type-${item.id}`}>
                            {item.contentType.replace('_', ' ')}
                          </Badge>
                          {item.isHero && <Badge variant="destructive" data-testid={`badge-hero-${item.id}`}>Hero</Badge>}
                          {item.featuredRank && <Badge variant="secondary" data-testid={`badge-featured-${item.id}`}>Featured #{item.featuredRank}</Badge>}
                        </div>
                        <CardTitle className="text-lg" data-testid={`text-title-${item.id}`}>{item.title}</CardTitle>
                        {item.excerpt && <p className="text-sm text-neutral-600 mt-1" data-testid={`text-excerpt-${item.id}`}>{item.excerpt}</p>}
                        <div className="text-xs text-neutral-500 mt-2">
                          {item.authors.length > 0 && <span data-testid={`text-authors-${item.id}`}>By {item.authors.join(", ")} • </span>}
                          <span data-testid={`text-date-${item.id}`}>
                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quick feature button */}
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90 text-white"
                          onClick={() => {
                            setQuickFeatureContent(item);
                            setQuickFeatureOpen(true);
                          }}
                          data-testid={`button-feature-${item.id}`}
                          title="Feature this content"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Feature
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewDrawerContent(item);
                            setReviewDrawerOpen(true);
                          }}
                          data-testid={`button-quick-review-${item.id}`}
                          title="Quick review"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {/* Preview in new tab — generates token on demand */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Preview (shares draft link)"
                          onClick={async () => {
                            const r = await fetch(`/api/content/${item.id}/preview-token`, { method: 'POST' });
                            if (r.ok) {
                              const { previewUrl } = await r.json();
                              window.open(previewUrl, '_blank');
                            }
                          }}
                          data-testid={`button-preview-${item.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {item.videoUrl && (
                          <Button variant="outline" size="sm" asChild data-testid={`button-view-video-${item.id}`}>
                            <a href={item.videoUrl} target="_blank" rel="noreferrer">
                              <Video className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Link href={`/admin/editorial/edit/${item.id}`}>
                          <Button
                            variant="default"
                            size="sm"
                            data-testid={`button-split-edit-${item.id}`}
                          >
                            <SplitSquareVertical className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-edit-${item.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Content</DialogTitle>
                              <DialogDescription>
                                Edit the content details, status, and publication settings.
                              </DialogDescription>
                            </DialogHeader>
                            <ContentForm
                              content={item}
                              onSubmit={(data) => updateContentMutation.mutate({ id: item.id, data })}
                              isLoading={updateContentMutation.isPending}
                              issues={issues}
                              generateSlug={generateSlug}
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-delete-${item.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Content</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteContentMutation.mutate(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`button-confirm-delete-${item.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickFeatureDialog
        open={quickFeatureOpen}
        onOpenChange={setQuickFeatureOpen}
        contentId={quickFeatureContent?.id || ""}
        contentTitle={quickFeatureContent?.title || ""}
        entityType="content"
      />
    </AdminLayout>
  );
}

function ContentForm({ 
  content, 
  onSubmit, 
  isLoading, 
  issues, 
  generateSlug 
}: { 
  content?: Content;
  onSubmit: (data: ContentPayload) => void;
  isLoading: boolean;
  issues: RawIssueRow[];
  generateSlug: (title: string) => string;
}) {
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: content?.title || "",
      slug: content?.slug || "",
      excerpt: content?.excerpt || "",
      body: content?.body || "",
      authors: content?.authors?.join(", ") || "",
      coverImageUrl: content?.coverImageUrl || "",
      videoUrl: content?.videoUrl || "",
      status: (content?.status as any) || "draft",
      contentType: content?.contentType || "essay",
      featuredRank: content?.featuredRank || undefined,
      isHero: content?.isHero || false,
      issueId: content?.issueId || undefined,
      scheduledAt: content?.scheduledAt
        ? new Date(content.scheduledAt).toISOString().slice(0, 16)
        : undefined,
    },
  });

  const handleSubmit = (data: ContentFormData) => {
    const payload: ContentPayload = {
      ...data,
      authors: data.authors ? data.authors.split(",").map(a => a.trim()).filter(Boolean) : [],
      // featuredRank and issueId are already numbers due to z.coerce.number()
    };

    // Transform galleryUrls string into gallery array for photoshoot content
    if (data.contentType === "photoshoot" && data.galleryUrls) {
      const urls = data.galleryUrls.split('\n').map(url => url.trim()).filter(Boolean);
      payload.gallery = urls.map((url, index) => ({
        src: url,
        caption: `Image ${index + 1}`,
        credit: data.credits || "",
        alt: `Gallery image ${index + 1}`,
      }));
      
      // Set first image as cover if no cover image is set
      if (!payload.coverImageUrl && urls.length > 0) {
        payload.coverImageUrl = urls[0];
      }
    }

    onSubmit(payload);
  };

  const watchTitle = form.watch("title");
  const watchContentType = form.watch("contentType");
  const watchVideoUrl = form.watch("videoUrl");
  
  // Auto-generate slug when title changes
  useEffect(() => {
    if (watchTitle && !content) {
      const newSlug = generateSlug(watchTitle);
      form.setValue("slug", newSlug);
    }
  }, [watchTitle, form, generateSlug, content]);
  
  // Show video preview and auto-generate thumbnail for video essays
  useEffect(() => {
    if (watchVideoUrl && isValidYouTubeUrl(watchVideoUrl)) {
      setShowVideoPreview(true);
      
      // Auto-generate thumbnail for video essays
      if (watchContentType === "video_essay") {
        const videoId = extractYouTubeId(watchVideoUrl);
        if (videoId) {
          const thumbnailUrl = getYouTubeThumbnail(videoId, 'high');
          
          // Only set if cover image is empty (don't override user's choice)
          const currentCoverImage = form.getValues("coverImageUrl");
          if (!currentCoverImage || currentCoverImage.trim() === "") {
            form.setValue("coverImageUrl", thumbnailUrl);
            
            // Show a brief toast notification
            toast({ 
              title: "Auto-generated thumbnail", 
              description: "YouTube thumbnail automatically set as cover image",
              duration: 3000
            });
          }
        }
      }
    } else {
      setShowVideoPreview(false);
    }
  }, [watchVideoUrl, watchContentType, form, toast]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-slug" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-content-type">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="essay">📝 Essay</SelectItem>
                  <SelectItem value="interview">🎤 Interview</SelectItem>
                  <SelectItem value="video_essay">🎬 Video Essay</SelectItem>
                  <SelectItem value="photoshoot">📸 Photoshoot</SelectItem>
                  <SelectItem value="playlist">🎵 Playlist</SelectItem>
                  <SelectItem value="artPdf">🎨 Art/PDF</SelectItem>
                  <SelectItem value="link">🔗 Link</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authors (comma-separated)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Jane Doe, John Smith" data-testid="input-authors" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea {...field} data-testid="textarea-excerpt" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Body Content
                {watchContentType === "video_essay" && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Description, analysis, or additional context for the video)
                  </span>
                )}
                {(watchContentType === "essay" || watchContentType === "interview") && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Rich text with embedded images)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                {(watchContentType === "essay" || watchContentType === "interview") ? (
                  <TiptapEditor
                    content={field.value || ""}
                    onChange={field.onChange}
                    placeholder={
                      watchContentType === "essay" 
                        ? "Start writing your essay..."
                        : "Start writing your interview..."
                    }
                  />
                ) : (
                  <Textarea 
                    {...field} 
                    rows={watchContentType === "video_essay" ? 6 : 8}
                    placeholder={
                      watchContentType === "video_essay" 
                        ? "Provide context, analysis, or additional information about the video content..."
                        : "Enter the main body content..."
                    }
                    data-testid="textarea-body" 
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <div className="space-y-2">
                {/* File Upload Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('cover-image-upload')?.click()}
                    className="flex items-center gap-2"
                    data-testid="button-upload-cover-image"
                  >
                    <Image className="w-4 h-4" />
                    Upload Image
                  </Button>
                  <input
                    id="cover-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      const inputElement = e.target;
                      if (!file) return;
                      
                      // Preserve existing cover URL in case upload fails
                      const previousCoverUrl = form.getValues('coverImageUrl');
                      
                      const formData = new FormData();
                      formData.append('image', file);
                      
                      try {
                        // Use raw fetch for FormData (apiRequest forces JSON)
                        const response = await fetch('/api/upload-image', {
                          method: 'POST',
                          body: formData,
                          credentials: 'include'
                        });
                        
                        if (!response.ok) {
                          const text = await response.text();
                          throw new Error(`${response.status}: ${text}`);
                        }
                        
                        const data = await response.json();
                        form.setValue('coverImageUrl', data.url);
                        toast({
                          title: "Image uploaded",
                          description: "Cover image successfully uploaded"
                        });
                      } catch (error) {
                        // Clear file input but restore previous cover URL on error
                        inputElement.value = '';
                        // Restore previous URL (don't clear it)
                        form.setValue('coverImageUrl', previousCoverUrl);
                        toast({
                          title: "Upload failed",
                          description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                  <span className="text-sm text-gray-500 self-center">or enter URL below</span>
                </div>
                
                {/* URL Input */}
                <FormControl>
                  <Input {...field} placeholder="https://example.com/image.jpg" data-testid="input-cover-image" />
                </FormControl>
                
                {/* Image Preview */}
                {field.value && (
                  <div className="relative w-full max-w-md rounded-lg overflow-hidden border">
                    <img 
                      src={field.value} 
                      alt="Cover preview" 
                      className="w-full h-auto"
                      onError={() => toast({
                        title: "Invalid image URL",
                        description: "The image URL is not accessible",
                        variant: "destructive"
                      })}
                    />
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Video URL field - shown for all content types but emphasized for video essays */}
        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                YouTube Video URL 
                {watchContentType === "video_essay" && <span className="text-red-500">*</span>}
                {watchContentType !== "video_essay" && <span className="text-gray-500 text-sm">(optional)</span>}
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                  data-testid="input-video-url" 
                />
              </FormControl>
              <FormMessage />
              
              {/* Live YouTube Preview */}
              {showVideoPreview && field.value && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Video Preview</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Video className="w-3 h-3" />
                      <span>YouTube</span>
                    </div>
                  </div>
                  <YouTubeEmbed 
                    url={field.value} 
                    className="max-w-md"
                    showTitle={false}
                    privacyEnhanced={true}
                  />
                </div>
              )}
            </FormItem>
          )}
        />

        {/* Type-specific fields that show/hide based on content type */}
        
        {/* Playlist Fields */}
        {watchContentType === "playlist" && (
          <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
            <h3 className="font-medium text-orange-800 flex items-center gap-2">
              🎵 Playlist Settings
            </h3>
            
            <FormField
              control={form.control}
              name="externalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist URL <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Spotify, Apple Music, SoundCloud, or YouTube playlist URL"
                      data-testid="input-playlist-url" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">Supported: Spotify, Apple Music, SoundCloud, YouTube</p>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Photoshoot Fields */}
        {watchContentType === "photoshoot" && (
          <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
            <h3 className="font-medium text-purple-800 flex items-center gap-2">
              📸 Photoshoot Settings
            </h3>
            
            <FormField
              control={form.control}
              name="galleryUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gallery Images <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter image URLs, one per line"
                      rows={6}
                      data-testid="textarea-gallery-urls" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">One image URL per line. First image becomes the cover.</p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Photographer: Name&#10;Stylist: Name&#10;Model: Name"
                      rows={4}
                      data-testid="textarea-credits" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">List credits like: Photographer: Name, Stylist: Name, etc.</p>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Art/PDF Fields */}
        {watchContentType === "artPdf" && (
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <h3 className="font-medium text-green-800 flex items-center gap-2">
              🎨 Art/PDF Settings
            </h3>
            
            <FormField
              control={form.control}
              name="pdfUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF/Art File URL <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Direct link to PDF or high-resolution art file"
                      data-testid="input-pdf-url" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">Supported: PDF files, high-res images (PNG, JPG)</p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="artistCredit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Credit</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Artist name and any additional credits"
                      data-testid="input-artist-credit" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* External URL Field - Available for all content types */}
        <FormField
          control={form.control}
          name="externalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External URL</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Link to external content (Substack, YouTube, Spotify, etc.)"
                  data-testid="input-external-url-general" 
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-600">Optional: Link to external content that complements this piece</p>
            </FormItem>
          )}
        />

        {/* Link Fields */}
        {watchContentType === "link" && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-medium text-blue-800 flex items-center gap-2">
              🔗 Link Settings
            </h3>
            
            <FormField
              control={form.control}
              name="externalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External URL <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Link to external article, project, or resource"
                      data-testid="input-external-url" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">Link will fetch preview metadata automatically</p>
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Publish now</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Schedule date/time — shown when status is 'scheduled' */}
          {form.watch("status") === "scheduled" && (
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Publish at
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      data-testid="input-scheduled-at"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="featuredRank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Rank (1-10)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" data-testid="input-featured-rank" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isHero"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    data-testid="checkbox-hero"
                  />
                </FormControl>
                <FormLabel>Hero Content</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associate with Issue</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  defaultValue={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-issue">
                      <SelectValue placeholder="Select issue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Issue</SelectItem>
                    {issues.map((issue: RawIssueRow) => (
                      <SelectItem key={issue.id} value={issue.id.toString()}>
                        {issue.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading} data-testid="button-save-content">
            {isLoading ? "Saving..." : content ? "Update Content" : "Create Content"}
          </Button>
        </div>
      </form>
    </Form>
  );
}