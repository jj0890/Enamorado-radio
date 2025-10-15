import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Radio, Calendar, Key, Copy, Eye, EyeOff, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import type { Resident, Schedule } from '@shared/schema';

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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/resident/logout', {});
    },
    onSuccess: () => {
      onLogout();
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const upcomingShows = schedule
    .filter(s => new Date(s.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

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

                  {resident.canGoLive && (
                    <Button className="w-full" size="lg" data-testid="button-go-live">
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Go Live Now
                    </Button>
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
