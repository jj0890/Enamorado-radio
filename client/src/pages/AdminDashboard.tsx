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
  Star
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

  // Build real activity from recent submissions
  const { data: recentMixes = [] } = useQuery<any[]>({
    queryKey: ['/api/mix-submissions'],
    select: (data) => data.slice(0, 5),
    refetchInterval: 60000,
  });
  const { data: recentApplications = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
    select: (data) => data.slice(0, 3),
    refetchInterval: 60000,
  });

  const recentActivities: ActivityItem[] = [
    ...recentMixes.map((m: any): ActivityItem => ({
      id: m.id,
      type: m.status === 'featured' ? 'mix_featured' : 'mix_approved',
      description: m.status === 'featured' ? 'featured mix' : 'submitted mix',
      actor: m.reviewedBy || m.name || 'community',
      targetName: m.title,
      createdAt: m.reviewedAt || m.submittedAt || m.createdAt || new Date().toISOString(),
    })),
    ...recentApplications.map((a: any): ActivityItem => ({
      id: a.id + 10000,
      type: 'application_approved',
      description: 'applied for residency',
      actor: a.djName || a.name || 'applicant',
      targetName: '',
      createdAt: a.submittedAt || a.createdAt || new Date().toISOString(),
    })),
  ]
    .filter((a) => a.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

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
                <Link href="/admin/community">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2 hover:bg-navy hover:text-white hover:border-navy transition-all"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-medium">Community</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-navy" />
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
                  <Users className="w-5 h-5 text-navy" />
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

          {/* System Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-navy" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                  <p className="text-sm font-medium text-green-800">Stream</p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-green-800">Database</p>
                  <p className="text-xs text-green-600">Connected</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-green-800">AzuraCast</p>
                  <p className="text-xs text-green-600">Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed activities={recentActivities} maxItems={10} />

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
