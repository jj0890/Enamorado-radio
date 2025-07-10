# Complete Code Files Part 2

## Mobile Radio Component (Updated with Symbol-based Artwork)

### client/src/pages/MobileRadio.tsx
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronDown, MoreHorizontal, Radio, Headphones, Search, Layers, User, Music, Mic, Disc, Volume2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '../lib/queryClient';
import { useWebSocket } from '../hooks/useWebSocket';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  streamUrl: string;
  duration?: number;
}

interface Show {
  id: number;
  title: string;
  host: string;
  location: string;
  description: string;
  tags: string[];
  isLive: boolean;
  artwork: string;
  date: string;
  time: string;
  streamUrl?: string;
}

// Symbol-based artwork component
const SymbolArtwork: React.FC<{ type: string; className?: string }> = ({ type, className = "w-full h-full" }) => {
  const getSymbol = () => {
    switch (type) {
      case 'dj':
        return <Disc className={`${className} text-white/60`} />;
      case 'student':
        return <Music className={`${className} text-white/60`} />;
      case 'collective':
        return <Volume2 className={`${className} text-white/60`} />;
      case 'live':
        return <Radio className={`${className} text-white/60`} />;
      default:
        return <Mic className={`${className} text-white/60`} />;
    }
  };

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${
      type === 'dj' ? 'from-purple-900 to-pink-900' :
      type === 'student' ? 'from-blue-900 to-cyan-900' :
      type === 'collective' ? 'from-green-900 to-teal-900' :
      'from-red-900 to-orange-900'
    } ${className}`}>
      {getSymbol()}
    </div>
  );
};

export default function MobileRadio() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [playerModal, setPlayerModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeNav, setActiveNav] = useState('live');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // API queries
  const { data: tracksData } = useQuery({
    queryKey: ['/api/tracks'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  const { data: showsData } = useQuery({
    queryKey: ['/api/shows/mobile'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  // WebSocket connection for real-time updates
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'currentPlayback') {
        console.log('Current playback update:', message.data);
      }
    }
  });

  // Use API data when available, fallback to empty arrays
  const tracks = tracksData || [];
  const shows = showsData || [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    const audio = audioRef.current;
    if (audio) {
      audio.src = track.streamUrl;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const playShow = (show: Show) => {
    setCurrentShow(show);
    if (show.streamUrl) {
      const track: Track = {
        id: show.id.toString(),
        title: show.title,
        artist: show.host,
        artwork: show.artwork,
        streamUrl: show.streamUrl
      };
      playTrack(track);
    }
  };

  const openShowModal = (show: Show) => {
    setCurrentShow(show);
    setShowModal(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getArtworkType = (showTitle: string) => {
    if (showTitle.includes('DJ')) return 'dj';
    if (showTitle.includes('STUDENT')) return 'student';
    if (showTitle.includes('COLLECTIVE')) return 'collective';
    return 'live';
  };

  const sampleTracklist = [
    { time: "0:00:20", artist: "Artist 1", title: "Track 1" },
    { time: "0:02:58", artist: "Artist 2", title: "Track 2" },
    { time: "0:06:10", artist: "Artist 3", title: "Track 3" },
    { time: "0:09:45", artist: "Artist 4", title: "Track 4" },
    { time: "0:13:20", artist: "Artist 5", title: "Track 5" }
  ];

  const relatedShows = [
    { 
      title: "Show 1", 
      location: "Location 1", 
      date: "5.3.2024", 
      tags: ["TAG1", "TAG2"],
      type: "dj"
    },
    { 
      title: "Show 2", 
      location: "Location 2", 
      date: "22.3.2024", 
      tags: ["TAG3", "TAG4"],
      type: "student"
    }
  ];

  const upNext = [
    { 
      title: "Next Show 1", 
      location: "Location 1", 
      date: "5.3.2024",
      type: "collective"
    },
    { 
      title: "Next Show 2", 
      location: "Location 2", 
      date: "22.3.2024",
      type: "live"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Audio Element */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-sm font-bold">LIVE</div>
            <div className="text-xs text-white/60">RADIO</div>
          </div>
          <button className="p-2 -mr-2">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Live Shows Feed */}
      <div className="p-4 space-y-4 pb-32">
        {shows.map((show) => (
          <div
            key={show.id}
            className="bg-white/5 rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
            onClick={() => openShowModal(show)}
          >
            <div className="relative">
              <div className="w-full h-64">
                <SymbolArtwork type={getArtworkType(show.title)} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {show.isLive && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">LIVE</span>
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-xs text-white/80 mb-1">{show.location}</div>
                <h3 className="text-lg font-bold mb-1">{show.title}</h3>
                <div className="text-xs text-white/80">{show.time}</div>
              </div>
              
              <button 
                className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  playShow(show);
                }}
              >
                <Play className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show Detail Modal */}
      {showModal && currentShow && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <button onClick={() => setShowModal(false)} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-sm font-bold">EPISODE</div>
              <button className="p-2 -mr-2">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Show Info */}
            <div className="p-4 border-b border-white/10">
              <div className="text-xs text-white/60 mb-2">{currentShow.date}</div>
              <div className="text-xs text-white/60 mb-1">{currentShow.location}</div>
              <h2 className="text-xl font-bold mb-2">{currentShow.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentShow.tags.map((tag) => (
                  <span key={tag} className="bg-transparent border border-white/30 px-3 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-white/70 mb-4">{currentShow.description}</p>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full">
                    <SymbolArtwork type={getArtworkType(currentShow.title)} className="w-full h-full rounded-full" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{currentShow.title}</div>
                    <div className="text-xs text-white/60">See all episodes</div>
                  </div>
                </div>
                <button className="ml-auto bg-white text-black px-4 py-2 rounded-full text-xs font-medium">
                  ♥ FOLLOWING
                </button>
              </div>
            </div>

            {/* You Might Also Like */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-bold mb-4">YOU MIGHT ALSO LIKE</h3>
              <div className="space-y-3">
                {relatedShows.map((related, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-15 h-15 rounded">
                      <SymbolArtwork type={related.type} className="w-full h-full rounded" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{related.title}</div>
                      <div className="text-xs text-white/60">{related.location} • {related.date}</div>
                      <div className="flex space-x-2 mt-1">
                        {related.tags.map((tag, i) => (
                          <span key={i} className="text-xs text-white/50">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracklist */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-bold mb-4">TRACKLIST</h3>
                <div className="space-y-3">
                  {sampleTracklist.map((track, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{track.artist}</div>
                        <div className="text-xs text-white/60">{track.title}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-white/60">{track.time}</span>
                        <button className="p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Subscribe prompt */}
                <div className="mt-6 p-4 border border-white/20 rounded-lg">
                  <h4 className="text-sm font-bold mb-2">UNLOCK TIMESTAMPS</h4>
                  <p className="text-xs text-white/70 mb-3">Subscribe to get full tracklist timestamps</p>
                  <button className="w-full bg-white text-black py-2 rounded text-sm font-medium">
                    SUBSCRIBE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Player Modal */}
      {playerModal && currentTrack && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Player Header */}
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setPlayerModal(false)} className="p-2 -ml-2">
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-center">
                <div className="text-sm font-bold">{currentTrack.title}</div>
                <div className="text-xs text-white/60">{currentTrack.artist}</div>
              </div>
              <div className="w-8" />
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-80 h-80 max-w-full max-h-full rounded-lg">
                <SymbolArtwork type={getArtworkType(currentTrack.title)} className="w-full h-full rounded-lg" />
              </div>
            </div>

            {/* Player Controls */}
            <div className="p-6">
              <div className="mb-6">
                <div className="relative">
                  <div className="w-full h-1 bg-white/20 rounded-full">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/60 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Up Next */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">UP NEXT</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/60">AUTO PLAY</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white transition-colors">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-black transition translate-x-6" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-white/60 mb-3">Similar to what you are listening to</div>
                <div className="space-y-3">
                  {upNext.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded">
                        <SymbolArtwork type={item.type} className="w-full h-full rounded" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-white/60">{item.location}, {item.date}</div>
                      </div>
                      <button className="w-8 h-8 flex items-center justify-center">
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Player */}
      {currentTrack && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-3">
            <div className="flex items-center space-x-3">
              <button onClick={() => setPlayerModal(true)} className="flex-1 flex items-center space-x-3">
                <div className="w-12 h-12 rounded">
                  <SymbolArtwork type={getArtworkType(currentTrack.title)} className="w-full h-full rounded" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{currentTrack.title}</div>
                  <div className="text-xs text-white/60">{currentTrack.artist} • LIVE</div>
                </div>
              </button>
              <button onClick={togglePlayPause} className="p-3">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10">
        <div className="grid grid-cols-5 h-16">
          <button 
            className={`flex flex-col items-center justify-center py-2 ${activeNav === 'live' ? 'text-white' : 'text-white/60'}`}
            onClick={() => setActiveNav('live')}
          >
            <Radio className="w-5 h-5 mb-1" />
            <span className="text-xs">LIVE</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center py-2 ${activeNav === 'discovery' ? 'text-white' : 'text-white/60'}`}
            onClick={() => setActiveNav('discovery')}
          >
            <Headphones className="w-5 h-5 mb-1" />
            <span className="text-xs">DISCOVERY</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center py-2 ${activeNav === 'search' ? 'text-white' : 'text-white/60'}`}
            onClick={() => setActiveNav('search')}
          >
            <Search className="w-5 h-5 mb-1" />
            <span className="text-xs">SEARCH</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center py-2 ${activeNav === 'guides' ? 'text-white' : 'text-white/60'}`}
            onClick={() => setActiveNav('guides')}
          >
            <Layers className="w-5 h-5 mb-1" />
            <span className="text-xs">GUIDES</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center py-2 ${activeNav === 'schedule' ? 'text-white' : 'text-white/60'}`}
            onClick={() => setActiveNav('schedule')}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">SCHEDULE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

Continue to Part 3 for server files...