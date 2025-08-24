import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Settings, Star, Users, Music, Heart } from "lucide-react";
import FeaturedMixCard from "../components/FeaturedMixCard";
import PublicMixCard from "../components/PublicMixCard";
import RadioStreamPlayer from "../components/RadioStreamPlayer";
import ProgramIndicator from "../components/ProgramIndicator";
import SimpleSongForm from "../components/SimpleSongForm";
import LastFmDebugPanel from "../components/LastFmDebugPanel";
import { getTrackThumbnail } from "../utils/soundcloud";
import { AzuraCastPlayer } from "../components/AzuraCastPlayer";

interface FeaturedSubmission {
  id: number;
  djName: string;
  demoMixTitle: string;
  demoMixDescription: string;
  primaryGenre: string;
  showLength: number;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audiocomUrl?: string;
  otherUrl?: string;
}

export default function HomePage() {

  const [showSongSubmission, setShowSongSubmission] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [trackThumbnails, setTrackThumbnails] = useState<{[key: number]: string}>({});

  // Fetch featured DJ submissions
  const { data: featuredSubmissions = [], isLoading, error } = useQuery<FeaturedSubmission[]>({
    queryKey: ['/api/dj-submissions/featured'],
  });

  // Fetch featured community mixes
  const { data: featuredMixes = [] } = useQuery({
    queryKey: ['/api/public/mixes/featured'],
    queryFn: async () => {
      const response = await fetch('/api/public/mixes/featured?limit=6');
      if (!response.ok) throw new Error('Failed to fetch featured mixes');
      return response.json();
    },
  });

  // Fetch thumbnails for featured submissions
  useEffect(() => {
    const fetchThumbnails = async () => {
      const thumbnails: {[key: number]: string} = {};
      
      for (const submission of featuredSubmissions) {
        try {
          const thumbnail = await getTrackThumbnail(submission);
          if (thumbnail) {
            thumbnails[submission.id] = thumbnail;
          }
        } catch (error) {
          console.error('Error fetching thumbnail for submission', submission.id, error);
        }
      }
      
      setTrackThumbnails(thumbnails);
    };

    if (featuredSubmissions.length > 0) {
      fetchThumbnails().catch(error => {
        console.error('Error in fetchThumbnails:', error);
      });
    }
  }, [featuredSubmissions]);

  // Get the first featured submission for display
  const featuredSubmission = featuredSubmissions[0];

  return (
    <div className="min-h-screen bg-white text-black">


      {/* Live Player Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2 text-sm font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">ENAMORADO RADIO</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">SAN ANTONIO</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fixed top-10 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/guides" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/submit-mix" className="text-gray-600 hover:text-red-500 transition-colors">
                  SUBMIT
                </Link>
                <Link href="/albums" className="text-gray-600 hover:text-red-500 transition-colors">
                  ALBUMS
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
                <Link href="/episodes" className="text-gray-600 hover:text-red-500 transition-colors">
                  RADIO
                </Link>
                <Link href="/schedule" className="text-red-500 hover:text-red-600 transition-colors font-medium">
                  SCHEDULE
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

      {/* Main Content */}
      <main className="pt-32 pb-32 px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">ENAMORADO RADIO</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-mono">
              Digital space dedicated to the things we are enamored with
            </p>
          </div>

          {/* Radio Stream Player */}
          <div className="mb-12">
            <RadioStreamPlayer />
          </div>

          {/* Featured Mix Section - Centered like Image 3 */}
          {featuredSubmission && (
            <div className="mb-16">
              <FeaturedMixCard 
                submission={featuredSubmission}
                thumbnail={trackThumbnails[featuredSubmission.id]}
              />
            </div>
          )}
        </section>

        {/* Explore Content Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-mono text-red-500">EXPLORE</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-mono">
              Discover curated content, join our community, and contribute to the station
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editorial/Staff Picks */}
            <Link
              href="/albums"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">EDITORIAL/STAFF PICKS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Hand-selected favorites from our editorial team. The music, mixes, and episodes we can't stop playing.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  EXPLORE PICKS →
                </div>
              </div>
            </Link>

            {/* Resident Applications */}
            <Link
              href="/resident-application"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">RESIDENT APPLICATIONS</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Join Season 1 as a resident DJ. Apply for a regular slot and become part of our programming lineup.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  APPLY FOR SEASON 1 →
                </div>
              </div>
            </Link>

            {/* Submit a Mix */}
            <Link
              href="/submit-mix"
              className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors group cursor-pointer block"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-gray-900">SUBMIT A MIX</h3>
                <p className="text-gray-600 font-mono text-sm mb-4">
                  Share your DJ mixes with our community. We feature original work and support emerging artists.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  SUBMIT MIX →
                </div>
              </div>
            </Link>

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
                  Suggest tracks for our rotation. Even if not directly chosen, submissions may be featured in compilation episodes dedicated to community picks.
                </p>
                <div className="text-red-500 font-mono text-sm group-hover:text-red-600 transition-colors">
                  SUGGEST SONGS →
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Fresh from the Community */}
        {featuredMixes.length > 0 && (
          <section className="py-16 px-4 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-mono text-gray-900">FRESH FROM THE COMMUNITY</h2>
              <p className="text-gray-600 font-mono">
                Featured mixes from community submissions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMixes.map((mix: any) => (
                <div key={mix.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Cover Art */}
                  <div className="relative h-48">
                    {mix.coverUrl ? (
                      <img 
                        src={mix.coverUrl} 
                        alt={`${mix.title} cover`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${mix.coverUrl ? 'hidden' : 'flex'}`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-500 font-mono">MIX</div>
                      </div>
                    </div>
                    
                    {/* Featured Star */}
                    <div className="absolute top-3 right-3">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{mix.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">by {mix.name}</p>
                    <p className="text-xs text-gray-500 mb-3">{mix.genre?.toUpperCase()}</p>
                    
                    {/* Description */}
                    {mix.about && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{mix.about}</p>
                    )}
                    
                    {/* Listen Button */}
                    <button 
                      onClick={() => window.open(mix.url, '_blank')}
                      className="w-full bg-black text-white py-2 px-4 rounded font-mono text-sm hover:bg-gray-800 transition-colors"
                    >
                      LISTEN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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