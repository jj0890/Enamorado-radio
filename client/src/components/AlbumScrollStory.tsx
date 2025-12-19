import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Share2, Music, ExternalLink, X, Play, ArrowLeft } from "lucide-react";
import { SiSpotify, SiApplemusic, SiBandcamp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Top10List, type Top10Album } from "@/data/top10Albums2025";
import { Link } from "wouter";

interface AlbumScrollStoryProps {
  list: Top10List;
  onClose?: () => void;
}

export function AlbumScrollStory({ list, onClose }: AlbumScrollStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedWriteUp, setExpandedWriteUp] = useState(false);
  const { toast } = useToast();
  
  const totalPanels = list.albums.length + 2;
  
  const scrollToPanel = useCallback((index: number) => {
    if (containerRef.current && index >= 0 && index < totalPanels) {
      const panels = containerRef.current.querySelectorAll('[data-panel]');
      if (panels[index]) {
        panels[index].scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [totalPanels]);
  
  const getAlbumPanelIndex = (rank: number): number => {
    const albumIdx = list.albums.findIndex(a => a.rank === rank);
    if (albumIdx === -1) return -1;
    return albumIdx + 1;
  };
  
  const getProgressLabel = (): string => {
    if (activeIndex === 0) return 'Intro';
    if (activeIndex === totalPanels - 1) return 'End';
    const albumRank = list.albums[activeIndex - 1]?.rank;
    return albumRank ? `#${albumRank}` : '';
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToPanel(Math.min(activeIndex + 1, totalPanels - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToPanel(Math.max(activeIndex - 1, 0));
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key >= '1' && e.key <= '9') {
        const rank = parseInt(e.key);
        const panelIndex = getAlbumPanelIndex(rank);
        if (panelIndex !== -1) {
          scrollToPanel(panelIndex);
        }
      } else if (e.key === '0') {
        const panelIndex = getAlbumPanelIndex(10);
        if (panelIndex !== -1) {
          scrollToPanel(panelIndex);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToPanel, totalPanels, onClose, list.albums]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const panels = container.querySelectorAll('[data-panel]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt((entry.target as HTMLElement).dataset.panel || '0');
            setActiveIndex(index);
            setExpandedWriteUp(false);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    
    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, []);
  
  const handleShare = async (album?: Top10Album) => {
    const shareText = album 
      ? `${album.rank}. ${album.artist} - ${album.title} | ${list.title}`
      : list.title;
    const shareUrl = `${window.location.origin}/albums/${list.slug}${album ? `#${album.rank}` : ''}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share it with friends who need good music.",
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {onClose ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-close-story"
          >
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Link href="/albums">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-albums"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare()}
          className="text-white/70 hover:text-white hover:bg-white/10"
          data-testid="button-share-list"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-1.5">
        {Array.from({ length: totalPanels }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToPanel(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              activeIndex === i 
                ? 'bg-white scale-125' 
                : 'bg-white/30 hover:bg-white/60'
            }`}
            aria-label={i === 0 ? 'Intro' : i === totalPanels - 1 ? 'End' : `Album #${list.albums[i - 1]?.rank || i}`}
            data-testid={`progress-dot-${i}`}
          />
        ))}
      </div>
      
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        <IntroPanel 
          list={list} 
          onNext={() => scrollToPanel(1)} 
        />
        
        {list.albums.map((album, index) => (
          <AlbumPanel
            key={album.rank}
            album={album}
            index={index + 1}
            totalAlbums={list.albums.length}
            isExpanded={expandedWriteUp && activeIndex === index + 1}
            onToggleExpand={() => setExpandedWriteUp(!expandedWriteUp)}
            onShare={() => handleShare(album)}
            onNext={() => scrollToPanel(index + 2)}
            onPrev={() => scrollToPanel(index)}
          />
        ))}
        
        <OutroPanel 
          list={list} 
          onRestart={() => scrollToPanel(0)}
          onShare={() => handleShare()}
        />
      </div>
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full">
        <span className="text-white/60 text-sm font-mono" data-testid="mobile-progress">
          {getProgressLabel()}
        </span>
      </div>
    </div>
  );
}

function IntroPanel({ list, onNext }: { list: Top10List; onNext: () => void }) {
  return (
    <div 
      data-panel="0"
      className="h-screen snap-start flex flex-col items-center justify-center relative px-6 py-16"
      style={{
        background: 'linear-gradient(135deg, #003F87 0%, #001F43 50%, #000 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center"
      >
        <Badge className="mb-6 bg-white/10 text-white border-white/20 font-mono">
          {list.year} YEAR IN REVIEW
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono tracking-tight">
          {list.title}
        </h1>
        
        <div className="prose prose-lg prose-invert mx-auto mb-10">
          {list.introText.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-white/80 font-mono text-sm md:text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <Button
          onClick={onNext}
          className="bg-white text-navy hover:bg-white/90 font-mono group"
          data-testid="button-begin-story"
        >
          Begin the journey
          <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-1 transition-transform" />
        </Button>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-white/40 text-xs font-mono flex items-center gap-1"
      >
        <span className="hidden md:inline">Use arrow keys or scroll to navigate</span>
        <span className="md:hidden">Scroll to continue</span>
      </motion.div>
    </div>
  );
}

interface AlbumPanelProps {
  album: Top10Album;
  index: number;
  totalAlbums: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onShare: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function AlbumPanel({ 
  album, 
  index, 
  totalAlbums, 
  isExpanded, 
  onToggleExpand, 
  onShare, 
  onNext, 
  onPrev 
}: AlbumPanelProps) {
  const isNumber1 = album.rank === 1;
  
  return (
    <div
      data-panel={index}
      className="min-h-screen snap-start flex flex-col md:flex-row relative overflow-hidden"
      style={{ backgroundColor: album.accentColor }}
    >
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/60 via-black/40 to-transparent pointer-events-none" />
      
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className={`absolute -top-6 -left-6 md:-top-8 md:-left-8 ${isNumber1 ? 'w-20 h-20 md:w-28 md:h-28' : 'w-16 h-16 md:w-20 md:h-20'} bg-white text-black font-mono font-bold flex items-center justify-center rounded-full shadow-2xl z-20`}>
            <span className={isNumber1 ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}>{album.rank}</span>
          </div>
          
          <img
            src={album.coverArtUrl}
            alt={`${album.artist} - ${album.title}`}
            className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover shadow-2xl rounded-lg"
            data-testid={`img-album-cover-${album.rank}`}
          />
          
          <div className="flex items-center justify-center gap-3 mt-6">
            {album.spotifyUrl && (
              <a
                href={album.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                data-testid={`link-spotify-${album.rank}`}
              >
                <SiSpotify className="w-5 h-5 text-white" />
              </a>
            )}
            {album.appleMusicUrl && (
              <a
                href={album.appleMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                data-testid={`link-apple-${album.rank}`}
              >
                <SiApplemusic className="w-5 h-5 text-white" />
              </a>
            )}
            {album.bandcampUrl && (
              <a
                href={album.bandcampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                data-testid={`link-bandcamp-${album.rank}`}
              >
                <SiBandcamp className="w-5 h-5 text-white" />
              </a>
            )}
            <button
              onClick={onShare}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              data-testid={`button-share-${album.rank}`}
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      </div>
      
      <div className="flex-1 flex items-center relative z-10 p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-lg"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {album.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-white/70 border-white/30 font-mono text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 font-mono">
            {album.artist}
          </h2>
          <h3 className="text-xl md:text-2xl lg:text-3xl text-white/80 mb-4 italic">
            {album.title}
          </h3>
          
          <p className="text-white/60 text-sm font-mono mb-6">
            {album.label} · {new Date(album.releaseDate).getFullYear()}
          </p>
          
          <div className="mb-6">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="prose prose-sm prose-invert"
                >
                  {album.writeUp.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-white/80 font-mono text-sm leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </motion.div>
              ) : (
                <motion.p
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/80 font-mono text-sm leading-relaxed line-clamp-4"
                >
                  {album.writeUp.split('\n\n')[0]}
                </motion.p>
              )}
            </AnimatePresence>
            
            <button
              onClick={onToggleExpand}
              className="text-white/60 hover:text-white text-sm font-mono mt-3 flex items-center gap-1"
              data-testid={`button-expand-${album.rank}`}
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Read full review <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </div>
          
          {album.standoutTracks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                <Music className="w-3 h-3" />
                Standout Tracks
              </h4>
              <div className="flex flex-wrap gap-2">
                {album.standoutTracks.map((track) => (
                  <span key={track} className="px-3 py-1 bg-white/10 rounded-full text-white text-sm font-mono">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-4">
            {index > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                className="text-white/60 hover:text-white hover:bg-white/10 font-mono"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                #{album.rank - 1}
              </Button>
            )}
            {index < totalAlbums && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                className="text-white/60 hover:text-white hover:bg-white/10 font-mono"
              >
                #{album.rank + 1}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function OutroPanel({ 
  list, 
  onRestart, 
  onShare 
}: { 
  list: Top10List; 
  onRestart: () => void; 
  onShare: () => void;
}) {
  return (
    <div
      data-panel={list.albums.length + 1}
      className="h-screen snap-start flex flex-col items-center justify-center relative px-6 py-16"
      style={{
        background: 'linear-gradient(135deg, #000 0%, #001F43 50%, #003F87 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-2xl text-center"
      >
        <div className="text-6xl md:text-8xl font-bold text-white/10 font-mono mb-6">
          END
        </div>
        
        <div className="prose prose-lg prose-invert mx-auto mb-10">
          {list.outroText.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-white/80 font-mono text-sm md:text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onShare}
            className="bg-white text-navy hover:bg-white/90 font-mono"
            data-testid="button-share-final"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share this list
          </Button>
          
          <Button
            onClick={onRestart}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 font-mono"
            data-testid="button-restart"
          >
            <Play className="w-4 h-4 mr-2" />
            Start over
          </Button>
          
          <Link href="/albums">
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 font-mono"
              data-testid="button-back-to-albums"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to albums
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default AlbumScrollStory;
