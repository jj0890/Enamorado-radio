import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, User, Calendar, Clock, Music } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function EpisodeView() {
  const { id } = useParams();

  const { data: episode, isLoading } = useQuery({
    queryKey: ["/api/episodes", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading episode...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Episode not found</div>
            <Link href="/latest">
              <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white font-mono">
                Back to Latest
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StickyRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/latest"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Latest
          </Link>
        </div>

        {/* Episode Header */}
        <div className="mb-12">
          <div className="flex items-start gap-8">
            {/* Artwork */}
            {episode.artworkUrl && (
              <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={episode.artworkUrl} 
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Episode Info */}
            <div className="flex-1">
              <div className="mb-4">
                <span className="text-sm font-mono text-red-500 uppercase">Episode</span>
                <h1 className="text-4xl font-bold mb-2 font-mono text-red-500">
                  {episode.title}
                </h1>
                <div className="flex items-center text-gray-600 font-mono text-lg mb-2">
                  <User className="w-5 h-5 mr-2" />
                  {episode.hostName}
                </div>
                {episode.seriesTitle && (
                  <div className="text-gray-500 font-mono">
                    {episode.seriesTitle}
                    {episode.episodeNumber && ` • Episode ${episode.episodeNumber}`}
                  </div>
                )}
              </div>

              {/* Episode Meta */}
              <div className="flex items-center gap-6 text-sm font-mono text-gray-500 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(episode.airDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-1" />
                  {episode.genre}
                </div>
              </div>

              {/* Play Button */}
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white font-mono mb-6"
                onClick={() => window.open(episode.audioUrl, '_blank')}
              >
                <Play className="w-5 h-5 mr-2" />
                Listen to Episode
              </Button>

              {/* Tags */}
              {episode.tags && episode.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {episode.tags.map((tag: string) => (
                    <span 
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded font-mono text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {episode.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 font-mono text-red-500">About This Episode</h2>
            <p className="text-gray-700 font-mono leading-relaxed text-lg">
              {episode.description}
            </p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center gap-4 mb-8">
          {episode.isFeatured && (
            <span className="bg-yellow-500 text-black px-3 py-1 rounded font-mono text-sm font-bold">
              FEATURED EPISODE
            </span>
          )}
          {episode.isLive && (
            <span className="bg-red-500 text-white px-3 py-1 rounded font-mono text-sm font-bold animate-pulse">
              LIVE NOW
            </span>
          )}
        </div>

        {/* Related Actions */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-mono text-gray-900 mb-2">Discover More</h3>
              <p className="text-gray-600 font-mono text-sm">
                Explore more content from our community and resident DJs
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/latest">
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  More Episodes
                </Button>
              </Link>
              <Link href="/submit-mix">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                  Submit Your Mix
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}