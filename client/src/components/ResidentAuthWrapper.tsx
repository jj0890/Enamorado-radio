import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ResidentLogin from '@/pages/ResidentLogin';
import ResidentDashboard from '@/pages/ResidentDashboard';
import ResidentEpisodeSubmit from '@/pages/ResidentEpisodeSubmit';
import RecordingGuide from '@/pages/RecordingGuide';

interface ResidentAuthData {
  authenticated: boolean;
  residentId?: number;
  username?: string;
  displayName?: string;
  showTitle?: string;
}

export default function ResidentAuthWrapper() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  console.log('🏠 ResidentAuthWrapper loaded, location:', location);

  const { data: authData, isLoading, isFetching, refetch } = useQuery<ResidentAuthData>({
    queryKey: ['/api/resident/auth'],
    retry: false,
    refetchOnMount: 'always',
    gcTime: 0,
    networkMode: 'always',
  });

  const handleLogin = async () => {
    await refetch();
    const params = new URLSearchParams(location.split('?')[1] || '');
    const from = params.get('from');
    if (from && from.startsWith('/') && !from.startsWith('/resident')) {
      setLocation(from);
    }
  };

  const handleLogout = async () => {
    queryClient.setQueryData(['/api/resident/auth'], { authenticated: false });
    queryClient.invalidateQueries({ queryKey: ['/api/resident/auth'] });
    await refetch();
  };

  // Loading state
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
    return <ResidentLogin onLogin={handleLogin} />;
  }

  // Authenticated - route to appropriate resident page
  const renderResidentPage = () => {
    const normalizedPath = location.split('?')[0].replace(/\/+$/, '') || '/resident';
    
    switch (normalizedPath) {
      case '/resident':
      case '/resident/dashboard':
        return (
          <ResidentDashboard 
            onLogout={handleLogout} 
            residentData={{
              id: authData.residentId!,
              username: authData.username!,
              displayName: authData.displayName || authData.username!,
              showTitle: authData.showTitle || null
            }}
          />
        );
      case '/resident/episode-submit':
      case '/resident/submit-episode':
        return <ResidentEpisodeSubmit />;
      case '/resident/recording-guide':
        return <RecordingGuide />;
      default:
        return (
          <ResidentDashboard 
            onLogout={handleLogout} 
            residentData={{
              id: authData.residentId!,
              username: authData.username!,
              displayName: authData.displayName || authData.username!,
              showTitle: authData.showTitle || null
            }}
          />
        );
    }
  };

  return renderResidentPage();
}
