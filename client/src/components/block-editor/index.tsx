import { useState, useCallback } from "react";
import { Plus, GripVertical, Trash2, Type, Image, Quote, MessageSquare, Play, LayoutGrid, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { EditorialSection } from "@shared/schema";
import TextBlockEditor from "./text-block-editor";
import ImageBlockEditor from "./image-block-editor";
import ImageRowBlockEditor from "./image-row-block-editor";
import PullQuoteBlockEditor from "./pull-quote-block-editor";
import CalloutBlockEditor from "./callout-block-editor";
import EmbedBlockEditor from "./embed-block-editor";
import QABlockEditor from "./qa-block-editor";

interface BlockEditorProps {
  sections: EditorialSection[];
  onChange: (sections: EditorialSection[]) => void;
}

type BlockType = EditorialSection["_type"];

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: "text", label: "Text", icon: Type, description: "Rich text content" },
  { type: "image", label: "Full Image", icon: Image, description: "Full-width image with caption" },
  { type: "imageRow", label: "Image Row", icon: LayoutGrid, description: "2 or 3 images side by side" },
  { type: "pullQuote", label: "Pull Quote", icon: Quote, description: "Highlighted quote" },
  { type: "callout", label: "Callout", icon: MessageSquare, description: "Colored background box" },
  { type: "embed", label: "Embed", icon: Play, description: "YouTube, Spotify, etc." },
  { type: "qa", label: "Q&A", icon: MessagesSquare, description: "Interview question and answer" },
];

function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyBlock(type: BlockType): EditorialSection {
  const id = generateId();
  
  switch (type) {
    case "text":
      return { _type: "text", id, content: "" };
    case "image":
      return { _type: "image", id, src: "", alt: "", caption: "", credit: "" };
    case "imageRow":
      return { _type: "imageRow", id, images: [], layout: "2-up" };
    case "pullQuote":
      return { _type: "pullQuote", id, quote: "", attribution: "" };
    case "callout":
      return { _type: "callout", id, content: "", backgroundColor: "#ffc0e6", textColor: "#2A2A2A" };
    case "embed":
      return { _type: "embed", id, url: "", embedHtml: "", platform: "" };
    case "qa":
      return { _type: "qa", id, questionLabel: "Q:", answerLabel: "A:", question: "", answer: "" };
    default:
      return { _type: "text", id, content: "" };
  }
}

function BlockTypeIcon({ type }: { type: BlockType }) {
  const blockType = BLOCK_TYPES.find(b => b.type === type);
  if (!blockType) return null;
  const IconComponent = blockType.icon;
  return <IconComponent className="w-4 h-4" />;
}

function BlockTypePicker({ onSelect, onClose }: { onSelect: (type: BlockType) => void; onClose: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {BLOCK_TYPES.map((blockType) => {
        const IconComponent = blockType.icon;
        return (
          <button
            key={blockType.type}
            onClick={() => {
              onSelect(blockType.type);
              onClose();
            }}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[var(--editorial)] hover:bg-orange-50 transition-colors text-left"
            data-testid={`add-block-${blockType.type}`}
          >
            <IconComponent className="w-5 h-5 text-[var(--editorial)] mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-[var(--charcoal)]">{blockType.label}</div>
              <div className="text-xs text-gray-500">{blockType.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BlockWrapper({
  block,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: EditorialSection;
  index: number;
  onUpdate: (block: EditorialSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const blockType = BLOCK_TYPES.find(b => b.type === block._type);

  return (
    <div 
      className="group relative border border-gray-200 rounded-lg bg-white mb-4 overflow-hidden"
      data-testid={`block-wrapper-${block.id}`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
            data-testid={`move-up-${block.id}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
            data-testid={`move-down-${block.id}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2 flex-1">
          <BlockTypeIcon type={block._type} />
          <span className="text-sm font-medium text-gray-600">{blockType?.label || block._type}</span>
        </div>
        
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete block"
          data-testid={`delete-block-${block.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Block Content */}
      <div className="p-4">
        {block._type === "text" && (
          <TextBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "image" && (
          <ImageBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "imageRow" && (
          <ImageRowBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "pullQuote" && (
          <PullQuoteBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "callout" && (
          <CalloutBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "embed" && (
          <EmbedBlockEditor block={block} onChange={onUpdate} />
        )}
        {block._type === "qa" && (
          <QABlockEditor block={block} onChange={onUpdate} />
        )}
      </div>
    </div>
  );
}

export default function BlockEditor({ sections, onChange }: BlockEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createEmptyBlock(type);
    const newSections = [...sections];
    
    if (insertIndex !== null) {
      newSections.splice(insertIndex, 0, newBlock);
      setInsertIndex(null);
    } else {
      newSections.push(newBlock);
    }
    
    onChange(newSections);
  }, [sections, onChange, insertIndex]);

  const handleUpdateBlock = useCallback((index: number, updatedBlock: EditorialSection) => {
    const newSections = [...sections];
    newSections[index] = updatedBlock;
    onChange(newSections);
  }, [sections, onChange]);

  const handleDeleteBlock = useCallback((index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    onChange(newSections);
  }, [sections, onChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    onChange(newSections);
  }, [sections, onChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    onChange(newSections);
  }, [sections, onChange]);

  return (
    <div className="block-editor" data-testid="block-editor">
      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Type className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No content blocks yet</p>
          <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--editorial)] hover:bg-[var(--editorial)]/90" data-testid="add-first-block">
                <Plus className="w-4 h-4 mr-2" />
                Add First Block
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Block</DialogTitle>
              </DialogHeader>
              <BlockTypePicker 
                onSelect={handleAddBlock} 
                onClose={() => setIsPickerOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {sections.map((block, index) => (
            <BlockWrapper
              key={block.id}
              block={block}
              index={index}
              onUpdate={(updated) => handleUpdateBlock(index, updated)}
              onDelete={() => handleDeleteBlock(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
            />
          ))}
          
          {/* Add block button at the bottom */}
          <div className="flex justify-center pt-4">
            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-dashed border-2"
                  data-testid="add-block-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Block</DialogTitle>
                </DialogHeader>
                <BlockTypePicker 
                  onSelect={handleAddBlock} 
                  onClose={() => setIsPickerOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}
    </div>
  );
}
