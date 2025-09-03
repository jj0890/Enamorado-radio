import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import PublicMixCard from "@/components/PublicMixCard";

export default function GenrePage() {
  const [, params] = useRoute<{ slug: string }>("/genre/:slug");
  const { slug } = params || { slug: "" };

  const { data: mixes = [], isLoading } = useQuery({
    queryKey: ["/api/public/mixes", { genreSlug: slug }],
    queryFn: async () => {
      const r = await fetch(`/api/public/mixes?genre=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load mixes");
      return r.json();
    },
  });

  const title = slug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-mono text-red-500 mb-6">{title}</h1>
      {isLoading ? (
        <div className="font-mono">Loading…</div>
      ) : mixes.length === 0 ? (
        <div className="font-mono text-gray-600">Nothing here yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixes.map((m: any) => <PublicMixCard key={m.id} mix={m} />)}
        </div>
      )}
    </div>
  );
}