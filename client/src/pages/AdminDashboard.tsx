import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminShell from "@/components/admin/AdminShell";
import ActivityFeed, { ActivityItem } from "@/components/admin/ActivityFeed";
import {
  Music,
  Users,
  PlayCircle,
  Radio,
  AlertTriangle,
  Upload,
  Disc,
  Headphones,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  FileText
} from "lucide-react";

interface AdminStats {
  totalMixSubmissions: number;
  pendingMixReviews: number;
  approvedMixes: number;
  featuredMixes: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  activeResidents: number;
  totalShows: number;
  liveShows: number;
  totalEpisodes: number;
  publishedEpisodes: number;
  recentSubmissions: number;
  publishedContent?: number;
  draftContent?: number;
  scheduledContent?: number;
}

function StreamStatusIndicator() {
  const { data, isLoading } = useQuery<{ isLive?: boolean; listenerCount?: number }>({
    queryKey: ['/api/stream-status'],
    refetchInterval: 30000,
    retry: false,
  });
  const online = data?.isLive;
  return (
    <div className={`text-center p-4 rounded-lg ${isLoading ? 'bg-gray-50' : online ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isLoading ? 'bg-gray-300 animate-pulse' : online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <p className={`text-sm font-medium ${isLoading ? 'text-gray-500' : online ? 'text-green-800' : 'text-red-800'}`}>Stream</p>
      <p className={`text-xs ${isLoading ? 'text-gray-400' : online ? 'text-green-600' : 'text-red-600'}`}>
        {isLoading ? 'Checking…' : online ? `Online${data?.listenerCount != null ? ` · ${data.listenerCount}` : ''}` : 'Offline'}
      </p>
    </div>
  );
}

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser?: string;
}

export default function AdminDashboard({ onLogout, currentUser = "admin" }: AdminDashboardProps) {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000,
  });

  const { data: activities = [] } = useQuery<ActivityItem[]>({
    queryKey: ['/api/admin/activity'],
    refetchInterval: 30000,
  });

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening with your radio station."
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
    >
      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Reviews</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingMixReviews}</p>
                  <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Approved Mixes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approvedMixes}</p>
                  <p className="text-xs text-gray-400 mt-1">Total published</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Featured</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.featuredMixes}</p>
                  <p className="text-xs text-gray-400 mt-1">Highlighted content</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">DJ Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingApplications || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">New applicants</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/admin/mix-submissions">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-review-mixes"
                  >
                    <Music className="w-5 h-5" />
                    <span className="text-xs font-medium">Review Mixes</span>
                  </Button>
                </Link>
                <Link href="/admin/upload">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-upload-episode"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Upload Episode</span>
                  </Button>
                </Link>
                <Link href="/admin/radio-ops">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-radio-ops"
                  >
                    <Radio className="w-5 h-5" />
                    <span className="text-xs font-medium">Radio Ops</span>
                  </Button>
                </Link>
                <Link href="/admin/residents">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-manage-residents"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-medium">Residents</span>
                  </Button>
                </Link>
                <Link href="/admin/contributors">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-contributors"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-medium">Contributors</span>
                  </Button>
                </Link>
                <Link href="/admin/editorial">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                    data-testid="quick-action-editorial"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-medium">Editorial</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-charcoal-500" />
                  Episodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Episodes</span>
                    <span className="font-semibold">{stats?.totalEpisodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Published</span>
                    <span className="font-semibold text-green-600">{stats?.publishedEpisodes || 0}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Link href="/admin/episode-queue">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Episodes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-charcoal-500" />
                  Editorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Live on site</span>
                    <span className="font-semibold text-green-600">{stats?.publishedContent ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Drafts</span>
                    <span className="font-semibold text-gray-500">{stats?.draftContent ?? 0}</span>
                  </div>
                  {(stats?.scheduledContent ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Scheduled</span>
                      <span className="font-semibold text-amber-600">{stats?.scheduledContent}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Link href="/admin/editorial">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Editorial
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-charcoal-500" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Active Residents</span>
                    <span className="font-semibold">{stats?.activeResidents || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pending Applications</span>
                    <span className="font-semibold text-orange-600">{stats?.pendingApplications || 0}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Link href="/admin/resident-applications">
                      <Button variant="outline" size="sm" className="w-full">
                        View Applications
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status — derived from real stats fetch */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-charcoal-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* DB: if stats loaded without error, DB is reachable */}
                <div className={`text-center p-4 rounded-lg ${stats ? 'bg-green-50' : isLoading ? 'bg-gray-50' : 'bg-red-50'}`}>
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${stats ? 'bg-green-500' : isLoading ? 'bg-gray-300 animate-pulse' : 'bg-red-500'}`}></div>
                  <p className={`text-sm font-medium ${stats ? 'text-green-800' : isLoading ? 'text-gray-500' : 'text-red-800'}`}>Database</p>
                  <p className={`text-xs ${stats ? 'text-green-600' : isLoading ? 'text-gray-400' : 'text-red-600'}`}>
                    {stats ? 'Connected' : isLoading ? 'Checking…' : 'Error'}
                  </p>
                </div>
                {/* Stream: link to /api/stream/status if available, otherwise unknown */}
                <StreamStatusIndicator />
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-gray-600">AzuraCast</p>
                  <p className="text-xs text-gray-400">See Radio Ops</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed activities={activities} maxItems={10} />

          {/* Alerts Card */}
          {stats && stats.pendingMixReviews > 5 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Review Queue Growing</p>
                    <p className="text-sm text-orange-600 mt-1">
                      You have {stats.pendingMixReviews} mixes pending review. Consider reviewing them soon.
                    </p>
                    <Link href="/admin/mix-submissions">
                      <Button size="sm" variant="outline" className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100">
                        Review Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
