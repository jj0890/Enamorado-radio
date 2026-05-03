import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface Submission {
  id: number;
  writerName: string;
  writerEmail: string;
  writerBio?: string;
  portfolioLinks?: string[];
  socialLinks?: { twitter?: string; instagram?: string };
  pitchTitle: string;
  pitchCategory?: string;
  pitchSummary: string;
  whyThisPublication?: string;
  uniqueAngle?: string;
  writingSampleText?: string;
  wordCount?: number;
  exclusiveSubmission?: boolean;
  targetPublishDate?: string;
  status: "pending" | "under_review" | "accepted" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface SubmissionsResponse {
  ok: boolean;
  data: { submissions: Submission[]; total: number };
}

interface StatsResponse {
  ok: boolean;
  data: {
    total: number;
    pending: number;
    underReview: number;
    accepted: number;
    rejected: number;
    thisMonth: number;
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded ${STATUS_STYLES[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Submission Detail Panel ──────────────────────────────────────────────────
function SubmissionDetail({
  submission,
  onBack,
  onUpdated,
}: {
  submission: Submission;
  onBack: () => void;
  onUpdated: (updated: Submission) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState(submission.reviewNotes || "");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (body: { status?: string; reviewNotes?: string }) =>
      apiRequest("PATCH", `/api/admin/submissions/${submission.id}`, body),
    onSuccess: (data: any) => {
      if (data?.ok && data?.data) {
        onUpdated(data.data);
        qc.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
        qc.invalidateQueries({ queryKey: ["/api/admin/submissions/stats"] });
      }
    },
  });

  const setStatus = (status: string) => {
    updateMutation.mutate({ status, reviewNotes });
  };

  const saveNotes = () => {
    updateMutation.mutate({ reviewNotes, status: submission.status });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center text-gray-500 hover:text-black text-sm mb-6 gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to submissions
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{submission.pitchTitle}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
            <span>•</span>
            <StatusBadge status={submission.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Writer */}
          <section className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold mb-3">Writer</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium">{submission.writerName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd>
                  <a href={`mailto:${submission.writerEmail}`} className="text-blue-600 hover:underline">
                    {submission.writerEmail}
                  </a>
                </dd>
              </div>
              {submission.writerBio && (
                <div>
                  <dt className="text-gray-500">Bio</dt>
                  <dd>{submission.writerBio}</dd>
                </div>
              )}
              {submission.portfolioLinks && submission.portfolioLinks.length > 0 && (
                <div>
                  <dt className="text-gray-500 mb-1">Portfolio</dt>
                  <dd className="space-y-0.5">
                    {submission.portfolioLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs truncate"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {link}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Pitch */}
          <section className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold mb-3">Pitch</h2>
            <dl className="space-y-3 text-sm">
              {submission.pitchCategory && (
                <div>
                  <dt className="text-gray-500 mb-0.5">Category</dt>
                  <dd>
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-bold uppercase rounded">
                      {submission.pitchCategory}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 mb-1">Summary</dt>
                <dd className="leading-relaxed">{submission.pitchSummary}</dd>
              </div>
              {submission.whyThisPublication && (
                <div>
                  <dt className="text-gray-500 mb-1">Why Enamorado Radio?</dt>
                  <dd className="leading-relaxed">{submission.whyThisPublication}</dd>
                </div>
              )}
              {submission.uniqueAngle && (
                <div>
                  <dt className="text-gray-500 mb-1">Unique Angle</dt>
                  <dd>{submission.uniqueAngle}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Writing sample */}
          {submission.writingSampleText && (
            <section className="bg-white rounded-lg border p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Writing Sample</h2>
                {submission.wordCount && (
                  <span className="text-xs text-gray-500">{submission.wordCount} words</span>
                )}
              </div>
              <div className="bg-gray-50 rounded p-4 max-h-80 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
                  {submission.writingSampleText}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <section className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Update Status</h3>
            <div className="space-y-2">
              {submission.status !== "under_review" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => setStatus("under_review")}
                  disabled={updateMutation.isPending}
                >
                  Mark Under Review
                </Button>
              )}
              {submission.status !== "accepted" && (
                <Button
                  size="sm"
                  className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setStatus("accepted")}
                  disabled={updateMutation.isPending}
                >
                  Accept
                </Button>
              )}
              {submission.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() => setStatus("rejected")}
                  disabled={updateMutation.isPending}
                >
                  Reject
                </Button>
              )}
            </div>
          </section>

          {/* Review Notes */}
          <section className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Review Notes</h3>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="h-28 resize-none text-sm"
              placeholder="Internal notes…"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={saveNotes}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Notes"}
            </Button>
          </section>

          {/* Meta */}
          <section className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold mb-3 text-sm">Metadata</h3>
            <dl className="space-y-2 text-xs text-gray-600">
              <div>
                <dt>ID</dt>
                <dd className="font-mono text-gray-900">#{submission.id}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{new Date(submission.submittedAt).toLocaleString()}</dd>
              </div>
              {submission.reviewedAt && (
                <div>
                  <dt>Reviewed</dt>
                  <dd>{new Date(submission.reviewedAt).toLocaleString()}</dd>
                </div>
              )}
              {submission.exclusiveSubmission && (
                <div>
                  <dt>Exclusive</dt>
                  <dd className="text-green-700 font-semibold">Yes</dd>
                </div>
              )}
              {submission.targetPublishDate && (
                <div>
                  <dt>Target date</dt>
                  <dd>{new Date(submission.targetPublishDate).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Submissions List ──────────────────────────────────────────────
export default function AdminSubmissions() {
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const { data: submissionsData, isLoading } = useQuery<SubmissionsResponse>({
    queryKey: ["/api/admin/submissions", filter],
    queryFn: () =>
      fetch(`/api/admin/submissions?status=${filter}`).then((r) => r.json()),
  });

  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ["/api/admin/submissions/stats"],
    queryFn: () => fetch("/api/admin/submissions/stats").then((r) => r.json()),
  });

  const submissions = submissionsData?.data?.submissions ?? [];
  const stats = statsData?.data;

  if (selectedSubmission) {
    return (
      <SubmissionDetail
        submission={selectedSubmission}
        onBack={() => setSelectedSubmission(null)}
        onUpdated={(updated) => setSelectedSubmission(updated)}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Writer Submissions</h1>
        <p className="text-gray-500">Review and manage editorial pitch submissions</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total", value: stats.total, className: "bg-white" },
            { label: "Pending", value: stats.pending, className: "bg-yellow-50" },
            { label: "Under Review", value: stats.underReview, className: "bg-blue-50" },
            { label: "Accepted", value: stats.accepted, className: "bg-green-50" },
            { label: "Rejected", value: stats.rejected, className: "bg-red-50" },
          ].map(({ label, value, className }) => (
            <div key={label} className={`${className} rounded-lg border p-4`}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "under_review", "accepted", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No submissions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Writer", "Pitch Title", "Category", "Status", "Submitted", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium">{sub.writerName}</div>
                    <div className="text-xs text-gray-400">{sub.writerEmail}</div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <span className="truncate block" title={sub.pitchTitle}>
                      {sub.pitchTitle}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {sub.pitchCategory && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {sub.pitchCategory}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
