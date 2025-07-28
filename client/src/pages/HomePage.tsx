import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, Music, Radio, Search, User, ChevronRight, Calendar, Headphones, Plus, X, Settings } from "lucide-react";
import { SearchModal } from "../components/SearchModal";
import { SoundCloudEmbed } from "../components/SoundCloudEmbed";
import EnhancedRadioPlayer from "../components/EnhancedRadioPlayer";
import LastFmDebugPanel from "../components/LastFmDebugPanel";
import ProgramIndicator from "../components/ProgramIndicator";
import CollegeRadioUpload from "../components/CollegeRadioUpload";
import { getTrackThumbnail } from "../utils/soundcloud";

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
  const [currentShow, setCurrentShow] = useState("Deep Routes");
  const [showSearch, setShowSearch] = useState(false);
  const [showSoundCloudEmbed, setShowSoundCloudEmbed] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [trackThumbnails, setTrackThumbnails] = useState<{[key: number]: string}>({});
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showRadioUpload, setShowRadioUpload] = useState(false);

  // Fetch featured DJ submissions
  const { data: featuredSubmissions = [], isLoading, error } = useQuery<FeaturedSubmission[]>({
    queryKey: ['/api/dj-submissions/featured'],
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
          // Continue with other submissions even if one fails
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

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setCurrentShow("Deep Routes");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Redirect guides to the new dedicated guides page
  const guides = [
    {
      id: "guides",
      title: "Artist Guides",
      icon: "🎵",
      description: "Deep dives into artists and genres",
      color: "from-purple-500 to-pink-500",
      route: "/guides"
    },
    {
      id: "albums",
      title: "Albums of the Month",
      icon: "💿",
      description: "Curated monthly album picks",
      color: "from-blue-500 to-teal-500", 
      route: "/albums"
    },
    {
      id: "episodes",
      title: "Radio Episodes",
      icon: "📻",
      description: "Browse all radio episodes",
      color: "from-green-500 to-emerald-500",
      route: "/episodes"
    },
    {
      id: "mixes",
      title: "Mixes",
      icon: "🎧",
      description: "Browse community mixes and DJ sets",
      color: "from-orange-500 to-red-500",
      route: "/mixes"
    }
  ];

  const recentShows = [
    {
      id: 1,
      title: "Post-Punk Revival",
      host: "Marcus Rivera",
      date: "December 15, 2024",
      duration: "2h 15m",
      category: "Electronic",
      isLive: false
    },
    {
      id: 2,
      title: "Deep Routes",
      host: "Marcus Rivera",
      date: "Live Now",
      duration: "1h 30m",
      category: "House",
      isLive: true
    },
    {
      id: 3,
      title: "Midnight Sessions",
      host: "Luna Park",
      date: "December 14, 2024",
      duration: "1h 45m",
      category: "Ambient",
      isLive: false
    },
    {
      id: 4,
      title: "Experimental Sounds",
      host: "Alex Stone",
      date: "December 13, 2024",
      duration: "2h 00m",
      category: "Experimental",
      isLive: false
    }
  ];

  const collections = [
    {
      title: "Winter Mixtapes",
      description: "Curated seasonal selections",
      count: 12,
      image: "gradient-1"
    },
    {
      title: "Electronic Futures",
      description: "Tomorrow's sound today",
      count: 8,
      image: "gradient-2"
    },
    {
      title: "Jazz Explorations",
      description: "Modern jazz discoveries",
      count: 15,
      image: "gradient-3"
    }
  ];

  // Transform featured submissions for display
  const featuredContent = featuredSubmissions.map((submission, index) => ({
    id: submission.id,
    title: submission.demoMixTitle || `${submission.djName} Mix`,
    artist: submission.djName,
    description: submission.demoMixDescription || "Featured mix from our radio community",
    genre: submission.primaryGenre,
    duration: `${submission.showLength} min`,
    soundcloudUrl: submission.soundcloudUrl || submission.mixcloudUrl || submission.audiocomUrl || submission.otherUrl,
    thumbnail: trackThumbnails[submission.id],
    isSpotlight: index === 0, // First approved submission gets spotlight
    background: index === 0 ? "from-purple-900/20 to-blue-900/20" : "from-red-900/20 to-orange-900/20"
  }));



  const handlePlayTrack = (content: any) => {
    // Open SoundCloud embed modal for direct playback
    setSelectedTrack(content);
    setShowSoundCloudEmbed(true);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Live Player Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
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
      <header className="fixed top-10 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200">
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
                <Link href="/dj-submit" className="text-gray-600 hover:text-red-500 transition-colors">
                  SUBMIT
                </Link>
                <Link href="/albums" className="text-gray-600 hover:text-red-500 transition-colors">
                  ALBUMS
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
                <Link href="/episodes" className="text-red-500 hover:text-red-600 transition-colors font-medium">
                  RADIO
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                onClick={() => setShowDebugPanel(true)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Last.fm Debug Panel"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              
              <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-32 px-4 max-w-7xl mx-auto">
        {/* Hero Section with Program Indicator */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">ENAMORADO RADIO</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6 font-mono">
              Digital space dedicated to the things we are enamored with
            </p>
            
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setIsRadioActive(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 font-mono font-bold transition-colors"
              >
                LISTEN
              </button>
              <Link 
                href="/episodes" 
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 font-mono transition-colors"
              >
                EPISODES
              </Link>
            </div>
          </div>

          {/* Program Status Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg max-w-2xl mx-auto mb-12">
            <ProgramIndicator />
          </div>
        </section>
        
        {/* Featured Mix Section */}
        <section className="mb-16">
          {featuredSubmissions.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Artwork Section */}
                  <div className="flex-shrink-0">
                    <div className="w-64 h-64 rounded-lg overflow-hidden bg-gray-200 relative">
                      {trackThumbnails[featuredSubmissions[0].id] ? (
                        <img 
                          src={trackThumbnails[featuredSubmissions[0].id]} 
                          alt={featuredSubmissions[0].demoMixTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-gray-500 text-center">
                            <Music className="w-16 h-16 mx-auto mb-2" />
                            <div className="text-sm font-medium font-mono">{featuredSubmissions[0].primaryGenre.toUpperCase()}</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                        <button 
                          onClick={() => handlePlayTrack(featuredSubmissions[0])}
                          className="bg-white/90 hover:bg-white text-black rounded-full p-6 transition-all duration-300 transform hover:scale-110"
                        >
                          <Play className="w-12 h-12" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-4 font-mono">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      FEATURED MIX
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 font-mono">
                      {featuredSubmissions[0].demoMixTitle}
                    </h2>
                    <p className="text-xl text-gray-600 mb-4 font-mono">{featuredSubmissions[0].djName}</p>
                    
                    <p className="text-gray-700 text-lg leading-relaxed mb-6 font-mono">
                      {featuredSubmissions[0].demoMixDescription}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-mono text-sm">{featuredSubmissions[0].primaryGenre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Headphones className="w-4 h-4" />
                        <span className="font-mono text-sm">{featuredSubmissions[0].showLength}min</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => handlePlayTrack(featuredSubmissions[0])}
                        className="flex items-center justify-center gap-3 bg-red-500 text-white hover:bg-red-600 px-8 py-3 rounded-lg font-medium transition-all duration-300 font-mono"
                      >
                        <Play className="w-5 h-5" />
                        <span>Play Mix</span>
                      </button>
                      
                      <button
                        onClick={() => setIsRadioActive(true)}
                        className="flex items-center justify-center gap-3 bg-gray-800 text-white hover:bg-gray-900 px-8 py-3 rounded-lg font-medium transition-all duration-300 font-mono"
                      >
                        <Radio className="w-5 h-5" />
                        <span>Listen Live</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Community Section */}
        <section className="mb-16">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3 font-mono text-gray-700">SHARE YOUR ART</h2>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                Join our community of artists and creators. We respect your work and provide 
                opportunities for featuring, airplay, and collaboration with fair compensation practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dj-submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 font-mono text-sm transition-colors"
                >
                  Submit a Mix
                </Link>
                <button
                  onClick={() => setShowRadioUpload(true)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 font-mono text-sm transition-colors"
                >
                  Submit for Radio
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Guides Grid Section */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4 font-mono text-gray-800">DISCOVER</h2>
            <p className="text-gray-600 font-mono">Explore our curated collections and featured content</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={guide.route}
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center border border-gray-200 hover:border-red-200 transition-colors">
                  <div className="text-4xl mb-3">{guide.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2 font-mono">{guide.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">{guide.description}</p>
                  
                  {/* Hover popup with red accent */}
                  <div className={`absolute -top-2 -right-2 w-48 bg-white border border-red-500 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-xl z-10`}>
                    <h4 className="font-semibold text-red-500 text-sm mb-1">{guide.title}</h4>
                    <p className="text-gray-600 text-xs">{guide.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Community Section */}
        <section className="mb-16">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3 font-mono text-gray-700">SHARE YOUR ART</h2>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                Join our community of artists and creators. We respect your work and provide 
                opportunities for featuring, airplay, and collaboration with fair compensation practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dj-submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 font-mono text-sm transition-colors"
                >
                  Submit a Mix
                </Link>
                <button
                  onClick={() => setShowRadioUpload(true)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 font-mono text-sm transition-colors"
                >
                  Submit for Radio
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Admin Access */}
      <footer className="mt-16 border-t border-gray-200 pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="text-gray-600 text-sm">
            © 2025 Enamorado Radio. Digital space for the things we love.
          </div>
          <Link 
            href="/admin" 
            className="text-gray-600 hover:text-gray-800 text-sm underline transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Last.fm Debug Panel */}
      <LastFmDebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />

      {/* Enhanced Radio Player with Last.fm Integration */}
      <EnhancedRadioPlayer 
        isActive={isRadioActive} 
        onClose={() => setIsRadioActive(false)} 
      />



      {/* College Radio Upload Modal */}
      <CollegeRadioUpload 
        isOpen={showRadioUpload}
        onClose={() => setShowRadioUpload(false)} 
      />

    </div>
  );
}