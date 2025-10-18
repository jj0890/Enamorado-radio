import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  FileAudio,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { EpisodeSubmission } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminEpisodeQueue() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [scheduledAirDate, setScheduledAirDate] = useState("");

  // Fetch episode submissions
  const { data: submissions = [], isLoading } = useQuery<EpisodeSubmission[]>({
    queryKey: ["/api/admin/episode-submissions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const response = await fetch(`/api/admin/episode-submissions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
  });

  // Review mutation (approve/reject)
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
        reviewedBy: "admin", // Would come from auth context in production
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/episode-submissions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/episode-submissions"] });
      toast({
        title: "Episode Deleted",
        description: "Episode submission has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete episode",
        variant: "destructive",
      });
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

  const handleDelete = (episode: EpisodeSubmission) => {
    if (confirm(`Are you sure you want to delete "${episode.title}" by ${episode.residentName}?`)) {
      deleteMutation.mutate(episode.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "approved":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-500 border-red-500/50";
      case "scheduled":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default:
        return "bg-zinc-500/20 text-zinc-500 border-zinc-500/50";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Episode Review Queue</h1>
          <p className="text-zinc-400">Review and manage resident episode submissions</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Label className="text-white">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-white" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-white">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
          </Badge>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileAudio className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No episode submissions found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((episode) => (
              <Card key={episode.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and Status */}
                      <div className="flex items-start gap-3">
                        <FileAudio className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{episode.title}</h3>
                            <Badge className={`${getStatusColor(episode.status)} border`}>
                              {episode.status}
                            </Badge>
                            {episode.genre && (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                                {episode.genre}
                              </Badge>
                            )}
                          </div>
                          {episode.seriesTitle && (
                            <p className="text-sm text-zinc-400 mt-1">
                              {episode.seriesTitle}
                              {episode.episodeNumber && ` • Episode ${episode.episodeNumber}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Resident Info */}
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{episode.residentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Submitted {episode.submittedAt ? format(new Date(episode.submittedAt), "MMM d, yyyy") : "Unknown"}</span>
                        </div>
                        {episode.audioFileSize && (
                          <span>
                            {(episode.audioFileSize / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {episode.description && (
                        <p className="text-sm text-zinc-300">{episode.description}</p>
                      )}

                      {/* Tags */}
                      {episode.tags && episode.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {episode.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Admin Notes */}
                      {episode.adminNotes && (
                        <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-1">Admin Notes:</p>
                          <p className="text-sm text-zinc-300">{episode.adminNotes}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {episode.rejectionReason && (
                        <div className="bg-red-500/10 p-3 rounded border border-red-500/50">
                          <p className="text-xs text-red-400 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-300">{episode.rejectionReason}</p>
                        </div>
                      )}

                      {/* Scheduled Air Date */}
                      {episode.scheduledAirDate && (
                        <div className="flex items-center gap-2 text-sm text-blue-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Scheduled: {format(new Date(episode.scheduledAirDate), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {episode.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => handleReview(episode, "approve")}
                            data-testid={`button-approve-${episode.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleReview(episode, "reject")}
                            data-testid={`button-reject-${episode.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                            data-testid={`button-menu-${episode.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(episode)}
                            data-testid={`button-delete-${episode.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve" ? "Approve Episode" : "Reject Episode"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedEpisode && (
                  <span>
                    "{selectedEpisode.title}" by {selectedEpisode.residentName}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Admin Notes */}
              <div>
                <Label className="text-white mb-2">Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes for the team..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="textarea-admin-notes"
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              {reviewAction === "reject" && (
                <div>
                  <Label className="text-white mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this episode was rejected..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="textarea-rejection-reason"
                  />
                </div>
              )}

              {/* Scheduled Air Date (if approving) */}
              {reviewAction === "approve" && (
                <div>
                  <Label className="text-white mb-2">Scheduled Air Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAirDate}
                    onChange={(e) => setScheduledAirDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-scheduled-air-date"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  className="border-zinc-700 hover:bg-zinc-800"
                  data-testid="button-cancel-review"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isPending || (reviewAction === "reject" && !rejectionReason)}
                  className={
                    reviewAction === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  data-testid="button-submit-review"
                >
                  {reviewMutation.isPending ? "Processing..." : reviewAction === "approve" ? "Approve Episode" : "Reject Episode"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
