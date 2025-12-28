import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import PublicMixCard from "@/components/PublicMixCard";
import { Music, Headphones, Calendar, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Simple Episode Card Component
function EpisodeCard({ episode }: { episode: any }) {
  return (
    <Link href={`/episode/${episode.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-navy transition-all duration-300 group shadow-sm hover:shadow-md">
        <div className="aspect-[16/9] bg-gray-200 overflow-hidden relative">
          {episode.artUrl ? (
            <img 
              src={episode.artUrl} 
              alt={episode.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Headphones className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-xs font-mono bg-blue-100 text-blue-800 hover:bg-blue-100">
              EPISODE
            </Badge>
            <div className="text-xs font-mono text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(episode.airDate).toLocaleDateString()}
            </div>
          </div>
          
          <h3 className="font-mono font-bold text-sm mb-2 line-clamp-2">{episode.title}</h3>
          <p className="text-xs font-mono text-gray-600 mb-3 line-clamp-2">{episode.description}</p>
          
          <div className="text-xs font-mono text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {Math.round(episode.duration / 60)} min
          </div>
        </div>
      </div>
    </Link>
  );
}

// Content Section Component
function ContentSection({ title, items, renderItem, emptyMessage }: {
  title: string;
  items: any[];
  renderItem: (item: any) => JSX.Element;
  emptyMessage: string;
}) {
  if (items.length === 0) return null;
  
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-mono text-gray-900">{title}</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {items.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(renderItem)}
      </div>
    </div>
  );
}

export default function GenrePage() {
  const [, params] = useRoute<{ slug: string }>("/genre/:slug");
  const { slug } = params || { slug: "" };

  // Fetch different content types
  const { data: mixes = [], isLoading: mixesLoading } = useQuery({
    queryKey: ["/api/mixes", { genreSlug: slug }],
    queryFn: async () => {
      const r = await fetch(`/api/mixes?genre=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load mixes");
      return r.json();
    },
  });

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({
    queryKey: ["/api/episodes", { genreSlug: slug }],
    queryFn: async () => {
      const r = await fetch(`/api/episodes?genre=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!r.ok) return []; // Episodes might not exist or have genre filtering
      return r.json();
    },
  });

  const isLoading = mixesLoading || episodesLoading;
  const totalItems = mixes.length + episodes.length;
  const title = slug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold font-mono text-navy">{title}</h1>
          <div className="flex items-center space-x-4">
            <Link href="/mixes" className="text-gray-500 hover:text-navy font-mono text-sm">
              ← Back to Mixes
            </Link>
          </div>
        </div>
        
        {isLoading ? (
          <div className="font-mono text-gray-500">Loading…</div>
        ) : totalItems === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-mono text-lg text-gray-600 mb-2">Nothing here yet</h3>
            <p className="font-mono text-sm text-gray-500 mb-6">
              No {title.toLowerCase()} content has been submitted yet
            </p>
            <Link href="/submit-mix">
              <Button className="bg-navy hover:bg-navy-dark text-white font-mono">
                Submit Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center space-x-6 text-sm font-mono text-gray-600">
            <div className="flex items-center">
              <Music className="w-4 h-4 mr-1" />
              {mixes.length} mixes
            </div>
            {episodes.length > 0 && (
              <div className="flex items-center">
                <Headphones className="w-4 h-4 mr-1" />
                {episodes.length} episodes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Sections */}
      {!isLoading && totalItems > 0 && (
        <>
          {/* Community Mixes */}
          <ContentSection 
            title="Community Mixes"
            items={mixes}
            renderItem={(mix) => <PublicMixCard key={mix.id} mix={mix} />}
            emptyMessage={`No ${title.toLowerCase()} mixes yet`}
          />

          {/* Episodes */}
          <ContentSection 
            title="Episodes & Shows"
            items={episodes}
            renderItem={(episode) => <EpisodeCard key={episode.id} episode={episode} />}
            emptyMessage={`No ${title.toLowerCase()} episodes yet`}
          />
        </>
      )}
    </div>
  );
}