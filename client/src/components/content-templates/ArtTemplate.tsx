// client/src/components/content-templates/ArtTemplate.tsx
import { ExternalLink, Download, ZoomIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/like-button";
import { Separator } from "@/components/ui/separator";
import PDFViewer from "@/components/pdf-viewer";
import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface FileItem {
  url: string;
  type: string;
  name?: string;
}

interface GalleryItem {
  src: string;
  caption?: string;
  credit?: string;
  alt?: string;
}

interface Content {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  authors: string[];
  coverImageUrl?: string;
  originChannel?: string;
  provider?: string;
  files?: FileItem[];
  gallery?: GalleryItem[];
  credits?: string;
  externalUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  likes?: number;
  publishedAt?: string;
}

interface OEmbedMeta {
  platform: string;
  title: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
  description: string | null;
}

interface ArtTemplateProps {
  content: Content;
  oembed?: OEmbedMeta | null;
  layout?: 'pane' | 'full';
  onShare?: () => void;
  formatDate?: (date: string) => string;
  estimateReadingTime?: (text: string) => number;
  labelForPlatform?: (platform?: string, kind?: string) => string;
  isPreview?: boolean;
}

export default function ArtTemplate({ 
  content, 
  oembed, 
  layout = 'full', 
  onShare,
  formatDate,
  estimateReadingTime,
  labelForPlatform,
  isPreview = false
}: ArtTemplateProps) {
  const isCommunity = content.originChannel === 'community';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Get images from gallery or files
  const galleryImages = content.gallery?.map(item => ({
    url: item.src,
    caption: item.caption,
    credit: item.credit || content.credits,
    alt: item.alt,
  })) || [];
  
  const fileImages = content.files?.filter(file => 
    file.type.startsWith('image/') || file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ).map(file => ({
    url: file.url,
    caption: file.name,
    credit: content.credits,
    alt: file.name,
  })) || [];
  
  // Combine all image sources
  let allImages = [...galleryImages, ...fileImages];
  
  // Add coverImageUrl if it exists and isn't already in the array
  if (content.coverImageUrl && !allImages.find(img => img.url === content.coverImageUrl)) {
    allImages.unshift({
      url: content.coverImageUrl,
      caption: undefined,
      credit: content.credits,
      alt: content.title,
    });
  }
  
  // Get primary image
  const primaryImage = content.coverImageUrl || allImages[0]?.url;
  
  // Get PDF files
  const pdfFiles = content.files?.filter(file => 
    file.type === 'application/pdf' || file.url.endsWith('.pdf')
  ) || [];

  if (layout === 'pane') {
    // 35/65 split: compact meta left, spacious viewer right (matches playlist layout)
    return (
      <div className="h-full flex flex-col md:flex-row bg-[var(--cream)]">
        {/* Left: Meta Card - Mobile: full width stacked second. Desktop: 35% left */}
        <div className="w-full md:w-[35%] p-6 flex flex-col overflow-y-auto md:order-1 order-2">
          <div className="flex-1">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                {pdfFiles.length > 0 ? 'PDF' : 'ART'}
              </Badge>
              {isCommunity && (
                <Badge variant="outline" className="ml-2">COMMUNITY</Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--charcoal)] mb-4 leading-tight">
              {content.title}
            </h1>
            
            {/* Artist info */}
            <div className="mb-4 space-y-2">
              {content.authors?.length > 0 && (
                <p className="text-[var(--charcoal)]/70">
                  by {content.authors.join(', ')}
                </p>
              )}
              {content.publishedAt && formatDate && (
                <p className="text-sm text-[var(--charcoal)]/60">
                  {formatDate(content.publishedAt)}
                </p>
              )}
            </div>
            
            {/* Description */}
            {content.excerpt && (
              <p className="text-[var(--charcoal)]/80 mb-6 leading-relaxed">
                {content.excerpt}
              </p>
            )}
            
            {/* File count info */}
            {(allImages.length > 0 || pdfFiles.length > 0) && (
              <div className="mb-6 text-sm text-[var(--charcoal)]/60">
                {allImages.length > 0 && (
                  <p>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</p>
                )}
                {pdfFiles.length > 0 && (
                  <p>{pdfFiles.length} PDF{pdfFiles.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            )}
            
            {/* Download buttons */}
            {content.files && content.files.length > 0 && (
              <div className="space-y-2 mb-4">
                {content.files.slice(0, 3).map((file, index) => (
                  <Button
                    key={index}
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`download-file-${index}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {file.name || `File ${index + 1}`}
                    </a>
                  </Button>
                ))}
                {content.files.length > 3 && (
                  <p className="text-xs text-[var(--charcoal)]/60">
                    +{content.files.length - 3} more files
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isCommunity && (
              <LikeButton id={content.id} initial={content.likes || 0} />
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare}>
                Share
              </Button>
            )}
          </div>
        </div>
        
        {/* Right: Viewer - Mobile: full width stacked first. Desktop: 65% right (spacious) */}
        <div className="w-full md:w-[65%] bg-white md:border-l overflow-hidden flex flex-col md:order-2 order-1 min-h-[320px] md:min-h-[600px]">
          {primaryImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img
                src={primaryImage}
                alt={content.title}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                style={{
                  aspectRatio: content.coverWidth && content.coverHeight 
                    ? `${content.coverWidth}/${content.coverHeight}` 
                    : 'auto'
                }}
                onClick={() => setSelectedImage(primaryImage)}
                data-testid="art-viewer"
              />
            </div>
          ) : pdfFiles.length > 0 ? (
            <div className="w-full h-full bg-white overflow-auto flex items-start justify-center">
              <PDFViewer 
                url={pdfFiles[0].url}
                title={content.title}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500 mb-4">No preview available</p>
              {content.externalUrl && (
                <Button asChild variant="outline">
                  <a
                    href={content.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View External
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Lightbox modal with navigation */}
        {selectedImage && allImages.length > 0 && (() => {
          const currentIndex = allImages.findIndex(img => img.url === selectedImage);
          const currentImage = allImages[currentIndex];
          const hasPrev = currentIndex > 0;
          const hasNext = currentIndex < allImages.length - 1;
          
          const goToPrev = () => {
            if (hasPrev) setSelectedImage(allImages[currentIndex - 1].url);
          };
          
          const goToNext = () => {
            if (hasNext) setSelectedImage(allImages[currentIndex + 1].url);
          };
          
          return (
            <div 
              className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
              data-testid="lightbox-modal"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt={currentImage?.alt || content.title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Navigation arrows */}
                {hasPrev && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 border border-white/30 text-white p-3 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                
                {hasNext && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 border border-white/30 text-white p-3 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Image counter and info */}
              {allImages.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {allImages.length}
                </div>
              )}
              
              {/* Caption/credit */}
              {(currentImage?.caption || currentImage?.credit) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl text-center text-white text-sm space-y-1">
                  {currentImage.caption && <p>{currentImage.caption}</p>}
                  {currentImage.credit && <p className="opacity-75">Credit: {currentImage.credit}</p>}
                </div>
              )}
              
              {/* Close button */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              >
                Close
              </Button>
            </div>
          );
        })()}
      </div>
    );
  }

  // Full page: Clean photoshoot gallery (wefolk.com style)
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Minimal header - Title and credit only */}
        <header className="mb-12 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-normal text-[var(--charcoal)] mb-2">
            {content.title}
          </h1>
          
          {/* Simple credit line */}
          {content.authors?.length > 0 && (
            <p className="text-base text-[var(--charcoal)]/60">
              {content.authors.join(', ')}
            </p>
          )}
        </header>
        
        {/* Content */}
        <div className="mb-8">
          {pdfFiles.length > 0 ? (
            // PDF viewer full width with white background
            <PDFViewer 
              url={pdfFiles[0].url}
              title={content.title}
              className="w-full"
            />
          ) : allImages.length > 0 ? (
            // Clean photoshoot stack - wefolk.com style
            <div className="space-y-16 max-w-[1400px] mx-auto" data-testid="gallery-container">
              {allImages.map((image, index) => (
                <div 
                  key={index}
                  className="w-full cursor-zoom-in"
                  onClick={() => setSelectedImage(image.url)}
                  data-testid={`gallery-item-${index}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || content.title}
                    className="w-full h-auto"
                    data-testid={`gallery-image-${index}`}
                  />
                </div>
              ))}
            </div>
          ) : primaryImage ? (
            // Single primary image
            <div className="text-center">
              <img
                src={primaryImage}
                alt={content.title}
                className="max-w-full max-h-[70vh] mx-auto object-contain rounded-lg shadow-lg cursor-zoom-in"
                style={{
                  aspectRatio: content.coverWidth && content.coverHeight 
                    ? `${content.coverWidth}/${content.coverHeight}` 
                    : 'auto'
                }}
                onClick={() => setSelectedImage(primaryImage)}
                data-testid="primary-image"
              />
            </div>
          ) : null}
        </div>
        
        {/* Minimal footer with essential actions */}
        <div className="mt-24 mb-12 max-w-[1400px] mx-auto space-y-6">
          {/* Actions - Like and Share */}
          {(isCommunity || onShare) && (
            <div className="flex items-center gap-4">
              {isCommunity && <LikeButton id={content.id} initial={content.likes || 0} />}
              {onShare && (
                <button
                  onClick={onShare}
                  className="text-sm text-[var(--charcoal)]/60 hover:text-[var(--charcoal)] transition-colors inline-flex items-center gap-2"
                >
                  Share
                </button>
              )}
            </div>
          )}
          
          {/* Download links for all files */}
          {content.files && content.files.length > 0 && (
            <div className="space-y-2">
              {content.files.map((file, index) => (
                <div key={index}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--charcoal)]/60 hover:text-[var(--charcoal)] transition-colors inline-flex items-center gap-2"
                    data-testid={`download-file-${index}`}
                  >
                    <Download className="w-4 h-4" />
                    {file.name || `Download ${file.type.includes('pdf') ? 'PDF' : 'File'}`}
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {/* Back navigation */}
          {!isPreview && (
            <Link href={isCommunity ? "/community" : "/editorials"}>
              <button className="text-[var(--charcoal)]/60 hover:text-[var(--charcoal)] transition-colors text-sm font-medium">
                ← {isCommunity ? "Back" : "Back to Editorials"}
              </button>
            </Link>
          )}
        </div>
        
        {/* Lightbox modal with navigation */}
        {selectedImage && allImages.length > 0 && (() => {
          const currentIndex = allImages.findIndex(img => img.url === selectedImage);
          const currentImage = allImages[currentIndex];
          const hasPrev = currentIndex > 0;
          const hasNext = currentIndex < allImages.length - 1;
          
          const goToPrev = () => {
            if (hasPrev) setSelectedImage(allImages[currentIndex - 1].url);
          };
          
          const goToNext = () => {
            if (hasNext) setSelectedImage(allImages[currentIndex + 1].url);
          };
          
          return (
            <div 
              className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
              data-testid="lightbox-modal"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt={currentImage?.alt || content.title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Navigation arrows */}
                {hasPrev && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 border border-white/30 text-white p-3 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                
                {hasNext && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 border border-white/30 text-white p-3 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Image counter and info */}
              {allImages.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {allImages.length}
                </div>
              )}
              
              {/* Caption/credit */}
              {(currentImage?.caption || currentImage?.credit) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl text-center text-white text-sm space-y-1">
                  {currentImage.caption && <p>{currentImage.caption}</p>}
                  {currentImage.credit && <p className="opacity-75">Credit: {currentImage.credit}</p>}
                </div>
              )}
              
              {/* Close button */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              >
                Close
              </Button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}