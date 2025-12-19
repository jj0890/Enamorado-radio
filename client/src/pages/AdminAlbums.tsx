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
import AdminShell from '@/components/admin/AdminShell';
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
  MessageSquare,
  Trophy,
  Plus,
  Edit,
  Save,
  X,
  Music,
  ExternalLink,
  Palette
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

interface YearEndList {
  id: number;
  month: string;
  title: string;
  slug: string;
  listType: string;
  introText?: string;
  outroText?: string;
  createdBy: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  items?: YearEndListItem[];
}

interface YearEndListItem {
  id: number;
  pickId: number;
  suggestionId: number;
  rank: number;
  blurb?: string;
  writeUp?: string;
  standoutTracks?: string[];
  accentColor?: string;
  label?: string;
  releaseDate?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  bandcampUrl?: string;
  addedBy: string;
  createdAt: string;
  album?: AlbumSuggestion | null;
}

interface AdminAlbumsProps {
  onLogout?: () => void;
  currentUser?: string;
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

export default function AdminAlbums({ onLogout, currentUser = "admin" }: AdminAlbumsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const [activeTab, setActiveTab] = useState('team-picks'); // Changed from 'suggestions'
  const [selectedSuggestion, setSelectedSuggestion] = useState<AlbumSuggestion | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // Changed from 'pending' to show all by default
  const [newPickMonth, setNewPickMonth] = useState('');
  const [newPickTitle, setNewPickTitle] = useState('');
  const [newPickDescription, setNewPickDescription] = useState('');
  const selectedPickMonth = searchParams.get('draft') || '';
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  
  // Album submission form state
  const [submitFormData, setSubmitFormData] = useState({
    artist: '',
    title: '',
    releaseYear: '',
    reason: ''
  });

  // Year-End Lists state
  const [selectedYearEndListSlug, setSelectedYearEndListSlug] = useState<string | null>(null);
  const [newListYear, setNewListYear] = useState(new Date().getFullYear().toString());
  const [newListTitle, setNewListTitle] = useState('');
  const [newListIntroText, setNewListIntroText] = useState('');
  const [newListOutroText, setNewListOutroText] = useState('');
  const [editingListMeta, setEditingListMeta] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState<{
    writeUp: string;
    standoutTracks: string;
    accentColor: string;
    label: string;
    releaseDate: string;
    spotifyUrl: string;
    appleMusicUrl: string;
    bandcampUrl: string;
  }>({
    writeUp: '',
    standoutTracks: '',
    accentColor: '',
    label: '',
    releaseDate: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    bandcampUrl: ''
  });
  const [isAddAlbumDialogOpen, setIsAddAlbumDialogOpen] = useState(false);
  const [selectedAlbumToAdd, setSelectedAlbumToAdd] = useState<AlbumSuggestion | null>(null);

  const setSelectedPickMonth = (month: string) => {
    if (month) {
      setLocation(`/admin/albums?draft=${month}`);
    } else {
      setLocation('/admin/albums');
    }
  };

  // Get current user
  const { data: authData } = useQuery<{ user: string; role: string }>({
    queryKey: ['/api/admin/auth'],
  });

  // Sync active tab from URL draft param on mount and when draft param changes
  useEffect(() => {
    // If draft param exists and we're not already on monthly-draft tab, switch to it
    if (selectedPickMonth && activeTab !== 'monthly-draft') {
      setActiveTab('monthly-draft');
    }
    // If no draft param and we're on monthly-draft, don't force a switch
    // (user may have manually navigated to the tab)
  }, [selectedPickMonth, activeTab]);

  // Fetch album suggestions with votes
  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery<AlbumSuggestion[]>({
    queryKey: ['/api/admin/albums/suggestions', statusFilter, activeTab],
    queryFn: async () => {
      // In Draft Pick tab, fetch all suggestions so we can filter for accepted ones
      const effectiveFilter = activeTab === 'monthly-draft' ? 'all' : statusFilter;
      const params = effectiveFilter !== 'all' ? `?status=${effectiveFilter}` : '';
      return fetch(`/api/admin/albums/suggestions${params}`, {
        credentials: 'include'
      }).then(res => res.json());
    }
  });

  // Fetch draft picks
  const { data: draftPicks = [], isLoading: loadingDrafts } = useQuery<AlbumPick[]>({
    queryKey: ['/api/admin/albums/drafts'],
    enabled: activeTab === 'monthly-draft',
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
    enabled: activeTab === 'monthly-draft' && !!selectedPickMonth,
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

  // Fetch year-end lists
  const { data: yearEndLists = [], isLoading: loadingYearEndLists } = useQuery<YearEndList[]>({
    queryKey: ['/api/admin/albums/year-end-lists'],
    enabled: activeTab === 'year-end-lists',
  });

  // Fetch selected year-end list with items
  const { data: selectedYearEndList, isLoading: loadingSelectedList } = useQuery<YearEndList>({
    queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug],
    queryFn: async () => {
      if (!selectedYearEndListSlug) return null;
      return fetch(`/api/admin/albums/year-end-lists/${selectedYearEndListSlug}`, {
        credentials: 'include'
      }).then(res => res.ok ? res.json() : null);
    },
    enabled: activeTab === 'year-end-lists' && !!selectedYearEndListSlug,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks', selectedPickMonth] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks', selectedPickMonth] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
    },
  });

  // Delete from pick mutation
  const deleteFromPickMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/albums/pick-items/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks', selectedPickMonth] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/picks', selectedPickMonth] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/drafts'] });
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

  // Submit album suggestion mutation
  const submitSuggestionMutation = useMutation({
    mutationFn: async (data: { artist: string; title: string; releaseYear?: number; reason?: string; suggestedBy: string }) => {
      const res = await apiRequest('POST', '/api/albums/suggest', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/suggestions'] });
      toast({ title: 'Suggestion submitted', description: 'Your album suggestion has been submitted for review.' });
      setIsSubmitDialogOpen(false);
      setSubmitFormData({ artist: '', title: '', releaseYear: '', reason: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to submit suggestion', 
        description: error.message || 'Could not submit your album suggestion. Please try again.',
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

  // Create year-end list mutation
  const createYearEndListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/albums/year-end-lists', {
        year: parseInt(newListYear),
        title: newListTitle || `Top 10 Albums of ${newListYear}`,
        introText: newListIntroText || null,
        outroText: newListOutroText || null,
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to create list');
      return result.data;
    },
    onSuccess: (data) => {
      setSelectedYearEndListSlug(data.slug);
      setNewListYear(new Date().getFullYear().toString());
      setNewListTitle('');
      setNewListIntroText('');
      setNewListOutroText('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists'] });
      toast({ title: 'List created', description: 'Year-end list has been created.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create list', description: error.message, variant: 'destructive' });
    },
  });

  // Update year-end list metadata mutation
  const updateYearEndListMetaMutation = useMutation({
    mutationFn: async (data: { title?: string; introText?: string; outroText?: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/albums/year-end-lists/${selectedYearEndListSlug}`, data);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update list');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug] });
      setEditingListMeta(false);
      toast({ title: 'List updated', description: 'List metadata has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update list', description: error.message, variant: 'destructive' });
    },
  });

  // Add album to year-end list mutation
  const addAlbumToYearEndListMutation = useMutation({
    mutationFn: async (data: { suggestionId: number; rank: number }) => {
      const res = await apiRequest('POST', `/api/admin/albums/year-end-lists/${selectedYearEndListSlug}/items`, data);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to add album');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug] });
      setIsAddAlbumDialogOpen(false);
      setSelectedAlbumToAdd(null);
      toast({ title: 'Album added', description: 'Album has been added to the list.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add album', description: error.message, variant: 'destructive' });
    },
  });

  // Update year-end list item mutation
  const updateYearEndListItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<YearEndListItem> }) => {
      const res = await apiRequest('PATCH', `/api/admin/albums/year-end-lists/${selectedYearEndListSlug}/items/${id}`, data);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update item');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug] });
      setEditingItemId(null);
      toast({ title: 'Item updated', description: 'Album item has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
    },
  });

  // Delete year-end list item mutation
  const deleteYearEndListItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/albums/year-end-lists/${selectedYearEndListSlug}/items/${id}`);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to remove album');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug] });
      toast({ title: 'Album removed', description: 'Album has been removed from the list.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to remove album', description: error.message, variant: 'destructive' });
    },
  });

  // Publish year-end list mutation
  const publishYearEndListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/admin/albums/year-end-lists/${selectedYearEndListSlug}/publish`);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to publish list');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/albums/year-end-lists', selectedYearEndListSlug] });
      toast({ title: 'List published', description: 'Year-end list is now live!' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to publish list', description: error.message, variant: 'destructive' });
    },
  });

  // Helper function to start editing an item
  const startEditingItem = (item: YearEndListItem) => {
    setEditingItemId(item.id);
    setItemFormData({
      writeUp: item.writeUp || '',
      standoutTracks: item.standoutTracks?.join(', ') || '',
      accentColor: item.accentColor || '',
      label: item.label || '',
      releaseDate: item.releaseDate || '',
      spotifyUrl: item.spotifyUrl || '',
      appleMusicUrl: item.appleMusicUrl || '',
      bandcampUrl: item.bandcampUrl || ''
    });
  };

  // Helper function to save item changes
  const saveItemChanges = (id: number) => {
    updateYearEndListItemMutation.mutate({
      id,
      data: {
        writeUp: itemFormData.writeUp || undefined,
        standoutTracks: itemFormData.standoutTracks ? itemFormData.standoutTracks.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        accentColor: itemFormData.accentColor || undefined,
        label: itemFormData.label || undefined,
        releaseDate: itemFormData.releaseDate || undefined,
        spotifyUrl: itemFormData.spotifyUrl || undefined,
        appleMusicUrl: itemFormData.appleMusicUrl || undefined,
        bandcampUrl: itemFormData.bandcampUrl || undefined
      }
    });
  };

  return (
    <AdminShell
      title="Albums"
      subtitle="Manage album of the month picks"
      breadcrumbs={[{ label: "Albums" }]}
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="team-picks" data-testid="tab-team-picks">
            Team Picks ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="monthly-draft" data-testid="tab-monthly-draft">
            Monthly Draft
          </TabsTrigger>
          <TabsTrigger value="published" data-testid="tab-published">
            Published ({publishedPicks.length})
          </TabsTrigger>
          <TabsTrigger value="year-end-lists" data-testid="tab-year-end-lists">
            <Trophy className="w-4 h-4 mr-1" />
            Year-End Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team-picks">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              <strong>How it works:</strong> Submit albums you love, vote on your teammates' picks, and the top-voted albums get added to the monthly draft!
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Picks</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => setIsSubmitDialogOpen(true)}
              className="bg-navy hover:bg-navy-dark text-white"
              data-testid="button-submit-pick"
            >
              <Disc className="w-4 h-4 mr-2" />
              Submit Your Pick
            </Button>
          </div>

          {loadingSuggestions ? (
            <div className="text-center py-8">Loading suggestions...</div>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
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

        <TabsContent value="monthly-draft">
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              <strong>Monthly Draft:</strong> Build your monthly album list by selecting top-voted picks from the Team Picks tab. Add your editorial notes and publish when ready!
            </p>
          </div>

          <div className="space-y-6">
            {!selectedPickMonth ? (
              <>
                {draftPicks.length > 0 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle>Existing Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {draftPicks.map((draft) => (
                          <div 
                            key={draft.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
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

                <Card className="bg-white border-gray-200">
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
                <Card className="bg-white border-gray-200">
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
                        <div key={item.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded">
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

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle>Add Albums to Pick</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
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
                            <div key={suggestion.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
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
                <Card key={pick.id} className="bg-white border-gray-200">
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
                          <Trash2 className="w-4 h-4 text-navy" />
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

        <TabsContent value="year-end-lists">
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Year-End Lists:</strong> Create and manage curated "Top 10 Albums of [Year]" lists with extended editorial content, standout tracks, and streaming links.
            </p>
          </div>

          <div className="space-y-6">
            {!selectedYearEndListSlug ? (
              <>
                {yearEndLists.length > 0 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle>Existing Year-End Lists</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {yearEndLists.map((list) => (
                          <div
                            key={list.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedYearEndListSlug(list.slug)}
                            data-testid={`year-end-list-${list.slug}`}
                          >
                            <div className="flex items-center gap-3">
                              <Trophy className="w-5 h-5 text-amber-600" />
                              <div>
                                <p className="font-medium">{list.title}</p>
                                <p className="text-sm text-muted-foreground">{list.month}</p>
                              </div>
                            </div>
                            <Badge variant={list.isPublished ? 'default' : 'outline'}>
                              {list.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create New Year-End List
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Year</label>
                      <Select value={newListYear} onValueChange={setNewListYear}>
                        <SelectTrigger data-testid="select-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2025, 2024, 2023, 2022, 2021].map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        placeholder={`Top 10 Albums of ${newListYear}`}
                        data-testid="input-list-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Introduction Text (optional)</label>
                      <Textarea
                        value={newListIntroText}
                        onChange={(e) => setNewListIntroText(e.target.value)}
                        placeholder="Write an introduction for your year-end list..."
                        rows={3}
                        data-testid="textarea-intro"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Outro Text (optional)</label>
                      <Textarea
                        value={newListOutroText}
                        onChange={(e) => setNewListOutroText(e.target.value)}
                        placeholder="Write a conclusion for your year-end list..."
                        rows={3}
                        data-testid="textarea-outro"
                      />
                    </div>
                    <Button
                      onClick={() => createYearEndListMutation.mutate()}
                      disabled={!newListYear || createYearEndListMutation.isPending}
                      data-testid="button-create-list"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Create List
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-600" />
                        <span>{selectedYearEndList?.title || 'Loading...'}</span>
                        {selectedYearEndList?.isPublished && (
                          <Badge>Published</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingListMeta(!editingListMeta)}
                          data-testid="button-edit-meta"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Info
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedYearEndListSlug(null)}
                          data-testid="button-back-to-lists"
                        >
                          Back to Lists
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingListMeta ? (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium">Title</label>
                          <Input
                            defaultValue={selectedYearEndList?.title}
                            id="edit-title"
                            data-testid="input-edit-title"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Introduction</label>
                          <Textarea
                            defaultValue={selectedYearEndList?.introText || ''}
                            id="edit-intro"
                            rows={3}
                            data-testid="textarea-edit-intro"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Outro</label>
                          <Textarea
                            defaultValue={selectedYearEndList?.outroText || ''}
                            id="edit-outro"
                            rows={3}
                            data-testid="textarea-edit-outro"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const titleEl = document.getElementById('edit-title') as HTMLInputElement;
                              const introEl = document.getElementById('edit-intro') as HTMLTextAreaElement;
                              const outroEl = document.getElementById('edit-outro') as HTMLTextAreaElement;
                              updateYearEndListMetaMutation.mutate({
                                title: titleEl?.value,
                                introText: introEl?.value,
                                outroText: outroEl?.value,
                              });
                            }}
                            disabled={updateYearEndListMetaMutation.isPending}
                            data-testid="button-save-meta"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingListMeta(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedYearEndList?.introText && (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-sm font-medium text-amber-800 mb-1">Introduction</p>
                            <p className="text-sm text-amber-700">{selectedYearEndList.introText}</p>
                          </div>
                        )}
                        {selectedYearEndList?.outroText && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-800 mb-1">Outro</p>
                            <p className="text-sm text-gray-600">{selectedYearEndList.outroText}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Albums ({selectedYearEndList?.items?.length || 0}/10)</h3>
                        <Button
                          size="sm"
                          onClick={() => setIsAddAlbumDialogOpen(true)}
                          data-testid="button-add-album"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Album
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {selectedYearEndList?.items?.map((item, index) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-4"
                            style={item.accentColor ? { borderLeftColor: item.accentColor, borderLeftWidth: '4px' } : {}}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateYearEndListItemMutation.mutate({ id: item.id, data: { rank: item.rank - 1 } })}
                                  disabled={index === 0}
                                  data-testid={`button-rank-up-${item.id}`}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <span className="text-lg font-bold text-center text-amber-600">#{item.rank}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateYearEndListItemMutation.mutate({ id: item.id, data: { rank: item.rank + 1 } })}
                                  disabled={index === (selectedYearEndList?.items?.length || 0) - 1}
                                  data-testid={`button-rank-down-${item.id}`}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-bold text-lg">{item.album?.title || 'Unknown Album'}</p>
                                    <p className="text-muted-foreground">{item.album?.artist || 'Unknown Artist'}</p>
                                    {item.label && <p className="text-sm text-gray-500">{item.label} • {item.releaseDate}</p>}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditingItem(item)}
                                      data-testid={`button-edit-item-${item.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteYearEndListItemMutation.mutate(item.id)}
                                      data-testid={`button-delete-item-${item.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>

                                {editingItemId === item.id ? (
                                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <label className="text-sm font-medium">Write-Up</label>
                                      <Textarea
                                        value={itemFormData.writeUp}
                                        onChange={(e) => setItemFormData({ ...itemFormData, writeUp: e.target.value })}
                                        placeholder="Extended review or thoughts about this album..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-sm font-medium">Standout Tracks (comma-separated)</label>
                                        <Input
                                          value={itemFormData.standoutTracks}
                                          onChange={(e) => setItemFormData({ ...itemFormData, standoutTracks: e.target.value })}
                                          placeholder="Track 1, Track 2, Track 3"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium flex items-center gap-1">
                                          <Palette className="w-3 h-3" /> Accent Color
                                        </label>
                                        <Input
                                          type="color"
                                          value={itemFormData.accentColor || '#f59e0b'}
                                          onChange={(e) => setItemFormData({ ...itemFormData, accentColor: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-sm font-medium">Label</label>
                                        <Input
                                          value={itemFormData.label}
                                          onChange={(e) => setItemFormData({ ...itemFormData, label: e.target.value })}
                                          placeholder="Record label"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Release Date</label>
                                        <Input
                                          value={itemFormData.releaseDate}
                                          onChange={(e) => setItemFormData({ ...itemFormData, releaseDate: e.target.value })}
                                          placeholder="2025-01-15"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <label className="text-sm font-medium">Spotify URL</label>
                                        <Input
                                          value={itemFormData.spotifyUrl}
                                          onChange={(e) => setItemFormData({ ...itemFormData, spotifyUrl: e.target.value })}
                                          placeholder="https://open.spotify.com/..."
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Apple Music URL</label>
                                        <Input
                                          value={itemFormData.appleMusicUrl}
                                          onChange={(e) => setItemFormData({ ...itemFormData, appleMusicUrl: e.target.value })}
                                          placeholder="https://music.apple.com/..."
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Bandcamp URL</label>
                                        <Input
                                          value={itemFormData.bandcampUrl}
                                          onChange={(e) => setItemFormData({ ...itemFormData, bandcampUrl: e.target.value })}
                                          placeholder="https://...bandcamp.com/..."
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => saveItemChanges(item.id)}
                                        disabled={updateYearEndListItemMutation.isPending}
                                      >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditingItemId(null)}>
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {item.writeUp && (
                                      <p className="text-sm text-gray-700 mt-2">{item.writeUp}</p>
                                    )}
                                    {item.standoutTracks && item.standoutTracks.length > 0 && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <Music className="w-4 h-4 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          Standout: {item.standoutTracks.join(', ')}
                                        </p>
                                      </div>
                                    )}
                                    {(item.spotifyUrl || item.appleMusicUrl || item.bandcampUrl) && (
                                      <div className="flex gap-2 mt-2">
                                        {item.spotifyUrl && (
                                          <a href={item.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Spotify
                                          </a>
                                        )}
                                        {item.appleMusicUrl && (
                                          <a href={item.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline text-sm flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Apple Music
                                          </a>
                                        )}
                                        {item.bandcampUrl && (
                                          <a href={item.bandcampUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Bandcamp
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(!selectedYearEndList?.items || selectedYearEndList.items.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No albums added yet. Add your top picks!</p>
                        </div>
                      )}
                    </div>

                    {!selectedYearEndList?.isPublished && (
                      <div className="border-t pt-4 flex gap-2">
                        <Button
                          onClick={() => publishYearEndListMutation.mutate()}
                          disabled={(selectedYearEndList?.items?.length || 0) === 0 || publishYearEndListMutation.isPending}
                          data-testid="button-publish-list"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {publishYearEndListMutation.isPending ? 'Publishing...' : 'Publish List'}
                        </Button>
                        {selectedYearEndList?.items && selectedYearEndList.items.length > 0 && (
                          <p className="text-sm text-muted-foreground self-center">
                            {selectedYearEndList.items.length} album{selectedYearEndList.items.length === 1 ? '' : 's'} ready to publish
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddAlbumDialogOpen} onOpenChange={setIsAddAlbumDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Album to Year-End List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select from accepted album suggestions to add to your year-end list.
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {suggestions.filter(s => s.status === 'accepted').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No accepted albums available.</p>
                  <p className="text-sm mt-1">Accept some album suggestions in the Team Picks tab first.</p>
                </div>
              ) : (
                suggestions.filter(s => s.status === 'accepted').map((suggestion) => {
                  const alreadyAdded = selectedYearEndList?.items?.some(i => i.suggestionId === suggestion.id);
                  return (
                    <div
                      key={suggestion.id}
                      className={`flex items-center justify-between p-3 border rounded ${alreadyAdded ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                      onClick={() => !alreadyAdded && setSelectedAlbumToAdd(suggestion)}
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.coverArtUrl && (
                          <img src={suggestion.coverArtUrl} alt="" className="w-10 h-10 rounded" />
                        )}
                        <div>
                          <p className="font-medium">{suggestion.title}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.artist}</p>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <Badge variant="secondary">Added</Badge>
                      ) : selectedAlbumToAdd?.id === suggestion.id ? (
                        <Badge>Selected</Badge>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setIsAddAlbumDialogOpen(false); setSelectedAlbumToAdd(null); }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedAlbumToAdd) {
                    addAlbumToYearEndListMutation.mutate({
                      suggestionId: selectedAlbumToAdd.id,
                      rank: (selectedYearEndList?.items?.length || 0) + 1,
                    });
                  }
                }}
                disabled={!selectedAlbumToAdd || addAlbumToYearEndListMutation.isPending}
              >
                Add to List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    <div key={note.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
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

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Suggest Album of the Month</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Album Title *</label>
              <Input
                value={submitFormData.title}
                onChange={(e) => setSubmitFormData({ ...submitFormData, title: e.target.value })}
                placeholder="e.g., Random Access Memories"
                data-testid="input-album-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Artist Name *</label>
              <Input
                value={submitFormData.artist}
                onChange={(e) => setSubmitFormData({ ...submitFormData, artist: e.target.value })}
                placeholder="e.g., Daft Punk"
                data-testid="input-artist-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Release Year (optional)</label>
              <Input
                type="number"
                value={submitFormData.releaseYear}
                onChange={(e) => setSubmitFormData({ ...submitFormData, releaseYear: e.target.value })}
                placeholder="e.g., 2013"
                data-testid="input-release-year"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Why this album? (optional)</label>
              <Textarea
                value={submitFormData.reason}
                onChange={(e) => setSubmitFormData({ ...submitFormData, reason: e.target.value })}
                placeholder="Share why this album deserves to be featured..."
                rows={3}
                data-testid="textarea-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsSubmitDialogOpen(false)}
                data-testid="button-cancel-submit"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!submitFormData.artist || !submitFormData.title) {
                    toast({ 
                      title: 'Missing information', 
                      description: 'Please provide both album title and artist name.',
                      variant: 'destructive'
                    });
                    return;
                  }
                  submitSuggestionMutation.mutate({
                    artist: submitFormData.artist,
                    title: submitFormData.title,
                    releaseYear: submitFormData.releaseYear ? parseInt(submitFormData.releaseYear) : undefined,
                    reason: submitFormData.reason || undefined,
                    suggestedBy: authData?.user || 'anonymous'
                  });
                }}
                disabled={submitSuggestionMutation.isPending || !submitFormData.artist || !submitFormData.title}
                className="bg-navy hover:bg-navy-dark text-white"
                data-testid="button-submit-suggestion"
              >
                {submitSuggestionMutation.isPending ? 'Submitting...' : 'Submit Suggestion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
