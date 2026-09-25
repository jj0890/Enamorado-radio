import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout, { SectionHeader } from "@/components/admin-layout";
import AdminLogin from "@/components/admin-login";
import { DataTable, Column, RowAction } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Inbox, ExternalLink, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// ── Types ────────────────────────────────────────────────────────────────────

interface MagazineSubmission {
  id: number;
  title: string;
  description: string;
  submitterHandle: string;
  submitterEmail?: string | null;
  socialHandle?: string | null;
  category: string;
  contentType?: string | null;
  status: string;
  editorialStatus?: string | null;
  externalUrl?: string | null;
  openCallId?: number | null;
  createdAt: string | Date;
}

// ── Submission detail dialog ──────────────────────────────────────────────────

function SubmissionDetail({
  submission,
  onClose,
  onApprove,
  onReject,
  onCreateSpotlight,
}: {
  submission: MagazineSubmission;
  onClose: () => void;
  onApprove: (id: number, notes?: string) => void;
  onReject: (id: number, notes?: string) => void;
  onCreateSpotlight: (id: number) => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold">{submission.title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        {/* Meta row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">{submission.category}</Badge>
          <Badge variant="outline">{submission.contentType || "text"}</Badge>
          <span className="text-neutral-500">
            by @{submission.submitterHandle}
          </span>
          {submission.submitterEmail && (
            <span className="text-neutral-500">{submission.submitterEmail}</span>
          )}
          {submission.socialHandle && (
            <span className="text-neutral-500">{submission.socialHandle}</span>
          )}
        </div>

        {/* Description */}
        <div className="bg-neutral-50 rounded-lg p-4 text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {submission.description}
        </div>

        {/* External link */}
        {submission.externalUrl && (
          <a
            href={submission.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {submission.externalUrl}
          </a>
        )}

        {/* Editor notes */}
        <div>
          <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide block mb-1.5">
            Internal notes (optional)
          </label>
          <Textarea
            placeholder="Add feedback or internal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(submission.id, notes)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApprove(submission.id, notes)}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approve
          </Button>
          <Button
            size="sm"
            onClick={() => onCreateSpotlight(submission.id)}
            className="ml-auto bg-neutral-900 text-white hover:bg-neutral-700"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Create Spotlight
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSubmissionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState<MagazineSubmission | undefined>();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/admin/whoami")
      .then((r) => r.json())
      .then((data) => {
        setIsAuthenticated(data?.isAdmin || data?.role === "editor" || false);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const { data: submissions = [], isLoading } = useQuery<MagazineSubmission[]>({
    queryKey: ["/api/magazine/submissions", statusFilter],
    queryFn: () =>
      apiRequest("GET", `/api/magazine/submissions?status=${statusFilter}`).then((r) =>
        r.json()
      ),
    enabled: isAuthenticated === true,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: string;
      notes?: string;
    }) =>
      apiRequest("PATCH", `/api/magazine/submissions/${id}/status`, {
        status,
        feedbackNotes: notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/magazine/submissions"] });
      setSelected(undefined);
    },
  });

  const spotlightMutation = useMutation({
    mutationFn: (submissionId: number) =>
      apiRequest(
        "POST",
        `/api/editorial/projects/from-submission/${submissionId}`,
        {}
      ).then((r) => r.json()),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/magazine/submissions"] });
      setSelected(undefined);
      toast({
        title: "Spotlight created",
        description: `"${project.title}" is ready to edit in Editorial Projects.`,
      });
      navigate(`/admin/editorial/projects/${project.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create spotlight",
        description: "Check console for details.",
        variant: "destructive",
      });
    },
  });

  const handleLoginSuccess = () => setIsAuthenticated(true);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const columns: Column<MagazineSubmission>[] = [
    {
      key: "title",
      header: "Submission",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium text-neutral-900">{item.title}</div>
          <div className="text-xs text-neutral-500 truncate max-w-xs mt-0.5">
            {item.description}
          </div>
        </div>
      ),
    },
    {
      key: "submitterHandle",
      header: "Submitter",
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-neutral-700">@{item.submitterHandle}</div>
          {item.submitterEmail && (
            <div className="text-xs text-neutral-500">{item.submitterEmail}</div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "100px",
      render: (item) => (
        <Badge variant="outline" className="capitalize text-xs">
          {item.category}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "100px",
      render: (item) => (
        <Badge className={`${statusColors[item.status] ?? ""} border capitalize text-xs`}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Received",
      sortable: true,
      width: "110px",
      render: (item) => (
        <span className="text-neutral-500 text-xs">
          {item.createdAt
            ? format(new Date(item.createdAt), "MMM d, yyyy")
            : "—"}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<MagazineSubmission>[] = [
    {
      label: "Review",
      onClick: (item) => setSelected(item),
    },
  ];

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "", label: "All" },
  ];

  const stats = {
    pending: (submissions as MagazineSubmission[]).filter((s) => s.status === "pending").length,
    approved: (submissions as MagazineSubmission[]).filter((s) => s.status === "approved").length,
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <SectionHeader
          title="Submissions"
          description="Open call and community submissions awaiting review"
          icon={Inbox}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-500">Pending Review</p>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-500">Approved</p>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-500">Total</p>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">{submissions.length}</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === tab.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          data={submissions}
          columns={columns}
          rowActions={rowActions}
          isLoading={isLoading}
          searchable={true}
          searchPlaceholder="Search submissions..."
          searchKeys={["title", "submitterHandle", "category", "description"]}
          emptyMessage={
            statusFilter === "pending"
              ? "No pending submissions. Check back after your next open call."
              : "No submissions found."
          }
          getRowId={(item) => item.id.toString()}
        />

        {/* Review dialog */}
        <Dialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(undefined);
          }}
        >
          {selected && (
            <SubmissionDetail
              submission={selected}
              onClose={() => setSelected(undefined)}
              onApprove={(id, notes) =>
                statusMutation.mutate({ id, status: "approved", notes })
              }
              onReject={(id, notes) =>
                statusMutation.mutate({ id, status: "rejected", notes })
              }
              onCreateSpotlight={(id) => spotlightMutation.mutate(id)}
            />
          )}
        </Dialog>
      </div>
    </AdminLayout>
  );
}
