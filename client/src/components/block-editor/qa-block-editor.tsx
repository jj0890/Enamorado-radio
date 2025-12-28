import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QABlock } from "@shared/schema";

interface QABlockEditorProps {
  block: QABlock;
  onChange: (block: QABlock) => void;
}

function MiniEditor({ 
  content, 
  onChange, 
  placeholder,
  testId 
}: { 
  content: string; 
  onChange: (content: string) => void;
  placeholder: string;
  testId: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[60px] focus:outline-none [&>p]:mb-2",
      },
    },
  });

  if (!editor) {
    return <div className="min-h-[60px] bg-gray-50 rounded animate-pulse" />;
  }

  return (
    <div data-testid={testId}>
      <div className="flex gap-1 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-3 h-3" />
        </Button>
      </div>
      <div className="border rounded-md p-3 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default function QABlockEditor({ block, onChange }: QABlockEditorProps) {
  return (
    <div className="qa-block-editor space-y-4" data-testid="qa-block-editor">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="questionLabel">Question Label</Label>
          <Input
            id="questionLabel"
            value={block.questionLabel || "Q:"}
            onChange={(e) => onChange({ ...block, questionLabel: e.target.value })}
            placeholder="TCI:"
            className="font-semibold"
            data-testid="input-question-label"
          />
          <p className="text-xs text-gray-500 mt-1">e.g., interviewer name or "TCI:"</p>
        </div>
        <div>
          <Label htmlFor="answerLabel">Answer Label</Label>
          <Input
            id="answerLabel"
            value={block.answerLabel || "A:"}
            onChange={(e) => onChange({ ...block, answerLabel: e.target.value })}
            placeholder="Bret McKenzie:"
            className="font-semibold"
            data-testid="input-answer-label"
          />
          <p className="text-xs text-gray-500 mt-1">e.g., interviewee name</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block font-semibold text-[var(--editorial)]">
            {block.questionLabel || "Question"}
          </Label>
          <MiniEditor
            content={block.question}
            onChange={(q) => onChange({ ...block, question: q })}
            placeholder="Type the question..."
            testId="editor-question"
          />
        </div>

        <div>
          <Label className="mb-2 block font-semibold text-[var(--charcoal)]">
            {block.answerLabel || "Answer"}
          </Label>
          <MiniEditor
            content={block.answer}
            onChange={(a) => onChange({ ...block, answer: a })}
            placeholder="Type the answer..."
            testId="editor-answer"
          />
        </div>
      </div>

      {(block.question || block.answer) && (
        <div className="mt-6 p-6 bg-[#FAFAF9] rounded-lg border-l-4 border-[var(--editorial)]">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Preview</p>
          <div className="space-y-4">
            <p className="text-base">
              <strong className="text-[var(--editorial)]">{block.questionLabel || "Q:"}</strong>{" "}
              <span dangerouslySetInnerHTML={{ __html: block.question || "<em>Question text...</em>" }} />
            </p>
            <p className="text-base">
              <strong className="text-[var(--charcoal)]">{block.answerLabel || "A:"}</strong>{" "}
              <span dangerouslySetInnerHTML={{ __html: block.answer || "<em>Answer text...</em>" }} />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
