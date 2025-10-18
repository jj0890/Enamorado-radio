import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Clock, Activity } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  album: string | null;
}

interface NowPlaying {
  now_playing: {
    song: Song;
  };
  playing_next: {
    song: Song;
  } | null;
  live: {
    is_live: boolean;
    streamer_name: string | null;
  };
}

interface LiveStatus {
  isLive: boolean;
  streamerName: string | null;
  nowPlaying: NowPlaying | null;
}

export default function RadioOps() {
  // Fetch live status
  const { data: liveStatus, isLoading: statusLoading } = useQuery<LiveStatus>({
    queryKey: ['/api/admin/radio/status'],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Note: Control mutations removed - AzuraCast control endpoints require web session auth
  // This panel is monitoring-only

  const isLive = liveStatus?.isLive || false;
  const nowPlaying = liveStatus?.nowPlaying;

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono text-red-500" data-testid="heading-radio-ops">
            RADIO OPS PANEL
          </h1>
          <p className="text-gray-600 mt-2">Real-time broadcast monitoring dashboard</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Live Status Card */}
          <Card data-testid="card-broadcast-status">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Broadcast Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge
                  variant={isLive ? 'default' : 'secondary'}
                  className={isLive ? 'bg-red-500 hover:bg-red-600' : ''}
                  data-testid="badge-broadcast-status"
                >
                  {isLive ? '🔴 LIVE' : '🤖 AUTO'}
                </Badge>
                {isLive && liveStatus?.streamerName && (
                  <span className="text-sm text-gray-600">{liveStatus.streamerName}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Now Playing Card */}
          <Card data-testid="card-now-playing">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : nowPlaying?.now_playing?.song ? (
                <div>
                  <p className="font-semibold text-lg">{nowPlaying.now_playing.song.title || 'Unknown Track'}</p>
                  <p className="text-sm text-gray-600">{nowPlaying.now_playing.song.artist || 'Unknown Artist'}</p>
                  {nowPlaying.now_playing.song.album && (
                    <p className="text-xs text-gray-500 mt-1">{nowPlaying.now_playing.song.album}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No track information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coming Up Next */}
        {!isLive && nowPlaying?.playing_next?.song && (
          <Card className="mb-8" data-testid="card-playing-next">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Coming Up Next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="font-semibold">{nowPlaying.playing_next.song.title}</p>
                <p className="text-gray-600">{nowPlaying.playing_next.song.artist}</p>
                {nowPlaying.playing_next.song.album && (
                  <p className="text-xs text-gray-500 mt-1">{nowPlaying.playing_next.song.album}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Limitation Notice - Controls Unavailable */}
        <Card className="border-yellow-300 bg-yellow-50" data-testid="card-control-notice">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚠️ Broadcast Controls Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-yellow-800">
                <strong>AzuraCast API Limitation:</strong> The skip track, go live, and disconnect endpoints require web session 
                authentication (browser cookies), which cannot be automated via API keys.
              </p>
              <p className="text-sm text-yellow-800">
                This panel provides <strong>real-time monitoring only</strong>. For active broadcast controls (skip, go live, disconnect streamers):
              </p>
              <a
                href="http://24.199.109.18/admin#/stations/1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                data-testid="link-azuracast-admin"
              >
                <Radio className="w-5 h-5" />
                Open AzuraCast Admin Panel →
              </a>
              <p className="text-xs text-yellow-700 mt-2">
                Opens in new tab - you'll need to log in with your AzuraCast credentials
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card className="mt-6" data-testid="card-station-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Station Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-600">Stream URL</p>
                <p className="font-mono text-xs">http://24.199.109.18:8000/radio.mp3</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Station ID</p>
                <p className="font-mono">Enamorado Radio</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Location</p>
                <p className="font-mono">San Antonio, TX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Instructions */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg" data-testid="guide-quick-guide">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Monitoring Features</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Live Status:</strong> See if station is in LIVE or AUTO mode</li>
            <li>• <strong>Now Playing:</strong> View current track information</li>
            <li>• <strong>Auto-Refresh:</strong> Status updates every 5 seconds automatically</li>
            <li>• <strong>Streamer Detection:</strong> Shows DJ name when live streaming</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
