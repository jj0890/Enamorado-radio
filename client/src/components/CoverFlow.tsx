import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CoverFlowItem {
  src: string;
  caption?: string;
}

interface CoverFlowProps {
  items: CoverFlowItem[];
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  onSelect?: (index: number) => void;
}

const CARD_W = 260;
const CARD_H_RATIO: Record<string, number> = {
  square: 1,
  portrait: 1.35,
  landscape: 0.67,
};

function getTransform(offset: number): { tx: number; tz: number; ry: number; opacity: number; zIndex: number } {
  const abs = Math.abs(offset);
  const sign = offset < 0 ? -1 : 1;

  if (abs === 0) return { tx: 0, tz: 80, ry: 0, opacity: 1, zIndex: 100 };

  const tx = sign * (140 + (abs - 1) * 72);
  const tz = -20 - (abs - 1) * 20;
  const ry = sign * -55;
  const opacity = Math.max(0.25, 1 - abs * 0.18);
  const zIndex = 100 - abs;

  return { tx, tz, ry, opacity, zIndex };
}

export default function CoverFlow({ items, aspectRatio = 'portrait', onSelect }: CoverFlowProps) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);
  const cardH = CARD_W * CARD_H_RATIO[aspectRatio];

  const go = useCallback((dir: number) => {
    setActive(prev => Math.max(0, Math.min(items.length - 1, prev + dir)));
  }, [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    dragDelta.current = 0;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    dragDelta.current = e.clientX - dragStartX.current;
  };

  const onPointerUp = () => {
    if (dragging) {
      if (dragDelta.current < -50) go(1);
      else if (dragDelta.current > 50) go(-1);
    }
    setDragging(false);
  };

  if (items.length === 0) return null;

  return (
    <div className="relative w-full select-none" style={{ background: '#090909' }}>
      {/* 3D stage */}
      <div
        className="relative overflow-hidden"
        style={{ height: cardH * 1.75, perspective: '900px', perspectiveOrigin: '50% 40%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item, i) => {
          const offset = i - active;
          const visible = Math.abs(offset) <= 4;
          if (!visible) return null;

          const { tx, tz, ry, opacity, zIndex } = getTransform(offset);

          return (
            <div
              key={i}
              onClick={() => {
                if (offset === 0) { onSelect?.(i); return; }
                go(offset > 0 ? 1 : -1);
              }}
              style={{
                position: 'absolute',
                top: '44%',
                left: '50%',
                width: CARD_W,
                height: cardH,
                cursor: offset === 0 ? 'default' : 'pointer',
                zIndex,
                opacity,
                transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg)`,
                transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Card face */}
              <img
                src={item.src}
                alt={item.caption ?? `Photo ${i + 1}`}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: 2,
                }}
              />

              {/* Reflection */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  height: '50%',
                  overflow: 'hidden',
                  transform: 'scaleY(-1)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 65%)',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 65%)',
                }}
              >
                <img
                  src={item.src}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Caption + nav */}
      <div className="flex items-center justify-between px-8 py-5">
        <button
          onClick={() => go(-1)}
          disabled={active === 0}
          className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          {items[active]?.caption && (
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
              {items[active].caption}
            </p>
          )}
          <p className="font-mono text-[9px] text-white/25 mt-1">
            {active + 1} / {items.length}
          </p>
        </div>

        <button
          onClick={() => go(1)}
          disabled={active === items.length - 1}
          className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dot strip */}
      <div className="flex justify-center gap-1 pb-6">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="transition-all"
            style={{
              width: i === active ? 16 : 4,
              height: 4,
              borderRadius: 2,
              background: i === active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)',
            }}
            aria-label={`Go to ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
