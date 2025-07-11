import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, Music, Radio, Search, User, ChevronRight, Calendar, Headphones } from "lucide-react";
import { SearchModal } from "../components/SearchModal";

export default function HomePage() {
  const [currentShow, setCurrentShow] = useState("Deep Routes");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setCurrentShow("Deep Routes");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const guides = [
    {
      id: "dj-guide",
      title: "DJ Guide",
      icon: "🎧",
      description: "Complete guide to DJing",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "submission-guide",
      title: "Submission Guide",
      icon: "📝",
      description: "How to submit your work",
      color: "from-blue-500 to-teal-500"
    },
    {
      id: "community-guide",
      title: "Community Guide",
      icon: "👥",
      description: "Join our community",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "technical-guide",
      title: "Technical Guide",
      icon: "⚙️",
      description: "Technical requirements",
      color: "from-orange-500 to-red-500"
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Live Player Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-white/80">LIVE NOW</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white">{currentShow}</span>
              <Headphones className="w-4 h-4 text-white/60" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white/60">CHICAGO</span>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="border border-white/20 text-white hover:bg-white/10 h-8 px-3 text-sm rounded flex items-center transition-colors"
            >
              <Play className="w-3 h-3 mr-1" />
              {isPlaying ? 'Pause' : 'Listen'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fixed top-10 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm">
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  LATEST
                </Link>
                <Link href="/zine" className="text-white/80 hover:text-white transition-colors">
                  EXPLORE
                </Link>
                <Link href="/mixes" className="text-white/80 hover:text-white transition-colors">
                  INFINITE MIXTAPES
                </Link>
                <Link href="/shop" className="text-white/80 hover:text-white transition-colors">
                  SHOP
                </Link>
                <Link href="/radio" className="text-white hover:text-blue-400 transition-colors font-medium">
                  RADIO
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded transition-colors">
                <User className="w-5 h-5" />
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
            <h1 className="text-6xl font-bold mb-4">ENAMORADO RADIO</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Digital space dedicated to the things we are enamored with
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Featured Content */}
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
              <h3 className="text-lg font-semibold mb-2">Post-Punk Revival</h3>
              <p className="text-white/70 text-sm mb-3">
                Rediscovering the angular sounds of early 80s UK underground
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Marcus Rivera</span>
                <span className="text-xs border border-white/20 px-2 py-1 rounded">2h 15m</span>
              </div>
            </div>

            {/* Live Show */}
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
        </section>

        {/* Guides Section - macOS Style */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">GUIDES</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="group relative cursor-pointer"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-3xl border border-white/10">
                  <span className="group-hover:scale-125 transition-transform duration-300">
                    {guide.icon}
                  </span>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="font-semibold text-sm">{guide.title}</h3>
                </div>
                
                {/* Hover popup */}
                <div className={`absolute -top-2 -right-2 w-48 bg-gradient-to-r ${guide.color} rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-xl z-10`}>
                  <h4 className="font-semibold text-white text-sm mb-1">{guide.title}</h4>
                  <p className="text-white/90 text-xs">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Shows */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">RECENT SHOWS</h2>
            <Link href="/radio" className="text-blue-400 hover:text-blue-300 flex items-center transition-colors">
              VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentShows.map((show) => (
              <div
                key={show.id}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10"
              >
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80 text-center">
                      <Music className="w-8 h-8 mx-auto mb-1" />
                      <div className="text-xs font-medium">{show.category}</div>
                    </div>
                  </div>
                  {show.isLive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-white/60 mb-1">{show.date}</div>
                <h3 className="font-semibold mb-1 text-sm">{show.title}</h3>
                <p className="text-white/70 text-xs mb-2">{show.host}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">{show.duration}</span>
                  {show.isLive && (
                    <span className="text-xs bg-red-500 px-2 py-1 rounded">LIVE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">COLLECTIONS</h2>
            <Link href="/collections" className="text-blue-400 hover:text-blue-300 flex items-center transition-colors">
              VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">{collection.count} ITEMS</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{collection.title}</h3>
                <p className="text-white/70 text-sm">{collection.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-8 border border-white/10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">JOIN OUR COMMUNITY</h2>
              <p className="text-white/70 mb-6">
                Be part of a growing community of music lovers, artists, and creators. 
                Share your passion and discover new sounds together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dj-submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Become a DJ
                </Link>
                <Link
                  href="/zine"
                  className="border border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Submit to Zine
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
    </div>
  );
}