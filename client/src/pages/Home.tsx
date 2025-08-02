import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { AudioPlayer } from '@/components/AudioPlayer';
import { StationGrid } from '@/components/StationGrid';
import { FeaturedShows } from '@/components/FeaturedShows';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  Search, 
  Heart, 
  User, 
  Home as HomeIcon,
  Grid3x3,
  Music,
  Library,
  Calendar,
  Clock,
  Users,
  Play,
  Volume2
} from 'lucide-react';
import { AudioStation, AudioShow, CurrentPlayback } from '@/types/audio';
import { Waveform } from '@/components/ui/waveform';

export default function Home() {
  const [currentPlayback, setCurrentPlayback] = useState<CurrentPlayback | null>(null);

  // Fetch stations
  const { data: stations = [], isLoading: stationsLoading } = useQuery<AudioStation[]>({
    queryKey: ['/api/stations'],
  });

  // Fetch featured shows
  const { data: featuredShows = [], isLoading: showsLoading } = useQuery<AudioShow[]>({
    queryKey: ['/api/shows/featured'],
  });

  // Fetch featured mix
  const { data: featuredMixes = [], isLoading: mixesLoading } = useQuery({
    queryKey: ['/api/dj-submissions/featured'],
  });

  // Fetch current playback
  const { data: playbackData } = useQuery<CurrentPlayback>({
    queryKey: ['/api/playback/current'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (playbackData) {
      setCurrentPlayback(playbackData);
    }
  }, [playbackData]);

  const handleStationSelect = (station: AudioStation) => {
    console.log('Selected station:', station);
    // TODO: Switch to station stream
  };

  const handleShowSelect = (show: AudioShow) => {
    console.log('Selected show:', show);
    // TODO: Switch to show stream
  };

  const handleListenLive = () => {
    // TODO: Start playing current live stream
    console.log('Listen live clicked');
  };

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
              <span className="text-white">DEEP ROUTES</span>
              <Volume2 className="w-4 h-4 text-white/60" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white/60">LONDON</span>
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-8">
              <Play className="w-3 h-3 mr-1" />
              Listen
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fixed top-10 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/">
                <div className="text-2xl font-bold tracking-tight cursor-pointer">
                  ENAMORADO
                </div>
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm">
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-white/80 hover:text-white transition-colors">
                  EXPLORE
                </Link>
                <Link href="/mixtapes" className="text-white/80 hover:text-white transition-colors">
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
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 max-w-7xl mx-auto">
        {/* Main Hero Section */}
        <section className="mb-12">
          <div className="text-center mb-6">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              ENAMORADO RADIO
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Digital space dedicated to the things we are enamored with
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Featured Mix */}
            {!mixesLoading && featuredMixes.length > 0 ? (
              <Link href="/mixes">
                <Card className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors">
                  <CardContent className="p-6">
                    <div className="aspect-square bg-white/5 rounded-lg mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white/80">
                          <Music className="w-16 h-16 mx-auto mb-2" />
                          <div className="text-sm font-medium">FEATURED MIX</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      {new Date(featuredMixes[0].submittedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {featuredMixes[0].dynamicTitle || featuredMixes[0].demoMixTitle}
                    </h3>
                    <p className="text-white/70 text-sm mb-3">
                      {featuredMixes[0].demoMixDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">
                        {featuredMixes[0].dynamicArtist || featuredMixes[0].djName}
                      </span>
                      <Badge variant="outline" className="text-xs border-white/20">
                        {featuredMixes[0].showLength}min
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="bg-black/40 border-white/10">
                <CardContent className="p-6">
                  <div className="aspect-square bg-white/5 rounded-lg mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/80">
                        <Music className="w-16 h-16 mx-auto mb-2" />
                        <div className="text-sm font-medium">FEATURED MIX</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-white/60">
                    {mixesLoading ? 'Loading...' : 'No featured mixes available'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Show */}
            <Card className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors">
              <CardContent className="p-6">
                <div className="aspect-square bg-white/5 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80">
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
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                    <Play className="w-3 h-3 mr-1" />
                    Listen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Shows */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">RECENT SHOWS</h2>
            <Link href="/radio">
              <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                VIEW ALL →
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                date: "DEC 15, 2024",
                title: "Post-Punk Revival",
                host: "Marcus Rivera",
                location: "LONDON",
                tags: ["POST PUNK", "REVIVAL", "UK"]
              },
              {
                date: "DEC 10, 2024", 
                title: "Detroit Techno Origins",
                host: "Luna Park",
                location: "BERLIN",
                tags: ["TECHNO", "DETROIT", "ORIGINALS"]
              },
              {
                date: "DEC 5, 2024",
                title: "Afrobeat Explorations",
                host: "Sarah Moon", 
                location: "NEW YORK",
                tags: ["AFROBEAT", "FUSION"]
              },
              {
                date: "NOV 28, 2024",
                title: "Ambient Architectures",
                host: "Alex Volta",
                location: "TOKYO", 
                tags: ["AMBIENT", "SOUNDSCAPE"]
              }
            ].map((show, index) => (
              <Card key={index} className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors group cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-square bg-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600/30 to-gray-800/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/60 transition-colors">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                        {show.location}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-white/60 mb-1">{show.date}</div>
                    <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {show.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">{show.host}</p>
                    <div className="flex flex-wrap gap-1">
                      {show.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-white/20 text-white/80">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">COLLECTIONS</h2>
            <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
              VIEW ALL →
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "LISTENER PICKS: WINTER '24",
                description: "Community-selected tracks defining the season",
                count: "47 tracks"
              },
              {
                title: "UNDERGROUND LONDON",
                description: "The sounds shaping the city's music scene",
                count: "32 tracks"
              },
              {
                title: "BERLIN AFTER DARK",
                description: "Late-night sessions from the German capital",
                count: "58 tracks"
              },
              {
                title: "GLOBAL FREQUENCIES",
                description: "Connecting cultures through sound",
                count: "41 tracks"
              }
            ].map((collection, index) => (
              <Card key={index} className="bg-black/40 border-white/10 hover:bg-black/60 transition-colors group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                      <Library className="w-8 h-8 text-white/60" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {collection.title}
                      </h3>
                      <p className="text-white/70 text-sm mb-2">{collection.description}</p>
                      <div className="text-white/60 text-xs">{collection.count}</div>
                    </div>
                    <div className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Audio Player Component */}
      <AudioPlayer isExpanded={false} onToggleExpanded={() => {}} />
    </div>
  );
}
