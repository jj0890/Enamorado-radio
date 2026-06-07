import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, ImagePlus } from "lucide-react";
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  /** Upload a file to /api/media/upload and return the URL */
  async function uploadFile(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/media/upload", { method: "POST", body });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.url as string;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      handleChange("coverImageUrl", url);
    } catch (err: any) {
      alert(err.message || "Cover image upload failed");
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      const existing = (formData.galleryUrls ?? "").trim();
      const combined = [existing, ...urls].filter(Boolean).join("\n");
      handleChange("galleryUrls", combined);
    } catch (err: any) {
      alert(err.message || "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
      if (galleryFileRef.current) galleryFileRef.current.value = "";
    }
  }

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

  // Gallery URL list derived from textarea value
  const galleryList = (formData.galleryUrls ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

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

            {/* Cover image — URL or file upload */}
            <div>
              <Label htmlFor="coverImageUrl">Cover Image</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="coverImageUrl"
                  placeholder="https://… or upload →"
                  value={formData.coverImageUrl ?? ""}
                  onChange={(e) => handleChange("coverImageUrl", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCover}
                  onClick={() => coverFileRef.current?.click()}
                  className="shrink-0"
                >
                  {uploadingCover ? (
                    <span className="text-xs">Uploading…</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>
              {formData.coverImageUrl && (
                <div className="mt-2 relative w-32 h-20">
                  <img
                    src={formData.coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded border"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <button
                    type="button"
                    onClick={() => handleChange("coverImageUrl", "")}
                    className="absolute -top-1.5 -right-1.5 bg-white rounded-full border p-0.5 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Gallery images — photoshoot type */}
            {formData.contentType === "photoshoot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Gallery Images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingGallery}
                    onClick={() => galleryFileRef.current?.click()}
                  >
                    {uploadingGallery ? (
                      <span className="text-xs">Uploading…</span>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Add Images
                      </>
                    )}
                  </Button>
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                </div>

                {/* Thumbnail strip */}
                {galleryList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {galleryList.map((url, i) => (
                      <div key={i} className="relative w-20 h-14">
                        <img
                          src={url}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-full object-cover rounded border"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = galleryList.filter((_, j) => j !== i).join("\n");
                            handleChange("galleryUrls", updated);
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-white rounded-full border p-0.5 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Raw URL textarea — manual entry still supported */}
                <Textarea
                  id="galleryUrls"
                  placeholder="One image URL per line"
                  value={formData.galleryUrls ?? ""}
                  onChange={(e) => handleChange("galleryUrls", e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {galleryList.length} image{galleryList.length !== 1 ? "s" : ""} · Upload or paste URLs above
                </p>
              </div>
            )}

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
