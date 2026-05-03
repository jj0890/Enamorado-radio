import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Play, Search, Clock, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StickyRadioPlayer from '@/components/StickyRadioPlayer';
import Navigation from '@/components/Navigation';
import type { Episode } from '@shared/schema-clean';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function EpisodeRow({ episode }: { episode: Episode }) {
  const artwork = episode.artworkUrl || `https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop`;
  const tags: string[] = (episode as any).tags || [];

  return (
    <Link href={`/episode/${episode.id}`}>
      <div className="group flex gap-4 py-4 border-b border-gray-100 hover:bg-cream-50 transition-colors cursor-pointer px-2 -mx-2 rounded">
        {/* Artwork */}
        <div className="relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded overflow-hidden bg-gray-100">
          <img
            src={artwork}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-charcoal-900 leading-tight line-clamp-1 group-hover:text-burnt-orange-500 transition-colors">
                {episode.title}
              </h3>
              <p className="text-sm text-charcoal-500 mt-0.5 line-clamp-1">
                {episode.hostName}
              </p>
            </div>
            <span className="text-xs text-charcoal-400 font-mono whitespace-nowrap flex-shrink-0 mt-0.5">
              {formatDate(episode.airDate)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {episode.duration ? (
              <span className="flex items-center gap-1 text-xs text-charcoal-400 font-mono">
                <Clock className="w-3 h-3" />
                {formatDuration(episode.duration)}
              </span>
            ) : null}
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/genre/${tag.toLowerCase().replace(/\s+/g, '-')}`;
                }}
                className="text-xs font-mono text-burnt-orange-500 hover:text-burnt-orange-600 bg-burnt-orange-100 px-2 py-0.5 rounded transition-colors"
              >
                {tag}
              </span>
            ))}
            {episode.seriesTitle && (
              <span className="text-xs font-mono text-charcoal-400 border border-charcoal-200 px-2 py-0.5 rounded">
                {episode.seriesTitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EpisodesBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const { data: episodes = [], isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes'],
    queryFn: async () => {
      const res = await fetch('/api/episodes');
      if (!res.ok) throw new Error('Failed to fetch episodes');
      return res.json();
    },
  });

  const filteredEpisodes = episodes.filter(episode => {
    const matchesSearch = !searchTerm ||
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.hostName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeries = !selectedSeries || episode.seriesTitle === selectedSeries;
    return matchesSearch && matchesSeries;
  });

  const uniqueSeries = [...new Set(episodes.map(ep => ep.seriesTitle).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-white text-charcoal-900">
      <StickyRadioPlayer />
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Header */}
        <div className="pt-10 pb-8 border-b border-black">
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-burnt-orange-500" />
            <span className="text-xs font-mono text-charcoal-400 uppercase tracking-widest">Archive</span>
          </div>
          <h1 className="text-4xl font-bold font-mono text-charcoal-900 tracking-tight">Episodes</h1>
          <p className="text-charcoal-500 mt-2 text-sm">
            {episodes.length} show{episodes.length !== 1 ? 's' : ''} from our community of DJs and artists
          </p>
        </div>

        {/* Search + Filter row */}
        <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <Input
              placeholder="Search episodes or hosts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-charcoal-200 focus:border-burnt-orange-500 font-mono text-sm"
            />
          </div>
          {uniqueSeries.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedSeries(null)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                  selectedSeries === null
                    ? 'bg-charcoal-900 text-white border-charcoal-900'
                    : 'border-charcoal-300 text-charcoal-600 hover:border-charcoal-900'
                }`}
              >
                All
              </button>
              {uniqueSeries.map(series => (
                <button
                  key={series}
                  onClick={() => setSelectedSeries(s => s === series ? null : series)}
                  className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                    selectedSeries === series
                      ? 'bg-burnt-orange-500 text-white border-burnt-orange-500'
                      : 'border-charcoal-300 text-charcoal-600 hover:border-burnt-orange-500 hover:text-burnt-orange-500'
                  }`}
                >
                  {series}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Episode list */}
        {isLoading ? (
          <div className="py-20 text-center text-charcoal-400 font-mono text-sm">Loading episodes...</div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-charcoal-400 font-mono text-sm">No episodes match your search</p>
          </div>
        ) : (
          <div className="mt-2">
            {filteredEpisodes.map(episode => (
              <EpisodeRow key={episode.id} episode={episode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
