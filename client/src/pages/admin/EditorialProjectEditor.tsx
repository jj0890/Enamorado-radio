import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Save, Eye, Trash2, Upload, X, FileText, Camera, MessageSquare, Users,
  ExternalLink, Play, CheckCheck, Circle, Send, Clock, Search, History,
  Link2, Globe, Shield, Music, AlertTriangle, RotateCcw, Loader2, Bell,
  Wifi, WifiOff, ChevronDown, ChevronRight, Disc, Radio,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { diffWords } from "diff";
import { useToast } from "@/hooks/use-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";

type ProjectType = "photoshoot" | "interview" | "essay" | "community-spotlight";
type WorkflowStatus = "planning" | "in-progress" | "copy-edit" | "ready" | "published" | "featured";

interface EditorialProject {
  id: number;
  title: string;
  type: ProjectType;
  status: WorkflowStatus;
  description: string;
  content?: string;
  assignedTo?: string;
  coAuthors?: string[];
  dueDate?: string;
  scheduledAt?: string;
  tags?: string[];
  coverImage?: string;
  images?: string[];
  layoutStyle?: string;
  interviewee?: string;
  intervieweeRole?: string;
  externalUrl?: string;
  externalType?: string;
  credits?: Record<string, string>;
  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  license?: string;
  // Analytics (read-only)
  readingTime?: number;
  wordCount?: number;
  viewCount?: number;
  // Workflow
  copyEditedBy?: string;
  copyEditedAt?: string;
  // Internal
  editorialNotes?: string;
  factChecked?: boolean;
  legalCleared?: boolean;
  // Embed
  featuredEmbed?: { type: string; url: string; title?: string; artist?: string; artwork?: string };
  // Related editorial content
  relatedProjectIds?: number[];
  // Related music content [{type:'mix'|'episode'|'album', id, title, coverImage?}]
  relatedMedia?: Array<{ type: 'mix' | 'episode' | 'album'; id: number; title: string; coverImage?: string }>;
  // Image captions
  imageCaptions?: Record<string, { caption: string; altText: string }>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Revision {
  id: number;
  projectId: number;
  label: string;
  savedBy: string;
  savedAt: string;
  content?: string;
}

const projectTypeConfig = {
  photoshoot: { label: "Photoshoot", icon: Camera },
  interview: { label: "Interview", icon: MessageSquare },
  essay: { label: "Essay", icon: FileText },
  "community-spotlight": { label: "Community Spotlight", icon: Users },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  planning:     { label: "Planning",     color: "bg-gray-500" },
  "in-progress":{ label: "In Progress",  color: "bg-yellow-500" },
  "copy-edit":  { label: "Copy Edit",    color: "bg-orange-500" },
  ready:        { label: "Ready",        color: "bg-blue-500" },
  published:    { label: "Published",    color: "bg-green-500" },
  featured:     { label: "Featured",     color: "bg-purple-500" },
};

const LICENSE_OPTIONS = [
  { value: "all-rights-reserved", label: "All Rights Reserved" },
  { value: "cc-by",       label: "CC BY (Attribution)" },
  { value: "cc-by-nc",    label: "CC BY-NC (Non-commercial)" },
  { value: "cc-by-sa",    label: "CC BY-SA (Share-alike)" },
  { value: "cc-by-nc-sa", label: "CC BY-NC-SA" },
];

// ─── Rich Text Editor ───────────────────────────────────────────────────────

function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      ImageExtension,
      LinkExtension.configure({ openOnClick: false, autolink: true }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3" } },
  });

  if (!editor) return null;

  function handleLinkToggle() {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("Enter URL:");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 flex-wrap">
        {[
          ["B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
          ["I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic")],
          ["H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
          ["H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
          ["• List", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList")],
          ['" Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote")],
        ].map(([label, fn, active]) => (
          <Button key={label as string} type="button" variant="ghost" size="sm"
            onClick={fn as () => void}
            className={`font-mono text-xs ${active ? "bg-gray-200" : ""}`}>
            {label as string}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm"
          onClick={handleLinkToggle}
          className={`font-mono text-xs ${editor.isActive("link") ? "bg-gray-200" : ""}`}>
          Link
        </Button>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="font-mono text-xs">
          HR
        </Button>
      </div>
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}

// ─── Media Tab ──────────────────────────────────────────────────────────────

interface PendingPreview { objectUrl: string; name: string; done: boolean; failed: boolean; }

interface MediaTabProps {
  projectId: number | null;
  coverImage: string;
  images: string[];
  imageCaptions: Record<string, { caption: string; altText: string }>;
  onCoverChange: (url: string) => void;
  onGalleryChange: (imgs: string[]) => void;
  onCaptionsChange: (caps: Record<string, { caption: string; altText: string }>) => void;
  onSave: () => void;
}

function MediaTab({ projectId, coverImage, images, imageCaptions, onCoverChange, onGalleryChange, onCaptionsChange, onSave }: MediaTabProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingPreview[]>([]);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const previews: PendingPreview[] = Array.from(files).map(f => ({
      objectUrl: URL.createObjectURL(f), name: f.name, done: false, failed: false,
    }));
    setPending(prev => [...prev, ...previews]);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append("files", f));
      const res = await fetch("/api/editorial/media/upload", { method: "POST", credentials: "include", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const urls: string[] = data.uploaded.map((m: any) => m.url);
      setPending(prev => prev.map(p => previews.find(q => q.objectUrl === p.objectUrl) ? { ...p, done: true } : p));
      previews.forEach(p => URL.revokeObjectURL(p.objectUrl));
      setTimeout(() => {
        setPending(prev => prev.filter(p => !previews.find(q => q.objectUrl === p.objectUrl)));
      }, 600);
      if (!coverImage && urls.length > 0) {
        onCoverChange(urls[0]);
        onGalleryChange([...images, ...urls.slice(1)]);
      } else {
        onGalleryChange([...images, ...urls]);
      }
      onSave();
      toast({ title: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded` });
    } catch {
      setPending(prev => prev.map(p => previews.find(q => q.objectUrl === p.objectUrl) ? { ...p, failed: true } : p));
      toast({ title: "Upload failed", variant: "destructive" });
    }
  }

  function updateCaption(url: string, field: "caption" | "altText", value: string) {
    const next = { ...imageCaptions, [url]: { ...((imageCaptions[url]) || { caption: "", altText: "" }), [field]: value } };
    onCaptionsChange(next);
  }

  const allImages = [
    ...(coverImage ? [{ url: coverImage, isCover: true }] : []),
    ...images.filter(u => u !== coverImage).map(url => ({ url, isCover: false })),
  ];
  const isUploading = pending.some(p => !p.done && !p.failed);
  const totalCount = allImages.length + pending.length;

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isUploading ? "border-navy bg-navy/5" : "border-gray-200 hover:border-navy"}`}
        onClick={() => document.getElementById("media-file-input")?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input id="media-file-input" type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {isUploading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="font-mono text-sm text-navy">Uploading {pending.filter(p => !p.done && !p.failed).length} image{pending.length > 1 ? "s" : ""}…</p>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="font-mono text-sm text-gray-500">Drop images here or click to upload</p>
            <p className="font-mono text-xs text-gray-300 mt-1">First image becomes cover · up to 50MB each</p>
          </>
        )}
      </div>

      {totalCount > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-3">
            {totalCount} image{totalCount !== 1 ? "s" : ""}
            {pending.length > 0 && <span className="text-navy ml-2">· {pending.filter(p => !p.done).length} uploading</span>}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allImages.map(({ url, isCover }, i) => {
              const cap = imageCaptions[url] || { caption: "", altText: "" };
              const isEditing = editingCaption === url;
              return (
                <div key={url} className={`group relative rounded-lg overflow-hidden border-2 transition-all ${isCover ? "border-navy" : "border-transparent hover:border-gray-300"}`}>
                  <img src={url} alt={cap.altText || ""} className="w-full aspect-square object-cover" />
                  {isCover && <span className="absolute top-2 left-2 bg-navy text-white font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">Cover</span>}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!isCover && (
                      <button onClick={() => { onCoverChange(url); onSave(); }}
                        className="bg-white text-gray-900 font-mono text-[10px] px-2 py-1 rounded hover:bg-navy hover:text-white transition-colors">
                        Set Cover
                      </button>
                    )}
                    <button onClick={() => setEditingCaption(isEditing ? null : url)}
                      className="bg-white/90 text-gray-700 font-mono text-[10px] px-2 py-1 rounded hover:bg-white transition-colors">
                      {isEditing ? "Close" : "Caption / Alt"}
                    </button>
                    <button onClick={() => { onGalleryChange(images.filter(u => u !== url)); if (isCover) onCoverChange(""); onSave(); }}
                      className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reorder arrows */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                    {i > (coverImage ? 1 : 0) && (
                      <button onClick={() => { const next = [...images]; const fi = images.indexOf(url); if (fi > 0) { [next[fi-1], next[fi]] = [next[fi], next[fi-1]]; onGalleryChange(next); } }}
                        className="bg-white/80 font-mono text-xs w-5 h-5 rounded flex items-center justify-center">←</button>
                    )}
                    {i < allImages.length - 1 && (
                      <button onClick={() => { const next = [...images]; const fi = images.indexOf(url); if (fi < next.length - 1) { [next[fi], next[fi+1]] = [next[fi+1], next[fi]]; onGalleryChange(next); } }}
                        className="bg-white/80 font-mono text-xs w-5 h-5 rounded flex items-center justify-center">→</button>
                    )}
                  </div>
                </div>
              );
            })}

            {pending.map(p => (
              <div key={p.objectUrl} className={`relative rounded-lg overflow-hidden border-2 transition-all ${p.failed ? "border-red-300" : "border-navy/30"}`}>
                <img src={p.objectUrl} alt={p.name} className={`w-full aspect-square object-cover transition-opacity ${p.done ? "opacity-100" : "opacity-60"}`} />
                {!p.done && !p.failed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="font-mono text-[9px] text-white/80 uppercase tracking-wider">Uploading</span>
                  </div>
                )}
                {p.done && <div className="absolute inset-0 flex items-center justify-center bg-green-500/20"><CheckCheck className="w-6 h-6 text-green-400" /></div>}
                {p.failed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/30">
                    <X className="w-5 h-5 text-red-300 mb-1" />
                    <span className="font-mono text-[9px] text-red-200 uppercase">Failed</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="font-mono text-[9px] text-white/70 truncate">{p.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Caption editor */}
          {editingCaption && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="font-mono text-xs uppercase tracking-widest text-gray-400">Image metadata</p>
              <div>
                <Label className="font-mono text-xs">Caption</Label>
                <Input
                  value={imageCaptions[editingCaption]?.caption || ""}
                  onChange={e => updateCaption(editingCaption, "caption", e.target.value)}
                  placeholder="Visible caption below the image..."
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">Alt text <span className="text-gray-400 font-normal">(accessibility)</span></Label>
                <Input
                  value={imageCaptions[editingCaption]?.altText || ""}
                  onChange={e => updateCaption(editingCaption, "altText", e.target.value)}
                  placeholder="Describe the image for screen readers..."
                  className="font-mono text-sm"
                />
              </div>
              <Button size="sm" onClick={() => { setEditingCaption(null); onSave(); }} className="font-mono text-xs bg-navy h-7 px-3">
                Save caption
              </Button>
            </div>
          )}
        </div>
      )}

      {allImages.length > 0 && !isUploading && (
        <p className="font-mono text-xs text-gray-400">Changes auto-save on upload. Use Save above to save reordering.</p>
      )}
    </div>
  );
}

// ─── SEO Tab ────────────────────────────────────────────────────────────────

interface SeoTabProps {
  formData: Partial<EditorialProject>;
  onChange: (updates: Partial<EditorialProject>) => void;
  onFetchFromUrl: () => void;
  isScraping: boolean;
  isAdmin: boolean;
}

function SeoTab({ formData, onChange, onFetchFromUrl, isScraping, isAdmin }: SeoTabProps) {
  const autoSlug = (formData.title || "")
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> SEO & Publishing</CardTitle>
          <CardDescription>Controls how this piece appears in search and on social</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-mono text-xs">URL Slug</Label>
            <div className="flex gap-2 items-center mt-1">
              <span className="font-mono text-xs text-gray-400 shrink-0">/editorial/</span>
              <Input
                value={formData.slug || ""}
                onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder={autoSlug || "article-url-slug"}
                className="font-mono text-sm"
              />
            </div>
            {!formData.slug && autoSlug && (
              <p className="font-mono text-[10px] text-gray-400 mt-1">
                Auto: <button onClick={() => onChange({ slug: autoSlug })} className="text-navy underline">{autoSlug}</button>
              </p>
            )}
          </div>

          <div>
            <Label className="font-mono text-xs">SEO Title <span className="text-gray-400 font-normal">(overrides page title in search)</span></Label>
            <Input
              value={formData.metaTitle || ""}
              onChange={e => onChange({ metaTitle: e.target.value })}
              placeholder={formData.title || "SEO-optimised title..."}
              maxLength={70}
              className="font-mono text-sm mt-1"
            />
            <p className="font-mono text-[10px] text-gray-400 mt-1">{(formData.metaTitle || "").length}/70 chars</p>
          </div>

          <div>
            <Label className="font-mono text-xs">Meta Description</Label>
            <Textarea
              value={formData.metaDescription || ""}
              onChange={e => onChange({ metaDescription: e.target.value })}
              placeholder="150–160 char summary for search results..."
              rows={3}
              maxLength={160}
              className="font-mono text-sm mt-1"
            />
            <p className="font-mono text-[10px] text-gray-400 mt-1">{(formData.metaDescription || "").length}/160 chars</p>
          </div>

          <div>
            <Label className="font-mono text-xs">Open Graph Image <span className="text-gray-400 font-normal">(social share image — defaults to cover)</span></Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={formData.ogImage || ""}
                onChange={e => onChange({ ogImage: e.target.value })}
                placeholder={formData.coverImage || "https://... or use cover image"}
                className="font-mono text-sm flex-1"
              />
              {formData.externalUrl && isAdmin && (
                <Button size="sm" variant="outline" onClick={onFetchFromUrl} disabled={isScraping}
                  className="font-mono text-xs shrink-0 gap-1.5">
                  {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  Fetch
                </Button>
              )}
            </div>
            {formData.ogImage && (
              <img src={formData.ogImage} alt="OG preview" className="mt-2 h-16 object-cover rounded border" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Rights & Licensing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-mono text-xs">License</Label>
            <Select value={formData.license || "all-rights-reserved"} onValueChange={v => onChange({ license: v })}>
              <SelectTrigger className="font-mono text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LICENSE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!formData.factChecked}
                onChange={e => onChange({ factChecked: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300" />
              <span className="font-mono text-xs text-gray-700">Fact-checked</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!formData.legalCleared}
                onChange={e => onChange({ legalCleared: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300" />
              <span className="font-mono text-xs text-gray-700">Legal cleared</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</CardTitle>
          <CardDescription>Set a future publish time — status must reach "ready" first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="font-mono text-xs">Scheduled publish</Label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt ? formData.scheduledAt.slice(0, 16) : ""}
              onChange={e => onChange({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="font-mono text-sm mt-1"
            />
          </div>
          {formData.scheduledAt && (
            <p className="font-mono text-xs text-blue-600">
              Scheduled for {new Date(formData.scheduledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Revision History Tab ───────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function InlineDiff({ older, newer }: { older: string; newer: string }) {
  const parts = diffWords(stripHtml(older), stripHtml(newer));
  return (
    <div className="font-mono text-xs leading-relaxed p-3 bg-gray-50 border border-gray-100 rounded mt-2 max-h-48 overflow-y-auto">
      {parts.map((part, i) => {
        if (part.added) return <mark key={i} style={{ background: "#d1fae5", color: "#065f46" }}>{part.value}</mark>;
        if (part.removed) return <del key={i} style={{ background: "#fee2e2", color: "#991b1b", textDecoration: "line-through" }}>{part.value}</del>;
        return <span key={i} className="text-gray-500">{part.value}</span>;
      })}
    </div>
  );
}

function RevisionsTab({ projectId, onRestore }: { projectId: number; onRestore: () => void }) {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: revisions = [], isLoading } = useQuery<Revision[]>({
    queryKey: [`/api/editorial/projects/${projectId}/revisions`],
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  const restoreMutation = useMutation({
    mutationFn: async (revisionId: number) => {
      const res = await fetch(`/api/editorial/projects/${projectId}/restore/${revisionId}`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Restore failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Revision restored" });
      onRestore();
    },
    onError: () => toast({ title: "Restore failed", variant: "destructive" }),
  });

  if (isLoading) return <div className="py-8 text-center font-mono text-sm text-gray-400">Loading revisions…</div>;

  if (revisions.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
        <History className="w-7 h-7 text-gray-300 mx-auto mb-3" />
        <p className="font-mono text-sm text-gray-400">No revisions yet</p>
        <p className="font-mono text-xs text-gray-300 mt-1">Every save creates a revision automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-4">
        {revisions.length} revision{revisions.length !== 1 ? "s" : ""} — auto-saved on every save
      </p>
      {revisions.map((rev, i) => {
        const isOpen = expandedId === rev.id;
        // Compare this revision against the next-older one (i+1 in desc order)
        const olderContent = revisions[i + 1]?.content;
        const canDiff = i > 0 && !!rev.content && !!olderContent;
        return (
          <div key={rev.id} className="bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-gray-800 truncate">{rev.label || "Auto-save"}</p>
                <p className="font-mono text-xs text-gray-400">
                  {new Date(rev.savedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  {rev.savedBy && rev.savedBy !== "system" && <span className="ml-2">· {rev.savedBy}</span>}
                </p>
              </div>
              {i === 0 && <Badge variant="outline" className="font-mono text-[10px]">Current</Badge>}
              {canDiff && (
                <button
                  onClick={() => setExpandedId(isOpen ? null : rev.id)}
                  className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-700 flex items-center gap-1"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Changes
                </button>
              )}
              {i > 0 && (
                <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(rev.id)}
                  disabled={restoreMutation.isPending}
                  className="font-mono text-xs h-7 px-2.5 gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </Button>
              )}
            </div>
            {isOpen && canDiff && (
              <div className="px-4 pb-3">
                <InlineDiff older={olderContent!} newer={rev.content!} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Article Preview Modal ──────────────────────────────────────────────────

function PreviewModal({ project, open, onClose }: {
  project: Partial<EditorialProject>;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <DialogTitle className="font-mono text-xs uppercase tracking-widest text-gray-400">Preview</DialogTitle>
          <span className="font-mono text-[10px] text-gray-300">Not live — for review only</span>
        </div>

        <div className="px-6 pb-10">
          {/* Cover image */}
          {project.coverImage && (
            <div className="w-full aspect-[16/7] overflow-hidden -mx-6 mb-8" style={{ width: "calc(100% + 3rem)" }}>
              <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Meta */}
          <div className="mb-2 flex items-center gap-3">
            {project.type && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                {project.type.replace("-", " ")}
              </span>
            )}
            {project.readingTime && (
              <span className="font-mono text-[10px] text-gray-300">· {project.readingTime} min read</span>
            )}
            {project.tags && project.tags.length > 0 && (
              <span className="font-mono text-[10px] text-gray-300">
                · {project.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight mb-3" style={{ textWrap: "balance" } as any}>
            {project.title || "Untitled"}
          </h1>

          {/* Excerpt */}
          {project.description && (
            <p className="text-lg text-gray-500 leading-relaxed mb-4">{project.description}</p>
          )}

          {/* Byline */}
          <div className="flex items-center gap-2 mb-8 pb-6 border-b border-gray-100">
            <span className="font-mono text-xs text-gray-500">
              By {project.interviewee || (project as any).author || project.assignedTo || "Unknown"}
            </span>
            {project.coAuthors && project.coAuthors.length > 0 && (
              <span className="font-mono text-xs text-gray-400">
                + {project.coAuthors.join(", ")}
              </span>
            )}
          </div>

          {/* Featured embed */}
          {project.featuredEmbed?.url && (
            <div className="mb-8 border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-gray-50">
              {project.featuredEmbed.artwork && (
                <img src={project.featuredEmbed.artwork} alt="" className="w-14 h-14 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-gray-400 mb-0.5">{project.featuredEmbed.type}</p>
                <p className="font-semibold truncate">{project.featuredEmbed.title || project.featuredEmbed.url}</p>
                {project.featuredEmbed.artist && (
                  <p className="font-mono text-xs text-gray-500">{project.featuredEmbed.artist}</p>
                )}
              </div>
              <a href={project.featuredEmbed.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          )}

          {/* Body */}
          {project.content ? (
            <div
              className="prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: project.content }}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-100 rounded-lg p-10 text-center">
              <p className="font-mono text-sm text-gray-300">No content yet</p>
            </div>
          )}

          {/* Related content footer */}
          {((project.relatedProjectIds?.length ?? 0) > 0 || (project.relatedMedia?.length ?? 0) > 0) && (
            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-3">Related</p>
              <div className="flex flex-wrap gap-2">
                {(project.relatedMedia || []).map(m => (
                  <span key={`${m.type}-${m.id}`} className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {m.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Related Content Picker ──────────────────────────────────────────────────

type RelatedMusicItem = { type: 'mix' | 'episode' | 'album'; id: number; title: string; coverImage?: string };

function RelatedContentPicker({
  allProjects,
  currentProjectId,
  selectedIds,
  selectedMusic,
  onIdsChange,
  onMusicChange,
}: {
  allProjects: EditorialProject[];
  currentProjectId: number | null;
  selectedIds: number[];
  selectedMusic: RelatedMusicItem[];
  onIdsChange: (ids: number[]) => void;
  onMusicChange: (items: RelatedMusicItem[]) => void;
}) {
  const [tab, setTab] = useState<'editorial' | 'mixes' | 'episodes' | 'albums'>('editorial');
  const [search, setSearch] = useState("");

  const { data: mixes = [] } = useQuery<any[]>({
    queryKey: ["/api/mixes"],
    queryFn: () => fetch("/api/mixes?status=approved&limit=100", { credentials: "include" }).then(r => r.json()),
    staleTime: 60000,
    enabled: tab === 'mixes',
  });
  const { data: episodes = [] } = useQuery<any[]>({
    queryKey: ["/api/episodes"],
    queryFn: () => fetch("/api/episodes?limit=100", { credentials: "include" }).then(r => r.json()),
    staleTime: 60000,
    enabled: tab === 'episodes',
  });
  const { data: albums = [] } = useQuery<any[]>({
    queryKey: ["/api/albums/published"],
    queryFn: () => fetch("/api/albums/published", { credentials: "include" }).then(r => r.json()),
    staleTime: 60000,
    enabled: tab === 'albums',
  });

  const q = search.toLowerCase();

  const filteredEditorial = allProjects
    .filter(p => p.id !== currentProjectId)
    .filter(p => !q || p.title.toLowerCase().includes(q) || (p.type || "").includes(q));

  const filteredMixes = (mixes as any[]).filter(m =>
    !q || (m.title || m.mixTitle || "").toLowerCase().includes(q) || (m.djName || "").toLowerCase().includes(q)
  );
  const filteredEpisodes = (episodes as any[]).filter(e =>
    !q || (e.title || "").toLowerCase().includes(q)
  );
  const filteredAlbums = (albums as any[]).filter(a =>
    !q || (a.title || a.albumTitle || "").toLowerCase().includes(q) || (a.artist || "").toLowerCase().includes(q)
  );

  function toggleEditorial(id: number) {
    onIdsChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  }

  function toggleMusic(item: RelatedMusicItem) {
    const exists = selectedMusic.find(m => m.type === item.type && m.id === item.id);
    onMusicChange(exists ? selectedMusic.filter(m => !(m.type === item.type && m.id === item.id)) : [...selectedMusic, item]);
  }

  const TABS = [
    { id: 'editorial' as const, label: 'Editorial', icon: FileText },
    { id: 'mixes' as const, label: 'Mixes', icon: Music },
    { id: 'episodes' as const, label: 'Episodes', icon: Radio },
    { id: 'albums' as const, label: 'Albums', icon: Disc },
  ];

  return (
    <div className="space-y-4">
      {/* Selected chips */}
      {(selectedIds.length > 0 || selectedMusic.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map(id => {
            const p = allProjects.find(x => x.id === id);
            return p ? (
              <span key={id} className="flex items-center gap-1.5 font-mono text-xs bg-navy/10 text-navy px-2.5 py-1 rounded-full">
                <FileText className="w-3 h-3" />{p.title}
                <button onClick={() => toggleEditorial(id)} className="hover:text-red-500 ml-0.5">×</button>
              </span>
            ) : null;
          })}
          {selectedMusic.map(m => (
            <span key={`${m.type}-${m.id}`} className="flex items-center gap-1.5 font-mono text-xs bg-olive/10 text-navy px-2.5 py-1 rounded-full">
              {m.type === 'mix' ? <Music className="w-3 h-3" /> : m.type === 'episode' ? <Radio className="w-3 h-3" /> : <Disc className="w-3 h-3" />}
              {m.title}
              <button onClick={() => toggleMusic(m)} className="hover:text-red-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-3 h-3" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="w-full font-mono text-sm pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-navy"
        />
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
        {tab === 'editorial' && (
          filteredEditorial.length === 0
            ? <p className="font-mono text-xs text-gray-400 text-center py-4">No projects found</p>
            : filteredEditorial.slice(0, 30).map(p => {
              const sel = selectedIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleEditorial(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${sel ? "bg-navy/10 text-navy" : "hover:bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-navy border-navy" : "border-gray-300"}`}>
                    {sel && <CheckCheck className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold truncate">{p.title}</p>
                    <p className="font-mono text-[10px] text-gray-400">{p.type} · {p.status}</p>
                  </div>
                </button>
              );
            })
        )}

        {tab === 'mixes' && (
          filteredMixes.length === 0
            ? <p className="font-mono text-xs text-gray-400 text-center py-4">No mixes found</p>
            : filteredMixes.slice(0, 30).map((m: any) => {
              const item: RelatedMusicItem = { type: 'mix', id: m.id, title: m.title || m.mixTitle || `Mix #${m.id}`, coverImage: m.coverArt || m.artwork };
              const sel = selectedMusic.some(x => x.type === 'mix' && x.id === m.id);
              const previewUrl = m.mixUrl || m.audioUrl;
              return (
                <div key={m.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sel ? "bg-olive/10" : "hover:bg-gray-50"}`}>
                  <button onClick={() => toggleMusic(item)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-olive border-olive" : "border-gray-300"}`} style={sel ? {backgroundColor:"#537A28",borderColor:"#537A28"} : {}}>
                      {sel && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                    {m.coverArt && <img src={m.coverArt} alt="" className="w-8 h-8 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold truncate">{item.title}</p>
                      {m.djName && <p className="font-mono text-[10px] text-gray-400">{m.djName}</p>}
                    </div>
                  </button>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-gray-300 hover:text-olive transition-colors"
                      title="Preview">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })
        )}

        {tab === 'episodes' && (
          filteredEpisodes.length === 0
            ? <p className="font-mono text-xs text-gray-400 text-center py-4">No episodes found</p>
            : filteredEpisodes.slice(0, 30).map((e: any) => {
              const item: RelatedMusicItem = { type: 'episode', id: e.id, title: e.title || `Episode #${e.id}`, coverImage: e.coverImage || e.artwork };
              const sel = selectedMusic.some(x => x.type === 'episode' && x.id === e.id);
              const previewUrl = e.audioUrl;
              return (
                <div key={e.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${sel ? "bg-olive/10" : "hover:bg-gray-50"}`}>
                  <button onClick={() => toggleMusic(item)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "border-olive" : "border-gray-300"}`} style={sel ? {backgroundColor:"#537A28",borderColor:"#537A28"} : {}}>
                      {sel && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold truncate">{item.title}</p>
                      {e.showName && <p className="font-mono text-[10px] text-gray-400">{e.showName}</p>}
                    </div>
                  </button>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-gray-300 hover:text-olive transition-colors"
                      title="Preview">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })
        )}

        {tab === 'albums' && (
          filteredAlbums.length === 0
            ? <p className="font-mono text-xs text-gray-400 text-center py-4">No albums found</p>
            : filteredAlbums.slice(0, 30).map((a: any) => {
              const title = a.title || a.albumTitle || `Album #${a.id}`;
              const item: RelatedMusicItem = { type: 'album', id: a.id, title, coverImage: a.coverArt || a.artwork };
              const sel = selectedMusic.some(x => x.type === 'album' && x.id === a.id);
              return (
                <button key={a.id} onClick={() => toggleMusic(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${sel ? "bg-olive/10" : "hover:bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0`} style={sel ? {backgroundColor:"#537A28",borderColor:"#537A28"} : {borderColor:"#d1d5db"}}>
                    {sel && <CheckCheck className="w-3 h-3 text-white" />}
                  </div>
                  {(a.coverArt || a.artwork) && <img src={a.coverArt || a.artwork} alt="" className="w-8 h-8 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold truncate">{title}</p>
                    {a.artist && <p className="font-mono text-[10px] text-gray-400">{a.artist}</p>}
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );
}

// ─── Main Editor ────────────────────────────────────────────────────────────

export default function EditorialProjectEditor() {
  const [, params] = useRoute("/admin/editorial/projects/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<EditorialProject>>({
    title: "", type: "essay", status: "planning", description: "", content: "",
    assignedTo: "", tags: [], images: [], imageCaptions: {}, coAuthors: [],
    layoutStyle: "vertical-scroll", interviewee: "", intervieweeRole: "",
    externalUrl: "", externalType: "", license: "all-rights-reserved",
    factChecked: false, legalCleared: false, relatedProjectIds: [], relatedMedia: [],
  });
  const [useExternalLink, setUseExternalLink] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scraperStatus, setScraperStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [showPreview, setShowPreview] = useState(false);

  const { data: whoami } = useQuery<{ isAdmin: boolean; role: string; user: string }>({
    queryKey: ["/api/admin/whoami"],
    queryFn: () => fetch("/api/admin/whoami", { credentials: "include" }).then(r => r.json()),
    staleTime: 300000,
  });
  const userRole = whoami?.role ?? "editor";

  const { data: project, isLoading } = useQuery<EditorialProject>({
    queryKey: [`/api/editorial/projects/${projectId}`],
    enabled: !!projectId,
  });

  // All projects for the related content picker
  const { data: allProjects = [] } = useQuery<EditorialProject[]>({
    queryKey: ["/api/editorial/projects"],
    staleTime: 30000,
  });

  useEffect(() => {
    if (project) {
      setFormData(project);
      setUseExternalLink(!!project.externalUrl);
    }
  }, [project]);

  const updateForm = useCallback((updates: Partial<EditorialProject>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<EditorialProject>) => {
      const url = projectId ? `/api/editorial/projects/${projectId}` : "/api/editorial/projects";
      const res = await fetch(url, {
        method: projectId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/editorial/projects/${projectId}/revisions`] });
      toast({ title: "Saved" });
      if (!projectId) setLocation(`/admin/editorial/projects/${data.id}`);
      else setFormData(prev => ({ ...prev, readingTime: data.readingTime, wordCount: data.wordCount, slug: data.slug || prev.slug }));
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/editorial/projects/${projectId}/publish`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Publish failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/editorial/projects/${projectId}`] });
      toast({ title: "Published and live" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/editorial/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      return res.json();
    },
    onSuccess: (data) => {
      updateForm({ status: data.status });
      queryClient.invalidateQueries({ queryKey: [`/api/editorial/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/projects"] });
      toast({ title: `→ ${statusConfig[data.status]?.label}` });
    },
  });

  // ── Webscraper fetch ──────────────────────────────────────────────────────

  async function fetchFromScraper(urlToScrape: string) {
    if (!urlToScrape) return;
    setIsScraping(true);
    try {
      const res = await fetch("/api/editorial/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: urlToScrape }),
      });
      const data = await res.json();
      if (res.status === 503) { setScraperStatus('offline'); throw new Error(data.error || "Webscraper offline"); }
      if (!res.ok) throw new Error(data.error || "Scrape failed");
      setScraperStatus('online');

      const updates: Partial<EditorialProject> = {};
      if (data.title && !formData.title) updates.title = data.title;
      if (data.description && !formData.description) updates.description = data.description;
      if (data.ogImage && !formData.ogImage) updates.ogImage = data.ogImage;
      if (data.ogImage && !formData.coverImage) updates.coverImage = data.ogImage;
      updateForm(updates);
      toast({ title: "Metadata fetched", description: `Filled: ${Object.keys(updates).join(", ") || "nothing new"}` });
    } catch (err: any) {
      toast({ title: err.message || "Scrape failed", variant: "destructive" });
    } finally {
      setIsScraping(false);
    }
  }

  // ── Embed fetch ───────────────────────────────────────────────────────────

  async function fetchEmbedMeta(embedUrl: string) {
    if (!embedUrl) return;
    setIsScraping(true);
    try {
      const res = await fetch("/api/editorial/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: embedUrl }),
      });
      const data = await res.json();
      if (res.status === 503) { setScraperStatus('offline'); throw new Error(data.error || "Webscraper offline"); }
      if (!res.ok) throw new Error(data.error || "Embed fetch failed");
      setScraperStatus('online');
      updateForm({
        featuredEmbed: {
          type: detectEmbedType(embedUrl),
          url: embedUrl,
          title: data.title || "",
          artist: data.author || "",
          artwork: data.ogImage || "",
        }
      });
      toast({ title: "Embed metadata fetched" });
    } catch (err: any) {
      toast({ title: err.message || "Embed fetch failed", variant: "destructive" });
    } finally {
      setIsScraping(false);
    }
  }

  function detectEmbedType(url: string): string {
    if (url.includes("soundcloud.com")) return "soundcloud";
    if (url.includes("spotify.com")) return "spotify";
    if (url.includes("bandcamp.com")) return "bandcamp";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    return "other";
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast({ title: "Title required", variant: "destructive" }); return;
    }
    saveMutation.mutate(formData);
  };

  // ── Request review (editor-only) ─────────────────────────────────────────

  const requestReviewMutation = useMutation({
    mutationFn: async () => {
      const note = `\n\n⚑ Review requested by ${whoami?.user ?? "editor"} on ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`;
      const res = await fetch(`/api/editorial/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ editorialNotes: (formData.editorialNotes || "") + note }),
      });
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    },
    onSuccess: () => toast({ title: "Review requested", description: "Admin has been flagged to review and publish this piece." }),
    onError: () => toast({ title: "Request failed", variant: "destructive" }),
  });

  // ── Status action bar ─────────────────────────────────────────────────────

  function StatusActionBar() {
    const status = formData.status as string;
    const busy = statusMutation.isPending || saveMutation.isPending;

    const bars: Record<string, React.ReactNode> = {
      planning: (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <Circle className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-xs text-gray-500 flex-1">Planning — not started yet</span>
          <Button size="sm" onClick={() => statusMutation.mutate("in-progress")} disabled={busy}
            className="font-mono text-xs bg-blue-600 hover:bg-blue-700 h-7 px-3">
            <Play className="w-3 h-3 mr-1.5" />Start Working
          </Button>
        </div>
      ),
      "in-progress": (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-xs text-blue-700 flex-1">In progress</span>
          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("planning")} disabled={busy}
            className="font-mono text-xs h-7 px-3 border-blue-200 text-blue-600">Back</Button>
          <Button size="sm" onClick={() => statusMutation.mutate("copy-edit")} disabled={busy}
            className="font-mono text-xs bg-orange-500 hover:bg-orange-600 h-7 px-3">
            Send to Copy Edit
          </Button>
        </div>
      ),
      "copy-edit": (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-lg flex-wrap gap-y-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-mono text-xs text-orange-700 flex-1">Copy edit stage</span>
          <Input
            value={formData.copyEditedBy || ""}
            onChange={e => updateForm({ copyEditedBy: e.target.value })}
            placeholder="Copy editor name"
            className="font-mono text-xs h-7 w-36 px-2"
          />
          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("in-progress")} disabled={busy}
            className="font-mono text-xs h-7 px-3 border-orange-200 text-orange-600">Back to Draft</Button>
          <Button size="sm" onClick={() => { saveMutation.mutate(formData); statusMutation.mutate("ready"); }} disabled={busy}
            className="font-mono text-xs bg-green-600 hover:bg-green-700 h-7 px-3">
            <CheckCheck className="w-3 h-3 mr-1.5" />Copy Edit Done
          </Button>
        </div>
      ),
      ready: (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
          <CheckCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="font-mono text-xs text-green-700 flex-1">Ready for review</span>
          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("in-progress")} disabled={busy}
            className="font-mono text-xs h-7 px-3 border-green-200 text-green-700">Back to Draft</Button>
          {userRole === "admin" ? (
            <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}
              className="font-mono text-xs bg-navy hover:bg-navy/90 h-7 px-3">
              <Send className="w-3 h-3 mr-1.5" />Publish
            </Button>
          ) : (
            <Button size="sm" onClick={() => requestReviewMutation.mutate()} disabled={requestReviewMutation.isPending}
              className="font-mono text-xs bg-amber-500 hover:bg-amber-600 h-7 px-3">
              <Bell className="w-3 h-3 mr-1.5" />Request Admin Review
            </Button>
          )}
        </div>
      ),
      published: (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-lg">
          <Send className="w-3.5 h-3.5 text-purple-600" />
          <span className="font-mono text-xs text-purple-700 flex-1">Published and live</span>
          {formData.viewCount !== undefined && (
            <span className="font-mono text-[10px] text-purple-500">{formData.viewCount} views</span>
          )}
        </div>
      ),
    };

    return bars[status] ?? null;
  }

  if (isLoading) {
    return (
      <AdminShell title="Loading..." subtitle="Loading project">
        <div className="py-12 text-center font-mono text-sm text-gray-400">Loading…</div>
      </AdminShell>
    );
  }

  const TypeIcon = projectTypeConfig[formData.type as ProjectType]?.icon || FileText;

  return (
    <AdminShell
      title={projectId ? "Edit Project" : "New Project"}
      subtitle={formData.title || "Untitled"}
      breadcrumbs={[
        { label: "Editorial Production" },
        { label: "Projects", href: "/admin/editorial/projects" },
        { label: projectId ? "Edit" : "New" },
      ]}
      actions={
        <div className="flex gap-2 items-center">
          {formData.readingTime && (
            <span className="font-mono text-xs text-gray-400">{formData.readingTime} min · {formData.wordCount?.toLocaleString()} words</span>
          )}
          {projectId && (
            <Button variant="outline" onClick={() => setShowPreview(true)} className="font-mono text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" />Preview
            </Button>
          )}
          <Button variant="outline" onClick={() => setLocation("/admin/editorial/projects")}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-navy hover:bg-navy/90">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {projectId && (
        <PreviewModal project={formData} open={showPreview} onClose={() => setShowPreview(false)} />
      )}

      <div className="mb-6"><StatusActionBar /></div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          {projectId && <TabsTrigger value="revisions">Revisions</TabsTrigger>}
        </TabsList>

        {/* ── Content Tab ─────────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-navy rounded-lg text-white"><TypeIcon className="w-5 h-5" /></div>
                  <div>
                    <CardTitle>Editorial Content</CardTitle>
                    <CardDescription>{projectTypeConfig[formData.type as ProjectType]?.label}</CardDescription>
                  </div>
                </div>
                <Badge className={statusConfig[formData.status as string]?.color}>
                  {statusConfig[formData.status as string]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={e => updateForm({ title: e.target.value })}
                  placeholder="Enter a compelling title…"
                  className="text-xl font-bold border-0 border-b px-0"
                />
              </div>

              <div>
                <Label>Excerpt / Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => updateForm({ description: e.target.value })}
                  placeholder="Brief description for feeds and previews…"
                  rows={3}
                />
              </div>

              {/* Bylines */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-xs">Primary Author</Label>
                  <Input value={formData.author || formData.assignedTo || ""}
                    onChange={e => updateForm({ author: e.target.value })}
                    placeholder="Author name" className="mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Co-authors <span className="text-gray-400 font-normal">(comma-separated)</span></Label>
                  <Input
                    value={formData.coAuthors?.join(", ") || ""}
                    onChange={e => updateForm({ coAuthors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="Name, Name…" className="mt-1" />
                </div>
              </div>

              {/* Interview fields */}
              {formData.type === "interview" && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <Label>Interviewee Name</Label>
                    <Input value={formData.interviewee || ""} onChange={e => updateForm({ interviewee: e.target.value })} placeholder="Artist name" />
                  </div>
                  <div>
                    <Label>Role / Title</Label>
                    <Input value={formData.intervieweeRole || ""} onChange={e => updateForm({ intervieweeRole: e.target.value })} placeholder="DJ, Producer, Artist…" />
                  </div>
                </div>
              )}

              {/* Featured embed */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-semibold">Featured Embed</Label>
                  <span className="font-mono text-[10px] text-gray-400">(SoundCloud, Spotify, Bandcamp, YouTube)</span>
                  {userRole === "admin" && (
                    <span className="ml-auto flex items-center gap-1 font-mono text-[10px]"
                      title={scraperStatus === 'online' ? 'Webscraper online' : scraperStatus === 'offline' ? 'Webscraper offline — start it at localhost:8080' : 'Webscraper status unknown'}>
                      {scraperStatus === 'online'
                        ? <><Wifi className="w-3 h-3 text-green-500" /><span className="text-green-500">scraper online</span></>
                        : scraperStatus === 'offline'
                        ? <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-400">scraper offline</span></>
                        : <><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" /><span className="text-gray-400">scraper</span></>}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={formData.featuredEmbed?.url || ""}
                    onChange={e => updateForm({ featuredEmbed: { ...(formData.featuredEmbed || { type: "other" }), url: e.target.value } })}
                    placeholder="https://soundcloud.com/..."
                    className="font-mono text-sm flex-1"
                  />
                  {userRole === "admin" && (
                    <Button size="sm" variant="outline" onClick={() => fetchEmbedMeta(formData.featuredEmbed?.url || "")}
                      disabled={isScraping || !formData.featuredEmbed?.url || scraperStatus === 'offline'}
                      title={scraperStatus === 'offline' ? 'Start webscraper at localhost:8080 first' : undefined}
                      className="font-mono text-xs gap-1.5 shrink-0">
                      {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      Fetch via Scraper
                    </Button>
                  )}
                </div>
                {formData.featuredEmbed?.title && (
                  <div className="mt-3 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    {formData.featuredEmbed.artwork && (
                      <img src={formData.featuredEmbed.artwork} alt="" className="w-10 h-10 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold truncate">{formData.featuredEmbed.title}</p>
                      {formData.featuredEmbed.artist && <p className="font-mono text-xs text-gray-500 truncate">{formData.featuredEmbed.artist}</p>}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">{formData.featuredEmbed.type}</Badge>
                  </div>
                )}
              </div>

              {/* External link */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                    <Label className="cursor-pointer">Link to external article (Substack, Medium…)</Label>
                  </div>
                  <input type="checkbox" checked={useExternalLink}
                    onChange={e => { setUseExternalLink(e.target.checked); if (!e.target.checked) updateForm({ externalUrl: "", externalType: "" }); }}
                    className="h-4 w-4 rounded border-gray-300" />
                </div>
                {useExternalLink && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Label>External URL</Label>
                        <Input value={formData.externalUrl || ""} onChange={e => updateForm({ externalUrl: e.target.value })}
                          placeholder="https://yourname.substack.com/p/..." type="url" />
                      </div>
                      <div>
                        <Label>Platform</Label>
                        <Select value={formData.externalType || "substack"} onValueChange={v => updateForm({ externalType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="substack">Substack</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {formData.externalUrl && userRole === "admin" && (
                      <Button size="sm" variant="outline" className="mt-3 font-mono text-xs gap-1.5"
                        onClick={() => fetchFromScraper(formData.externalUrl!)} disabled={isScraping}>
                        {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        Auto-fill metadata from URL
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Editor */}
              {!useExternalLink && (
                <div>
                  <Label>Content</Label>
                  <RichTextEditor content={formData.content || ""} onChange={html => updateForm({ content: html })} />
                </div>
              )}
              {useExternalLink && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center">
                  <ExternalLink className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-mono text-sm text-gray-500">Readers will be redirected to the external URL</p>
                </div>
              )}

              {/* Editorial notes */}
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <Label className="font-mono text-xs text-amber-700">Internal Editorial Notes <span className="font-normal">(admin-only, never shown publicly)</span></Label>
                <Textarea
                  value={formData.editorialNotes || ""}
                  onChange={e => updateForm({ editorialNotes: e.target.value })}
                  placeholder="Notes for the team: context, concerns, sourcing notes…"
                  rows={3}
                  className="mt-2 bg-white font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Workflow, assignment, and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project Type</Label>
                  <Select value={formData.type} onValueChange={v => updateForm({ type: v as ProjectType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(projectTypeConfig).map(([value, cfg]) => (
                        <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Workflow Status</Label>
                  <Select value={formData.status} onValueChange={v => updateForm({ status: v as WorkflowStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([value, cfg]) => (
                        <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assigned To</Label>
                  <Input value={formData.assignedTo || ""} onChange={e => updateForm({ assignedTo: e.target.value })} placeholder="Team member" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.dueDate?.slice(0, 10) || ""} onChange={e => updateForm({ dueDate: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Tags <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></Label>
                <Input
                  value={formData.tags?.join(", ") || ""}
                  onChange={e => updateForm({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                  placeholder="music, culture, techno, san antonio"
                />
              </div>

              {formData.type === "photoshoot" && (
                <div>
                  <Label>Photoshoot Layout</Label>
                  <Select value={formData.layoutStyle || "vertical-scroll"} onValueChange={v => updateForm({ layoutStyle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical-scroll">Vertical Scroll (Editorial)</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                      <SelectItem value="coverflow">Cover Flow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Production credits */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <Label className="font-mono text-xs uppercase tracking-wider text-gray-500">Production Credits</Label>
                {["photographer", "stylist", "mua", "wardrobe", "location"].map(role => (
                  <div key={role} className="grid grid-cols-3 items-center gap-3">
                    <Label className="font-mono text-xs text-gray-500 capitalize">{role}</Label>
                    <Input
                      className="col-span-2 font-mono text-sm"
                      value={(formData.credits as any)?.[role] || ""}
                      onChange={e => updateForm({ credits: { ...(formData.credits || {}), [role]: e.target.value } })}
                      placeholder={`${role.charAt(0).toUpperCase() + role.slice(1)} name`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Media Tab ───────────────────────────────────────────────── */}
        <TabsContent value="media" className="space-y-6">
          <MediaTab
            projectId={projectId}
            coverImage={formData.coverImage || ""}
            images={formData.images || []}
            imageCaptions={formData.imageCaptions || {}}
            onCoverChange={url => updateForm({ coverImage: url })}
            onGalleryChange={imgs => updateForm({ images: imgs })}
            onCaptionsChange={caps => updateForm({ imageCaptions: caps })}
            onSave={() => saveMutation.mutate(formData)}
          />
        </TabsContent>

        {/* ── SEO Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="seo" className="space-y-6">
          <SeoTab
            formData={formData}
            onChange={updateForm}
            onFetchFromUrl={() => fetchFromScraper(formData.externalUrl || "")}
            isScraping={isScraping}
            isAdmin={userRole === "admin"}
          />
        </TabsContent>

        {/* ── Related Tab ─────────────────────────────────────────────── */}
        <TabsContent value="related" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Related Content
              </CardTitle>
              <CardDescription>
                Link editorial articles and music content that should appear alongside this piece
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RelatedContentPicker
                allProjects={allProjects as EditorialProject[]}
                currentProjectId={projectId}
                selectedIds={formData.relatedProjectIds || []}
                selectedMusic={formData.relatedMedia || []}
                onIdsChange={ids => updateForm({ relatedProjectIds: ids })}
                onMusicChange={items => updateForm({ relatedMedia: items })}
              />
              {((formData.relatedProjectIds?.length ?? 0) > 0 || (formData.relatedMedia?.length ?? 0) > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="font-mono text-xs gap-1.5 bg-navy hover:bg-navy/90">
                    <Save className="w-3 h-3" />Save Related Content
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Revisions Tab ───────────────────────────────────────────── */}
        {projectId && (
          <TabsContent value="revisions" className="space-y-4">
            <RevisionsTab
              projectId={projectId}
              onRestore={() => queryClient.invalidateQueries({ queryKey: [`/api/editorial/projects/${projectId}`] })}
            />
          </TabsContent>
        )}
      </Tabs>
    </AdminShell>
  );
}
