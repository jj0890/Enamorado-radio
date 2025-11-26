import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminShell from "@/components/admin/AdminShell";
import DataTable, { Column, StatusBadge, DateCell, TruncatedText } from "@/components/admin/DataTable";
import { 
  Music, 
  ExternalLink, 
  Check,
  Star,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface MixSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  artUrl?: string;
  featureOnSite?: boolean;
  pushToAzura?: boolean;
  filePath?: string;
  fileName?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'featured';
  approvedAt?: string;
  approvedBy?: string;
}

interface AdminMixSubmissionsProps {
  onLogout?: () => void;
  currentUser?: string;
}

export default function AdminMixSubmissions({ onLogout, currentUser = "admin" }: AdminMixSubmissionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const { data: allSubmissions = [], isLoading, refetch } = useQuery<MixSubmission[]>({
    queryKey: ['/api/admin/mixes'],
  });

  const pendingSubmissions = allSubmissions.filter(sub => sub.status === 'pending');
  const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
  const featuredSubmissions = allSubmissions.filter(sub => sub.status === 'featured');

  const getFilteredData = () => {
    switch (activeTab) {
      case 'pending': return pendingSubmissions;
      case 'approved': return approvedSubmissions;
      case 'featured': return featuredSubmissions;
      default: return allSubmissions;
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('POST', `/api/mixes/${mixId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Mix Approved", description: "Mix has been approved successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
    },
    onError: (error: any) => {
      toast({ title: "Approval Failed", description: error.message || "Failed to approve mix.", variant: "destructive" });
    },
  });

  const featureMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('POST', `/api/admin/mixes/${mixId}/feature`, {});
    },
    onSuccess: () => {
      toast({ title: "Mix Featured", description: "Mix has been featured successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes/featured'] });
    },
    onError: (error: any) => {
      toast({ title: "Feature Failed", description: error.message || "Failed to feature mix.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('DELETE', `/api/mixes/${mixId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Mix Deleted", description: "Mix has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message || "Failed to delete mix.", variant: "destructive" });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (mixIds: number[]) => {
      return Promise.all(mixIds.map(id => apiRequest('POST', `/api/mixes/${id}/approve`, {})));
    },
    onSuccess: () => {
      toast({ title: "Mixes Approved", description: "Selected mixes have been approved." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mixes'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (mixIds: number[]) => {
      return Promise.all(mixIds.map(id => apiRequest('DELETE', `/api/mixes/${id}`, {})));
    },
    onSuccess: () => {
      toast({ title: "Mixes Deleted", description: "Selected mixes have been deleted." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mixes'] });
    },
  });

  const columns: Column<MixSubmission>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (mix) => (
        <div className="flex items-center gap-3">
          {mix.artUrl ? (
            <img src={mix.artUrl} alt={mix.title} className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <Music className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{mix.title}</p>
            <p className="text-sm text-gray-500">{mix.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'genre',
      header: 'Genre',
      sortable: true,
      render: (mix) => (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          {mix.genre || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (mix) => <StatusBadge status={mix.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (mix) => <DateCell date={mix.submittedAt} />,
    },
    {
      key: 'url',
      header: 'Link',
      render: (mix) => (
        <a 
          href={mix.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-navy hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="text-sm">Open</span>
        </a>
      ),
    },
  ];

  return (
    <AdminShell
      title="Mix Submissions"
      subtitle="Review and manage community mix submissions"
      breadcrumbs={[{ label: "Mixes" }]}
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{allSubmissions.length}</p>
            <p className="text-sm text-gray-500">Total Mixes</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{pendingSubmissions.length}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{approvedSubmissions.length}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{featuredSubmissions.length}</p>
            <p className="text-sm text-gray-500">Featured</p>
          </div>
        </div>
      </div>

      {/* Tabs and Data Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({allSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-3 h-3 mr-1" />
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            <Check className="w-3 h-3 mr-1" />
            Approved ({approvedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="featured" data-testid="tab-featured">
            <Star className="w-3 h-3 mr-1" />
            Featured ({featuredSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={getFilteredData()}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search mixes by title or artist..."
            searchKeys={['title', 'name', 'genre']}
            emptyMessage="No mixes found"
            onRefresh={() => refetch()}
            bulkActions={[
              {
                label: "Approve Selected",
                icon: Check,
                onClick: (items) => {
                  const ids = items.map(i => i.id);
                  bulkApproveMutation.mutate(ids);
                },
              },
              {
                label: "Delete Selected",
                icon: Trash2,
                variant: "destructive",
                onClick: (items) => {
                  if (confirm(`Delete ${items.length} selected mixes? This cannot be undone.`)) {
                    const ids = items.map(i => i.id);
                    bulkDeleteMutation.mutate(ids);
                  }
                },
              },
            ]}
            rowActions={[
              {
                label: "Approve",
                icon: Check,
                onClick: (mix) => approveMutation.mutate(mix.id),
                show: (mix) => mix.status === 'pending',
              },
              {
                label: "Feature",
                icon: Star,
                onClick: (mix) => featureMutation.mutate(mix.id),
                show: (mix) => mix.status === 'approved',
              },
              {
                label: "View Link",
                icon: ExternalLink,
                onClick: (mix) => window.open(mix.url, '_blank'),
              },
              {
                label: "Delete",
                icon: Trash2,
                variant: "destructive",
                onClick: (mix) => {
                  if (confirm("Are you sure you want to delete this mix?")) {
                    deleteMutation.mutate(mix.id);
                  }
                },
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
