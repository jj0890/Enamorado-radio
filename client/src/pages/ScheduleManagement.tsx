import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, Clock, CalendarCheck, FileAudio, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EpisodeSubmission } from '@shared/schema';

interface ScheduleDialogProps {
  episode: EpisodeSubmission;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ScheduleDialog({ episode, isOpen, onClose, onSuccess }: ScheduleDialogProps) {
  const { toast } = useToast();
  const [airDate, setAirDate] = useState('');
  const [airTime, setAirTime] = useState('');

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const scheduledDateTime = `${airDate}T${airTime}`;
      return await apiRequest('PATCH', `/api/admin/episode-submissions/${episode.id}`, {
        status: 'scheduled',
        scheduledAirDate: new Date(scheduledDateTime).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/episode-submissions'] });
      toast({
        title: 'Episode Scheduled',
        description: `"${episode.title}" is scheduled to air on ${new Date(`${airDate}T${airTime}`).toLocaleString()}.`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to schedule episode.',
        variant: 'destructive',
      });
    },
  });

  const handleSchedule = () => {
    if (!airDate || !airTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate that scheduled time is in the future
    const scheduledDateTime = new Date(`${airDate}T${airTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      toast({
        title: 'Invalid Air Date',
        description: 'Air date must be in the future. Please select a later date/time.',
        variant: 'destructive',
      });
      return;
    }
    
    scheduleMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="dialog-schedule-episode">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-mono">Schedule Episode</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-dialog">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <strong>{episode.title}</strong>
            </p>
            <p className="text-xs text-gray-500">
              by {episode.residentName}
              {episode.seriesTitle && ` • ${episode.seriesTitle}`}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="air-date">Air Date</Label>
              <Input
                id="air-date"
                type="date"
                value={airDate}
                onChange={(e) => setAirDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-air-date"
              />
            </div>

            <div>
              <Label htmlFor="air-time">Air Time</Label>
              <Input
                id="air-time"
                type="time"
                value={airTime}
                onChange={(e) => setAirTime(e.target.value)}
                data-testid="input-air-time"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={handleSchedule}
              disabled={scheduleMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Episode'}
            </Button>
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-schedule">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleManagement() {
  const { toast } = useToast();
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'approved' | 'scheduled'>('approved');

  const { data: approvedEpisodes = [], isLoading: approvedLoading } = useQuery<EpisodeSubmission[]>({
    queryKey: ['/api/admin/episode-submissions', { status: 'approved' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/episode-submissions?status=approved');
      if (!response.ok) throw new Error('Failed to fetch approved episodes');
      return response.json();
    },
  });

  const { data: scheduledEpisodes = [], isLoading: scheduledLoading } = useQuery<EpisodeSubmission[]>({
    queryKey: ['/api/admin/episode-submissions', { status: 'scheduled' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/episode-submissions?status=scheduled');
      if (!response.ok) throw new Error('Failed to fetch scheduled episodes');
      return response.json();
    },
  });

  const unscheduleMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      return await apiRequest('PATCH', `/api/admin/episode-submissions/${episodeId}`, {
        status: 'approved',
        scheduledAirDate: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/episode-submissions'] });
      toast({
        title: 'Episode Unscheduled',
        description: 'Episode moved back to approved queue.',
      });
    },
  });

  const handleScheduleClick = (episode: EpisodeSubmission) => {
    setSelectedEpisode(episode);
  };

  const handleUnschedule = (episode: EpisodeSubmission) => {
    if (confirm(`Remove "${episode.title}" from the schedule?`)) {
      unscheduleMutation.mutate(episode.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono mb-2 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-red-500" />
            Schedule Management
          </h1>
          <p className="text-gray-600">
            Manage episode air dates and programming schedule
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'approved' ? 'default' : 'outline'}
            onClick={() => setActiveTab('approved')}
            data-testid="tab-approved"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved ({approvedEpisodes.length})
          </Button>
          <Button
            variant={activeTab === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setActiveTab('scheduled')}
            data-testid="tab-scheduled"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Scheduled ({scheduledEpisodes.length})
          </Button>
        </div>

        {/* Approved Episodes */}
        {activeTab === 'approved' && (
          <Card data-testid="card-approved-episodes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approved Episodes Ready to Schedule
              </CardTitle>
              <CardDescription>
                These episodes have been approved and are waiting for air date assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : approvedEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {approvedEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      data-testid={`approved-episode-${episode.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{episode.title}</h4>
                        {episode.seriesTitle && (
                          <p className="text-xs text-gray-500">
                            {episode.seriesTitle}
                            {episode.episodeNumber && ` #${episode.episodeNumber}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          by {episode.residentName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Approved {episode.reviewedAt && new Date(episode.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleScheduleClick(episode)}
                          data-testid={`button-schedule-${episode.id}`}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileAudio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No approved episodes waiting to be scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scheduled Episodes */}
        {activeTab === 'scheduled' && (
          <Card data-testid="card-scheduled-episodes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                Scheduled Episodes
              </CardTitle>
              <CardDescription>
                Episodes with assigned air dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : scheduledEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {scheduledEpisodes
                    .sort((a, b) => {
                      const dateA = a.scheduledAirDate ? new Date(a.scheduledAirDate).getTime() : 0;
                      const dateB = b.scheduledAirDate ? new Date(b.scheduledAirDate).getTime() : 0;
                      return dateA - dateB;
                    })
                    .map((episode) => (
                      <div
                        key={episode.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`scheduled-episode-${episode.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{episode.title}</h4>
                          {episode.seriesTitle && (
                            <p className="text-xs text-gray-500">
                              {episode.seriesTitle}
                              {episode.episodeNumber && ` #${episode.episodeNumber}`}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            by {episode.residentName}
                          </p>
                          {episode.scheduledAirDate && (
                            <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Airs: {new Date(episode.scheduledAirDate).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <Badge variant="default" className="flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3" />
                            Scheduled
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnschedule(episode)}
                            disabled={unscheduleMutation.isPending}
                            data-testid={`button-unschedule-${episode.id}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Unschedule
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No episodes scheduled yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Schedule Dialog */}
        {selectedEpisode && (
          <ScheduleDialog
            episode={selectedEpisode}
            isOpen={!!selectedEpisode}
            onClose={() => setSelectedEpisode(null)}
            onSuccess={() => setSelectedEpisode(null)}
          />
        )}
      </div>
    </div>
  );
}
