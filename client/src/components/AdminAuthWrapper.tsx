import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import EditorDashboard from "@/pages/EditorDashboard";
import AdminBackups from "@/pages/AdminBackups";
import AdminMixSubmissions from "@/pages/AdminMixSubmissions";
import AdminStats from "@/pages/AdminStats";
import AdminDangerZone from "@/pages/AdminDangerZone";
import ScheduleAdmin from "@/pages/ScheduleAdmin";
import AdminQueue from "@/pages/AdminQueue";
import AzuraCastAdmin from "@/pages/AzuraCastAdmin";
import AdminMixRouting from "@/pages/AdminMixRouting";
import AdminEpisodeUpload from "@/pages/AdminEpisodeUpload";
import AdminEpisodeQueue from "@/pages/AdminEpisodeQueue";
import AdminResidentApplications from "@/pages/AdminResidentApplications";
import AdminResidents from "@/pages/AdminResidents";
import AdminAlbums from "@/pages/AdminAlbums";
import HeroBannersAdmin from "@/pages/HeroBannersAdmin";
import PlaylistSubmissionsAdmin from "@/pages/PlaylistSubmissionsAdmin";
import AdminSettings from "@/pages/AdminSettings";
import RadioOps from "@/pages/RadioOps";
import EditorPortal from "@/pages/EditorPortal";
import MixUploadToAzuraCast from "@/components/MixUploadToAzuraCast";
import AzuraCastMixManager from "@/components/AzuraCastMixManager";
import EditorialWorkflow from "@/pages/EditorialWorkflow";
import AdminCommunity from "@/pages/AdminCommunity";
import ScheduleManagement from "@/pages/ScheduleManagement";
import AdminContentCurator from "@/pages/AdminContentCurator";
import EditorialProjects from "@/pages/admin/EditorialProjects";
import EditorialProjectEditor from "@/pages/admin/EditorialProjectEditor";
import EditorialContentMapper from "@/pages/admin/EditorialContentMapper";
import EditorialMediaLibrary from "@/pages/admin/EditorialMediaLibrary";
import AdminMagazineSubmissions from "@/pages/magazine-admin-submissions";
import { useLocation, Link } from "wouter";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminAuthData {
  authenticated: boolean;
  user?: string;
  role?: 'viewer' | 'contributor' | 'editor' | 'admin';
}

// Define admin-only routes (editors cannot access these)
const ADMIN_ONLY_ROUTES = [
  '/admin/residents',
  '/admin/resident-applications',
  '/admin/settings',
  '/admin/azuracast',
  '/admin/routing',
  '/admin/radio-ops',
  '/admin/backups',
  '/admin/danger-zone',
  '/admin/stats',
  '/admin/azuracast-upload',
  '/admin/mix-manager',
];

// Access Denied component for non-admins trying to access admin-only pages
function AccessDenied({ role, onLogout }: { role?: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </div>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Your role:</strong> {role || 'Unknown'}<br/>
              <strong>Required role:</strong> Admin
            </p>
          </div>
          <p className="text-sm text-gray-600">
            This page is restricted to administrators only. If you believe you should have access, please contact your system administrator.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="default" className="flex-1">
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={onLogout} data-testid="button-logout">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAuthWrapper() {
  const [location] = useLocation();
  console.log('🔐 AdminAuthWrapper location:', location);
  const queryClient = useQueryClient();

  const { data: authData, isLoading, isFetching, isError, refetch } = useQuery<AdminAuthData>({
    queryKey: ['/api/admin/auth'],
    retry: false,
    refetchOnMount: 'always',
    gcTime: 0,
    networkMode: 'always',
  });


  const handleLogin = async () => {
    await refetch();
  };

  const handleLogout = async () => {
    try {
      // Call logout API to destroy server session
      await fetch('/api/admin/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      
      // Clear cache and refetch
      queryClient.setQueryData(['/api/admin/auth'], { authenticated: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth'] });
      await refetch();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      queryClient.setQueryData(['/api/admin/auth'], { authenticated: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth'] });
      await refetch();
    }
  };

  // Loading state - show spinner while checking auth
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[#FEFCF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-mono">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (authData?.authenticated !== true) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Authenticated - route to appropriate admin page
  const renderAdminPage = () => {
    console.log('🔀 AdminAuthWrapper routing to:', location);
    console.log('👤 User role:', authData?.role);
    
    // Normalize path by removing trailing slash and query parameters
    const normalizedPath = location.split('?')[0].replace(/\/+$/, '') || '/admin';
    
    // Check if route is admin-only using prefix matching to catch nested routes
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => normalizedPath.startsWith(route));
    const isAdmin = authData?.role === 'admin';
    
    if (isAdminOnlyRoute && !isAdmin) {
      console.log('🚫 Access denied: User role', authData?.role, 'cannot access', normalizedPath);
      return <AccessDenied role={authData?.role} onLogout={handleLogout} />;
    }
    
    // Role-based routing for /admin root path
    if (normalizedPath === '/admin') {
      // Editors get their task-focused dashboard
      if (authData?.role === 'editor') {
        return <EditorDashboard onLogout={handleLogout} currentUser={authData.user || ""} />;
      }
      // Admins, contributors, and viewers get full admin dashboard
      return <AdminDashboard onLogout={handleLogout} currentUser={authData.user || ""} />;
    }
    
    switch (normalizedPath) {
      case '/admin/community':
        return <AdminCommunity />;
      case '/admin/mix-submissions':
        return <AdminMixSubmissions />; // Use dedicated mix submissions component
      case '/admin/submissions':
        return <ScheduleAdmin />;
      case '/admin/queue':
        return <AdminQueue />;
      case '/admin/azuracast':
        return <AzuraCastAdmin />;
      case '/admin/routing':
        return <AdminMixRouting />;
      case '/admin/upload':
        return <AdminEpisodeUpload onLogout={handleLogout} currentUser={authData.user || ""} userRole={authData?.role === 'admin' ? 'admin' : 'editor'} />;
      case '/admin/episode-queue':
        return <AdminEpisodeQueue />;
      case '/admin/schedule-management':
        return <ScheduleManagement />;
      case '/admin/azuracast-upload':
        return (
          <div className="min-h-screen bg-[#FEFCF9] p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-8 font-mono text-navy">
                AZURACAST UPLOAD
              </h1>
              <MixUploadToAzuraCast />
            </div>
          </div>
        );
      case '/admin/mix-manager':
        return (
          <div className="min-h-screen bg-[#FEFCF9] p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-8 font-mono text-navy">
                MIX MANAGER - Upload, Publish & Schedule
              </h1>
              <AzuraCastMixManager />
            </div>
          </div>
        );
      case '/admin/backups':
        return <AdminBackups onLogout={handleLogout} currentUser={authData.user || ""} userRole={authData?.role === 'admin' ? 'admin' : 'editor'} />;
      case '/admin/stats':
        return <AdminStats onLogout={handleLogout} currentUser={authData.user || ""} userRole={authData?.role === 'admin' ? 'admin' : 'editor'} />;
      case '/admin/danger-zone':
        return <AdminDangerZone onLogout={handleLogout} currentUser={authData.user || ""} userRole={authData?.role === 'admin' ? 'admin' : 'editor'} />;
      case '/admin/editorial-workflow':
        return <EditorialWorkflow />;
      case '/admin/resident-applications':
        return <AdminResidentApplications onLogout={handleLogout} currentUser={authData.user || ""} userRole={authData?.role === 'admin' ? 'admin' : 'editor'} />;
      case '/admin/residents':
        return <AdminResidents onLogout={handleLogout} currentUser={authData.user || ""} />;
      case '/admin/albums':
        return <AdminAlbums onLogout={handleLogout} currentUser={authData.user || ""} />;
      case '/admin/hero-banners':
        return <HeroBannersAdmin />;
      case '/admin/playlist-submissions':
        return <PlaylistSubmissionsAdmin currentUser={authData.user || ""} onLogout={handleLogout} />;
      case '/admin/settings':
        return <AdminSettings onLogout={handleLogout} currentUser={authData.user || ""} />;
      case '/admin/radio-ops':
        return <RadioOps />;
      case '/admin/content-curator':
        return <AdminContentCurator />;
      case '/admin/magazine-submissions':
        return <AdminMagazineSubmissions />;
      case '/admin/editorial/projects':
        return <EditorialProjects />;
      case '/admin/editorial/content-mapper':
        return <EditorialContentMapper />;
      case '/admin/editorial/media-library':
        return <EditorialMediaLibrary />;
      case '/editor':
        return <EditorPortal />;
      default:
        // Check if it's an editorial project editor route (dynamic ID)
        if (normalizedPath.startsWith('/admin/editorial/projects/')) {
          return <EditorialProjectEditor />;
        }
        return <AdminDashboard onLogout={handleLogout} currentUser={authData.user || ""} />;
    }
  };

  return <>{renderAdminPage()}</>;
}