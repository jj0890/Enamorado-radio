import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronDown, MoreHorizontal, Radio, Headphones, Search, Layers, User } from 'lucide-react';
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
              <img 
                src={show.artwork} 
                alt={show.title} 
                className="w-full h-64 object-cover"
              />
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
                  <img 
                    src={currentShow.artwork} 
                    className="w-10 h-10 rounded-full" 
                    alt={currentShow.host}
                  />
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
              <div className="w-80 h-80 max-w-full max-h-full">
                <img 
                  src={currentTrack.artwork} 
                  className="w-full h-full object-cover rounded-lg" 
                  alt="Track artwork"
                />
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
                <img 
                  src={currentTrack.artwork} 
                  className="w-12 h-12 rounded object-cover" 
                  alt="Current track"
                />
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