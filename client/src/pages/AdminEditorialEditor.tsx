import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import AdminLogin from "@/components/admin-login";
import SplitContentEditor, { type ContentFormData } from "@/components/split-content-editor";
import type { ContributorAssignment } from "@/components/contributor-picker";
import type { RawIssueRow } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Content = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  /** @deprecated use contributors junction */
  authors?: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  status: "draft" | "published";
  contentType: "essay" | "interview" | "video_essay" | "photoshoot" | "playlist" | "artPdf" | "link";
  featuredRank?: number;
  isHero: boolean;
  issueId?: number;
  publishedAt?: string;
  createdAt: string;
  externalUrl?: string;
  galleryUrls?: string;
  credits?: string;
  pdfUrl?: string;
  artistCredit?: string;
};

/** Raw junction row returned from GET /api/content/:id/contributors */
type ContentContributorRow = {
  id: number;
  contentId: number;
  contributorId: number;
  role: string;
  position: number;
};

/** Payload sent to the server — contributors travels alongside content fields */
type ContentPayload = Omit<ContentFormData, "galleryUrls"> & {
  gallery?: Array<{
    src: string;
    caption: string;
    credit: string;
    alt: string;
  }>;
};

export default function AdminEditorialEditor() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isNewRoute] = useRoute("/admin/editorial/new");
  const [isEditRoute, editParams] = useRoute("/admin/editorial/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isEditMode = isEditRoute;

  // Check authentication status
  useEffect(() => {
    fetch("/api/admin/whoami")
      .then((r) => r.json())
      .then((data) => {
        setIsAuthenticated(data?.isAdmin || false);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // Fetch issues for dropdown
  const { data: issues = [] } = useQuery<RawIssueRow[]>({
    queryKey: ["/api/issues"],
    enabled: isAuthenticated === true,
  });

  // Fetch all content
  const { data: allContent = [], isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ["/api/content"],
    enabled: isAuthenticated === true,
  });

  // Find content being edited
  const editingContent = isEditMode && editParams?.id
    ? allContent.find((c) => c.id === editParams.id)
    : null;

  // Fetch existing contributor assignments when editing
  const { data: existingContributors = [] } = useQuery<ContentContributorRow[]>({
    queryKey: [`/api/content/${editParams?.id}/contributors`],
    enabled: isAuthenticated === true && isEditMode === true && !!editParams?.id,
  });

  // Map junction rows to the shape ContributorPicker uses.
  // Memoized to prevent new array reference on every render (which would reset form edits).
  const initialContributors: ContributorAssignment[] = useMemo(
    () =>
      existingContributors.map((row) => ({
        contributorId: row.contributorId,
        role: row.role,
        position: row.position,
      })),
    [existingContributors]
  );

  // Guards for edit mode
  const isEditingButContentNotLoaded = isEditMode && isLoadingContent;
  const isEditingButContentNotFound =
    isEditMode && !isLoadingContent && editParams?.id && !editingContent;

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: (data: ContentPayload) => apiRequest("POST", "/api/content", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      toast({ title: "Content created successfully" });
      setLocation("/admin/editorial");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating content",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContentPayload }) =>
      apiRequest("PATCH", `/api/content/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/published-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection-content"] });
      toast({ title: "Content updated successfully" });
      setLocation("/admin/editorial");
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating content",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const generateSlug = (title: string): string =>
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Waiting for edit content to load
  if (isEditingButContentNotLoaded) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
          <div className="text-neutral-600">Loading content…</div>
        </div>
      </AdminLayout>
    );
  }

  // Content not found in edit mode
  if (isEditingButContentNotFound) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center gap-4">
          <div className="text-xl font-semibold text-neutral-800">Content Not Found</div>
          <div className="text-neutral-600">
            The content you're trying to edit doesn't exist or has been deleted.
          </div>
          <button
            onClick={() => setLocation("/admin/editorial")}
            className="px-4 py-2 bg-[var(--editorial)] text-white rounded hover:opacity-90"
          >
            Back to Editorial List
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SplitContentEditor
        content={editingContent || undefined}
        initialContributors={initialContributors}
        onSubmit={(formData) => {
          if (isEditMode) {
            if (!editParams?.id) {
              toast({
                title: "Error",
                description: "Missing content ID for update",
                variant: "destructive",
              });
              return;
            }
            if (!editingContent) {
              toast({
                title: "Error",
                description: "Content not loaded yet. Please wait.",
                variant: "destructive",
              });
              return;
            }
            // contributors array passes through in payload — server handles junction save
            updateContentMutation.mutate({ id: editParams.id, data: formData as ContentPayload });
          } else {
            createContentMutation.mutate(formData as ContentPayload);
          }
        }}
        onClose={() => setLocation("/admin/editorial")}
        isLoading={
          createContentMutation.isPending || updateContentMutation.isPending
        }
        issues={issues}
        generateSlug={generateSlug}
      />
    </AdminLayout>
  );
}
