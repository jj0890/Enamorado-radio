import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AdminShell from "@/components/admin/AdminShell";
import { Image, Music, Copy, Check, Filter } from "lucide-react";

interface MediaAsset {
  url: string;
  filename: string;
  type: "image" | "audio";
  size: number;
  uploadedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs font-mono text-charcoal-500 hover:text-charcoal-900 transition-colors"
      title="Copy URL"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

interface AdminMediaLibraryProps {
  onLogout: () => void;
  currentUser?: string;
  userRole?: "admin" | "editor";
}

export default function AdminMediaLibrary({
  onLogout,
  currentUser = "admin",
  userRole = "admin",
}: AdminMediaLibraryProps) {
  const [filter, setFilter] = useState<"all" | "image" | "audio">("all");

  const { data: assets = [], isLoading } = useQuery<MediaAsset[]>({
    queryKey: ["/api/admin/media"],
    queryFn: async () => {
      const r = await fetch("/api/admin/media");
      if (!r.ok) throw new Error("Failed to load media");
      return r.json();
    },
  });

  const visible = filter === "all" ? assets : assets.filter(a => a.type === filter);
  const imageCount = assets.filter(a => a.type === "image").length;
  const audioCount = assets.filter(a => a.type === "audio").length;

  return (
    <AdminShell
      title="Media Library"
      subtitle={`${assets.length} assets`}
      onLogout={onLogout}
      currentUser={currentUser}
      userRole={userRole}
    >
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "image", "audio"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
              filter === f
                ? "bg-charcoal-900 text-white border-charcoal-900"
                : "border-charcoal-200 text-charcoal-600 hover:border-charcoal-500"
            }`}
          >
            {f === "all" ? `All (${assets.length})` : f === "image" ? `Images (${imageCount})` : `Audio (${audioCount})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-charcoal-100 animate-pulse rounded" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-20 text-center text-charcoal-400 font-mono text-sm">
          No {filter === "all" ? "" : filter} assets uploaded yet.
        </div>
      ) : filter === "audio" ? (
        /* Audio list view */
        <div className="space-y-2">
          {visible.map(asset => (
            <div
              key={asset.url}
              className="flex items-center gap-4 p-3 border border-charcoal-100 hover:border-charcoal-300 bg-white transition-colors"
            >
              <div className="w-10 h-10 bg-charcoal-100 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-charcoal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-charcoal-900 truncate">{asset.filename}</p>
                <p className="font-mono text-xs text-charcoal-400">
                  {formatBytes(asset.size)} · {formatDate(asset.uploadedAt)}
                </p>
              </div>
              <CopyButton value={asset.url} />
            </div>
          ))}
        </div>
      ) : (
        /* Image grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {visible.map(asset => (
            <div key={asset.url} className="group relative">
              <div className="aspect-square bg-charcoal-100 overflow-hidden border border-charcoal-100 hover:border-charcoal-300 transition-colors">
                {asset.type === "image" ? (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-charcoal-400" />
                  </div>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none group-hover:pointer-events-auto">
                <p className="font-mono text-[10px] text-white/80 truncate mb-1">{asset.filename}</p>
                <p className="font-mono text-[10px] text-white/60 mb-2">{formatBytes(asset.size)}</p>
                <CopyButton value={asset.url} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
