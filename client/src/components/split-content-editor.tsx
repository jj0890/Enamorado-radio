import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TipTapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X, ImagePlus, Bold, Italic, Quote, Minus, Camera, Settings, Eye, EyeOff } from "lucide-react";
import type { RawIssueRow } from "@shared/schema";
import ContributorPicker, { type ContributorAssignment } from "@/components/contributor-picker";

type Content = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
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
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const bodyImageRef = useRef<HTMLInputElement>(null);

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      TipTapImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Write your story. Drag or paste photos straight into the text…" }),
    ],
    content: content?.body || "",
    onUpdate({ editor }) {
      handleChange("body", editor.getHTML());
    },
    editorProps: {
      handlePaste(_, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadFile(file).then((url) => {
                editor?.chain().focus().setImage({ src: url }).run();
              }).catch((err) => alert(err.message || "Image upload failed"));
            }
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const img = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (!img) return false;
        event.preventDefault();
        const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY }) ?? { pos: view.state.selection.anchor };
        uploadFile(img).then((url) => {
          editor?.chain().focus().insertContentAt(pos, { type: "image", attrs: { src: url } }).run();
        }).catch((err) => alert(err.message || "Image upload failed"));
        return true;
      },
    },
  });

  useEffect(() => {
    if (initialContributors.length > 0) {
      setFormData((prev) => ({ ...prev, contributors: initialContributors }));
    }
  }, [initialContributors]);

  useEffect(() => {
    if (!content && formData.title && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(formData.title) }));
    }
  }, [formData.title, content, generateSlug]);

  async function uploadCoverFile(file: File) {
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

  function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingCover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadCoverFile(file);
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

  const handleChange = (field: keyof ContentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const galleryList = (formData.galleryUrls ?? "")
    .split("\n").map((u) => u.trim()).filter(Boolean);

  const isDraft = formData.status === "draft";

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}
      className="min-h-screen bg-white"
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${showSettings ? "bg-gray-100 border-gray-300 text-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>

          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDraft ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
            {isDraft ? "Draft" : "Published"}
          </span>

          <Button type="submit" disabled={isLoading} size="sm" className="bg-[var(--editorial,#b84c27)] hover:opacity-90 text-white">
            {isLoading ? "Saving…" : isDraft ? "Save Draft" : "Update"}
          </Button>
        </div>
      </div>

      {/* ── Settings drawer ─────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="border-b border-gray-100 bg-gray-50 px-8 py-5">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                className="mt-1 text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Content Type</Label>
              <Select value={formData.contentType} onValueChange={(v) => handleChange("contentType", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
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
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Contributors</Label>
              <div className="mt-1">
                <ContributorPicker
                  value={formData.contributors}
                  onChange={(contributors) => handleChange("contributors", contributors)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document body ────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Cover photo */}
        {formData.coverImageUrl ? (
          <div className="relative mb-8 rounded-xl overflow-hidden group">
            <img
              src={formData.coverImageUrl}
              alt="Cover"
              className="w-full h-72 object-cover"
              onError={(e) => (e.currentTarget.style.opacity = "0.3")}
            />
            <button
              type="button"
              onClick={() => handleChange("coverImageUrl", "")}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
            onDragLeave={() => setIsDraggingCover(false)}
            onDrop={handleCoverDrop}
            onClick={() => coverFileRef.current?.click()}
            className={`mb-8 border-2 border-dashed rounded-xl p-12 text-center cursor-pointer select-none transition-colors ${
              isDraggingCover
                ? "border-orange-400 bg-orange-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {uploadingCover ? (
              <p className="text-sm text-gray-400 animate-pulse">Uploading…</p>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-400">Drop your cover photo here</p>
                <p className="text-xs text-gray-300 mt-1">or click to browse · JPEG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}
        <input
          ref={coverFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCoverFile(f); }}
        />

        {/* Title */}
        <input
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Title"
          required
          className="w-full text-4xl font-bold font-serif text-gray-900 placeholder-gray-200 border-none outline-none resize-none bg-transparent mb-3 leading-tight"
        />

        {/* Excerpt / subtitle */}
        <input
          value={formData.excerpt ?? ""}
          onChange={(e) => handleChange("excerpt", e.target.value)}
          placeholder="Add a subtitle…"
          className="w-full text-lg text-gray-400 italic placeholder-gray-200 border-none outline-none bg-transparent mb-8 leading-relaxed"
        />

        <hr className="border-gray-100 mb-8" />

        {/* Rich text body */}
        <div className="relative">
          {/* Toolbar — pinned above editor */}
          <div className="flex flex-wrap items-center gap-0.5 mb-3">
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold">
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic">
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="Heading 2">
              <span className="text-xs font-semibold">H2</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="Heading 3">
              <span className="text-xs font-semibold">H3</span>
            </ToolbarBtn>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Pull quote">
              <Quote className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider">
              <Minus className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn onClick={() => bodyImageRef.current?.click()} title="Insert photo">
              <Camera className="w-4 h-4" />
            </ToolbarBtn>
            <input
              ref={bodyImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await uploadFile(file);
                  editor?.chain().focus().setImage({ src: url }).run();
                } catch (err: any) {
                  alert(err.message || "Image upload failed");
                } finally {
                  if (bodyImageRef.current) bodyImageRef.current.value = "";
                }
              }}
            />
          </div>

          <EditorContent
            editor={editor}
            className="prose prose-lg max-w-none
              [&_.ProseMirror]:outline-none
              [&_.ProseMirror]:min-h-[400px]
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-300
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
              [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
              [&_.ProseMirror_img]:max-w-full
              [&_.ProseMirror_img]:rounded-lg
              [&_.ProseMirror_img]:my-6
              [&_.ProseMirror_img]:mx-auto
              [&_.ProseMirror_img]:block
              [&_.ProseMirror_blockquote]:border-l-4
              [&_.ProseMirror_blockquote]:border-orange-400
              [&_.ProseMirror_blockquote]:pl-4
              [&_.ProseMirror_blockquote]:italic
              [&_.ProseMirror_blockquote]:text-gray-500"
          />
        </div>

        {/* Gallery — photoshoot only */}
        {formData.contentType === "photoshoot" && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Gallery</p>
              <Button type="button" variant="outline" size="sm" disabled={uploadingGallery} onClick={() => galleryFileRef.current?.click()}>
                {uploadingGallery ? "Uploading…" : <><ImagePlus className="w-4 h-4 mr-1" />Add Photos</>}
              </Button>
              <input ref={galleryFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </div>
            {galleryList.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryList.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} className="w-full h-full object-cover rounded" onError={(e) => (e.currentTarget.style.display = "none")} />
                    <button
                      type="button"
                      onClick={() => handleChange("galleryUrls", galleryList.filter((_, j) => j !== i).join("\n"))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    ><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
            Discard
          </Button>
          <div className="flex items-center gap-3">
            {isDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { handleChange("status", "published"); setTimeout(() => onSubmit({ ...formData, status: "published" }), 0); }}
                disabled={isLoading}
              >
                Publish
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="bg-[var(--editorial,#b84c27)] hover:opacity-90 text-white">
              {isLoading ? "Saving…" : isDraft ? "Save Draft" : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ToolbarBtn({ onClick, active, title, children }: {
  onClick?: () => void;
  active?: boolean | null;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}
    >
      {children}
    </button>
  );
}
