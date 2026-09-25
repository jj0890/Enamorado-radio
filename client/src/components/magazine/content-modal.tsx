import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ContentModalProps {
  open: boolean;
  onClose: () => void;
  contentSlug: string | null;
}

export default function ContentModal({ open, onClose, contentSlug }: ContentModalProps) {
  const { data } = useQuery({
    queryKey: ["/api/magazine/submissions", contentSlug],
    queryFn: async () => {
      if (!contentSlug) return null;
      const r = await fetch(`/api/magazine/content/${contentSlug}`);
      return r.ok ? r.json() : null;
    },
    enabled: open && !!contentSlug,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-paper-border max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-faint hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {data ? (
          <div className="p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-olive mb-3">
              {data.templateType || data.editorialCategory || "Editorial"}
            </p>
            <h2 className="font-display font-black uppercase text-3xl leading-none text-foreground mb-4">
              {data.title}
            </h2>
            {data.excerpt && (
              <p className="font-serif italic text-ink-muted text-lg leading-relaxed mb-6">
                {data.excerpt}
              </p>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="h-6 bg-paper-cool animate-pulse rounded mb-3 w-24 mx-auto" />
            <div className="h-8 bg-paper-cool animate-pulse rounded mb-4" />
          </div>
        )}
      </div>
    </div>
  );
}
