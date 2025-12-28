import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminShell from "@/components/admin/AdminShell";
import DataTable, { Column, StatusBadge, DateCell } from "@/components/admin/DataTable";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileAudio,
  Trash2,
  Check,
  X,
  Headphones
} from "lucide-react";
import { format } from "date-fns";
import type { EpisodeSubmission } from "@shared/schema";

interface AdminEpisodeQueueProps {
  onLogout?: () => void;
  currentUser?: string;
}

export default function AdminEpisodeQueue({ onLogout, currentUser = "admin" }: AdminEpisodeQueueProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [scheduledAirDate, setScheduledAirDate] = useState("");

  const { data: allSubmissions = [], isLoading, refetch } = useQuery<EpisodeSubmission[]>({
    queryKey: ["/api/admin/episode-submissions"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/episode-submissions`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
  });

  const pendingSubmissions = allSubmissions.filter(sub => sub.status === 'pending');
  const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
  const rejectedSubmissions = allSubmissions.filter(sub => sub.status === 'rejected');

  const getFilteredData = () => {
    switch (activeTab) {
      case 'pending': return pendingSubmissions;
      case 'approved': return approvedSubmissions;
      case 'rejected': return rejectedSubmissions;
      default: return allSubmissions;
    }
  };

  const reviewMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      status: string;
      adminNotes?: string;
      rejectionReason?: string;
      scheduledAirDate?: string;
    }) => {
      return await apiRequest("PATCH", `/api/admin/episode-submissions/${data.id}`, {
        status: data.status,
        adminNotes: data.adminNotes,
        rejectionReason: data.rejectionReason,
        scheduledAirDate: data.scheduledAirDate,
        reviewedBy: currentUser,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/episode-submissions"] });
      toast({
        title: "Episode Reviewed",
        description: `Episode ${variables.status === "approved" ? "approved" : "rejected"} successfully.`,
      });
      setReviewDialogOpen(false);
      setSelectedEpisode(null);
      setAdminNotes("");
      setRejectionReason("");
      setScheduledAirDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error?.message || "Failed to review episode",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/episode-submissions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/episode-submissions"] });
      toast({ title: "Episode Deleted", description: "Episode submission has been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error?.message || "Failed to delete episode", variant: "destructive" });
    },
  });

  const handleReview = (episode: EpisodeSubmission, action: "approve" | "reject") => {
    setSelectedEpisode(episode);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedEpisode || !reviewAction) return;
    reviewMutation.mutate({
      id: selectedEpisode.id,
      status: reviewAction === "approve" ? "approved" : "rejected",
      adminNotes,
      rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
      scheduledAirDate: reviewAction === "approve" && scheduledAirDate ? scheduledAirDate : undefined,
    });
  };

  const columns: Column<EpisodeSubmission>[] = [
    {
      key: 'title',
      header: 'Episode',
      sortable: true,
      render: (ep) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-navy/10 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-navy" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{ep.title}</p>
            <p className="text-sm text-gray-500">{ep.residentName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'genre',
      header: 'Genre',
      sortable: true,
      render: (ep) => (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          {ep.genre || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (ep) => <StatusBadge status={ep.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (ep) => ep.submittedAt ? <DateCell date={ep.submittedAt} /> : <span className="text-gray-400">—</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (ep) => {
        if (!ep.duration) return <span className="text-gray-400">—</span>;
        const mins = Math.floor(ep.duration / 60);
        return <span className="text-gray-600">{mins} min</span>;
      },
    },
  ];

  return (
    <AdminShell
      title="Episode Queue"
      subtitle="Review and manage episode submissions from residents"
      breadcrumbs={[{ label: "Episodes" }]}
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Headphones className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{allSubmissions.length}</p>
            <p className="text-sm text-gray-500">Total Episodes</p>
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
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{rejectedSubmissions.length}</p>
            <p className="text-sm text-gray-500">Rejected</p>
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
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            <X className="w-3 h-3 mr-1" />
            Rejected ({rejectedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={getFilteredData()}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search episodes by title or resident..."
            searchKeys={['title', 'residentName', 'genre']}
            emptyMessage="No episodes found"
            onRefresh={() => refetch()}
            bulkActions={[
              {
                label: "Approve Selected",
                icon: Check,
                onClick: (items) => {
                  items.forEach(ep => {
                    reviewMutation.mutate({ id: ep.id, status: 'approved' });
                  });
                },
              },
              {
                label: "Delete Selected",
                icon: Trash2,
                variant: "destructive",
                onClick: (items) => {
                  if (confirm(`Delete ${items.length} selected episodes?`)) {
                    items.forEach(ep => deleteMutation.mutate(ep.id));
                  }
                },
              },
            ]}
            rowActions={[
              {
                label: "Approve",
                icon: Check,
                onClick: (ep) => handleReview(ep, 'approve'),
                show: (ep) => ep.status === 'pending',
              },
              {
                label: "Reject",
                icon: X,
                onClick: (ep) => handleReview(ep, 'reject'),
                show: (ep) => ep.status === 'pending',
              },
              {
                label: "Delete",
                icon: Trash2,
                variant: "destructive",
                onClick: (ep) => {
                  if (confirm(`Delete "${ep.title}"?`)) {
                    deleteMutation.mutate(ep.id);
                  }
                },
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Episode" : "Reject Episode"}
            </DialogTitle>
            <DialogDescription>
              {selectedEpisode?.title} by {selectedEpisode?.residentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reviewAction === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="airDate">Scheduled Air Date (optional)</Label>
                <Input
                  id="airDate"
                  type="datetime-local"
                  value={scheduledAirDate}
                  onChange={(e) => setScheduledAirDate(e.target.value)}
                  data-testid="input-air-date"
                />
              </div>
            )}
            
            {reviewAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this episode is being rejected..."
                  data-testid="input-rejection-reason"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this submission..."
                data-testid="input-admin-notes"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewMutation.isPending}
              className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? "Processing..." : reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
