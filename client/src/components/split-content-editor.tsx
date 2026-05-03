import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { RawIssueRow } from "@shared/schema";
import ContributorPicker, { type ContributorAssignment } from "@/components/contributor-picker";

type Content = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  /** @deprecated use contributors instead */
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

export type ContentFormData = {
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  contributors: ContributorAssignment[];
  coverImageUrl?: string;
  videoUrl?: string;
  status: "draft" | "published";
  contentType: "essay" | "interview" | "video_essay" | "photoshoot" | "playlist" | "artPdf" | "link";
  featuredRank?: number;
  isHero: boolean;
  issueId?: number;
  externalUrl?: string;
  galleryUrls?: string;
  credits?: string;
  pdfUrl?: string;
  artistCredit?: string;
};

interface SplitContentEditorProps {
  content?: Content;
  /** Pre-loaded contributor assignments from the junction table (used in edit mode) */
  initialContributors?: ContributorAssignment[];
  onSubmit: (data: ContentFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
  issues: RawIssueRow[];
  generateSlug: (title: string) => string;
}

export default function SplitContentEditor({
  content,
  initialContributors = [],
  onSubmit,
  onClose,
  isLoading = false,
  issues,
  generateSlug,
}: SplitContentEditorProps) {
  const [formData, setFormData] = useState<ContentFormData>({
    title: content?.title || "",
    slug: content?.slug || "",
    excerpt: content?.excerpt || "",
    body: content?.body || "",
    contributors: initialContributors,
    coverImageUrl: content?.coverImageUrl || "",
    videoUrl: content?.videoUrl || "",
    status: content?.status || "draft",
    contentType: content?.contentType || "essay",
    featuredRank: content?.featuredRank,
    isHero: content?.isHero || false,
    issueId: content?.issueId,
    externalUrl: content?.externalUrl || "",
    galleryUrls: content?.galleryUrls || "",
    credits: content?.credits || "",
    pdfUrl: content?.pdfUrl || "",
    artistCredit: content?.artistCredit || "",
  });

  // Sync initialContributors if they load after mount (edit mode async fetch)
  useEffect(() => {
    if (initialContributors.length > 0) {
      setFormData((prev) => ({ ...prev, contributors: initialContributors }));
    }
  }, [initialContributors]);

  // Auto-generate slug when title changes (only for new content)
  useEffect(() => {
    if (!content && formData.title && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(formData.title) }));
    }
  }, [formData.title, content, generateSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof ContentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Readable preview byline
  const bylineNames = formData.contributors
    .map((a) => a.contributorId)
    .join(","); // resolved in preview via ContributorPicker data; use simple placeholder here

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Side */}
      <Card>
        <CardHeader>
          <CardTitle>{content ? "Edit Content" : "Create New Content"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select
                value={formData.contentType}
                onValueChange={(value) => handleChange("contentType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="video_essay">Video Essay</SelectItem>
                  <SelectItem value="photoshoot">Photoshoot</SelectItem>
                  <SelectItem value="playlist">Playlist</SelectItem>
                  <SelectItem value="artPdf">Art PDF</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contributor Picker — replaces deprecated authors comma-list */}
            <ContributorPicker
              value={formData.contributors}
              onChange={(contributors) => handleChange("contributors", contributors)}
            />

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={10}
              />
            </div>

            <div>
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => handleChange("coverImageUrl", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : content ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Side */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {formData.title && <h1>{formData.title}</h1>}
            {formData.contributors.length > 0 && (
              <p className="text-gray-600 text-sm">
                {formData.contributors.length === 1 ? "By " : "By "}
                <span className="font-medium">
                  {formData.contributors.length} contributor
                  {formData.contributors.length !== 1 ? "s" : ""} assigned
                </span>
              </p>
            )}
            {formData.excerpt && <p className="italic">{formData.excerpt}</p>}
            {formData.body && (
              <div className="whitespace-pre-wrap">{formData.body}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
