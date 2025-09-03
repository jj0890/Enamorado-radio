import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type EditorialAlbum = {
  id: string;            // your internal id or the MBID
  mbid?: string;         // if you store a MusicBrainz ID
  title: string;
  artist: string;
  year?: string;
  artUrl?: string;       // pre-resolved cover art (from your existing API)
};

export default function AlbumsPage() {
  const { data: albums = [], isLoading, error } = useQuery<EditorialAlbum[]>({
    // Use your existing backend hook that returns 4-8 editorial picks with artUrl already filled
    queryKey: ["/api/editorial/albums", { limit: 4 }],
    queryFn: async () => {
      const r = await fetch("/api/editorial/albums?limit=4", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load albums");
      return r.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center font-mono">Loading…</div>;
  if (error) return <div className="p-8 text-center font-mono text-red-600">Failed to load albums</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold font-mono text-red-500 mb-6">Editorial Picks</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {albums.map((a) => (
          <div key={a.id || a.mbid} className="border rounded-lg overflow-hidden bg-white">
            {a.artUrl ? (
              <img
                src={a.artUrl}
                alt={`${a.title} cover`}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100" />
            )}
            <div className="p-3">
              <div className="font-mono font-semibold">{a.title}</div>
              <div className="text-sm text-gray-600 font-mono">
                {a.artist}{a.year ? ` • ${a.year}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}