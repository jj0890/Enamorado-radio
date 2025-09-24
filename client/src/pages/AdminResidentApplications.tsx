import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Music, 
  Calendar, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ExternalLink,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResidentApplication {
  id: number;
  name: string;
  alias?: string;
  email: string;
  phone?: string;
  location?: string;
  experience?: string;
  genre?: string;
  bio?: string;
  mixUrl?: string;
  socialLinks?: any;
  availability?: string;
  showConcept?: string;
  equipment?: string;
  additionalInfo?: string;
  
  // Google Forms integration
  googleFormResponseId?: string;
  googleSheetRowNumber?: number;
  
  // Application status
  status: string;
  reviewStage?: string;
  priority?: string;
  
  // Review process
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  interviewScheduled?: string;
  trialShowDate?: string;
  approvalDate?: string;
  
  // Resident status
  isActiveResident: boolean;
  showSlot?: string;
  onboardingCompleted: boolean;
  
  createdAt: string;
  updatedAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'submitted': 'bg-blue-100 text-blue-800',
    'under_review': 'bg-yellow-100 text-yellow-800',
    'interview_scheduled': 'bg-purple-100 text-purple-800',
    'trial_approved': 'bg-indigo-100 text-indigo-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'on_hold': 'bg-gray-100 text-gray-800',
  };
  
  return (
    <Badge className={variants[status] || variants['submitted']}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const variants: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-600',
    'normal': 'bg-blue-100 text-blue-600',
    'high': 'bg-orange-100 text-orange-600',
    'urgent': 'bg-red-100 text-red-600',
  };
  
  return (
    <Badge variant="outline" className={variants[priority] || variants['normal']}>
      {priority.toUpperCase()}
    </Badge>
  );
};

export default function AdminResidentApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ResidentApplication | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [syncSpreadsheetId, setSyncSpreadsheetId] = useState('');

  // Fetch resident applications
  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/resident-applications', selectedStatus],
    queryFn: () => {
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      return fetch(`/api/resident-applications${params}`).then(res => res.json());
    }
  });

  // Update application status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      fetch(`/api/resident-applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resident-applications'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    }
  });

  // Delete application mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/resident-applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resident-applications'] });
      toast({ title: 'Application deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete application', variant: 'destructive' });
    }
  });

  // Sync from Google Sheets mutation
  const syncMutation = useMutation({
    mutationFn: (spreadsheetId: string) =>
      fetch('/api/resident-applications/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      }).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/resident-applications'] });
      toast({ 
        title: 'Sync completed', 
        description: `${data.created} created, ${data.skipped} skipped of ${data.total} total` 
      });
      setSyncSpreadsheetId('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Sync failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleStatusUpdate = (id: number, status: string, notes?: string) => {
    statusMutation.mutate({ id, status, notes });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSync = () => {
    if (!syncSpreadsheetId.trim()) {
      toast({ title: 'Please enter a spreadsheet ID', variant: 'destructive' });
      return;
    }
    syncMutation.mutate(syncSpreadsheetId.trim());
  };

  const statusCounts = applications.reduce((acc: Record<string, number>, app: ResidentApplication) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-mono text-red-500">
            RESIDENT APPLICATIONS
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-applications"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Google Sheets Sync */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Sync from Google Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
                <Input
                  id="spreadsheet-id"
                  value={syncSpreadsheetId}
                  onChange={(e) => setSyncSpreadsheetId(e.target.value)}
                  placeholder="Enter Google Sheets spreadsheet ID..."
                  data-testid="input-spreadsheet-id"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Extract from: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                </p>
              </div>
              <Button 
                onClick={handleSync} 
                disabled={syncMutation.isPending}
                data-testid="button-sync-sheets"
              >
                <Download className="w-4 h-4 mr-2" />
                {syncMutation.isPending ? 'Syncing...' : 'Sync Applications'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Filter Tabs */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
          <TabsList className="bg-white">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" data-testid="tab-submitted">
              New ({statusCounts.submitted || 0})
            </TabsTrigger>
            <TabsTrigger value="under_review" data-testid="tab-under-review">
              Under Review ({statusCounts.under_review || 0})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({statusCounts.approved || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({statusCounts.rejected || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No applications found</p>
                <p className="text-gray-400">Try syncing from Google Sheets or check your filters</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((application: ResidentApplication) => (
                  <Card key={application.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold" data-testid={`text-applicant-name-${application.id}`}>
                              {application.name}
                            </h3>
                            {application.alias && application.alias !== application.name && (
                              <Badge variant="secondary" data-testid={`badge-alias-${application.id}`}>
                                "{application.alias}"
                              </Badge>
                            )}
                            <StatusBadge status={application.status} />
                            <PriorityBadge priority={application.priority || 'normal'} />
                            {application.isActiveResident && (
                              <Badge className="bg-green-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Active Resident
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span data-testid={`text-email-${application.id}`}>{application.email}</span>
                            </div>
                            {application.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{application.phone}</span>
                              </div>
                            )}
                            {application.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{application.location}</span>
                              </div>
                            )}
                            {application.genre && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Music className="w-4 h-4" />
                                <span>{application.genre}</span>
                              </div>
                            )}
                            {application.availability && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="truncate">{application.availability}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {application.showConcept && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Show Concept:</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{application.showConcept}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setIsDetailsOpen(true);
                            }}
                            data-testid={`button-view-details-${application.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {application.mixUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.mixUrl, '_blank')}
                              data-testid={`button-view-mix-${application.id}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}

                          <Select 
                            value={application.status} 
                            onValueChange={(status) => handleStatusUpdate(application.id, status)}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-status-${application.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="trial_approved">Trial Approved</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(application.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${application.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Application Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{selectedApplication.name}</h2>
                  {selectedApplication.alias && selectedApplication.alias !== selectedApplication.name && (
                    <Badge variant="secondary">"{selectedApplication.alias}"</Badge>
                  )}
                  <StatusBadge status={selectedApplication.status} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm">{selectedApplication.email}</p>
                  </div>
                  {selectedApplication.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <p className="text-sm">{selectedApplication.phone}</p>
                    </div>
                  )}
                  {selectedApplication.location && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Location</Label>
                      <p className="text-sm">{selectedApplication.location}</p>
                    </div>
                  )}
                  {selectedApplication.genre && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Genre</Label>
                      <p className="text-sm">{selectedApplication.genre}</p>
                    </div>
                  )}
                </div>

                {selectedApplication.bio && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Bio</Label>
                    <p className="text-sm">{selectedApplication.bio}</p>
                  </div>
                )}

                {selectedApplication.experience && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Experience</Label>
                    <p className="text-sm">{selectedApplication.experience}</p>
                  </div>
                )}

                {selectedApplication.availability && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Availability</Label>
                    <p className="text-sm">{selectedApplication.availability}</p>
                  </div>
                )}

                {selectedApplication.showConcept && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Show Concept</Label>
                    <p className="text-sm">{selectedApplication.showConcept}</p>
                  </div>
                )}

                {selectedApplication.equipment && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Equipment</Label>
                    <p className="text-sm">{selectedApplication.equipment}</p>
                  </div>
                )}

                {selectedApplication.mixUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mix URL</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">{selectedApplication.mixUrl}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedApplication.mixUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedApplication.additionalInfo && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Additional Info</Label>
                    <p className="text-sm">{selectedApplication.additionalInfo}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <Label className="font-medium">Submitted</Label>
                      <p>{new Date(selectedApplication.submittedAt).toLocaleString()}</p>
                    </div>
                    {selectedApplication.reviewedAt && (
                      <div>
                        <Label className="font-medium">Reviewed</Label>
                        <p>{new Date(selectedApplication.reviewedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Notes Section */}
                <div>
                  <Label htmlFor="review-notes" className="text-sm font-medium text-gray-700">
                    Review Notes
                  </Label>
                  <Textarea
                    id="review-notes"
                    value={selectedApplication.reviewNotes || ''}
                    onChange={(e) => {
                      if (selectedApplication) {
                        setSelectedApplication({
                          ...selectedApplication,
                          reviewNotes: e.target.value
                        });
                      }
                    }}
                    placeholder="Add internal notes about this application..."
                    className="mt-1"
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => {
                      if (selectedApplication) {
                        statusMutation.mutate({
                          id: selectedApplication.id,
                          status: selectedApplication.status,
                          notes: selectedApplication.reviewNotes
                        });
                      }
                    }}
                    disabled={statusMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}