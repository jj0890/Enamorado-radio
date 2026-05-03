import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`);
      const data = await response.json();
      if (data.ok) {
        setSubmission(data.data);
        setReviewNotes(data.data.reviewNotes || '');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setSubmission(data.data);
        alert('Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-gray-400" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Submission Not Found</h2>
          <Link to="/admin/submissions" className="text-blue-600 hover:underline">
            ← Back to submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/submissions"
          className="inline-flex items-center text-gray-600 hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to submissions
        </Link>
        <h1 className="text-3xl font-bold mb-2">{submission.pitchTitle}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
          <span>•</span>
          <span className={`px-2 py-1 rounded font-semibold ${
            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            submission.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
            submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {submission.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Writer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Writer Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Name</dt>
                <dd className="text-base">{submission.writerName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Email</dt>
                <dd className="text-base">
                  <a href={`mailto:${submission.writerEmail}`} className="text-blue-600 hover:underline">
                    {submission.writerEmail}
                  </a>
                </dd>
              </div>
              {submission.writerBio && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Bio</dt>
                  <dd className="text-sm text-gray-700">{submission.writerBio}</dd>
                </div>
              )}
              {submission.portfolioLinks && submission.portfolioLinks.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Portfolio</dt>
                  <dd className="space-y-1">
                    {submission.portfolioLinks.map((link: string, idx: number) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Pitch Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Pitch Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Category</dt>
                <dd>
                  <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded">
                    {submission.pitchCategory}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-2">Summary</dt>
                <dd className="text-base leading-relaxed">{submission.pitchSummary}</dd>
              </div>
              {submission.whyThisPublication && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-2">Why Enamorado Radio?</dt>
                  <dd className="text-base leading-relaxed">{submission.whyThisPublication}</dd>
                </div>
              )}
              {submission.uniqueAngle && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-2">Unique Angle</dt>
                  <dd className="text-base">{submission.uniqueAngle}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Writing Sample */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Writing Sample</h2>
              <div className="text-sm text-gray-600">
                {submission.wordCount} words
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-base leading-relaxed whitespace-pre-wrap font-serif">
                {submission.writingSampleText}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold mb-4">Update Status</h3>
            <div className="space-y-2">
              {submission.status !== 'under_review' && (
                <button
                  onClick={() => updateStatus('under_review')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Mark as Under Review
                </button>
              )}
              {submission.status !== 'accepted' && (
                <button
                  onClick={() => updateStatus('accepted')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  Accept
                </button>
              )}
              {submission.status !== 'rejected' && (
                <button
                  onClick={() => updateStatus('rejected')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  Reject
                </button>
              )}
            </div>
          </div>

          {/* Review Notes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold mb-4">Review Notes</h3>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full p-3 border rounded-lg h-32 resize-none text-sm"
              placeholder="Add internal notes about this submission..."
            />
            <button
              onClick={() => updateStatus(submission.status)}
              disabled={updating}
              className="mt-2 w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-black transition disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold mb-4">Metadata</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">Submission ID</dt>
                <dd className="font-mono">{submission.id}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Submitted</dt>
                <dd>{new Date(submission.submittedAt).toLocaleString()}</dd>
              </div>
              {submission.reviewedAt && (
                <div>
                  <dt className="text-gray-600">Reviewed</dt>
                  <dd>{new Date(submission.reviewedAt).toLocaleString()}</dd>
                </div>
              )}
              {submission.exclusiveSubmission && (
                <div>
                  <dt className="text-gray-600">Exclusive</dt>
                  <dd className="text-green-600 font-semibold">Yes</dd>
                </div>
              )}
              {submission.targetPublishDate && (
                <div>
                  <dt className="text-gray-600">Target Date</dt>
                  <dd>{new Date(submission.targetPublishDate).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
