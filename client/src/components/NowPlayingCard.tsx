import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';

interface NowPlayingData {
  now_playing?: {
    song?: {
      artist?: string;
      title?: string;
      art?: string;
    };
  };
  live?: {
    is_live?: boolean;
    streamer_name?: string;
  };
}

export function NowPlayingCard() {
  const { data, isLoading } = useQuery<NowPlayingData>({
    queryKey: ['/nowplaying'],
    refetchInterval: 10000, // Poll every 10 seconds
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const song = data?.now_playing?.song || {};
  const artist = song.artist || '';
  const track = song.title || 'Live Stream';
  const isLive = data?.live?.is_live;

  // Enhanced title mapping for uploaded episodes
  let displayTitle = 'Enamorado Radio';
  if (artist && track && track !== 'Station Offline') {
    displayTitle = `${artist} — ${track}`;
  } else if (track && track !== 'Station Offline' && track !== 'Live Stream') {
    displayTitle = track;
  }

  const subtitle = isLive
    ? `LIVE • ${data?.live?.streamer_name || 'On Air'}`
    : track === 'Station Offline' ? 'Station Offline' : null;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {song.art ? (
            <img
              src={song.art}
              alt={displayTitle}
              className="w-12 h-12 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-navy rounded flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {displayTitle}
            </h3>
            {subtitle && (
              <div className="flex items-center gap-2 mt-1">
                {isLive ? (
                  <Badge variant="destructive" className="text-xs">
                    {subtitle}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}