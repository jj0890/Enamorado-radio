import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Calendar, Clock, Radio, Filter, Settings } from "lucide-react";

interface Show {
  id: string;
  title: string;
  host: string;
  startTime: string;
  duration: number;
  category: string;
  description: string;
  tags: string[];
  artwork?: string;
  isLive: boolean;
}

export default function Schedule() {
  const [currentFilter, setCurrentFilter] = useState<'all' | 'live' | 'residency' | 'guest' | 'experimental'>('all');
  const [currentShow, setCurrentShow] = useState<string>("Loading...");
  const [timezone] = useState("America/Chicago");

  const shows: Show[] = [
    {
      id: '1',
      title: 'Deep Routes',
      host: 'Marcus Rivera',
      startTime: '2025-01-15T20:00:00',
      duration: 120,
      category: 'live',
      description: 'Deep house specialist with 15+ years digging through Detroit\'s underground',
      tags: ['house', 'deep', 'underground'],
      isLive: true
    },
    {
      id: '2',
      title: 'Experimental Sounds',
      host: 'Alex Stone',
      startTime: '2025-01-16T18:00:00',
      duration: 90,
      category: 'experimental',
      description: 'Pushing boundaries with avant-garde and experimental music',
      tags: ['experimental', 'avant-garde', 'ambient'],
      isLive: false
    },
    {
      id: '3',
      title: 'Midnight Sessions',
      host: 'Luna Park',
      startTime: '2025-01-17T00:00:00',
      duration: 60,
      category: 'residency',
      description: 'Late night ambient and downtempo selections',
      tags: ['ambient', 'downtempo', 'chillout'],
      isLive: false
    },
    {
      id: '4',
      title: 'Guest Mix: Vinyl Junkie',
      host: 'David Chen',
      startTime: '2025-01-18T19:00:00',
      duration: 75,
      category: 'guest',
      description: 'Rare grooves and deep cuts from the vinyl collection',
      tags: ['soul', 'funk', 'rare grooves'],
      isLive: false
    }
  ];

  const filteredShows = shows.filter(show => 
    currentFilter === 'all' || show.category === currentFilter
  );

  const groupedShows = filteredShows.reduce((acc, show) => {
    const date = new Date(show.startTime).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(show);
    return acc;
  }, {} as Record<string, Show[]>);

  useEffect(() => {
    const liveShow = shows.find(show => show.isLive);
    if (liveShow) {
      setCurrentShow(`${liveShow.title} with ${liveShow.host}`);
    } else {
      setCurrentShow("No live broadcast");
    }
  }, []);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'live': return 'bg-red-500/20 text-red-400';
      case 'residency': return 'bg-blue-500/20 text-blue-400';
      case 'guest': return 'bg-green-500/20 text-green-400';
      case 'experimental': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Moving Banner */}
      <div className="bg-orange-500 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-sm font-medium">
            LIVE BROADCASTS • EXPERIMENTAL MUSIC • COMMUNITY DRIVEN • LISTEN AT ENAMORADORADIO.COM
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-orange-500 hover:text-orange-400 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-4">Schedule</h1>
          <div className="text-gray-400 mb-4">Your Timezone: {timezone}</div>
          <div className="flex items-center justify-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 inline-flex">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium" id="current-show">{currentShow}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center space-x-2 mb-8 flex-wrap">
          {[
            { key: 'all', label: 'All Shows' },
            { key: 'live', label: 'Live' },
            { key: 'residency', label: 'Residencies' },
            { key: 'guest', label: 'Guest Mixes' },
            { key: 'experimental', label: 'Experimental' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCurrentFilter(key as typeof currentFilter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentFilter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(groupedShows).map(([date, dayShows]) => (
            <div key={date} className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-orange-500 text-center">
                {date}
              </h2>
              <div className="space-y-3">
                {dayShows.map((show) => (
                  <div
                    key={show.id}
                    className="bg-gray-900 rounded-lg p-3 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <Radio className="w-6 h-6 text-gray-400 group-hover:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-orange-500 group-hover:text-white font-semibold text-sm">
                            {formatTime(show.startTime)}
                          </span>
                          {show.isLive && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-white">
                          {show.title}
                        </h3>
                        <p className="text-gray-400 group-hover:text-white/90 text-xs mb-2">
                          {show.host}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {show.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-500/20 text-blue-400 group-hover:bg-white/20 group-hover:text-white px-2 py-1 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 group-hover:text-white/80 text-xs">
                            {formatDuration(show.duration)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(show.category)} group-hover:bg-white/20 group-hover:text-white`}>
                            {show.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Archive Link */}
        <div className="text-center">
          <Link
            href="/schedule-archive"
            className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
          >
            » View full schedule archive
          </Link>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="fixed bottom-6 right-6">
        <Link
          href="/admin"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
        >
          <Settings className="w-5 h-5" />
          <span>Admin Panel</span>
        </Link>
      </div>
    </div>
  );
}