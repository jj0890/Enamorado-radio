/**
 * LikeButton — SoundCloud-style heart toggle for community content.
 *
 * - Anonymous session cookie tracks state (no login required)
 * - Optimistic updates for instant feel
 * - Spring-bounce animation on like via Web Animations API
 * - Auto-promotes content to community feature slot at threshold (server-side)
 *
 * Usage:
 *   <LikeButton id={content.id} initial={content.likes} />
 *   <LikeButton id={episode.id} entityType="episode" initial={0} />
 */

import { useRef } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LikeEntityType = "submission" | "episode" | "mix" | "content";

export interface LikeButtonProps {
  /** Content ID — matches the entity's primary key */
  id: string | number;
  /** Initial like count (from SSR / page data) */
  initial?: number;
  /** Entity type for the backend route (default: 'content' for editorial templates) */
  entityType?: LikeEntityType;
  /** Optional size variant */
  size?: "sm" | "md" | "lg";
  /** Extra classes */
  className?: string;
}

interface LikeStatus {
  liked: boolean;
  count: number;
  promoted?: boolean;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE = {
  sm: { icon: 14, text: "text-xs" },
  md: { icon: 18, text: "text-sm" },
  lg: { icon: 22, text: "text-base" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function LikeButton({
  id,
  initial = 0,
  entityType = "content",
  size = "md",
  className,
}: LikeButtonProps) {
  const queryClient = useQueryClient();
  const queryKey = [`/api/likes/${entityType}/${id}`];
  const heartRef = useRef<HTMLSpanElement>(null);

  // ── Fetch current state ───────────────────────────────────────────────────
  const { data } = useQuery<LikeStatus>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/likes/${entityType}/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch like status");
      return res.json();
    },
    initialData: { liked: false, count: initial },
    staleTime: 60_000,
  });

  const liked = data?.liked ?? false;
  const count = data?.count ?? initial;

  // ── Toggle mutation with optimistic update ────────────────────────────────
  const { mutate, isPending } = useMutation<LikeStatus, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/likes/${entityType}/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LikeStatus>(queryKey);
      queryClient.setQueryData<LikeStatus>(queryKey, (old) => ({
        liked: !old?.liked,
        count: (old?.count ?? initial) + (old?.liked ? -1 : 1),
      }));
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Click handler — spring-bounce only fires on "like" (not unlike) ───────
  const handleClick = () => {
    if (isPending) return;

    // Spring-bounce animation (SoundCloud feel) — fires on like, not unlike
    if (!liked && heartRef.current) {
      heartRef.current.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.4)" },
          { transform: "scale(0.88)" },
          { transform: "scale(1.16)" },
          { transform: "scale(0.96)" },
          { transform: "scale(1)" },
        ],
        { duration: 480, easing: "ease-out" }
      );
    }

    mutate();
  };

  const { icon: iconSize, text: textSize } = SIZE[size];

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      className={cn(
        // Layout
        "inline-flex items-center gap-1.5 select-none",
        // Reset
        "bg-transparent border-none cursor-pointer p-0",
        // Color transitions
        "transition-colors duration-200",
        liked
          ? "text-burnt-orange-500"
          : "text-muted-foreground hover:text-burnt-orange-400",
        // Disabled
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      {/* Heart icon */}
      <span ref={heartRef} className="inline-flex will-change-transform">
        <Heart
          size={iconSize}
          strokeWidth={liked ? 0 : 1.75}
          className={cn(
            "transition-all duration-200",
            liked
              ? "fill-burnt-orange-500 drop-shadow-[0_0_5px_hsl(20,100%,55%)]"
              : "fill-none"
          )}
          aria-hidden="true"
        />
      </span>

      {/* Count — hidden when zero, fades in when > 0 */}
      <span
        className={cn(
          textSize,
          "font-medium tabular-nums leading-none",
          "transition-all duration-200",
          count > 0 ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
        aria-hidden="true"
      >
        {formatCount(count)}
      </span>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compact number formatting: 1200 → "1.2k" */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}
