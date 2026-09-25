import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  FileText,
  Camera,
  MessageSquare,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProjectType = "photoshoot" | "interview" | "essay" | "community-spotlight";
type WorkflowStatus = "planning" | "in-progress" | "ready" | "published" | "featured";

interface EditorialProject {
  id: number;
  title: string;
  type: ProjectType;
  status: WorkflowStatus;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  tags?: string[];
  coverImage?: string;
  contentId?: number; // Links to published content
}

const projectTypeConfig = {
  photoshoot: { label: "Photoshoot", icon: Camera, color: "bg-purple-500" },
  interview: { label: "Interview", icon: MessageSquare, color: "bg-blue-500" },
  essay: { label: "Essay", icon: FileText, color: "bg-green-500" },
  "community-spotlight": { label: "Community Spotlight", icon: Users, color: "bg-orange-500" },
};

const statusConfig = {
  planning: { label: "Planning", color: "bg-gray-500" },
  "in-progress": { label: "In Progress", color: "bg-yellow-500" },
  ready: { label: "Ready", color: "bg-blue-500" },
  published: { label: "Published", color: "bg-green-500" },
  featured: { label: "Featured", color: "bg-purple-500" },
};

export default function EditorialProjects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | "all">("all");
  const [filterType, setFilterType] = useState<ProjectType | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [newProject, setNewProject] = useState({
    title: "",
    type: "essay" as ProjectType,
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<EditorialProject[]>({
    queryKey: ["/api/editorial/projects"],
    refetchInterval: 5000,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (project: typeof newProject) => {
      const response = await fetch("/api/editorial/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/projects"] });
      setDialogOpen(false);
      setNewProject({ title: "", type: "essay", description: "", assignedTo: "", dueDate: "" });
      toast({
        title: "Project created",
        description: "Editorial project has been created successfully.",
      });
    },
  });

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: WorkflowStatus }) => {
      const response = await fetch(`/api/editorial/projects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/projects"] });
      toast({
        title: "Status updated",
        description: "Project status has been updated.",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/editorial/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/projects"] });
      toast({
        title: "Project deleted",
        description: "Project has been removed.",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProject.title || !newProject.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and description.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (filterStatus !== "all" && project.status !== filterStatus) return false;
    if (filterType !== "all" && project.type !== filterType) return false;
    return true;
  });

  // Group by status for kanban view
  const projectsByStatus = {
    planning: filteredProjects.filter((p) => p.status === "planning"),
    "in-progress": filteredProjects.filter((p) => p.status === "in-progress"),
    ready: filteredProjects.filter((p) => p.status === "ready"),
    published: filteredProjects.filter((p) => p.status === "published"),
    featured: filteredProjects.filter((p) => p.status === "featured"),
  };

  return (
    <AdminShell
      title="Editorial Projects"
      subtitle="Manage photoshoots, interviews, essays, and community spotlights"
      breadcrumbs={[{ label: "Editorial Production" }, { label: "Projects" }]}
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy-dark">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Editorial Project</DialogTitle>
              <DialogDescription>
                Start a new editorial project for photoshoots, interviews, essays, or community features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Type</label>
                <Select
                  value={newProject.type}
                  onValueChange={(value) => setNewProject({ ...newProject, type: value as ProjectType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(projectTypeConfig).map(([value, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Enter project title..."
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe the project goals, target audience, and key elements..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Assigned To (Optional)</label>
                  <Input
                    placeholder="Team member name"
                    value={newProject.assignedTo}
                    onChange={(e) => setNewProject({ ...newProject, assignedTo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date (Optional)</label>
                  <Input
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
                className="bg-navy hover:bg-navy-dark"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as WorkflowStatus | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(value) => setFilterType(value as ProjectType | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(projectTypeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
            <div key={status} className="flex flex-col">
              <div className="mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusConfig[status as WorkflowStatus].color}`} />
                  {statusConfig[status as WorkflowStatus].label}
                  <Badge variant="secondary" className="ml-auto">
                    {statusProjects.length}
                  </Badge>
                </h3>
              </div>

              <div className="space-y-2 flex-1">
                {statusProjects.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                    No projects
                  </div>
                ) : (
                  statusProjects.map((project) => {
                    const TypeIcon = projectTypeConfig[project.type].icon;
                    return (
                      <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${projectTypeConfig[project.type].color} text-white`}>
                                <TypeIcon className="w-3 h-3" />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {projectTypeConfig[project.type].label}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-sm mt-2">{project.title}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          {project.assignedTo && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <Users className="w-3 h-3" />
                              {project.assignedTo}
                            </div>
                          )}
                          {project.dueDate && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex gap-1">
                          <Link href={`/admin/editorial/projects/${project.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {status !== "featured" && (
                            <Select
                              value={project.status}
                              onValueChange={(value) =>
                                updateStatusMutation.mutate({ id: project.id, status: value as WorkflowStatus })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Delete this project?")) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && projects.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No editorial projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to start the editorial workflow</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-navy hover:bg-navy-dark">
            <Plus className="w-4 h-4 mr-2" />
            Create First Project
          </Button>
        </div>
      )}
    </AdminShell>
  );
}
