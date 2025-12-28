import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImageRowBlock } from "@shared/schema";

interface ImageRowBlockEditorProps {
  block: ImageRowBlock;
  onChange: (block: ImageRowBlock) => void;
}

export default function ImageRowBlockEditor({ block, onChange }: ImageRowBlockEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleLayoutChange = (layout: "2-up" | "3-up") => {
    onChange({ ...block, layout });
  };

  const handleAddImage = () => {
    const maxImages = block.layout === "3-up" ? 3 : 2;
    if (block.images.length >= maxImages) return;
    
    onChange({
      ...block,
      images: [...block.images, { src: "", alt: "", caption: "" }],
    });
  };

  const handleRemoveImage = (index: number) => {
    onChange({
      ...block,
      images: block.images.filter((_, i) => i !== index),
    });
  };

  const handleImageChange = (index: number, field: "src" | "alt" | "caption", value: string) => {
    const newImages = [...block.images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange({ ...block, images: newImages });
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleImageChange(index, "src", data.url);
        handleImageChange(index, "alt", file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const maxImages = block.layout === "3-up" ? 3 : 2;

  return (
    <div className="image-row-block-editor space-y-4" data-testid="image-row-block-editor">
      {/* Layout Selector */}
      <div className="flex items-center gap-4">
        <Label>Layout</Label>
        <Select value={block.layout} onValueChange={handleLayoutChange}>
          <SelectTrigger className="w-32" data-testid="layout-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2-up">2 Images</SelectItem>
            <SelectItem value="3-up">3 Images</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Images Grid */}
      <div className={`grid gap-4 ${block.layout === "3-up" ? "grid-cols-3" : "grid-cols-2"}`}>
        {block.images.map((image, index) => (
          <div key={index} className="relative border rounded-lg p-3 space-y-2">
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              data-testid={`remove-image-${index}`}
            >
              <X className="w-4 h-4" />
            </button>

            {image.src ? (
              <img
                src={image.src}
                alt={image.alt || ""}
                className="w-full h-24 object-cover rounded"
              />
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-[var(--editorial)]">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">
                  {uploadingIndex === index ? "Uploading..." : "Upload"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(index, e)}
                  disabled={uploadingIndex !== null}
                  data-testid={`file-input-${index}`}
                />
              </label>
            )}

            <Input
              value={image.src}
              onChange={(e) => handleImageChange(index, "src", e.target.value)}
              placeholder="Image URL"
              className="text-xs"
              data-testid={`input-src-${index}`}
            />
            <Input
              value={image.caption || ""}
              onChange={(e) => handleImageChange(index, "caption", e.target.value)}
              placeholder="Caption (optional)"
              className="text-xs"
              data-testid={`input-caption-${index}`}
            />
          </div>
        ))}

        {/* Add Image Button */}
        {block.images.length < maxImages && (
          <button
            onClick={handleAddImage}
            className="flex flex-col items-center justify-center h-full min-h-[150px] border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--editorial)] hover:bg-orange-50 transition-colors"
            data-testid="add-image"
          >
            <Plus className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">Add Image</span>
          </button>
        )}
      </div>
    </div>
  );
}
