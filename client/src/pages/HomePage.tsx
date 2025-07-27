import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, Music, Radio, Search, User, ChevronRight, Calendar, Headphones, Plus, X } from "lucide-react";
import { SearchModal } from "../components/SearchModal";
import { AudioPlayer } from "../components/AudioPlayer";
import { SoundCloudEmbed } from "../components/SoundCloudEmbed";
import CustomRadioPlayer from "../components/CustomRadioPlayer";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [showSoundCloudEmbed, setShowSoundCloudEmbed] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [trackThumbnails, setTrackThumbnails] = useState<{[key: number]: string}>({});

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
              <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-32 px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">ENAMORADO RADIO</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6 font-mono">
              Digital space dedicated to the things we are enamored with
            </p>
            {featuredContent.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 text-red-600 text-sm font-mono">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>{featuredContent.length} Featured Mix{featuredContent.length > 1 ? 'es' : ''} Available</span>
              </div>
            )}
          </div>
          
          {/* Featured Content - Main Highlight */}
          {featuredContent.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Artwork Section */}
                  <div className="flex-shrink-0">
                    <div className="w-80 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 relative">
                      {featuredContent[0].thumbnail ? (
                        <img 
                          src={featuredContent[0].thumbnail} 
                          alt={featuredContent[0].title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white/80 text-center">
                            <Music className="w-16 h-16 mx-auto mb-2" />
                            <div className="text-sm font-medium">{featuredContent[0].genre.toUpperCase()}</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                        <button 
                          onClick={() => handlePlayTrack(featuredContent[0])}
                          className="bg-white/90 hover:bg-white text-black rounded-full p-6 transition-all duration-300 transform hover:scale-110"
                        >
                          <Play className="w-12 h-12" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      FEATURED MIX OF THE MONTH
                    </div>
                    
                    <h2 className="text-4xl font-bold mb-2 text-white">{featuredContent[0].title}</h2>
                    <p className="text-2xl text-white/80 mb-4">{featuredContent[0].artist}</p>
                    
                    <p className="text-white text-lg mb-6 max-w-2xl bg-black/40 p-4 rounded-lg backdrop-blur-sm">
                      {featuredContent[0].description}
                    </p>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                      <span className="text-white/60 text-sm">{featuredContent[0].genre}</span>
                      <span className="text-white/60 text-sm">•</span>
                      <span className="text-white/60 text-sm">{featuredContent[0].duration}</span>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                      <button 
                        onClick={() => handlePlayTrack(featuredContent[0])}
                        className="bg-white text-black px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        Listen Here
                      </button>
                      {featuredContent[0].soundcloudUrl && (
                        <a 
                          href={featuredContent[0].soundcloudUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        >
                          Listen on SoundCloud
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Additional Featured Tracks */}
          {featuredContent.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredContent.slice(1).map((content) => (
                <div key={content.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10">
                  <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-lg mb-3 relative overflow-hidden">
                    {content.thumbnail ? (
                      <img 
                        src={content.thumbnail} 
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white/80 text-center">
                          <Music className="w-12 h-12 mx-auto mb-2" />
                          <div className="text-xs font-medium">{content.genre.toUpperCase()}</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                      <button 
                        onClick={() => handlePlayTrack(content)}
                        className="bg-white/90 hover:bg-white text-black rounded-full p-3 transition-all duration-300 transform hover:scale-110"
                      >
                        <Play className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-white/60 mb-1">{content.genre} • {content.duration}</div>
                  <h3 className="text-sm font-semibold mb-1">{content.title}</h3>
                  <p className="text-white/70 text-xs mb-2">{content.artist}</p>
                  <button 
                    onClick={() => handlePlayTrack(content)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Play
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Fallback when no featured content */}
          {featuredContent.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Default content when no featured submissions */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10">
                <div className="aspect-square bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80 text-center">
                      <Music className="w-16 h-16 mx-auto mb-2" />
                      <div className="text-sm font-medium">FEATURED MIX</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/60 mb-1">DECEMBER 15, 2024</div>
                <h3 className="text-lg font-semibold mb-2">Submit Your Mix</h3>
                <p className="text-white/70 text-sm mb-3">
                  Be the first to have your mix featured on our homepage
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Your Name Here</span>
                  <Link 
                    href="/dj-submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Submit
                  </Link>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10">
                <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80 text-center">
                      <Radio className="w-16 h-16 mx-auto mb-2" />
                      <div className="text-sm font-medium">LIVE NOW</div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="text-xs text-white/60 mb-1">LIVE • 8:00 PM GMT</div>
                <h3 className="text-lg font-semibold mb-2">Deep Routes</h3>
                <p className="text-white/70 text-sm mb-3">
                  Deep house specialist with 15+ years digging through Detroit's underground
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Marcus Rivera</span>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center transition-colors">
                    <Play className="w-3 h-3 mr-1" />
                    Listen
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Explore Section - macOS Style */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-mono text-red-500">EXPLORE</h2>
          </div>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
              {guides.map((guide) => (
                <Link key={guide.id} href={guide.route}>
                  <div className="group relative cursor-pointer">
                  
                    <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-3xl border border-white/10">
                      <span className="group-hover:scale-125 transition-transform duration-300">
                        {guide.icon}
                      </span>
                    </div>
                    <div className="mt-3 text-center">
                      <h3 className="font-semibold text-sm">{guide.title}</h3>
                    </div>
                    
                    {/* Hover popup with red accent */}
                    <div className={`absolute -top-2 -right-2 w-48 bg-white border border-red-500 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-xl z-10`}>
                      <h4 className="font-semibold text-red-500 text-sm mb-1">{guide.title}</h4>
                      <p className="text-gray-600 text-xs">{guide.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Live Radio Player */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold font-mono text-red-500">NOW PLAYING:</h2>
            <div className="flex items-center gap-2 text-red-500 font-mono">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
          
          <div className="bg-white border-2 border-red-500 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-purple-500/10 to-red-500/10 p-4 border-b border-red-200">
              <div className="flex items-center justify-center">
                <Radio className="w-6 h-6 text-red-500 mr-2" />
                <span className="font-mono text-red-500 font-bold">ENAMORADO RADIO</span>
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="max-w-3xl mx-auto">
                <CustomRadioPlayer />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 font-mono text-sm">
                  Streaming live from our curated playlist • Use controls above to play, pause, and explore tracks
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Issue Preview - Magazine Style with Red Border */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border-4 border-red-500 shadow-xl">
              <div className="text-center">
                {/* Magazine Cover */}
                <div className="w-64 h-80 mx-auto mb-6 bg-black rounded-lg shadow-2xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">ENAMORADO</h3>
                    <p className="text-white/70 text-sm mb-4">ISSUE #001</p>
                    <div className="w-16 h-0.5 bg-white/50 mx-auto"></div>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-black mb-3">Featured Issue Preview</h3>
                <div className="text-red-500 hover:text-red-600 transition-colors cursor-pointer font-medium">
                  Coming Soon →
                </div>
              </div>
            </div>
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
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Admin Access */}
      <footer className="mt-16 border-t border-white/10 pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="text-white/60 text-sm">
            © 2025 Enamorado Radio. Digital space for the things we love.
          </div>
          <Link 
            href="/admin" 
            className="text-white/60 hover:text-white text-sm underline transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* SoundCloud Embed Modal */}
      {showSoundCloudEmbed && selectedTrack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white text-xl font-bold">{selectedTrack.title}</h3>
                <p className="text-white/70">{selectedTrack.artist}</p>
              </div>
              <button
                onClick={() => setShowSoundCloudEmbed(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <SoundCloudEmbed
              url={selectedTrack.soundcloudUrl}
              title={selectedTrack.title}
              artist={selectedTrack.artist}
              height={300}
              className="mb-4"
            />
            
            <div className="text-white/60 text-sm">
              <p className="mb-2">{selectedTrack.description}</p>
              <div className="flex items-center gap-4">
                <span>{selectedTrack.genre}</span>
                <span>{selectedTrack.duration}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio Player - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <AudioPlayer
          track={currentTrack}
          isExpanded={isPlayerExpanded}
          onToggleExpanded={() => setIsPlayerExpanded(!isPlayerExpanded)}
        />
      </div>
    </div>
  );
}