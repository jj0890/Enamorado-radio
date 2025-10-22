import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Radio, Calendar, Key, Copy, Eye, EyeOff, PlayCircle, Info, Upload, FileAudio } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import type { Resident, Schedule } from '@shared/schema';
import StreamingGuide from '@/components/StreamingGuide';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ResidentDashboardProps {
  onLogout: () => void;
  residentData: {
    id: number;
    username: string;
    displayName: string;
    showTitle: string | null;
  };
}

export default function ResidentDashboard({ onLogout, residentData }: ResidentDashboardProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch resident details
  const { data: resident, isLoading: residentLoading } = useQuery<Resident>({
    queryKey: [`/api/residents/${residentData.id}`],
  });

  // Fetch resident's schedule
  const { data: schedule = [], isLoading: scheduleLoading } = useQuery<Schedule[]>({
    queryKey: [`/api/schedule/resident/${residentData.id}`],
  });

  // Fetch resident's episode submissions
  interface EpisodeSubmission {
    id: number;
    title: string;
    seriesTitle?: string;
    episodeNumber?: number;
    status: string;
    submittedAt: string;
    rejectionReason?: string;
    scheduledAirDate?: string;
  }
  
  const { data: episodes = [], isLoading: episodesLoading } = useQuery<EpisodeSubmission[]>({
    queryKey: [`/api/resident/episodes?residentId=${residentData.id}`],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/resident/logout', {});
    },
    onSuccess: () => {
      onLogout();
    },
  });

  const goLiveMutation = useMutation({
    mutationFn: async ({ scheduleId, status }: { scheduleId: number; status: string }) => {
      return await apiRequest('POST', '/api/resident/live-status', { scheduleId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedule/resident/${residentData.id}`] });
      toast({
        title: "Status Updated",
        description: "Your live status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update live status.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  // Find current or next show
  const now = new Date();
  
  // Current live show = any show marked as live
  const currentLiveShow = schedule.find(s => s.liveStatus === 'live');
  
  // Active slot = most recent show that has started and isn't completed
  // This is the show the resident should control, regardless of how long ago it started
  const activeSlot = schedule
    .filter(s => new Date(s.scheduledAt) <= now && s.liveStatus !== 'completed')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
  
  // Next upcoming show = future shows within 4 hours
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const nextUpcomingShow = schedule
    .filter(s => {
      const showTime = new Date(s.scheduledAt);
      return showTime > now && 
             showTime <= fourHoursFromNow && 
             s.liveStatus !== 'completed';
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  
  // The show to control = active slot (if exists and not already live elsewhere) OR next upcoming
  const showToControl = (activeSlot && !currentLiveShow) ? activeSlot : 
                        currentLiveShow ? currentLiveShow : 
                        nextUpcomingShow;

  const upcomingShows = schedule
    .filter(s => new Date(s.scheduledAt) > now && s.liveStatus !== 'completed')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);
  
  const handleGoLive = () => {
    if (!showToControl) {
      toast({
        title: "No Show Available",
        description: "You don't have any active or upcoming shows within the next 4 hours.",
        variant: "destructive",
      });
      return;
    }
    
    // Toggle: if this show is live, go offline; otherwise go live
    const newStatus = showToControl.liveStatus === 'live' ? 'offline' : 'live';
    goLiveMutation.mutate({ scheduleId: showToControl.id, status: newStatus });
  };
  
  const handleCompleteShow = () => {
    if (!activeSlot) return;
    
    if (confirm(`Mark "${activeSlot.title}" as completed? This will allow you to go live for your next show.`)) {
      goLiveMutation.mutate({ scheduleId: activeSlot.id, status: 'completed' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Radio className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-mono font-bold">Resident Portal</h1>
                <p className="text-xs text-gray-500">{residentData.displayName}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streaming Credentials */}
          <Card data-testid="card-streaming-credentials">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Streaming Credentials
              </CardTitle>
              <CardDescription>
                Use these credentials to connect your streaming software (BUTT, Mixxx, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {residentLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resident ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">AzuraCast Username</label>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded border text-sm font-mono" data-testid="text-azuracast-username">
                        {resident.azuracastUsername || 'Not configured'}
                      </code>
                      {resident.azuracastUsername && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(resident.azuracastUsername!, 'Username')}
                          data-testid="button-copy-username"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">AzuraCast Password</label>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded border text-sm font-mono" data-testid="text-azuracast-password">
                        {resident.azuracastPassword 
                          ? showPassword 
                            ? resident.azuracastPassword 
                            : '••••••••••'
                          : 'Not configured'
                        }
                      </code>
                      {resident.azuracastPassword && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(resident.azuracastPassword!, 'Password')}
                            data-testid="button-copy-password"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mount Point</label>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded border text-sm font-mono" data-testid="text-mount-point">
                        {resident.mountPoint || 'Not configured'}
                      </code>
                      {resident.mountPoint && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(resident.mountPoint!, 'Mount Point')}
                          data-testid="button-copy-mountpoint"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {resident.canGoLive && resident.azuracastUsername && resident.azuracastPassword && resident.mountPoint && (
                    <div className="space-y-3">
                      <StreamingGuide 
                        credentials={{
                          azuracastUsername: resident.azuracastUsername,
                          azuracastPassword: resident.azuracastPassword,
                          mountPoint: resident.mountPoint
                        }}
                      />
                      
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">How to Go Live</AlertTitle>
                        <AlertDescription className="text-blue-700 text-sm">
                          The "Go Live" button only updates your status in this portal. To actually broadcast, you must connect BUTT/Mixxx using your credentials above. 
                          When you connect, the playlist will automatically stop and your stream will take over. When you disconnect, the playlist resumes.
                        </AlertDescription>
                      </Alert>

                      {showToControl && (
                        <div className="p-3 bg-gray-100 rounded-lg text-sm">
                          <p className="font-medium">
                            {showToControl.liveStatus === 'live' ? 'Currently Live:' : 
                             activeSlot === showToControl ? 'Active Slot:' : 
                             'Next Show:'}
                          </p>
                          <p className="text-gray-600">{showToControl.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(showToControl.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          size="lg" 
                          onClick={handleGoLive}
                          disabled={goLiveMutation.isPending || !showToControl}
                          variant={showToControl?.liveStatus === 'live' ? 'destructive' : 'default'}
                          data-testid="button-go-live"
                        >
                          <PlayCircle className="w-5 h-5 mr-2" />
                          {showToControl?.liveStatus === 'live' ? 'Go Offline' : 'Go Live'}
                        </Button>
                        {activeSlot && activeSlot.liveStatus !== 'live' && (
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={handleCompleteShow}
                            disabled={goLiveMutation.isPending}
                            data-testid="button-complete-show"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Unable to load credentials</p>
              )}
            </CardContent>
          </Card>

          {/* Show Information */}
          <Card data-testid="card-show-info">
            <CardHeader>
              <CardTitle>Your Show</CardTitle>
              <CardDescription>Show details and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {residentLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resident ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Show Title</label>
                    <p className="text-lg font-semibold mt-1" data-testid="text-show-title">
                      {resident.showTitle || 'Not configured'}
                    </p>
                  </div>
                  {resident.showDescription && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-600 mt-1" data-testid="text-show-description">
                        {resident.showDescription}
                      </p>
                    </div>
                  )}
                  {resident.genres && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Genres</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {resident.genres.map((genre, i) => (
                          <Badge key={i} variant="secondary">{genre}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <Badge variant={resident.isActive ? 'default' : 'secondary'} data-testid="badge-status">
                        {resident.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Unable to load show information</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Episode */}
          <Card data-testid="card-submit-episode" className="bg-gradient-to-br from-red-50 to-white border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Upload className="w-5 h-5" />
                Submit Pre-Recorded Episode
              </CardTitle>
              <CardDescription>
                Upload your pre-recorded episodes for review and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Record your episode using Audacity or your preferred audio software, then submit it here for editorial review and scheduling.
                </p>
                <Button asChild className="w-full" size="lg" data-testid="button-submit-episode">
                  <Link href="/resident/submit-episode">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit New Episode
                  </Link>
                </Button>
                <Link href="/resident/recording-guide">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium" data-testid="link-recording-guide">
                    📚 New to recording? Read our step-by-step Audacity guide →
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Episodes */}
          <Card className="lg:col-span-2" data-testid="card-my-episodes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="w-5 h-5" />
                My Episode Submissions
              </CardTitle>
              <CardDescription>Track your submitted episodes and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {episodesLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : episodes.length > 0 ? (
                <div className="space-y-3">
                  {episodes.slice(0, 5).map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      data-testid={`episode-item-${episode.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{episode.title}</h4>
                        {episode.seriesTitle && (
                          <p className="text-xs text-gray-500">{episode.seriesTitle} {episode.episodeNumber && `#${episode.episodeNumber}`}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Submitted {new Date(episode.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {episode.status === 'rejected' && episode.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Feedback:</strong> {episode.rejectionReason}
                          </p>
                        )}
                        {episode.status === 'scheduled' && episode.scheduledAirDate && (
                          <p className="text-sm text-green-600 mt-2">
                            <strong>Air Date:</strong> {new Date(episode.scheduledAirDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Badge 
                          variant={
                            episode.status === 'approved' || episode.status === 'scheduled' ? 'default' :
                            episode.status === 'rejected' ? 'destructive' :
                            episode.status === 'aired' ? 'secondary' :
                            'outline'
                          }
                          data-testid={`badge-status-${episode.id}`}
                        >
                          {episode.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {episodes.length > 5 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      Showing 5 of {episodes.length} episodes
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileAudio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No episodes submitted yet</p>
                  <Button asChild variant="outline" data-testid="button-submit-first-episode">
                    <Link href="/resident/submit-episode">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Your First Episode
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="lg:col-span-2" data-testid="card-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Shows
              </CardTitle>
              <CardDescription>Your scheduled time slots</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : upcomingShows.length > 0 ? (
                <div className="space-y-3">
                  {upcomingShows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      data-testid={`schedule-item-${show.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{show.title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(show.scheduledAt).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge variant={show.liveStatus === 'live' ? 'destructive' : 'secondary'}>
                        {show.liveStatus || 'scheduled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No upcoming shows scheduled</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
