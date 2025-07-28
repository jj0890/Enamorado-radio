import { useQuery } from '@tanstack/react-query';
import { Radio, Shuffle, Clock, User } from 'lucide-react';

interface ProgramInfo {
  type: 'auto' | 'live';
  currentShow?: {
    id: number;
    name: string;
    host: string;
    startTime: string;
    endTime: string;
    description?: string;
    genre?: string;
  };
  nextShow?: {
    id: number;
    name: string;
    host: string;
    startTime: string;
    dayOfWeek: number;
  };
  currentTrack?: {
    id: string;
    title: string;
    artist: string;
    sourceType: string;
    metadata?: any;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProgramIndicator() {
  const { data: programInfo, isLoading } = useQuery<ProgramInfo>({
    queryKey: ['/api/radio/program-info'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  if (isLoading || !programInfo) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  const isLive = programInfo.type === 'live';

  return (
    <div className="text-center py-6">
      {/* Main Program Status */}
      <div className="mb-4">
        {isLive && programInfo.currentShow ? (
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 font-mono text-sm font-bold">LIVE NOW</span>
            </div>
            <h2 className="text-2xl font-bold font-mono text-gray-800 mb-1">
              {programInfo.currentShow.name}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-mono text-sm">with {programInfo.currentShow.host}</span>
            </div>
            <div className="text-gray-500 text-sm font-mono mt-1">
              {programInfo.currentShow.startTime} - {programInfo.currentShow.endTime}
            </div>
            {programInfo.currentShow.genre && (
              <div className="text-gray-500 text-xs font-mono mt-1">
                {programInfo.currentShow.genre}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shuffle className="w-4 h-4 text-blue-500" />
              <span className="text-blue-500 font-mono text-sm font-bold">AUTO ROTATION</span>
            </div>
            <h2 className="text-2xl font-bold font-mono text-gray-800 mb-1">
              Enamorado Radio - Continuous Mix
            </h2>
            <div className="text-gray-600 text-sm font-mono">
              24/7 Curated Music Selection
            </div>
          </div>
        )}
      </div>

      {/* Current Track Info */}
      {programInfo.currentTrack && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
          <div className="text-xs font-mono text-gray-500 mb-1">NOW PLAYING</div>
          <div className="font-semibold text-gray-800">{programInfo.currentTrack.title}</div>
          <div className="text-gray-600 text-sm">{programInfo.currentTrack.artist}</div>
          <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
            <Radio className="w-3 h-3" />
            {programInfo.currentTrack.sourceType === 'upload' && 'Community Upload'}
            {programInfo.currentTrack.sourceType === 'soundcloud' && 'SoundCloud'}
            {programInfo.currentTrack.sourceType === 'dj_submission' && 'DJ Submission'}
          </div>
        </div>
      )}

      {/* Next Show Info */}
      {!isLive && programInfo.nextShow && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">NEXT LIVE SHOW</span>
          </div>
          <div className="text-gray-700 font-medium">
            {programInfo.nextShow.name}
          </div>
          <div className="text-gray-600 text-sm">
            with {programInfo.nextShow.host}
          </div>
          <div className="text-gray-500 text-xs font-mono mt-1">
            {DAYS[programInfo.nextShow.dayOfWeek]} at {programInfo.nextShow.startTime}
          </div>
        </div>
      )}

      {/* Auto Mode Description */}
      {!isLive && (
        <div className="mt-4 text-xs text-gray-500 font-mono max-w-sm mx-auto">
          Playing approved community submissions and curated tracks. 
          Tune in for live shows to hear hosted programming.
        </div>
      )}
    </div>
  );
}