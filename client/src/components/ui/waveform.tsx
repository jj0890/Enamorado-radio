import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  className?: string;
  barCount?: number;
  animated?: boolean;
  color?: string;
}

export function Waveform({ 
  className, 
  barCount = 10, 
  animated = true,
  color = "currentColor"
}: WaveformProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!animated) return;

    const animateBars = () => {
      barsRef.current.forEach((bar, index) => {
        if (bar) {
          const height = Math.random() * 100 + 10;
          const delay = index * 50;
          
          setTimeout(() => {
            bar.style.height = `${height}%`;
          }, delay);
        }
      });
    };

    const interval = setInterval(animateBars, 500);
    animateBars(); // Initial animation

    return () => clearInterval(interval);
  }, [animated]);

  return (
    <div className={cn("flex items-end space-x-1 h-8", className)}>
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="bg-current rounded-sm transition-all duration-300"
          style={{ 
            width: '3px', 
            height: `${Math.random() * 100 + 10}%`,
            color: color,
            opacity: animated ? 0.6 : 1
          }}
        />
      ))}
    </div>
  );
}
