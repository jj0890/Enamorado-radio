import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Music,
  Disc,
  Upload,
  Calendar,
  Users,
  Radio,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Image,
  ListMusic,
  Activity,
  Database,
  AlertTriangle,
  FileText,
  Headphones,
  BarChart3,
  FolderOpen
} from "lucide-react";

export interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  roles?: ('admin' | 'editor')[];
}

const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/stats", label: "Analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Content",
    defaultOpen: true,
    items: [
      { href: "/admin/mix-submissions", label: "Mixes", icon: Music },
      { href: "/admin/episode-queue", label: "Episodes", icon: Headphones },
      { href: "/admin/albums", label: "Albums", icon: Disc },
      { href: "/admin/editorial", label: "Editorial", icon: FileText },
      { href: "/admin/hero-banners", label: "Hero Banners", icon: Image },
      { href: "/admin/playlist-submissions", label: "Playlists", icon: ListMusic },
      { href: "/admin/media", label: "Media Library", icon: FolderOpen },
    ]
  },
  {
    title: "Schedule",
    defaultOpen: false,
    items: [
      { href: "/admin/schedule-management", label: "Schedule Manager", icon: Calendar },
      { href: "/admin/upload", label: "Episode Upload", icon: Upload },
    ]
  },
  {
    title: "Community",
    defaultOpen: true,
    items: [
      { href: "/admin/resident-applications", label: "Applications", icon: FileText },
      { href: "/admin/residents", label: "Residents", icon: Users },
      { href: "/admin/contributors", label: "Contributors", icon: Users },
      { href: "/admin/queue", label: "Request Queue", icon: ListMusic },
    ]
  },
  {
    title: "Integrations",
    defaultOpen: false,
    items: [
      { href: "/admin/radio-ops", label: "Radio Ops", icon: Radio },
      { href: "/admin/azuracast", label: "AzuraCast", icon: Radio },
    ]
  },
  {
    title: "System",
    defaultOpen: false,
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/backups", label: "Backups", icon: Database },
      { href: "/admin/danger-zone", label: "Danger Zone", icon: AlertTriangle, roles: ['admin'] },
    ]
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  currentUser?: string;
  userRole?: 'admin' | 'editor';
  onLogout?: () => void;
  actions?: React.ReactNode;
}

export default function AdminShell({ 
  children, 
  title, 
  subtitle,
  breadcrumbs = [],
  currentUser = "admin",
  userRole = "admin",
  onLogout,
  actions
}: AdminShellProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    adminNavSections.forEach(section => {
      initial[section.title] = section.defaultOpen ?? false;
    });
    return initial;
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/logout', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth'] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      onLogout?.();
    },
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const filteredSections = adminNavSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    })
  })).filter(section => section.items.length > 0);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <h1 className="font-bold text-sm">Enamorado</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {filteredSections.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections[section.title]}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                <span>{section.title}</span>
                {openSections[section.title] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || 
                    (item.href !== '/admin' && location.startsWith(item.href));
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-navy text-white' 
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                        data-testid={`nav-${item.href.replace('/admin/', '').replace('/', '-') || 'dashboard'}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold">
            {currentUser.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Site
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex-1 text-xs bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            data-testid="button-logout"
          >
            <LogOut className="w-3 h-3 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/admin">
                  <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Admin</span>
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-300">/</span>
                    {crumb.href ? (
                      <Link href={crumb.href}>
                        <span className="text-gray-500 hover:text-gray-700 cursor-pointer">{crumb.label}</span>
                      </Link>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Header Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
