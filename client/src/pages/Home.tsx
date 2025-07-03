import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Users
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">RadioCast</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-32 px-4 max-w-6xl mx-auto">
        {/* Now Playing Hero */}
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white/80">NOW PLAYING</span>
              </div>
              
              <h2 className="text-3xl font-bold mb-2">
                {currentPlayback?.title || 'Deep House Sessions'}
              </h2>
              <p className="text-white/70 mb-4">
                with {currentPlayback?.artist || 'Marcus Rivera'}
              </p>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Journey through the depths of electronic music with curated deep house tracks from around the globe.
              </p>
              
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleListenLive}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium"
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Listen Live
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-full font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Featured Shows */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Featured Shows</h3>
            <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
              View All
            </Button>
          </div>
          
          {showsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-white/10 rounded-lg mb-3 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <FeaturedShows
              shows={featuredShows}
              onShowSelect={handleShowSelect}
            />
          )}
        </section>

        {/* Popular Stations */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Popular Stations</h3>
          
          {stationsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-white/10 rounded-lg mb-3 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StationGrid
              stations={stations}
              onStationSelect={handleStationSelect}
            />
          )}
        </section>

        {/* On Air Now */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-6">On Air Now</h3>
          
          <Card className="bg-black/40 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-white/80">
                      LIVE • 11 PM - 12 AM
                    </span>
                  </div>
                  <h4 className="font-semibold text-white">
                    {currentPlayback?.title || 'RadioCast 10 Years'}
                  </h4>
                  <p className="text-white/70 text-sm">
                    Celebrating a decade of music discovery
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full p-0"
                  onClick={handleListenLive}
                >
                  <Radio className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Live waveform visualization */}
              <div className="flex items-center space-x-4 mb-4">
                <Waveform className="flex-1 h-8" barCount={20} color="rgb(59 130 246)" />
                <span className="text-xs text-white/60">Live Audio</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-white/60">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{Math.floor(Math.random() * 1000) + 500} listening</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Live since {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                  ON AIR
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-6">
        <div className="flex items-center justify-around px-4 py-2">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-3 text-blue-400">
            <HomeIcon className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-3 text-white/70 hover:text-white">
            <Grid3x3 className="w-5 h-5" />
            <span className="text-xs">Browse</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-3 text-white/70 hover:text-white">
            <Radio className="w-5 h-5" />
            <span className="text-xs">Radio</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-3 text-white/70 hover:text-white">
            <Library className="w-5 h-5" />
            <span className="text-xs">Library</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-3 text-white/70 hover:text-white">
            <Search className="w-5 h-5" />
            <span className="text-xs">Search</span>
          </Button>
        </div>
      </nav>

      {/* Audio Player Component */}
      <AudioPlayer />
    </div>
  );
}
