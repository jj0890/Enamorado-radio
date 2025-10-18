import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Radio, PlayCircle, StopCircle, SkipForward, Clock, Activity } from 'lucide-react';

interface NowPlaying {
  song: {
    title: string;
    artist: string;
    album: string | null;
  };
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
  const { toast } = useToast();

  // Fetch live status
  const { data: liveStatus, isLoading: statusLoading } = useQuery<LiveStatus>({
    queryKey: ['/api/admin/radio/status'],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Go Live mutation
  const goLiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/radio/go-live', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/radio/status'] });
      toast({
        title: '✅ Going Live!',
        description: 'Stream switched to live input',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to go live',
        variant: 'destructive',
      });
    },
  });

  // Return to Auto mutation
  const returnToAutoMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/radio/return-to-auto', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/radio/status'] });
      toast({
        title: '📻 Returned to AutoDJ',
        description: 'Now playing scheduled programming',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to return to auto',
        variant: 'destructive',
      });
    },
  });

  // Skip track mutation
  const skipMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/radio/skip', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/radio/status'] });
      toast({
        title: '⏭️ Skipped Track',
        description: 'Playing next track',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to skip track',
        variant: 'destructive',
      });
    },
  });

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
          <p className="text-gray-600 mt-2">Live broadcast controls and monitoring</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                {isLive && liveStatus.streamerName && (
                  <span className="text-sm text-gray-600">{liveStatus.streamerName}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Now Playing Card */}
          <Card className="md:col-span-2" data-testid="card-now-playing">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : nowPlaying ? (
                <div>
                  <p className="font-semibold">{nowPlaying.song.title}</p>
                  <p className="text-sm text-gray-600">{nowPlaying.song.artist}</p>
                  {nowPlaying.song.album && (
                    <p className="text-xs text-gray-500">{nowPlaying.song.album}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No track information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card data-testid="card-control-panel">
          <CardHeader>
            <CardTitle>Broadcast Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Go Live */}
              <Button
                onClick={() => goLiveMutation.mutate()}
                disabled={isLive || goLiveMutation.isPending}
                className="h-24 flex flex-col items-center justify-center gap-2"
                data-testid="button-go-live"
              >
                <PlayCircle className="w-8 h-8" />
                <span className="font-semibold">GO LIVE</span>
                <span className="text-xs opacity-75">Switch to live input</span>
              </Button>

              {/* Return to Auto */}
              <Button
                onClick={() => returnToAutoMutation.mutate()}
                disabled={!isLive || returnToAutoMutation.isPending}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                data-testid="button-return-to-auto"
              >
                <StopCircle className="w-8 h-8" />
                <span className="font-semibold">RETURN TO AUTO</span>
                <span className="text-xs opacity-75">Resume AutoDJ</span>
              </Button>

              {/* Skip Track */}
              <Button
                onClick={() => skipMutation.mutate()}
                disabled={isLive || skipMutation.isPending}
                variant="secondary"
                className="h-24 flex flex-col items-center justify-center gap-2"
                data-testid="button-skip-track"
              >
                <SkipForward className="w-8 h-8" />
                <span className="font-semibold">SKIP TRACK</span>
                <span className="text-xs opacity-75">Next in playlist</span>
              </Button>
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

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg" data-testid="guide-quick-guide">
          <h3 className="font-semibold text-blue-900 mb-2">📖 Quick Guide</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>GO LIVE:</strong> Switches stream to live DJ input (requires AzuraCast streamer connection)</li>
            <li>• <strong>RETURN TO AUTO:</strong> Returns to scheduled AutoDJ programming</li>
            <li>• <strong>SKIP TRACK:</strong> Skips current track (AutoDJ mode only)</li>
            <li>• <strong>Status updates every 5 seconds automatically</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
