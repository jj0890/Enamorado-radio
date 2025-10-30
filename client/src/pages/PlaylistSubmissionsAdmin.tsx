import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  X, 
  Star,
  Music2,
  ExternalLink,
  Trash2,
  StarOff
} from "lucide-react";
import { useState } from "react";

interface PlaylistSubmission {
  id: number;
  curatorName: string;
  curatorEmail: string | null;
  title: string;
  description: string | null;
  playlistUrl: string;
  platform: 'spotify' | 'apple_music' | 'youtube' | 'unknown';
  artworkUrl: string | null;
  tags: string[] | null;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  likes: number;
  submittedAt: string;
  approvedAt: string | null;
  featuredAt: string | null;
}

export default function PlaylistSubmissionsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'featured' | 'rejected'>('pending');

  // Fetch all playlists
  const { data: allPlaylists = [], isLoading } = useQuery<PlaylistSubmission[]>({
    queryKey: ['/api/editor/playlists'],
  });

  // Filter by status
  const playlists = allPlaylists.filter(p => p.status === activeTab);

  // Approve mutation
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
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/editor/playlists/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/playlists'] });
      toast({
        title: "Playlist Rejected",
        description: "The playlist has been rejected.",
        variant: "destructive",
      });
    },
  });

  // Feature/Unfeature mutation
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
  });

  // Delete mutation
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
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'spotify':
        return <Badge className="bg-green-600">Spotify</Badge>;
      case 'apple_music':
        return <Badge className="bg-pink-600">Apple Music</Badge>;
      case 'youtube':
        return <Badge className="bg-red-600">YouTube</Badge>;
      default:
        return <Badge variant="secondary">{platform}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  const pendingCount = allPlaylists.filter(p => p.status === 'pending').length;
  const approvedCount = allPlaylists.filter(p => p.status === 'approved').length;
  const featuredCount = allPlaylists.filter(p => p.status === 'featured').length;
  const rejectedCount = allPlaylists.filter(p => p.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Playlist Submissions</h1>
          <p className="text-muted-foreground">
            Review and manage community-submitted playlists
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending {pendingCount > 0 && <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved {approvedCount > 0 && <Badge className="ml-2">{approvedCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="featured" data-testid="tab-featured">
              Featured {featuredCount > 0 && <Badge className="ml-2">{featuredCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected {rejectedCount > 0 && <Badge className="ml-2">{rejectedCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {playlists.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No {activeTab} playlists</p>
                </CardContent>
              </Card>
            ) : (
              playlists.map((playlist) => (
                <Card key={playlist.id} data-testid={`playlist-card-${playlist.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          {playlist.title}
                          {getPlatformBadge(playlist.platform)}
                          {playlist.status === 'featured' && (
                            <Badge className="bg-yellow-600">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Curated by {playlist.curatorName}
                          {playlist.curatorEmail && ` (${playlist.curatorEmail})`}
                        </p>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        data-testid={`button-open-${playlist.id}`}
                      >
                        <a 
                          href={playlist.playlistUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Description */}
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground">
                          {playlist.description}
                        </p>
                      )}

                      {/* Tags */}
                      {playlist.tags && playlist.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {playlist.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>❤️ {playlist.likes} likes</span>
                        <span>📅 Submitted {new Date(playlist.submittedAt).toLocaleDateString()}</span>
                        {playlist.approvedAt && (
                          <span>✅ Approved {new Date(playlist.approvedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {playlist.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => approveMutation.mutate(playlist.id)}
                              disabled={approveMutation.isPending}
                              size="sm"
                              data-testid={`button-approve-${playlist.id}`}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectMutation.mutate(playlist.id)}
                              disabled={rejectMutation.isPending}
                              variant="destructive"
                              size="sm"
                              data-testid={`button-reject-${playlist.id}`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        {(playlist.status === 'approved' || playlist.status === 'featured') && (
                          <>
                            <Button
                              onClick={() => toggleFeatureMutation.mutate({ 
                                id: playlist.id, 
                                featured: playlist.status !== 'featured' 
                              })}
                              disabled={toggleFeatureMutation.isPending}
                              variant={playlist.status === 'featured' ? 'outline' : 'default'}
                              size="sm"
                              data-testid={`button-toggle-feature-${playlist.id}`}
                            >
                              {playlist.status === 'featured' ? (
                                <>
                                  <StarOff className="w-4 h-4 mr-2" />
                                  Unfeature
                                </>
                              ) : (
                                <>
                                  <Star className="w-4 h-4 mr-2" />
                                  Feature
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => rejectMutation.mutate(playlist.id)}
                              disabled={rejectMutation.isPending}
                              variant="outline"
                              size="sm"
                              data-testid={`button-reject-approved-${playlist.id}`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        {playlist.status === 'rejected' && (
                          <Button
                            onClick={() => approveMutation.mutate(playlist.id)}
                            disabled={approveMutation.isPending}
                            size="sm"
                            data-testid={`button-reapprove-${playlist.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Re-approve
                          </Button>
                        )}

                        <div className="flex-1" />
                        
                        <Button
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently delete this playlist?')) {
                              deleteMutation.mutate(playlist.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${playlist.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
