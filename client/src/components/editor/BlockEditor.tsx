import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

interface BlockEditorProps {
  /** JSON string of BlockNote Block[] array, or legacy HTML string */
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
  /** Optional project ID used for image uploads */
  projectId?: number | null;
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch("/api/editorial/media/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  const url = data.uploaded?.[0]?.url;
  if (!url) throw new Error("No URL returned");
  return url;
}

function parseContent(raw: string): Block[] | undefined {
  if (!raw || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    // BlockNote content is an array of blocks
    if (Array.isArray(parsed)) return parsed as Block[];
  } catch {
    // Legacy HTML — can't convert automatically, start fresh
  }
  return undefined;
}

export function BlockEditor({ content, onChange, placeholder, projectId }: BlockEditorProps) {
  const initialContent = useRef(parseContent(content));

  const editor = useCreateBlockNote({
    initialContent: initialContent.current,
    uploadFile,
    placeholders: {
      default: placeholder ?? "Write something… or type / for blocks",
    },
  });

  // Sync outward on every change
  useEffect(() => {
    if (!editor) return;
    const unsubscribe = editor.onEditorContentChange(() => {
      const blocks = editor.document;
      onChange(JSON.stringify(blocks));
    });
    return unsubscribe;
  }, [editor, onChange]);

  return (
    <div
      className="min-h-[480px] rounded-md overflow-hidden"
      style={{
        // Override BlockNote defaults to match site's dark/editorial aesthetic
        "--bn-colors-editor-background": "transparent",
        "--bn-colors-editor-text": "inherit",
        "--bn-font-family": "'EB Garamond', 'Georgia', serif",
      } as React.CSSProperties}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
        className="blocknote-editorial"
      />
    </div>
  );
}

export default BlockEditor;
