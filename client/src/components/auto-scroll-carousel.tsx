import { useEffect, useRef, ReactNode } from 'react';

interface AutoScrollCarouselProps {
  children: ReactNode;
  interval?: number;
  cardWidth?: number;
  gap?: number;
  className?: string;
  pauseOnHover?: boolean;
  enabled?: boolean;
}

export default function AutoScrollCarousel({
  children,
  interval = 7000,
  cardWidth = 220,
  gap = 20,
  className = '',
  pauseOnHover = true,
  enabled = true,
}: AutoScrollCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollNext = () => {
    if (!carouselRef.current || isPausedRef.current) return;

    const carousel = carouselRef.current;
    const currentScroll = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    // Calculate next scroll position
    let nextScroll = currentScroll + cardWidth + gap;

    // If we've reached the end, loop back to start
    if (nextScroll >= maxScroll) {
      nextScroll = 0;
    }

    // Smooth scroll to next position
    carousel.scrollTo({
      left: nextScroll,
      behavior: 'smooth',
    });
  };

  const pause = () => {
    isPausedRef.current = true;
  };

  const resume = () => {
    isPausedRef.current = false;
  };

  const startAutoScroll = () => {
    if (!enabled) return;

    scrollTimerRef.current = setInterval(() => {
      scrollNext();
    }, interval);
  };

  const stopAutoScroll = () => {
    if (scrollTimerRef.current) {
      clearInterval(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();

    return () => {
      stopAutoScroll();
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [interval, enabled]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      pause();
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      resume();
    }
  };

  const handleScroll = () => {
    pause();

    // Resume after 3 seconds of no scrolling
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      resume();
    }, 3000);
  };

  const handleTouchStart = () => {
    pause();
  };

  const handleTouchEnd = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      resume();
    }, 3000);
  };

  return (
    <div
      ref={carouselRef}
      className={`flex flex-row gap-${gap / 4} overflow-x-scroll overflow-y-hidden scroll-smooth ${className}`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
}

export function CarouselCard({
  children,
  width = 200,
  className = '',
  onClick,
}: {
  children: ReactNode;
  width?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-3 flex-shrink-0 cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 ${className}`}
      style={{ width: `${width}px` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CarouselArtwork({
  src,
  alt,
  size = 200,
  className = '',
  showPlayButton = true,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  showPlayButton?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-[var(--slate)] ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-black">
            <span className="text-lg">▶</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CarouselInfo({
  title,
  subtitle,
  onSubtitleClick,
}: {
  title: string;
  subtitle?: string;
  onSubtitleClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <div className="text-sm font-semibold text-white leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
        {title}
      </div>
      {subtitle && (
        <div
          className="text-xs text-muted-foreground leading-tight overflow-hidden text-ellipsis whitespace-nowrap hover:text-white hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSubtitleClick?.();
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
