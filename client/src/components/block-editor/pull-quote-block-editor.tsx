import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { PullQuoteBlock } from "@shared/schema";

interface PullQuoteBlockEditorProps {
  block: PullQuoteBlock;
  onChange: (block: PullQuoteBlock) => void;
}

export default function PullQuoteBlockEditor({ block, onChange }: PullQuoteBlockEditorProps) {
  return (
    <div className="pull-quote-block-editor space-y-4" data-testid="pull-quote-block-editor">
      {/* Preview */}
      {block.quote && (
        <div className="p-6 border-y-2 border-[var(--editorial)] bg-orange-50/50 rounded">
          <p className="text-xl font-serif italic text-center text-[var(--charcoal)]">
            "{block.quote}"
          </p>
          {block.attribution && (
            <p className="text-sm text-center text-gray-500 mt-2">
              — {block.attribution}
            </p>
          )}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="quote">Quote</Label>
          <Textarea
            id="quote"
            value={block.quote}
            onChange={(e) => onChange({ ...block, quote: e.target.value })}
            placeholder="Enter the quote text..."
            rows={3}
            className="font-serif"
            data-testid="input-quote"
          />
        </div>
        <div>
          <Label htmlFor="attribution">Attribution (optional)</Label>
          <Input
            id="attribution"
            value={block.attribution || ""}
            onChange={(e) => onChange({ ...block, attribution: e.target.value })}
            placeholder="Who said this?"
            data-testid="input-attribution"
          />
        </div>
      </div>
    </div>
  );
}
