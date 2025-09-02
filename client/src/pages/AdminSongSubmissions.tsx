import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Music, Clock, Star, ExternalLink, User, Mail, Calendar, Hash, ListMusic, Play } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface SongSubmission {
  id: number;
  submitterName: string;
  submitterEmail: string;
  songTitle: string;
  artistName: string;
  albumName?: string;
  genre: string;
  submissionType: 'discovery' | 'promotion' | 'testing';
  platform: string;
  platformUrl: string;
  trackId?: string;
  description?: string;
  themeTag?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  metadata?: string;
  queuePosition?: number;
  playbackStatus?: 'queued' | 'playing' | 'played';
  currentlyPlaying?: boolean;
}

export default function AdminSongSubmissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: submissions = [], isLoading } = useQuery<SongSubmission[]>({
    queryKey: ['/api/song-submissions'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return apiRequest(`/api/song-submissions/${id}/status`, 'PATCH', {
        status,
        approvedBy: 'Admin', // In real app, this would be the logged-in admin
        notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Song submission status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/song-submissions'] });
      setReviewingId(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update submission status.",
        variant: "destructive",
      });
    },
  });

  const convertToMixMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/song-submissions/${id}/convert-to-mix`, 'POST');
    },
    onSuccess: (data) => {
      toast({
        title: "Converted to Mix",
        description: `Song has been converted to mix submission #${data.mix.id}. You can now attach audio and push to AzuraCast.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/song-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert song to mix submission.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status, notes: reviewNotes });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'spotify': return 'bg-green-500 text-white';
      case 'apple_music': return 'bg-gray-800 text-white';
      case 'soundcloud': return 'bg-orange-500 text-white';
      case 'bandcamp': return 'bg-blue-600 text-white';
      case 'youtube': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const parseMetadata = (metadataStr?: string) => {
    if (!metadataStr) return null;
    try {
      return JSON.parse(metadataStr);
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading song submissions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold text-gray-900 mb-2">Song Submissions Admin</h1>
              <p className="text-gray-600 font-mono">
                Manage community song submissions for radio programming and themed days
              </p>
            </div>
            <Link
              href="/admin/queue"
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-mono transition-colors"
            >
              <ListMusic className="w-4 h-4" />
              Manage Queue
            </Link>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800">
                {submissions.filter((s: SongSubmission) => s.approvalStatus === 'pending').length}
              </div>
              <div className="text-sm text-yellow-600 font-mono">Pending Review</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-800">
                {submissions.filter((s: SongSubmission) => s.approvalStatus === 'approved').length}
              </div>
              <div className="text-sm text-green-600 font-mono">Approved</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">
                {submissions.filter((s: SongSubmission) => s.themeTag && s.themeTag !== 'none').length}
              </div>
              <div className="text-sm text-blue-600 font-mono">Themed Submissions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-800">
                {submissions.filter((s: SongSubmission) => s.submissionType === 'promotion').length}
              </div>
              <div className="text-sm text-purple-600 font-mono">Artist Promotions</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-mono font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">Song submissions will appear here for admin review.</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission: SongSubmission) => {
              const metadata = parseMetadata(submission.metadata);
              const isReviewing = reviewingId === submission.id;

              return (
                <Card key={submission.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="font-mono text-lg">{submission.songTitle}</CardTitle>
                          <Badge className={getStatusColor(submission.approvalStatus)}>
                            {submission.approvalStatus}
                          </Badge>
                          <Badge className={getPlatformColor(submission.platform)}>
                            {submission.platform}
                          </Badge>
                          {submission.themeTag && submission.themeTag !== 'none' && (
                            <Badge variant="outline" className="bg-blue-50">
                              <Hash className="w-3 h-3 mr-1" />
                              {submission.themeTag.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-gray-600 font-mono">by {submission.artistName}</div>
                        {submission.albumName && (
                          <div className="text-sm text-gray-500 font-mono">from {submission.albumName}</div>
                        )}
                      </div>
                      
                      {metadata?.imageUrl && (
                        <img 
                          src={metadata.imageUrl} 
                          alt="Album artwork"
                          className="w-16 h-16 rounded object-cover ml-4"
                        />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Metadata Display */}
                    {metadata && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-mono font-semibold mb-2">Fetched Metadata</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {metadata.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                          {metadata.popularity && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {metadata.popularity}/100
                            </div>
                          )}
                          {metadata.releaseDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {metadata.releaseDate}
                            </div>
                          )}
                          <a 
                            href={submission.platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Listen
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Submission Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <User className="w-4 h-4" />
                          Submitted by
                        </div>
                        <div className="font-mono">{submission.submitterName}</div>
                        <div className="text-gray-500 font-mono">{submission.submitterEmail}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Type & Genre</div>
                        <div className="font-mono capitalize">{submission.submissionType}</div>
                        <div className="text-gray-500 font-mono">{submission.genre}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Submitted</div>
                        <div className="font-mono">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {submission.description && (
                      <div>
                        <div className="text-gray-600 mb-1">Description</div>
                        <div className="text-sm bg-gray-50 p-2 rounded font-mono">
                          {submission.description}
                        </div>
                      </div>
                    )}

                    {/* Admin Review Section */}
                    <div className="border-t pt-4">
                      {submission.approvalStatus === 'pending' ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => convertToMixMutation.mutate(submission.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
                              disabled={convertToMixMutation.isPending}
                            >
                              {convertToMixMutation.isPending ? 'Converting...' : 'Convert to Mix'}
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(submission.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white font-mono"
                              disabled={updateStatusMutation.isPending}
                            >
                              Approve Only
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                              variant="outline"
                              className="font-mono border-red-200 text-red-600 hover:bg-red-50"
                              disabled={updateStatusMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                          {(reviewingId === submission.id) && (
                            <Textarea
                              placeholder="Add review notes (optional)..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="font-mono"
                            />
                          )}
                        </div>
                      ) : (
                        /* Quick Actions for Approved */
                        <div className="flex gap-2">
                          {submission.approvalStatus === 'approved' && (
                            <div className="text-green-600 font-mono text-sm">
                              ✓ Featured in rotation
                            </div>
                          )}
                          <Button
                            onClick={() => setReviewingId(submission.id)}
                            variant="outline"
                            className="font-mono"
                          >
                            Update Notes
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Review Information */}
                    {submission.approvalStatus !== 'pending' && (
                      <div className="border-t pt-3 text-sm">
                        <div className="text-gray-600">
                          {submission.approvalStatus === 'approved' ? 'Approved' : 'Rejected'} 
                          {submission.reviewedAt && ` on ${new Date(submission.reviewedAt).toLocaleDateString()}`}
                          {submission.reviewedBy && ` by ${submission.reviewedBy}`}
                        </div>
                        {submission.adminNotes && (
                          <div className="mt-1 text-gray-700 font-mono bg-gray-50 p-2 rounded">
                            {submission.adminNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}