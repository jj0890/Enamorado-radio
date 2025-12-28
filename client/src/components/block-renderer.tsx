import DOMPurify from "dompurify";
import type { EditorialSection, TextBlock, ImageBlock, ImageRowBlock, PullQuoteBlock, CalloutBlock, EmbedBlock, QABlock, TemplateType } from "@shared/schema";
import QABlockRenderer from "./block-renderer/qa-block-renderer";

interface BlockRendererProps {
  sections: EditorialSection[];
  className?: string;
  templateType?: TemplateType; // Template type for styling variations
}

// Template-specific text styling
const getTextStyles = (templateType?: TemplateType): string => {
  switch (templateType) {
    case "article":
      // Serif fonts, larger text for long-form reading
      return `prose prose-xl max-w-none font-serif text-[20px] leading-[1.85] text-[var(--charcoal)]
        [&>p]:mb-8 [&>p]:text-[20px] [&>p]:leading-[1.85]
        [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-16 [&>h2]:mb-6 [&>h2]:leading-[1.2] [&>h2]:font-serif
        [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mt-12 [&>h3]:mb-5 [&>h3]:leading-[1.3] [&>h3]:font-serif
        [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--editorial)] [&>blockquote]:pl-8 [&>blockquote]:italic [&>blockquote]:text-[22px] [&>blockquote]:my-12 [&>blockquote]:leading-[1.75]
        [&>ul]:my-8 [&>ol]:my-8 [&>li]:mb-3 [&>li]:text-[20px] [&>li]:leading-[1.85]
        [&>a]:text-[var(--editorial)] [&>a]:underline [&>a]:decoration-2 [&>a]:underline-offset-2`;
    
    case "interview":
      // Sans-serif fonts, medium text for conversational flow
      return `prose prose-lg max-w-none font-sans text-[18px] leading-[1.75] text-[var(--charcoal)]
        [&>p]:mb-6 [&>p]:text-[18px] [&>p]:leading-[1.75]
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-14 [&>h2]:mb-5 [&>h2]:leading-[1.2] [&>h2]:font-sans
        [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-10 [&>h3]:mb-4 [&>h3]:leading-[1.3] [&>h3]:font-sans
        [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--editorial)] [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-[18px] [&>blockquote]:my-10 [&>blockquote]:leading-[1.7]
        [&>ul]:my-6 [&>ol]:my-6 [&>li]:mb-2 [&>li]:text-[18px] [&>li]:leading-[1.75]
        [&>a]:text-[var(--editorial)] [&>a]:underline [&>a]:decoration-1 [&>a]:underline-offset-2`;
    
    case "photo_essay":
      // Sans-serif, smaller text to let images dominate
      return `prose prose-base max-w-none font-sans text-[16px] leading-[1.7] text-[var(--charcoal)]
        [&>p]:mb-5 [&>p]:text-[16px] [&>p]:leading-[1.7]
        [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:leading-[1.2] [&>h2]:font-sans [&>h2]:tracking-wide [&>h2]:uppercase
        [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:leading-[1.3] [&>h3]:font-sans
        [&>blockquote]:border-l-2 [&>blockquote]:border-[var(--charcoal)]/40 [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-[16px] [&>blockquote]:my-8 [&>blockquote]:leading-[1.65]
        [&>ul]:my-5 [&>ol]:my-5 [&>li]:mb-2 [&>li]:text-[16px] [&>li]:leading-[1.7]
        [&>a]:text-[var(--charcoal)] [&>a]:underline [&>a]:decoration-1 [&>a]:underline-offset-2`;
    
    default:
      // Default article styling
      return `prose prose-xl max-w-none font-serif text-[19px] leading-[1.8] text-[var(--charcoal)]
        [&>p]:mb-8 [&>p]:text-[19px] [&>p]:leading-[1.8]
        [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-16 [&>h2]:mb-6 [&>h2]:leading-[1.2] [&>h2]:font-serif
        [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mt-12 [&>h3]:mb-5 [&>h3]:leading-[1.3] [&>h3]:font-serif
        [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--editorial)] [&>blockquote]:pl-8 [&>blockquote]:italic [&>blockquote]:text-[21px] [&>blockquote]:my-12 [&>blockquote]:leading-[1.75]
        [&>ul]:my-8 [&>ol]:my-8 [&>li]:mb-3 [&>li]:text-[19px] [&>li]:leading-[1.8]
        [&>a]:text-[var(--editorial)] [&>a]:underline [&>a]:decoration-2 [&>a]:underline-offset-2`;
  }
};

function TextBlockRenderer({ block, templateType }: { block: TextBlock; templateType?: TemplateType }) {
  return (
    <div 
      className={getTextStyles(templateType)}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(block.content, {
          ALLOWED_TAGS: [
            "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
            "blockquote", "ul", "ol", "li", "a", "img",
          ],
          ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
          ALLOW_DATA_ATTR: false,
        }),
      }}
      data-testid={`text-block-${block.id}`}
    />
  );
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  return (
    <figure className="my-12" data-testid={`image-block-${block.id}`}>
      <img
        src={block.src}
        alt={block.alt || ""}
        className="w-full rounded-lg shadow-md"
      />
      {(block.caption || block.credit) && (
        <figcaption className="mt-3 text-sm text-[var(--charcoal)]/60 text-center">
          {block.caption && <span>{block.caption}</span>}
          {block.caption && block.credit && <span> — </span>}
          {block.credit && <span className="italic">Photo: {block.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}

function ImageRowBlockRenderer({ block }: { block: ImageRowBlock }) {
  const gridCols = block.layout === "3-up" ? "grid-cols-3" : "grid-cols-2";
  
  return (
    <div 
      className={`grid ${gridCols} gap-4 my-12`}
      data-testid={`image-row-block-${block.id}`}
    >
      {block.images.map((image, index) => (
        <figure key={index} className="m-0">
          <img
            src={image.src}
            alt={image.alt || ""}
            className="w-full h-full object-cover rounded-lg"
          />
          {image.caption && (
            <figcaption className="mt-2 text-sm text-[var(--charcoal)]/60 text-center">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function PullQuoteBlockRenderer({ block }: { block: PullQuoteBlock }) {
  return (
    <blockquote 
      className="pull-quote"
      data-testid={`pull-quote-block-${block.id}`}
    >
      <p className="relative z-10">
        {block.quote}
      </p>
      {block.attribution && (
        <footer className="pull-quote__author">
          — {block.attribution}
        </footer>
      )}
    </blockquote>
  );
}

function CalloutBlockRenderer({ block }: { block: CalloutBlock }) {
  return (
    <aside 
      className="my-12 p-8 rounded-lg"
      style={{ 
        backgroundColor: block.backgroundColor,
        color: block.textColor 
      }}
      data-testid={`callout-block-${block.id}`}
    >
      <div
        className="prose prose-lg max-w-none
          [&>p]:mb-4 [&>p]:last:mb-0
          [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-4
          [&>ul]:my-4 [&>ol]:my-4 [&>li]:mb-2"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(block.content, {
            ALLOWED_TAGS: ["p", "br", "strong", "em", "h3", "ul", "ol", "li", "a"],
            ALLOWED_ATTR: ["href", "target", "rel"],
          }),
        }}
      />
    </aside>
  );
}

function EmbedBlockRenderer({ block }: { block: EmbedBlock }) {
  if (block.embedHtml) {
    return (
      <div 
        className="my-12"
        data-testid={`embed-block-${block.id}`}
      >
        <div
          className="w-full [&>iframe]:w-full [&>iframe]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: block.embedHtml }}
        />
        {block.platform && (
          <p className="mt-2 text-sm text-[var(--charcoal)]/50 text-center">
            via {block.platform}
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      className="my-12 p-6 bg-gray-100 rounded-lg text-center"
      data-testid={`embed-block-${block.id}`}
    >
      <p className="text-[var(--charcoal)]/60 mb-4">Embedded content</p>
      <a 
        href={block.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-[var(--editorial)] underline"
      >
        View on {block.platform || "external site"}
      </a>
    </div>
  );
}

export default function BlockRenderer({ sections, className = "", templateType }: BlockRendererProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Get max width based on template type
  const getMaxWidth = () => {
    if (templateType === "photo_essay") return "max-w-[85ch]";
    return "max-w-[65ch]";
  };

  return (
    <div className={`${getMaxWidth()} mx-auto ${className}`} data-testid="block-renderer">
      {sections.map((section) => {
        switch (section._type) {
          case "text":
            return <TextBlockRenderer key={section.id} block={section} templateType={templateType} />;
          case "image":
            return <ImageBlockRenderer key={section.id} block={section} />;
          case "imageRow":
            return <ImageRowBlockRenderer key={section.id} block={section} />;
          case "pullQuote":
            return <PullQuoteBlockRenderer key={section.id} block={section} />;
          case "callout":
            return <CalloutBlockRenderer key={section.id} block={section} />;
          case "embed":
            return <EmbedBlockRenderer key={section.id} block={section} />;
          case "qa":
            return <QABlockRenderer key={section.id} block={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
