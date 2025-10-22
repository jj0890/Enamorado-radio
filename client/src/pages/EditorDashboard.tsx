import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Disc, 
  LogOut,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";

interface EditorStats {
  pendingEpisodes: number;
  pendingMixes: number;
  pendingAlbums: number;
  recentActivity: Array<{
    type: 'episode' | 'mix' | 'album';
    title: string;
    submitter: string;
    submittedAt: string;
  }>;
}

interface EditorDashboardProps {
  onLogout: () => void;
  currentUser?: string;
}

export default function EditorDashboard({ onLogout, currentUser }: EditorDashboardProps) {
  const { data: stats, isLoading } = useQuery<EditorStats>({
    queryKey: ['/api/editor/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const taskCards = [
    {
      title: "Episode Queue",
      description: "Review submitted episodes from residents",
      icon: Music,
      href: "/admin/episode-queue",
      count: stats?.pendingEpisodes || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      dataTestId: "card-episodes"
    },
    {
      title: "Mix Submissions",
      description: "Approve community-submitted mixes",
      icon: Music,
      href: "/admin/mix-submissions",
      count: stats?.pendingMixes || 0,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      dataTestId: "card-mixes"
    },
    {
      title: "Album Suggestions",
      description: "Moderate album of the month submissions",
      icon: Disc,
      href: "/admin/albums",
      count: stats?.pendingAlbums || 0,
      color: "text-green-500",
      bgColor: "bg-green-50",
      dataTestId: "card-albums"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Editor Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold font-mono text-red-500" data-testid="heading-editor">EDITOR PANEL</h1>
              {currentUser && (
                <Badge variant="outline" className="font-mono" data-testid="badge-user">
                  {currentUser}
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              onClick={onLogout}
              className="font-mono text-sm"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-mono mb-2">Welcome back{currentUser ? `, ${currentUser}` : ''}!</h2>
          <p className="text-gray-600 font-mono">Here's what needs your attention</p>
        </div>

        {/* Task Queue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {taskCards.map((task) => {
            const Icon = task.icon;
            const hasPending = task.count > 0;
            
            return (
              <Card key={task.href} className="hover:shadow-lg transition-shadow" data-testid={task.dataTestId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${task.bgColor}`}>
                      <Icon className={`h-6 w-6 ${task.color}`} />
                    </div>
                    {hasPending && (
                      <Badge variant="destructive" className="font-mono" data-testid={`badge-count-${task.dataTestId}`}>
                        {task.count}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-mono text-lg mt-4">{task.title}</CardTitle>
                  <CardDescription className="font-mono text-sm">
                    {task.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={task.href}>
                    <Button 
                      variant={hasPending ? "default" : "outline"} 
                      className="w-full font-mono"
                      data-testid={`button-view-${task.dataTestId}`}
                    >
                      {hasPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Review Now
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          All Clear
                        </>
                      )}
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">Recent Submissions</CardTitle>
            <CardDescription className="font-mono">
              Latest content awaiting review across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 font-mono text-sm" data-testid="text-loading">Loading activity...</p>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`activity-item-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono capitalize">
                        {item.type}
                      </Badge>
                      <div>
                        <p className="font-mono text-sm font-medium" data-testid={`text-title-${index}`}>
                          {item.title}
                        </p>
                        <p className="font-mono text-xs text-gray-500" data-testid={`text-submitter-${index}`}>
                          by {item.submitter}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-gray-400">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 font-mono text-sm" data-testid="text-no-activity">
                No recent submissions
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
