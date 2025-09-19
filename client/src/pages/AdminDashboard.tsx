import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Music, 
  Users, 
  PlayCircle, 
  Radio, 
  ArrowLeft,
  LogOut,
  AlertTriangle,
  Trash2,
  RefreshCw
} from "lucide-react";

interface AdminStats {
  totalMixSubmissions: number;
  pendingMixReviews: number;
  approvedMixes: number;
  featuredMixes: number;
  totalShows: number;
  liveShows: number;
  totalEpisodes: number;
  publishedEpisodes: number;
  recentSubmissions: number;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/mix-submissions", label: "Mix Submissions", icon: Music },
  { href: "/admin/dj-applications", label: "DJ Applications", icon: Users },
  { href: "/admin/queue", label: "Queue", icon: PlayCircle },
  { href: "/admin/azuracast", label: "AzuraCast", icon: Radio },
];

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser?: string;
}

export default function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/logout', 'POST', {});
    },
    onSuccess: () => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth'] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      onLogout();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold font-mono text-red-500">ADMIN PANEL</h1>
              
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-mono transition-colors ${
                        isActive 
                          ? 'bg-red-100 text-red-600' 
                          : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="font-mono">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              
              <div className="text-sm text-gray-600 font-mono">
                Logged in as: <span className="font-semibold">{currentUser}</span>
              </div>
              
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                disabled={logoutMutation.isPending}
                className="font-mono"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-mono text-gray-900">Dashboard</h2>
          <p className="text-gray-600 font-mono">Radio station administration overview</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Total Mix Submissions</p>
                    <p className="text-3xl font-bold font-mono">{stats.totalMixSubmissions}</p>
                  </div>
                  <Music className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Pending Reviews</p>
                    <p className="text-3xl font-bold font-mono text-orange-600">{stats.pendingMixReviews}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Approved Mixes</p>
                    <p className="text-3xl font-bold font-mono text-green-600">{stats.approvedMixes}</p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Featured Mixes</p>
                    <p className="text-3xl font-bold font-mono text-purple-600">{stats.featuredMixes}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">★</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Total Shows</p>
                    <p className="text-3xl font-bold font-mono">{stats.totalShows}</p>
                  </div>
                  <Radio className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Live Shows</p>
                    <p className="text-3xl font-bold font-mono text-red-600">{stats.liveShows}</p>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Total Episodes</p>
                    <p className="text-3xl font-bold font-mono">{stats.totalEpisodes}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Recent Submissions (7d)</p>
                    <p className="text-3xl font-bold font-mono text-indigo-600">{stats.recentSubmissions}</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/mix-submissions" className="block">
                <Button variant="outline" className="w-full justify-start font-mono" data-testid="link-mix-submissions">
                  <Music className="w-4 h-4 mr-2" />
                  Review Mix Submissions
                </Button>
              </Link>
              
              <Link href="/admin/queue" className="block">
                <Button variant="outline" className="w-full justify-start font-mono" data-testid="link-queue">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Manage Queue
                </Button>
              </Link>
              
              <Link href="/admin/azuracast" className="block">
                <Button variant="outline" className="w-full justify-start font-mono" data-testid="link-azuracast">
                  <Radio className="w-4 h-4 mr-2" />
                  AzuraCast Integration
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">System Status</CardTitle>
              <CardDescription>Current operational status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">Admin Session</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">Database</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">Stream</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}