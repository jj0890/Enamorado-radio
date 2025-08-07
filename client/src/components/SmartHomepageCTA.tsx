import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Radio, Play, Upload, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { useAudioManager } from '@/lib/audioManager';

interface StreamStatus {
  isLive: boolean;
  listenerCount?: number;
  currentShow?: string;
}

interface UpcomingShow {
  title: string;
  host: string;
  startTime: Date;
}

export function SmartHomepageCTA() {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({ isLive: false });
  const [featuredMixes, setFeaturedMixes] = useState<any[]>([]);
  const [upcomingShow, setUpcomingShow] = useState<UpcomingShow | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { currentTrack, isPlaying, mode } = useAudioManager();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check live stream status
        const streamResponse = await fetch('/api/stream-status');
        if (streamResponse.ok) {
          const streamData = await streamResponse.json();
          setStreamStatus(streamData);
        }

        // Get featured mixes
        const mixesResponse = await fetch('/api/mixes?status=featured&limit=5');
        if (mixesResponse.ok) {
          const mixesData = await mixesResponse.json();
          setFeaturedMixes(mixesData);
        }

        // Get upcoming show
        const scheduleResponse = await fetch('/api/schedule?upcoming=true&limit=1');
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          if (scheduleData.length > 0) {
            setUpcomingShow({
              title: scheduleData[0].title,
              host: scheduleData[0].host,
              startTime: new Date(scheduleData[0].startTime),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Priority 1: Live stream is active
  if (streamStatus.isLive) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
            <Radio className="w-8 h-8 text-red-500 mr-2" />
            <h2 className="text-2xl font-bold font-mono text-red-500">LIVE NOW</h2>
          </div>
          
          <p className="text-gray-800 font-mono mb-2 text-lg">
            {streamStatus.currentShow || 'Broadcasting live'}
          </p>
          
          {streamStatus.listenerCount && (
            <p className="text-sm text-gray-600 font-mono mb-6">
              {streamStatus.listenerCount} listeners tuned in
            </p>
          )}

          <div className="flex items-center justify-center gap-4">
            <Button className="bg-red-500 hover:bg-red-600 text-white font-mono">
              <Radio className="w-4 h-4 mr-2" />
              Tune In Live
            </Button>
            <Link href="/schedule">
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Priority 2: Featured mixes available (archive rotation)
  if (featuredMixes.length > 0) {
    const currentMixDisplay = currentTrack && mode === 'auto' 
      ? `${currentTrack.title} - ${currentTrack.artist}`
      : 'Archive Rotation Active';

    return (
      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-blue-500 mr-2" />
          <h2 className="text-2xl font-bold font-mono text-blue-500">ARCHIVE ROTATION</h2>
        </div>
        
        <p className="text-gray-800 font-mono mb-2">
          {isPlaying ? 'Now Playing:' : 'Ready to play:'}
        </p>
        <p className="text-lg font-bold font-mono text-blue-600 mb-6">
          {currentMixDisplay}
        </p>
        
        <p className="text-sm text-gray-600 font-mono mb-6">
          Featuring {featuredMixes.length} curated mixes from our community
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/mixes">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-mono">
              <Play className="w-4 h-4 mr-2" />
              Explore Featured Mixes
            </Button>
          </Link>
          <Link href="/submit-mix">
            <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-mono">
              <Upload className="w-4 h-4 mr-2" />
              Submit Your Mix
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Priority 3: No featured mixes or off-season
  return (
    <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <Upload className="w-8 h-8 text-purple-500 mr-2" />
        <h2 className="text-2xl font-bold font-mono text-purple-500">BE THE FIRST</h2>
      </div>
      
      <p className="text-gray-800 font-mono mb-2 text-lg">
        Help us launch our archive rotation
      </p>
      
      {upcomingShow && (
        <p className="text-sm text-gray-600 font-mono mb-4">
          Next live show: {upcomingShow.title} with {upcomingShow.host}
          <br />
          {upcomingShow.startTime.toLocaleDateString()} at {upcomingShow.startTime.toLocaleTimeString()}
        </p>
      )}
      
      <p className="text-sm text-gray-600 font-mono mb-6">
        Submit your mix to be featured in our rotation and help shape the sound of Enamorado Radio
      </p>

      <div className="flex items-center justify-center gap-4">
        <Link href="/submit-mix">
          <Button className="bg-purple-500 hover:bg-purple-600 text-white font-mono">
            <Upload className="w-4 h-4 mr-2" />
            Submit Your Mix
          </Button>
        </Link>
        <Link href="/resident-application">
          <Button variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-mono">
            <ExternalLink className="w-4 h-4 mr-2" />
            Become a Resident
          </Button>
        </Link>
      </div>
    </div>
  );
}