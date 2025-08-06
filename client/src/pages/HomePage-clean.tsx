import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Music, Compass, Calendar, Heart, Settings, Play } from "lucide-react";
import SimpleSongForm from "@/components/SimpleSongForm";
import LastFmDebugPanel from "@/components/LastFmDebugPanel";
import PersistentRadioPlayer from "@/components/PersistentRadioPlayer";

export default function HomePage() {
  const [showSongSubmission, setShowSongSubmission] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Fetch latest content for homepage preview
  const { data: latestContent = [] } = useQuery({
    queryKey: ["/api/latest"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch featured guides
  const { data: featuredGuides = [] } = useQuery({
    queryKey: ["/api/guides", { featured: true, limit: 3 }],
  });

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Audio Manager - Persistent Radio Player */}
      <PersistentRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO RADIO
              </h1>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  EPISODES
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowDebugPanel(true)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Debug Panel"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h2 className="text-6xl font-bold mb-6 font-mono text-red-500">
            COLLEGE RADIO
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-8 font-mono">
            Discover new music, explore curated guides, and connect with a community of music lovers
          </p>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link
              href="/latest"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">LATEST</h3>
                <p className="text-gray-600 font-mono text-sm">
                  Recent episodes and mixes
                </p>
              </div>
            </Link>

            <Link
              href="/explore"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">EXPLORE</h3>
                <p className="text-gray-600 font-mono text-sm">
                  Curated guides and themes
                </p>
              </div>
            </Link>

            <Link
              href="/schedule"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">SCHEDULE</h3>
                <p className="text-gray-600 font-mono text-sm">
                  Upcoming shows and events
                </p>
              </div>
            </Link>

            <Link
              href="/submit-mix"
              className="bg-white border-2 border-black p-6 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-mono text-gray-900">SUBMIT</h3>
                <p className="text-gray-600 font-mono text-sm">
                  Share your mix
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Latest Content Preview */}
        {latestContent.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold font-mono text-red-500">FRESH FROM THE COMMUNITY</h2>
              <Link href="/latest">
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  View All →
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestContent.slice(0, 6).map((item: any, index: number) => (
                <div key={`${item.type}-${item.id}`} className="bg-gray-50 border-2 border-black rounded-lg p-6 hover:border-red-500 transition-colors">
                  <div className="mb-4">
                    <span className="text-xs font-mono text-red-500 uppercase">
                      {item.type === 'episode' ? 'Episode' : 'Community Mix'}
                    </span>
                    <h3 className="text-xl font-bold font-mono text-gray-900 mt-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 font-mono text-sm">
                      by {item.type === 'episode' ? item.hostName : item.name}
                    </p>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 font-mono text-sm mb-4 line-clamp-3">
                      {item.type === 'episode' ? item.description : item.about}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">
                      {item.genre}
                    </span>
                    {item.type === 'episode' ? (
                      <Link href={`/episode/${item.id}`}>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-mono">
                          Listen
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white font-mono"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        Listen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Guides Preview */}
        {featuredGuides.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold font-mono text-red-500">FEATURED GUIDES</h2>
              <Link href="/explore">
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  Explore All →
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredGuides.map((guide: any) => (
                <Link key={guide.id} href={`/explore/${guide.slug}`}>
                  <div className="bg-gray-50 border-2 border-black rounded-lg p-6 hover:border-red-500 transition-colors cursor-pointer h-full">
                    <div className="mb-4">
                      <span className="text-xs font-mono text-red-500 uppercase">
                        {guide.guideType}
                      </span>
                      <h3 className="text-xl font-bold font-mono text-gray-900 mt-1">
                        {guide.title}
                      </h3>
                      <p className="text-gray-600 font-mono text-sm">
                        by {guide.authorName}
                      </p>
                    </div>
                    
                    <p className="text-gray-600 font-mono text-sm line-clamp-3">
                      {guide.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Community Interaction */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6 font-mono text-red-500">JOIN THE COMMUNITY</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Song Suggestions */}
            <button
              onClick={() => setShowSongSubmission(true)}
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer text-left w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">SONG SUGGESTIONS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Suggest tracks for our rotation. Community picks may be featured in special episodes.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  SUGGEST SONGS →
                </div>
              </div>
            </button>

            {/* Resident Applications */}
            <a
              href="/resident-application"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">BECOME A RESIDENT</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Join our team of resident DJs and radio hosts. Share your passion with the community.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  APPLY NOW →
                </div>
              </div>
            </a>
          </div>
        </section>
      </main>

      {/* Modals */}
      {showSongSubmission && (
        <SimpleSongForm isOpen={showSongSubmission} onClose={() => setShowSongSubmission(false)} />
      )}

      {showDebugPanel && (
        <LastFmDebugPanel isOpen={showDebugPanel} onClose={() => setShowDebugPanel(false)} />
      )}
    </div>
  );
}