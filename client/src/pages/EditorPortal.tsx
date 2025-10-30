import { Link, useLocation } from 'wouter';
import { Music, Calendar, Star, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function EditorPortal() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout', {});
      navigate('/admin/login');
      toast({
        title: 'Logged Out',
        description: 'See you next time!',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const editorActions = [
    {
      title: 'Manage Mixes',
      description: 'Review and approve community mix submissions',
      icon: Music,
      href: '/admin/mixes',
      color: 'bg-purple-500',
    },
    {
      title: 'Albums of the Month',
      description: 'Vote on suggestions and curate monthly album picks',
      icon: Star,
      href: '/admin/albums',
      color: 'bg-yellow-500',
    },
    {
      title: 'Schedule',
      description: 'View and manage upcoming shows',
      icon: Calendar,
      href: '/admin/schedule',
      color: 'bg-blue-500',
    },
    {
      title: 'Content Library',
      description: 'Browse episodes and guides',
      icon: FileText,
      href: '/episodes',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-mono text-navy">EDITOR PORTAL</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Content management workspace</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  View Site
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center pt-16 pb-8 mb-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">Welcome Back, Editor!</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage content, review submissions, and shape what gets featured on Enamorado Radio
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {editorActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-navy dark:border-gray-800 dark:hover:border-navy">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{action.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Editor Guidelines */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-300">📝 Editor Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>• <strong>Mix Reviews:</strong> Listen to submissions and approve quality content that fits our vibe</li>
              <li>• <strong>Album Voting:</strong> Vote on community suggestions - 2+ votes needed for consensus</li>
              <li>• <strong>Quality Control:</strong> Ensure submissions have proper metadata and meet our standards</li>
              <li>• <strong>Community First:</strong> We celebrate diverse voices - focus on inclusion over perfection</li>
            </ul>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Need Help?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This editor portal gives you access to content management tools without system-level admin features. 
            If you need additional permissions or have questions, contact an admin.
          </p>
        </div>
      </main>
    </div>
  );
}
