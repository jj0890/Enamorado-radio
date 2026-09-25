import { FileText } from "lucide-react";

/**
 * PDF thumbnail component.
 * Displays a "PDF" placeholder. Install `pdfjs-dist` and upgrade this
 * component to render a real page preview when needed.
 */
type Props = {
  url: string;
  className?: string;
  page?: number;
  dpi?: number;
};

export default function PDFThumb({ url, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-paper-cool border border-paper-border gap-2 ${className}`}
      title={url}
    >
      <FileText className="w-8 h-8 text-ink-faint" />
      <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">PDF</span>
    </div>
  );
}
