import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Play, ExternalLink, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Episode } from '@shared/schema';

export default function EpisodesBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const { data: episodes = [], isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes'],
    queryFn: async () => {
      const response = await fetch('/api/episodes');
      if (!response.ok) throw new Error('Failed to fetch episodes');
      return response.json();
    },
  });

  const filteredEpisodes = episodes.filter(episode => {
    const matchesSearch = episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         episode.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         episode.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeries = !selectedSeries || episode.seriesTitle === selectedSeries;
    
    return matchesSearch && matchesSeries;
  });

  const uniqueSeries = [...new Set(episodes.map(ep => ep.seriesTitle).filter(Boolean))];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Episodes</h1>
          <p className="text-gray-400 mb-6">
            Discover radio shows and mixes from our community of DJs and artists
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search episodes, hosts, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedSeries === null ? "default" : "outline"}
                onClick={() => setSelectedSeries(null)}
                className="whitespace-nowrap"
              >
                All Series
              </Button>
              {uniqueSeries.map(series => (
                <Button
                  key={series}
                  variant={selectedSeries === series ? "default" : "outline"}
                  onClick={() => setSelectedSeries(series)}
                  className="whitespace-nowrap"
                >
                  {series}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEpisodes.map((episode) => (
            <div key={episode.id} className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors">
              <div className="aspect-video bg-gray-800 relative overflow-hidden">
                {episode.artworkUrl ? (
                  <img 
                    src={episode.artworkUrl} 
                    alt={episode.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-gray-600" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <Link href={`/episode/${episode.id}`}>
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6 mr-2" />
                      Play Episode
                    </Button>
                  </div>
                </Link>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {episode.seriesTitle || 'Episode'}
                  </Badge>
                  {episode.isFeatured && (
                    <Badge variant="secondary" className="text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                
                <Link href={`/episode/${episode.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-blue-400 transition-colors cursor-pointer">
                    {episode.title}
                  </h3>
                </Link>
                
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <User className="h-4 w-4 mr-1" />
                  <span>{episode.hostName}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(episode.airDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDuration(episode.duration)}</span>
                  </div>
                </div>
                
                {episode.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {episode.description}
                  </p>
                )}
                
                {episode.tags && episode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {episode.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {episode.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{episode.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Link href={`/episode/${episode.id}`}>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Listen Now
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(episode.audioUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredEpisodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No episodes found matching your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}