import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ContentCalendar from "@/components/editorial/ContentCalendar";
import {
  Music,
  Disc,
  Image,
  LogOut,
  FileText,
  Camera,
  Mic,
  PenLine,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListMusic,
  Plus,
  Layers,
  CalendarDays,
} from "lucide-react";

interface EditorDashboardProps {
  onLogout: () => void;
  currentUser?: string;
}

interface EditorialProject {
  id: number;
  title: string;
  type: string;
  status: string;
  description?: string;
  assignedTo?: string;
  updatedAt: string;
  dueDate?: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  photoshoot: Camera,
  interview: Mic,
  essay: PenLine,
  'community-spotlight': FileText,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  planning:    { label: 'Planning',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500' },
  ready:       { label: 'Ready',       color: 'bg-green-50 text-green-700',   dot: 'bg-green-500' },
  published:   { label: 'Published',   color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  featured:    { label: 'Featured',    color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
};

const SECTION_ORDER = ['in-progress', 'planning', 'ready', 'published'];

export default function EditorDashboard({ onLogout, currentUser }: EditorDashboardProps) {
  const [view, setView] = useState<"my-work" | "calendar">("my-work");
  // All projects assigned to this editor
  const { data: myProjects = [], isLoading: projectsLoading } = useQuery<EditorialProject[]>({
    queryKey: ['/api/editorial/projects', { assignedTo: currentUser }],
    queryFn: () =>
      fetch(`/api/editorial/projects?assignedTo=${encodeURIComponent(currentUser || '')}`, {
        credentials: 'include',
      }).then(r => r.json()),
    enabled: !!currentUser,
    refetchInterval: 60000,
  });

  // All projects (for the full list link)
  const { data: allProjects = [] } = useQuery<EditorialProject[]>({
    queryKey: ['/api/editorial/projects'],
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/editor/stats'],
    refetchInterval: 30000,
  });

  // Group my projects by status
  const grouped = SECTION_ORDER.reduce<Record<string, EditorialProject[]>>((acc, s) => {
    acc[s] = myProjects.filter(p => p.status === s);
    return acc;
  }, {});

  const activeCount = myProjects.filter(p => p.status === 'in-progress').length;
  const needsAttention = myProjects.filter(p => p.status === 'planning').length;

  const queueItems = [
    { title: 'Mix Submissions', icon: Music, href: '/admin/mix-submissions', count: stats?.pendingMixes || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Episode Queue', icon: Music, href: '/admin/episode-queue', count: stats?.pendingEpisodes || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Album Picks', icon: Disc, href: '/admin/albums', count: stats?.pendingAlbums || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Hero Banners', icon: Image, href: '/admin/hero-banners', count: 0, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Playlists', icon: ListMusic, href: '/admin/playlist-submissions', count: stats?.pendingPlaylists || 0, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-navy tracking-wider">EDITOR</span>
            {currentUser && (
              <Badge variant="outline" className="font-mono text-xs">{currentUser}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setView("my-work")}
                className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${view === "my-work" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                My Work
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${view === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                <CalendarDays className="w-3 h-3" />
                Calendar
              </button>
            </div>
            <Link href="/admin/editorial/projects">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                All Projects
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout} className="font-mono text-xs gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Calendar view */}
        {view === "calendar" && <ContentCalendar />}

        {/* My work view */}
        {view === "my-work" && <>

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-1">My Work</p>
            <h1 className="text-2xl font-bold font-mono text-gray-900">
              {activeCount > 0
                ? `${activeCount} project${activeCount > 1 ? 's' : ''} in progress`
                : needsAttention > 0
                ? `${needsAttention} project${needsAttention > 1 ? 's' : ''} to start`
                : 'Nothing assigned yet'}
            </h1>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="font-mono text-xs text-gray-400">All editorial</p>
              <p className="font-mono text-lg font-bold text-gray-900">{allProjects.length}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-gray-400">Mine</p>
              <p className="font-mono text-lg font-bold text-navy">{myProjects.length}</p>
            </div>
          </div>
        </div>

        {/* My Projects — grouped by status */}
        {projectsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : myProjects.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-mono text-sm text-gray-400">No projects assigned to you yet</p>
            <p className="font-mono text-xs text-gray-300 mt-1">Ask an admin to assign editorial work</p>
          </div>
        ) : (
          <div className="space-y-8">
            {SECTION_ORDER.map(status => {
              const projects = grouped[status];
              if (!projects || projects.length === 0) return null;
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-500">{cfg.label}</span>
                    <span className="font-mono text-xs text-gray-300">({projects.length})</span>
                  </div>
                  <div className="space-y-2">
                    {projects.map(project => {
                      const Icon = TYPE_ICON[project.type] || FileText;
                      const isActive = project.status === 'in-progress';
                      return (
                        <Link key={project.id} href={`/admin/editorial/projects/${project.id}`}>
                          <div className={`group flex items-center gap-4 px-5 py-4 bg-white border rounded-xl hover:border-navy hover:shadow-sm transition-all cursor-pointer ${isActive ? 'border-blue-200' : 'border-gray-100'}`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm font-semibold text-gray-900 truncate">{project.title}</p>
                              {project.description && (
                                <p className="font-mono text-xs text-gray-400 truncate mt-0.5">{project.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {project.dueDate && (
                                <span className="font-mono text-[10px] text-gray-400">
                                  due {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-navy transition-colors" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 pt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-4">Review Queues</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {queueItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <p className="font-mono text-xs font-semibold text-gray-700">{item.title}</p>
                    {item.count > 0 && (
                      <p className="font-mono text-xs text-orange-500 mt-0.5">{item.count} pending</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        </>}

      </div>
    </div>
  );
}
