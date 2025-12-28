import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CalloutBlock } from "@shared/schema";

interface CalloutBlockEditorProps {
  block: CalloutBlock;
  onChange: (block: CalloutBlock) => void;
}

const PRESET_COLORS = [
  { name: "Pink", bg: "#ffc0e6", text: "#2A2A2A" },
  { name: "Orange", bg: "#FFE4CC", text: "#2A2A2A" },
  { name: "Yellow", bg: "#FFF3CD", text: "#2A2A2A" },
  { name: "Green", bg: "#D4EDDA", text: "#2A2A2A" },
  { name: "Blue", bg: "#CCE5FF", text: "#2A2A2A" },
  { name: "Purple", bg: "#E2D9F3", text: "#2A2A2A" },
  { name: "Gray", bg: "#E2E3E5", text: "#2A2A2A" },
  { name: "Dark", bg: "#2A2A2A", text: "#FFFFFF" },
];

export default function CalloutBlockEditor({ block, onChange }: CalloutBlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
      }),
      Placeholder.configure({
        placeholder: "Add callout content...",
      }),
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onChange({
        ...block,
        content: editor.getHTML(),
      });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[80px] focus:outline-none [&>p]:mb-2 [&>ul]:my-2 [&>ol]:my-2",
        style: `color: ${block.textColor}`,
      },
    },
  });

  if (!editor) {
    return <div className="min-h-[80px] bg-gray-50 rounded animate-pulse" />;
  }

  return (
    <div className="callout-block-editor space-y-4" data-testid="callout-block-editor">
      {/* Color Presets */}
      <div>
        <Label className="mb-2 block">Background Color</Label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => onChange({ ...block, backgroundColor: color.bg, textColor: color.text })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                block.backgroundColor === color.bg 
                  ? "border-[var(--editorial)] scale-110" 
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color.bg }}
              title={color.name}
              data-testid={`color-${color.name.toLowerCase()}`}
            />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="color"
              value={block.backgroundColor}
              onChange={(e) => onChange({ ...block, backgroundColor: e.target.value })}
              className="w-8 h-8 p-0 border-0 cursor-pointer"
              data-testid="custom-color"
            />
            <span className="text-xs text-gray-500">Custom</span>
          </div>
        </div>
      </div>

      {/* Preview with Editor */}
      <div
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: block.backgroundColor,
          color: block.textColor 
        }}
      >
        {/* Mini Toolbar */}
        <div className="flex gap-1 mb-2 pb-2 border-b opacity-70">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-6 px-2 ${editor.isActive("bold") ? "bg-black/10" : ""}`}
            data-testid="toolbar-bold"
          >
            <Bold className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-6 px-2 ${editor.isActive("italic") ? "bg-black/10" : ""}`}
            data-testid="toolbar-italic"
          >
            <Italic className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-6 px-2 ${editor.isActive("bulletList") ? "bg-black/10" : ""}`}
            data-testid="toolbar-bullet-list"
          >
            <List className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-6 px-2 ${editor.isActive("orderedList") ? "bg-black/10" : ""}`}
            data-testid="toolbar-ordered-list"
          >
            <ListOrdered className="w-3 h-3" />
          </Button>
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
