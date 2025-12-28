import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout, { SectionHeader } from "@/components/admin-layout";
import AdminLogin from "@/components/admin-login";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, FileText, Star, ExternalLink } from "lucide-react";
import type { RawContentRow } from "@shared/schema";

const issueFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});

type IssueFormData = z.infer<typeof issueFormSchema>;

type Issue = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  pdfUrl?: string;
  status: "draft" | "published";
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
};

export default function AdminIssues() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    fetch("/api/admin/whoami")
      .then(r => r.json())
      .then(data => {
        setIsAuthenticated(data?.isAdmin || false);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // Fetch issues data
  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
    enabled: isAuthenticated === true,
  });

  // Fetch content associated with issues
  const { data: content = [] } = useQuery<RawContentRow[]>({
    queryKey: ["/api/content"],
    enabled: isAuthenticated === true,
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: (data: IssueFormData) => apiRequest("POST", "/api/issues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setShowCreateForm(false);
      toast({ title: "Issue created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating issue", description: error?.message, variant: "destructive" });
    },
  });

  // Update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IssueFormData }) => apiRequest("PATCH", `/api/issues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setEditingIssue(null);
      toast({ title: "Issue updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating issue", description: error?.message, variant: "destructive" });
    },
  });

  // Delete issue mutation
  const deleteIssueMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/issues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({ title: "Issue deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting issue", description: error?.message, variant: "destructive" });
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

  const getIssueContent = (issueId: string): RawContentRow[] => {
    return content.filter((item: RawContentRow) => item.issueId?.toString() === issueId);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

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
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Magazine Issues Management</h1>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-issue">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Issue</DialogTitle>
                </DialogHeader>
                <IssueForm
                  onSubmit={(data) => createIssueMutation.mutate(data)}
                  isLoading={createIssueMutation.isPending}
                  generateSlug={generateSlug}
                />
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-neutral-600">Loading issues...</div>
          ) : issues.length === 0 ? (
            <div className="text-neutral-500">No issues found. Create your first issue!</div>
          ) : (
            <div className="grid gap-6">
              {(issues as Issue[]).map((issue: Issue) => {
                const issueContent = getIssueContent(issue.id);
                
                return (
                  <Card key={issue.id} data-testid={`card-issue-${issue.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={issue.status === "published" ? "default" : "secondary"} data-testid={`badge-status-${issue.id}`}>
                              {issue.status}
                            </Badge>
                            {issue.featured && <Badge variant="destructive" data-testid={`badge-featured-${issue.id}`}><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                          </div>
                          <CardTitle className="text-xl" data-testid={`text-title-${issue.id}`}>{issue.title}</CardTitle>
                          {issue.description && <p className="text-neutral-600 mt-2" data-testid={`text-description-${issue.id}`}>{issue.description}</p>}
                          <div className="text-sm text-neutral-500 mt-2">
                            <span data-testid={`text-date-${issue.id}`}>
                              {issue.publishedAt ? `Published ${new Date(issue.publishedAt).toLocaleDateString()}` : `Created ${new Date(issue.createdAt).toLocaleDateString()}`}
                            </span>
                            <span className="mx-2">•</span>
                            <span data-testid={`text-content-count-${issue.id}`}>{issueContent.length} article{issueContent.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          {issue.coverImageUrl && (
                            <img 
                              src={issue.coverImageUrl} 
                              alt={issue.title}
                              className="w-16 h-20 object-cover rounded border"
                              data-testid={`img-cover-${issue.id}`}
                            />
                          )}
                          <div className="flex flex-col gap-2">
                            {issue.pdfUrl && (
                              <Button variant="outline" size="sm" asChild data-testid={`button-view-pdf-${issue.id}`}>
                                <a href={issue.pdfUrl} target="_blank" rel="noreferrer">
                                  <FileText className="w-4 h-4 mr-1" />
                                  PDF
                                </a>
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`button-edit-${issue.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Issue</DialogTitle>
                                </DialogHeader>
                                <IssueForm
                                  issue={issue}
                                  onSubmit={(data) => updateIssueMutation.mutate({ id: issue.id, data })}
                                  isLoading={updateIssueMutation.isPending}
                                  generateSlug={generateSlug}
                                />
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`button-delete-${issue.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{issue.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteIssueMutation.mutate(issue.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    data-testid={`button-confirm-delete-${issue.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {issueContent.length > 0 && (
                      <CardContent>
                        <h4 className="font-semibold mb-3">Table of Contents</h4>
                        <div className="space-y-2">
                          {issueContent.map((item: RawContentRow) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0" data-testid={`content-item-${item.id}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium" data-testid={`text-content-title-${item.id}`}>{item.title}</span>
                                  <Badge variant="outline" data-testid={`badge-content-type-${item.id}`}>
                                    {item.contentType.replace('_', ' ')}
                                  </Badge>
                                  {item.status === "published" && <Badge variant="default" data-testid={`badge-content-status-${item.id}`}>Published</Badge>}
                                </div>
                                {item.authors && item.authors.length > 0 && (
                                  <p className="text-sm text-neutral-600" data-testid={`text-content-authors-${item.id}`}>
                                    By {item.authors.join(", ")}
                                  </p>
                                )}
                              </div>
                              {item.videoUrl && (
                                <Button variant="ghost" size="sm" asChild data-testid={`button-content-video-${item.id}`}>
                                  <a href={item.videoUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function IssueForm({ 
  issue, 
  onSubmit, 
  isLoading, 
  generateSlug 
}: { 
  issue?: Issue;
  onSubmit: (data: IssueFormData) => void;
  isLoading: boolean;
  generateSlug: (title: string) => string;
}) {
  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      title: issue?.title || "",
      slug: issue?.slug || "",
      description: issue?.description || "",
      coverImageUrl: issue?.coverImageUrl || "",
      pdfUrl: issue?.pdfUrl || "",
      status: issue?.status || "draft",
      featured: issue?.featured || false,
    },
  });

  const watchTitle = form.watch("title");
  
  // Auto-generate slug when title changes
  useEffect(() => {
    if (watchTitle && !issue) {
      const newSlug = generateSlug(watchTitle);
      form.setValue("slug", newSlug);
    }
  }, [watchTitle, form, generateSlug, issue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Issue #1: Spring 2024" data-testid="input-title" />
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Brief description of this issue's theme or contents" data-testid="textarea-description" />
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
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com/cover.jpg" data-testid="input-cover-image" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pdfUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PDF Download URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com/issue.pdf" data-testid="input-pdf-url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 pt-8">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    data-testid="checkbox-featured"
                  />
                </FormControl>
                <FormLabel>Featured Issue</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading} data-testid="button-save-issue">
            {isLoading ? "Saving..." : issue ? "Update Issue" : "Create Issue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}