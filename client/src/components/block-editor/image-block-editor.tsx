import { useState } from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ImageBlock } from "@shared/schema";

interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
}

export default function ImageBlockEditor({ block, onChange }: ImageBlockEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onChange({
          ...block,
          src: data.url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange({
      ...block,
      src: url,
    });
  };

  return (
    <div className="image-block-editor space-y-4" data-testid="image-block-editor">
      {block.src ? (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={block.src}
              alt={block.alt || ""}
              className="w-full max-h-64 object-contain rounded-lg bg-gray-100"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onChange({ ...block, src: "" })}
              data-testid="remove-image"
            >
              Change Image
            </Button>
          </div>

          {/* Metadata Fields */}
          <div className="grid gap-3">
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={block.alt || ""}
                onChange={(e) => onChange({ ...block, alt: e.target.value })}
                placeholder="Describe the image"
                data-testid="input-alt"
              />
            </div>
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={block.caption || ""}
                onChange={(e) => onChange({ ...block, caption: e.target.value })}
                placeholder="Image caption (optional)"
                data-testid="input-caption"
              />
            </div>
            <div>
              <Label htmlFor="credit">Photo Credit</Label>
              <Input
                id="credit"
                value={block.credit || ""}
                onChange={(e) => onChange({ ...block, credit: e.target.value })}
                placeholder="Photographer name (optional)"
                data-testid="input-credit"
              />
            </div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--editorial)] hover:bg-orange-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {isUploading ? "Uploading..." : "Click to upload image"}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                data-testid="file-input"
              />
            </label>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={block.src}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                data-testid="input-url"
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
