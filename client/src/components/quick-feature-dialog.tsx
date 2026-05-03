import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuickFeatureDialogProps {
  open: boolean;
  onClose: () => void;
  onFeature: (contentId: string) => void;
  contentId?: string;
}

export function QuickFeatureDialog({ open, onClose, onFeature, contentId }: QuickFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature This Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Are you sure you want to feature this content?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (contentId) onFeature(contentId);
                onClose();
              }}
            >
              Feature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
