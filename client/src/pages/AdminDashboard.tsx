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
  RefreshCw,
  Upload,
  Disc,
  Settings,
  Calendar
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

// Comprehensive admin navigation organized by category
const navItems = [
  // Core Admin
  { href: "/admin", label: "Dashboard", icon: BarChart3, category: "core" },
  
  // Content Management  
  { href: "/admin/mix-submissions", label: "Mix Review", icon: Music, category: "content" },
  { href: "/admin/song-submissions", label: "Song Review", icon: Music, category: "content" },
  { href: "/admin/routing", label: "Mix Routing", icon: PlayCircle, category: "content" },
  { href: "/admin/upload", label: "Episode Upload", icon: Upload, category: "content" },
  { href: "/admin/episode-queue", label: "Episode Queue", icon: Music, category: "content" },
  { href: "/admin/schedule-management", label: "Schedule Manager", icon: Calendar, category: "content" },
  { href: "/admin/albums", label: "Albums of the Month", icon: Disc, category: "content" },
  
  // Community
  { href: "/admin/submissions", label: "Community Submissions", icon: Music, category: "community" },
  { href: "/admin/resident-applications", label: "DJ Applications", icon: Users, category: "community" },
  { href: "/admin/residents", label: "Residents", icon: Users, category: "community" },
  { href: "/admin/queue", label: "Queue", icon: PlayCircle, category: "community" },
  
  // AzuraCast Integration
  { href: "/admin/radio-ops", label: "Radio Ops Panel", icon: Radio, category: "integration" },
  { href: "/admin/azuracast", label: "AzuraCast", icon: Radio, category: "integration" },
  { href: "/admin/azuracast-upload", label: "AzuraCast Upload", icon: Upload, category: "integration" },
  { href: "/admin/mix-manager", label: "Mix Manager", icon: Radio, category: "integration" },
  
  // System Management
  { href: "/admin/stats", label: "Stats Dashboard", icon: BarChart3, category: "system" },
  { href: "/admin/backups", label: "Backup System", icon: RefreshCw, category: "system" },
  { href: "/admin/settings", label: "Settings", icon: Settings, category: "system" },
  { href: "/admin/danger-zone", label: "Danger Zone", icon: AlertTriangle, category: "system" },
  { href: "/admin/editorial-workflow", label: "Editorial", icon: AlertTriangle, category: "system" },
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
      return apiRequest('POST', '/api/admin/logout', {});
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
              <h1 className="text-xl font-bold font-mono text-navy">ADMIN PANEL</h1>
              
              <div className="hidden lg:flex space-x-1">
                {navItems.filter(item => item.category === 'core' || item.category === 'content').map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`flex items-center space-x-2 px-2 py-2 rounded-md text-xs font-mono transition-colors ${
                        isActive 
                          ? 'bg-red-100 text-red-600' 
                          : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                      }`} data-testid={`nav-${item.href.replace('/admin/', '').replace('/', 'dashboard')}`}>
                        <Icon className="w-4 h-4" />
                        <span className="hidden xl:inline">{item.label}</span>
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

        {/* Top KPIs - Simplified to 4 key metrics */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
                    <p className="text-sm font-mono text-gray-600">DJ Applications</p>
                    <p className="text-3xl font-bold font-mono text-blue-600">{stats.pendingApplications || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-mono text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/mix-submissions">
              <Button className="w-full h-20 text-lg font-mono" variant="outline">
                <Music className="w-6 h-6 mr-2" />
                Review Mixes
              </Button>
            </Link>
            <Link href="/admin/upload">
              <Button className="w-full h-20 text-lg font-mono" variant="outline">
                <Upload className="w-6 h-6 mr-2" />
                Upload Episode
              </Button>
            </Link>
            <Link href="/admin/radio-ops">
              <Button className="w-full h-20 text-lg font-mono" variant="outline">
                <Radio className="w-6 h-6 mr-2" />
                Radio Ops
              </Button>
            </Link>
            <Link href="/admin/albums">
              <Button className="w-full h-20 text-lg font-mono" variant="outline">
                <Disc className="w-6 h-6 mr-2" />
                Albums
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Navigation Grid - Organized by Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Content Management */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Content Management</CardTitle>
              <CardDescription>Review and manage submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {navItems.filter(item => item.category === 'content').map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <Button variant="outline" className="w-full justify-start font-mono" data-testid={`nav-${item.href.replace('/admin/', '')}`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Community */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Community</CardTitle>
              <CardDescription>DJ applications and queue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {navItems.filter(item => item.category === 'community').map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <Button variant="outline" className="w-full justify-start font-mono" data-testid={`nav-${item.href.replace('/admin/', '')}`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* AzuraCast Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">AzuraCast</CardTitle>
              <CardDescription>Radio streaming integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {navItems.filter(item => item.category === 'integration').map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <Button variant="outline" className="w-full justify-start font-mono" data-testid={`nav-${item.href.replace('/admin/', '')}`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* System Management */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">System</CardTitle>
              <CardDescription>Administration and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {navItems.filter(item => item.category === 'system').map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <Button variant="outline" className="w-full justify-start font-mono" data-testid={`nav-${item.href.replace('/admin/', '')}`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {/* System Status */}
              <div className="border-t pt-3 mt-3">
                <div className="text-xs font-mono text-gray-600 mb-2">System Status</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">Session</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">Database</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">Stream</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      Live
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}