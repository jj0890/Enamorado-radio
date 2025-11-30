import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Star,
  Music2,
  ExternalLink,
  Trash2,
  StarOff,
  Clock,
  CheckCircle,
  ListMusic,
} from "lucide-react";
import { SiSpotify, SiApplemusic, SiSoundcloud, SiYoutube } from "react-icons/si";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable, { StatusBadge, DateCell, TruncatedText, type Column, type RowAction } from "@/components/admin/DataTable";

interface PlaylistSubmission {
  id: number;
  curatorName: string;
  curatorEmail: string | null;
  title: string;
  description: string | null;
  playlistUrl: string;
  platform: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube' | 'unknown';
  artworkUrl: string | null;
  tags: string[] | null;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  likes: number;
  submittedAt: string;
  approvedAt: string | null;
  featuredAt: string | null;
}

interface PlaylistSubmissionsAdminProps {
  currentUser: string;
  onLogout: () => void;
}

function PlatformBadge({ platform }: { platform: string }) {
  switch (platform) {
    case 'spotify':
      return (
        <Badge className="bg-green-600 text-white flex items-center gap-1">
          <SiSpotify className="w-3 h-3" />
          Spotify
        </Badge>
      );
    case 'apple_music':
      return (
        <Badge className="bg-pink-600 text-white flex items-center gap-1">
          <SiApplemusic className="w-3 h-3" />
          Apple Music
        </Badge>
      );
    case 'soundcloud':
      return (
        <Badge className="bg-orange-500 text-white flex items-center gap-1">
          <SiSoundcloud className="w-3 h-3" />
          SoundCloud
        </Badge>
      );
    case 'youtube':
      return (
        <Badge className="bg-red-600 text-white flex items-center gap-1">
          <SiYoutube className="w-3 h-3" />
          YouTube
        </Badge>
      );
    default:
      return <Badge variant="secondary">{platform}</Badge>;
  }
}

export default function PlaylistSubmissionsAdmin({ currentUser, onLogout }: PlaylistSubmissionsAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'featured' | 'rejected'>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [playlistToReject, setPlaylistToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: allPlaylists = [], isLoading } = useQuery<PlaylistSubmission[]>({
    queryKey: ['/api/editor/playlists'],
  });

  const pendingCount = allPlaylists.filter(p => p.status === 'pending').length;
  const approvedCount = allPlaylists.filter(p => p.status === 'approved').length;
  const featuredCount = allPlaylists.filter(p => p.status === 'featured').length;
  const rejectedCount = allPlaylists.filter(p => p.status === 'rejected').length;

  const getFilteredData = () => {
    switch (activeTab) {
      case 'pending': return allPlaylists.filter(p => p.status === 'pending');
      case 'approved': return allPlaylists.filter(p => p.status === 'approved');
      case 'featured': return allPlaylists.filter(p => p.status === 'featured');
      case 'rejected': return allPlaylists.filter(p => p.status === 'rejected');
      default: return allPlaylists;
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/editor/playlists/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community'] });
      toast({
        title: "Playlist Approved",
        description: "The playlist is now visible to the community.",
      });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve playlist",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      return apiRequest('PATCH', `/api/editor/playlists/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/playlists'] });
      setRejectDialogOpen(false);
      setPlaylistToReject(null);
      setRejectionReason('');
      toast({
        title: "Playlist Rejected",
        description: "The playlist has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject playlist",
        variant: "destructive",
      });
    },
  });

  const handleRejectClick = (id: number) => {
    setPlaylistToReject(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (playlistToReject !== null) {
      rejectMutation.mutate({ id: playlistToReject, reason: rejectionReason || undefined });
    }
  };

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      return apiRequest('PATCH', `/api/editor/playlists/${id}/feature`, { featured });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community'] });
      toast({
        title: variables.featured ? "Playlist Featured" : "Playlist Unfeatured",
        description: variables.featured 
          ? "The playlist is now featured on the community page." 
          : "The playlist is no longer featured.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feature Toggle Failed",
        description: error instanceof Error ? error.message : "Failed to update playlist feature status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/editor/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community'] });
      toast({
        title: "Playlist Deleted",
        description: "The playlist has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete playlist",
        variant: "destructive",
      });
    },
  });

  const columns: Column<PlaylistSubmission>[] = [
    {
      key: 'title',
      header: 'Playlist',
      sortable: true,
      render: (playlist) => (
        <div className="flex items-center gap-3">
          {playlist.artworkUrl ? (
            <img 
              src={playlist.artworkUrl} 
              alt={playlist.title}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <span className="font-medium text-gray-900"><TruncatedText text={playlist.title} maxLength={30} /></span>
            <p className="text-xs text-gray-500">{playlist.curatorName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      sortable: true,
      render: (playlist) => <PlatformBadge platform={playlist.platform} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (playlist) => <StatusBadge status={playlist.status} />,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (playlist) => playlist.tags && playlist.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {playlist.tags.slice(0, 2).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {playlist.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{playlist.tags.length - 2}
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-gray-400">—</span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (playlist) => <DateCell date={playlist.submittedAt} />,
    },
    {
      key: 'playlistUrl',
      header: 'Link',
      render: (playlist) => (
        <a 
          href={playlist.playlistUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
          data-testid={`link-playlist-${playlist.id}`}
        >
          <ExternalLink className="w-3 h-3" />
          <span className="text-sm">Open</span>
        </a>
      ),
    },
  ];

  const rowActions: RowAction<PlaylistSubmission>[] = [
    {
      label: 'Approve',
      icon: Check,
      onClick: (playlist) => approveMutation.mutate(playlist.id),
      show: (playlist) => playlist.status === 'pending',
    },
    {
      label: 'Feature',
      icon: Star,
      onClick: (playlist) => toggleFeatureMutation.mutate({ id: playlist.id, featured: true }),
      show: (playlist) => playlist.status === 'approved',
    },
    {
      label: 'Unfeature',
      icon: StarOff,
      onClick: (playlist) => toggleFeatureMutation.mutate({ id: playlist.id, featured: false }),
      show: (playlist) => playlist.status === 'featured',
    },
    {
      label: 'Re-approve',
      icon: Check,
      onClick: (playlist) => approveMutation.mutate(playlist.id),
      show: (playlist) => playlist.status === 'rejected',
    },
    {
      label: 'Reject',
      icon: X,
      onClick: (playlist) => handleRejectClick(playlist.id),
      variant: 'destructive',
      show: (playlist) => playlist.status !== 'rejected',
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: (playlist) => {
        if (confirm('Are you sure you want to permanently delete this playlist?')) {
          deleteMutation.mutate(playlist.id);
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <AdminShell
      title="Playlist Submissions"
      subtitle="Review and manage community-submitted playlists"
      breadcrumbs={[{ label: "Playlists" }]}
      currentUser={currentUser}
      userRole="editor"
      onLogout={onLogout}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <ListMusic className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{allPlaylists.length}</p>
            <p className="text-sm text-gray-500">Total Playlists</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{featuredCount}</p>
            <p className="text-sm text-gray-500">Featured</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({allPlaylists.length})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="featured" data-testid="tab-featured">
                Featured ({featuredCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DataTable
          data={getFilteredData()}
          columns={columns}
          rowActions={rowActions}
          searchKeys={['title', 'curatorName', 'platform']}
          searchPlaceholder="Search playlists..."
          isLoading={isLoading}
          emptyMessage={activeTab === 'pending' 
            ? "No pending playlists to review"
            : "No playlists match your filters"}
        />
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Playlist</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this playlist.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Playlist doesn't match our community guidelines..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            data-testid="input-rejection-reason"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setPlaylistToReject(null);
                setRejectionReason('');
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
