import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Music, Radio, Clock, TrendingUp } from "lucide-react";

interface AdminStatsData {
  totalMixes: number;
  pendingReviews: number;
  approvedMixes: number;
  featuredMixes: number;
  totalShows: number;
  liveShows: number;
  totalEpisodes: number;
  publishedEpisodes: number;
  recentSubmissions: Array<{
    id: number;
    title: string;
    artist: string;
    submittedAt: string;
    status: string;
  }>;
}

interface NowPlayingData {
  is_online: boolean;
  now_playing: {
    song: {
      title: string;
      artist: string;
      album?: string;
    };
  };
  listeners: {
    current: number;
    total: number;
    unique: number;
  };
  station: {
    name: string;
  };
}

export default function AdminStats() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStatsData>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: nowPlaying, isLoading: nowPlayingLoading } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000, // Refresh every 10 seconds for live data
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const approvalRate = stats?.totalMixes ? Math.round((stats.approvedMixes / stats.totalMixes) * 100) : 0;
  const featuredRate = stats?.approvedMixes ? Math.round((stats.featuredMixes / stats.approvedMixes) * 100) : 0;
  const publishRate = stats?.totalEpisodes ? Math.round((stats.publishedEpisodes / stats.totalEpisodes) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono text-navy">
              📊 STATS DASHBOARD
            </h1>
            <p className="text-gray-600 mt-2 font-mono">
              Real-time radio station metrics and analytics
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
            <Activity className="w-4 h-4" />
            Live updates every 30s
          </div>
        </div>

        {/* Live Stream Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-mono text-navy">
                <Radio className="w-5 h-5" />
                Live Stream Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nowPlayingLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : nowPlaying ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${nowPlaying.is_online ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="font-mono text-sm">
                      {nowPlaying.is_online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="font-mono text-sm">
                    <div className="font-semibold">{nowPlaying.now_playing?.song?.title || 'No Track Info'}</div>
                    <div className="text-gray-600">{nowPlaying.now_playing?.song?.artist || 'Unknown Artist'}</div>
                    {nowPlaying.now_playing?.song?.album && (
                      <div className="text-gray-500 text-xs">{nowPlaying.now_playing.song.album}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 font-mono">Stream data unavailable</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-mono text-navy">
                <Users className="w-5 h-5" />
                Listener Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nowPlayingLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : nowPlaying?.listeners ? (
                <div className="space-y-3">
                  <div className="text-3xl font-bold font-mono text-navy">
                    {nowPlaying.listeners.current}
                  </div>
                  <div className="text-sm text-gray-600 font-mono">
                    Total: {nowPlaying.listeners.total} | Unique: {nowPlaying.listeners.unique}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 font-mono">Listener data unavailable</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <Music className="w-4 h-4" />
                Mix Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-navy mb-1">
                {stats?.totalMixes || 0}
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {stats?.pendingReviews || 0} pending review
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <TrendingUp className="w-4 h-4" />
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-navy mb-2">
                {approvalRate}%
              </div>
              <Progress value={approvalRate} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <Radio className="w-4 h-4" />
                Radio Shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-navy mb-1">
                {stats?.totalShows || 0}
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {stats?.liveShows || 0} live shows
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-mono text-sm">
                <Clock className="w-4 h-4" />
                Episodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-navy mb-1">
                {stats?.totalEpisodes || 0}
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {publishRate}% published
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="font-mono text-navy">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2">
                    <span>Approval Rate</span>
                    <span>{approvalRate}%</span>
                  </div>
                  <Progress value={approvalRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2">
                    <span>Featured Rate</span>
                    <span>{featuredRate}%</span>
                  </div>
                  <Progress value={featuredRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2">
                    <span>Publish Rate</span>
                    <span>{publishRate}%</span>
                  </div>
                  <Progress value={publishRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="font-mono text-navy">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
                  stats.recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <div className="font-mono text-sm font-medium truncate max-w-48">
                          {submission.title}
                        </div>
                        <div className="font-mono text-xs text-gray-600">
                          by {submission.artist}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submission.status === 'featured' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 font-mono text-sm text-center py-8">
                    No recent submissions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="font-mono text-navy">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/admin/mix-submissions'}
                className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                data-testid="button-review-mixes"
              >
                <div className="font-mono text-sm font-medium text-red-700">
                  Review Mixes
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  {stats?.pendingReviews || 0} pending
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/backups'}
                className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                data-testid="button-manage-backups"
              >
                <div className="font-mono text-sm font-medium text-red-700">
                  Manage Backups
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  System protection
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/azuracast'}
                className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                data-testid="button-stream-control"
              >
                <div className="font-mono text-sm font-medium text-red-700">
                  Stream Control
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  AzuraCast panel
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin'}
                className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                data-testid="button-admin-dashboard"
              >
                <div className="font-mono text-sm font-medium text-red-700">
                  Admin Dashboard
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Main admin panel
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}