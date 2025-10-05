import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Disc, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  Trash2,
  Send,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AlbumSuggestion {
  id: number;
  artist: string;
  title: string;
  releaseYear?: number;
  suggestedBy: string;
  reason?: string;
  musicbrainzId?: string;
  releaseGroupId?: string;
  coverArtUrl?: string;
  spotifyUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  voteCount?: number;
  approvalCount?: number;
  votes?: AlbumVote[];
}

interface AlbumVote {
  id: number;
  suggestionId: number;
  voterUsername: string;
  value: 1 | -1;
  createdAt: string;
}

interface AlbumPick {
  id: number;
  month: string;
  title: string;
  description?: string;
  createdBy: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface AlbumPickItem {
  id: number;
  pickId: number;
  suggestionId: number;
  rank: number;
  blurb?: string;
  addedBy: string;
  createdAt: string;
  album?: AlbumSuggestion;
}

interface AlbumNote {
  id: number;
  suggestionId: number;
  authorUsername: string;
  content: string;
  createdAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
  };
  
  return (
    <Badge className={variants[status] || variants['pending']}>
      {status.toUpperCase()}
    </Badge>
  );
};

export default function AdminAlbums() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const [activeTab, setActiveTab] = useState('suggestions');
  const [selectedSuggestion, setSelectedSuggestion] = useState<AlbumSuggestion | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [newPickMonth, setNewPickMonth] = useState('');
  const [newPickTitle, setNewPickTitle] = useState('');
  const [newPickDescription, setNewPickDescription] = useState('');
  const selectedPickMonth = searchParams.get('draft') || '';
  const [noteContent, setNoteContent] = useState('');

  const setSelectedPickMonth = (month: string) => {
    if (month) {
      setLocation(`/admin/albums?draft=${month}`);
    } else {
      setLocation('/admin/albums');
    }
  };

  // Sync active tab from URL draft param on mount and when draft param changes
  useEffect(() => {
    if (selectedPickMonth && activeTab !== 'draft') {
      setActiveTab('draft');
    }
  }, [selectedPickMonth]);

  // Fetch album suggestions with votes
  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery<AlbumSuggestion[]>({
    queryKey: ['/api/admin/albums/suggestions', statusFilter, activeTab],
    queryFn: async () => {
      // In Draft Pick tab, fetch all suggestions so we can filter for accepted ones
      const effectiveFilter = activeTab === 'draft' ? 'all' : statusFilter;
      const params = effectiveFilter !== 'all' ? `?status=${effectiveFilter}` : '';
      return fetch(`/api/admin/albums/suggestions${params}`, {
        credentials: 'include'
      }).then(res => res.json());
    }
  });

  // Fetch draft picks
  const { data: draftPicks = [], isLoading: loadingDrafts } = useQuery<AlbumPick[]>({
    queryKey: ['/api/admin/albums/drafts'],
    enabled: activeTab === 'draft',
  });

  // Fetch published picks
  const { data: publishedPicks = [], isLoading: loadingPublished } = useQuery<AlbumPick[]>({
    queryKey: ['/api/albums/published'],
    enabled: activeTab === 'published',
  });

  // Fetch draft pick
  const { data: draftPick, isLoading: loadingDraft } = useQuery<AlbumPick & { items: AlbumPickItem[] }>({
    queryKey: ['/api/admin/albums/picks', selectedPickMonth],
    queryFn: async () => {
      if (!selectedPickMonth) return null;
      return fetch(`/api/admin/albums/picks/${selectedPickMonth}`, {
        credentials: 'include'
      }).then(res => res.ok ? res.json() : null);
    },
    enabled: activeTab === 'draft' && !!selectedPickMonth,
  });

  // Fetch notes for selected suggestion
  const { data: notes = [] } = useQuery<AlbumNote[]>({
    queryKey: ['/api/admin/albums/suggestions', selectedSuggestion?.id, 'notes'],
    queryFn: async () => {
      if (!selectedSuggestion) return [];
      return fetch(`/api/admin/albums/suggestions/${selectedSuggestion.id}/notes`, {
        credentials: 'include'
      }).then(res => res.json());
    },
    enabled: !!selectedSuggestion,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: 1 | -1 }) => {
      const res = await apiRequest('POST', `/api/admin/albums/suggestions/${id}/vote`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      toast({ title: 'Vote recorded', description: 'Your vote has been saved.' });
    },
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/albums/suggestions/${id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      toast({ title: 'Album accepted', description: 'The album suggestion has been accepted.' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/albums/suggestions/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      toast({ title: 'Album rejected', description: 'The album suggestion has been rejected.' });
    },
  });

  // Create pick mutation
  const createPickMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/albums/picks', {
        month: newPickMonth,
        title: newPickTitle,
        description: newPickDescription,
      });
      const result = await res.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to create pick');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      setSelectedPickMonth(data.month);
      setNewPickMonth('');
      setNewPickTitle('');
      setNewPickDescription('');
      toast({ title: 'Pick created', description: 'Draft album pick has been created.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create pick', 
        description: error.message || 'Could not create the album pick. Please try again.',
        variant: 'destructive'
      });
    },
  });

  // Add to pick mutation
  const addToPickMutation = useMutation({
    mutationFn: async ({ suggestionId, rank, blurb }: { suggestionId: number; rank: number; blurb?: string }) => {
      const res = await apiRequest('POST', `/api/admin/albums/picks/${selectedPickMonth}/items`, { suggestionId, rank, blurb });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks'] });
      toast({ title: 'Album added', description: 'Album added to draft pick.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to add album', 
        description: error.message || 'Could not add album to pick. Please try again.',
        variant: 'destructive'
      });
    },
  });

  // Update rank mutation
  const updateRankMutation = useMutation({
    mutationFn: async ({ id, rank }: { id: number; rank: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/albums/pick-items/${id}`, { rank });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks'] });
    },
  });

  // Delete from pick mutation
  const deleteFromPickMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/albums/pick-items/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks'] });
      toast({ title: 'Album removed', description: 'Album removed from draft pick.' });
    },
  });

  // Publish pick mutation
  const publishPickMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/admin/albums/picks/${selectedPickMonth}/publish`);
      const result = await res.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to publish pick');
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/albums/published'] });
      toast({ title: 'Pick published', description: 'Album pick is now live!' });
      setSelectedPickMonth('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to publish pick', 
        description: error.message || 'Could not publish the album pick. Please try again.',
        variant: 'destructive'
      });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ suggestionId, content }: { suggestionId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/admin/albums/suggestions/${suggestionId}/notes`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions', selectedSuggestion?.id, 'notes'] });
      setNoteContent('');
      toast({ title: 'Note added', description: 'Your note has been saved.' });
    },
  });

  // Delete suggestion mutation
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/albums/suggestions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      setIsDetailsOpen(false);
      setSelectedSuggestion(null);
      toast({ title: 'Deleted', description: 'Album suggestion has been permanently deleted.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete', 
        description: error.message || 'Could not delete the album suggestion.',
        variant: 'destructive'
      });
    },
  });

  // Backfill Spotify URL mutation
  const backfillSpotifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/albums/suggestions/${id}/backfill-spotify`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      toast({ title: 'Spotify URL added', description: 'Spotify link has been added to this album.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to add Spotify URL', 
        description: error.message || 'No Spotify album found for this artist and title.',
        variant: 'destructive'
      });
    },
  });

  // Delete published pick mutation
  const deletePublishedPickMutation = useMutation({
    mutationFn: async (month: string) => {
      const res = await apiRequest('DELETE', `/api/admin/albums/picks/${month}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/albums/published'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
      toast({ title: 'Pick deleted', description: 'Published album pick has been deleted.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete pick', 
        description: error.message || 'Could not delete the published pick.',
        variant: 'destructive'
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Disc className="w-8 h-8" />
            Albums of the Month
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage community album suggestions and monthly picks
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">
            Suggestions ({suggestions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">
            Draft Pick
          </TabsTrigger>
          <TabsTrigger value="published" data-testid="tab-published">
            Published ({publishedPicks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          <div className="mb-4 flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suggestions</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingSuggestions ? (
            <div className="text-center py-8">Loading suggestions...</div>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {suggestion.coverArtUrl && (
                        <img 
                          src={suggestion.coverArtUrl} 
                          alt={`${suggestion.title} cover`}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg" data-testid={`album-title-${suggestion.id}`}>
                              {suggestion.title}
                            </h3>
                            <p className="text-muted-foreground">{suggestion.artist}</p>
                            {suggestion.releaseYear && (
                              <p className="text-sm text-muted-foreground">{suggestion.releaseYear}</p>
                            )}
                          </div>
                          <StatusBadge status={suggestion.status} />
                        </div>

                        {suggestion.reason && (
                          <p className="mt-2 text-sm">{suggestion.reason}</p>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Suggested by: {suggestion.suggestedBy}</span>
                          <span>•</span>
                          <span>Votes: {suggestion.voteCount || 0}</span>
                          <span>•</span>
                          <span>Approvals: {suggestion.approvalCount || 0}</span>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {suggestion.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => voteMutation.mutate({ id: suggestion.id, value: 1 })}
                                disabled={voteMutation.isPending}
                                data-testid={`button-upvote-${suggestion.id}`}
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Upvote
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => voteMutation.mutate({ id: suggestion.id, value: -1 })}
                                disabled={voteMutation.isPending}
                                data-testid={`button-downvote-${suggestion.id}`}
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                Downvote
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptMutation.mutate(suggestion.id)}
                                disabled={acceptMutation.isPending}
                                data-testid={`button-accept-${suggestion.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectMutation.mutate(suggestion.id)}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${suggestion.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {suggestion.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSuggestionMutation.mutate(suggestion.id)}
                              disabled={deleteSuggestionMutation.isPending}
                              data-testid={`button-delete-${suggestion.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSuggestion(suggestion);
                              setIsDetailsOpen(true);
                            }}
                            data-testid={`button-view-details-${suggestion.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft">
          <div className="space-y-6">
            {!selectedPickMonth ? (
              <>
                {draftPicks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Existing Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {draftPicks.map((draft) => (
                          <div 
                            key={draft.id}
                            className="flex items-center justify-between p-3 border rounded hover:bg-muted cursor-pointer"
                            onClick={() => setSelectedPickMonth(draft.month)}
                            data-testid={`draft-pick-${draft.month}`}
                          >
                            <div>
                              <p className="font-medium">{draft.title}</p>
                              <p className="text-sm text-muted-foreground">{draft.month}</p>
                            </div>
                            <Badge variant="outline">Draft</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Create New Pick</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Month (YYYY-MM)</label>
                      <Input
                        type="month"
                        value={newPickMonth}
                        onChange={(e) => setNewPickMonth(e.target.value)}
                        data-testid="input-pick-month"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newPickTitle}
                        onChange={(e) => setNewPickTitle(e.target.value)}
                        placeholder="e.g., January 2025 Picks"
                        data-testid="input-pick-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Textarea
                        value={newPickDescription}
                        onChange={(e) => setNewPickDescription(e.target.value)}
                        placeholder="Describe this month's theme or selection criteria"
                        data-testid="textarea-pick-description"
                      />
                    </div>
                    <Button
                      onClick={() => createPickMutation.mutate()}
                      disabled={!newPickMonth || !newPickTitle || createPickMutation.isPending}
                      data-testid="button-create-pick"
                    >
                      Create Pick
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{draftPick?.title || selectedPickMonth}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPickMonth('')}
                        data-testid="button-change-month"
                      >
                        Change Month
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {draftPick?.description && (
                      <p className="text-muted-foreground mb-4">{draftPick.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      {draftPick?.items.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRankMutation.mutate({ id: item.id, rank: item.rank - 1 })}
                              disabled={index === 0}
                              data-testid={`button-rank-up-${item.id}`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-bold text-center">{item.rank}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRankMutation.mutate({ id: item.id, rank: item.rank + 1 })}
                              disabled={index === (draftPick?.items.length || 0) - 1}
                              data-testid={`button-rank-down-${item.id}`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{item.album?.title}</p>
                            <p className="text-sm text-muted-foreground">{item.album?.artist}</p>
                            {item.blurb && <p className="text-sm italic mt-1">{item.blurb}</p>}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFromPickMutation.mutate(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {!draftPick?.items.length && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">
                          Add at least one album to this pick before publishing
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => publishPickMutation.mutate()}
                        disabled={!draftPick?.items?.length || publishPickMutation.isPending}
                        data-testid="button-publish-pick"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {publishPickMutation.isPending ? 'Publishing...' : 'Publish Pick'}
                      </Button>
                      {draftPick && draftPick.items && draftPick.items.length > 0 && (
                        <p className="text-sm text-muted-foreground self-center">
                          {draftPick.items.length} album{draftPick.items.length === 1 ? '' : 's'} ready to publish
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add Albums to Pick</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select from accepted album suggestions to add to this month's pick
                    </p>
                  </CardHeader>
                  <CardContent>
                    {suggestions.filter(s => s.status === 'accepted').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="font-medium mb-2">No accepted albums available</p>
                        <p className="text-sm">
                          Accept some album suggestions in the Suggestions tab first, then come back here to add them to your pick.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {suggestions.filter(s => s.status === 'accepted').map((suggestion) => {
                          const alreadyAdded = draftPick?.items.some(i => i.suggestionId === suggestion.id);
                          return (
                            <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex-1">
                                <p className="font-medium">{suggestion.title}</p>
                                <p className="text-sm text-muted-foreground">{suggestion.artist}</p>
                                {suggestion.releaseYear && (
                                  <p className="text-xs text-muted-foreground">{suggestion.releaseYear}</p>
                                )}
                              </div>
                              {alreadyAdded ? (
                                <Badge variant="secondary">Added</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToPickMutation.mutate({
                                    suggestionId: suggestion.id,
                                    rank: (draftPick?.items.length || 0) + 1,
                                  })}
                                  disabled={addToPickMutation.isPending}
                                  data-testid={`button-add-to-pick-${suggestion.id}`}
                                >
                                  Add to Pick
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="published">
          {loadingPublished ? (
            <div className="text-center py-8">Loading published picks...</div>
          ) : (
            <div className="grid gap-4">
              {publishedPicks.map((pick) => (
                <Card key={pick.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{pick.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {pick.month}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${pick.title}"? This action cannot be undone.`)) {
                              deletePublishedPickMutation.mutate(pick.month);
                            }
                          }}
                          disabled={deletePublishedPickMutation.isPending}
                          data-testid={`button-delete-pick-${pick.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pick.description && <p className="text-muted-foreground mb-2">{pick.description}</p>}
                    <p className="text-sm text-muted-foreground">
                      Published on {new Date(pick.publishedAt!).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Album Details</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedSuggestion.coverArtUrl && (
                  <img
                    src={selectedSuggestion.coverArtUrl}
                    alt={`${selectedSuggestion.title} cover`}
                    className="w-32 h-32 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedSuggestion.title}</h3>
                  <p className="text-muted-foreground">{selectedSuggestion.artist}</p>
                  {selectedSuggestion.releaseYear && (
                    <p className="text-sm text-muted-foreground">{selectedSuggestion.releaseYear}</p>
                  )}
                  <StatusBadge status={selectedSuggestion.status} />
                </div>
              </div>

              {selectedSuggestion.reason && (
                <div>
                  <h4 className="font-medium mb-1">Why this album?</h4>
                  <p className="text-sm">{selectedSuggestion.reason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                </h4>
                <div className="space-y-2 mb-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium">{note.authorUsername}</p>
                      <p>{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1"
                    data-testid="textarea-note"
                  />
                  <Button
                    onClick={() => addNoteMutation.mutate({
                      suggestionId: selectedSuggestion.id,
                      content: noteContent,
                    })}
                    disabled={!noteContent || addNoteMutation.isPending}
                    data-testid="button-add-note"
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2">
                {!selectedSuggestion.spotifyUrl && (
                  <Button
                    onClick={() => backfillSpotifyMutation.mutate(selectedSuggestion.id)}
                    disabled={backfillSpotifyMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-backfill-spotify"
                  >
                    🎵 Add Spotify Link
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently delete this suggestion?')) {
                      deleteSuggestionMutation.mutate(selectedSuggestion.id);
                    }
                  }}
                  disabled={deleteSuggestionMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-delete-suggestion"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Suggestion
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
