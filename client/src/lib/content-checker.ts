import { useQuery } from "@tanstack/react-query";

/** Returns true if there is any published editorial content */
export function useHasEditorialContent(): boolean {
  const { data } = useQuery<unknown[]>({
    queryKey: ["/api/magazine/content"],
    queryFn: async () => {
      const r = await fetch("/api/magazine/content?limit=1");
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });
  return Array.isArray(data) && data.length > 0;
}

/** Returns true if there is any archive content (episodes/mixes) */
export function useHasArchiveContent(): boolean {
  const { data } = useQuery<unknown[]>({
    queryKey: ["/api/mixes", "check"],
    queryFn: async () => {
      const r = await fetch("/api/mixes?limit=1&status=approved");
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });
  return Array.isArray(data) && data.length > 0;
}
