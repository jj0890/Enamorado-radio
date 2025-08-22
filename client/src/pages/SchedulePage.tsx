import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, Radio, Music } from "lucide-react";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Fetch schedule data
  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["/api/schedule", { upcoming: viewMode === 'upcoming' ? true : undefined }],
    refetchInterval: 60000, // Refresh every minute for live updates
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StickyRadioPlayer />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="text-gray-600 font-mono">Loading schedule...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StickyRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
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
                <Link href="/schedule" className="text-red-500 font-medium">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
                  MIXES
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 font-mono text-red-500">SCHEDULE</h1>
          <p className="text-xl text-gray-600 max-w-3xl font-mono">
            Weekly programming grid showing upcoming shows, live broadcasts, and past episodes
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button
              variant={viewMode === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setViewMode('upcoming')}
              className={viewMode === 'upcoming' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Shows
            </Button>
            <Button
              variant={viewMode === 'past' ? 'default' : 'outline'}
              onClick={() => setViewMode('past')}
              className={viewMode === 'past' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Clock className="w-4 h-4 mr-2" />
              Past Shows
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              className={viewMode === 'all' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Music className="w-4 h-4 mr-2" />
              All Programming
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        {schedule.length > 0 ? (
          <div className="space-y-6">
            {schedule.map((item: any) => {
              const isLive = item.status === 'live';
              const isUpcoming = new Date(item.scheduledAt) > new Date();
              const showTime = new Date(item.scheduledAt);
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-gray-50 border-2 rounded-lg p-6 transition-all duration-300 ${
                    isLive 
                      ? 'border-red-500 bg-red-50' 
                      : isUpcoming 
                      ? 'border-gray-300 hover:border-red-500' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex items-center gap-3 mb-3">
                        {isLive && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-red-500 text-white">
                            <Radio className="w-3 h-3 mr-1" />
                            LIVE NOW
                          </span>
                        )}
                        {isUpcoming && !isLive && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-blue-500 text-white">
                            <Calendar className="w-3 h-3 mr-1" />
                            UPCOMING
                          </span>
                        )}
                        {!isUpcoming && !isLive && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-500 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            AIRED
                          </span>
                        )}
                      </div>

                      {/* Show Info */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold font-mono text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center text-gray-600 font-mono text-sm mb-2">
                          <User className="w-4 h-4 mr-2" />
                          {item.hostName}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 font-mono text-sm">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Time and Duration */}
                      <div className="flex items-center gap-6 text-sm font-mono text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {showTime.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {showTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                        <div>
                          Duration: {item.duration}min
                        </div>
                        {item.isRecurring && (
                          <div className="text-blue-600">
                            Recurring {item.recurrencePattern}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Artwork */}
                    {item.artworkUrl && (
                      <div className="ml-6">
                        <img 
                          src={item.artworkUrl} 
                          alt={item.title}
                          className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {item.episodeId && (
                          <Link href={`/episode/${item.episodeId}`}>
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-mono">
                              Listen to Episode
                            </Button>
                          </Link>
                        )}
                        {isLive && (
                          <div className="text-red-500 font-mono text-sm animate-pulse">
                            Broadcasting now on Enamorado Radio
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs font-mono text-gray-400">
                        {item.status === 'scheduled' ? 'Scheduled' : 
                         item.status === 'live' ? 'Live' : 
                         item.status === 'completed' ? 'Completed' : 
                         'Status: ' + item.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 font-mono mb-4">
              No {viewMode === 'upcoming' ? 'upcoming shows' : 
                   viewMode === 'past' ? 'past shows' : 
                   'programming'} scheduled yet.
            </div>
            <p className="text-gray-500 font-mono text-sm mb-6">
              Check back soon for our latest programming updates, or submit a mix to get involved.
            </p>
            <Link href="/submit-mix" className="inline-block">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
                Submit Your Mix
              </Button>
            </Link>
          </div>
        )}

        {/* Programming Notes */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">PROGRAMMING NOTES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
              <Radio className="w-8 h-8 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-700 mb-2">Live Shows</h3>
              <p className="text-sm font-mono text-gray-600">
                Real-time broadcasts with live chat and interaction
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
              <Music className="w-8 h-8 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-700 mb-2">Recorded Sets</h3>
              <p className="text-sm font-mono text-gray-600">
                Pre-recorded mixes and curated programming
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
              <Calendar className="w-8 h-8 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold font-mono text-gray-700 mb-2">Special Events</h3>
              <p className="text-sm font-mono text-gray-600">
                Featured showcases and community takeovers
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}