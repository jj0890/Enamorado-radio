import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  Music,
  Clock,
  ExternalLink,
  Radio
} from "lucide-react";
import { useState, useEffect } from "react";

interface QueuedSong {
  id: number;
  submitterName: string;
  songTitle: string;
  artistName: string;
  albumName?: string;
  genre: string;
  platform: string;
  platformUrl: string;
  metadata?: string;
  queuePosition: number;
  playbackStatus: 'queued' | 'playing' | 'played';
  currentlyPlaying: boolean;
  submittedAt: string;
  approvedAt: string;
  approvedBy: string;
}

export default function AdminQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queuedSongs = [], isLoading } = useQuery({
    queryKey: ['/api/admin/queue'],
  });

  const { data: currentlyPlaying } = useQuery({
    queryKey: ['/api/admin/currently-playing'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  const updatePlaybackMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'play' | 'played' | 'skip' }) => {
      return apiRequest('PATCH', `/api/admin/queue/${id}/playback`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currently-playing'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newPosition }: { id: number; newPosition: number }) => {
      return apiRequest('PATCH', `/api/admin/queue/${id}/position`, { newPosition });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/queue'] });
      toast({
        title: "Queue Updated",
        description: "Song position has been updated successfully.",
      });
    },
  });

  const parseMetadata = (metadataString?: string) => {
    try {
      return metadataString ? JSON.parse(metadataString) : null;
    } catch {
      return null;
    }
  };

  const handlePlaybackAction = (id: number, action: 'play' | 'played' | 'skip') => {
    updatePlaybackMutation.mutate({ id, action });
    
    let message = '';
    switch (action) {
      case 'play':
        message = 'Song marked as currently playing';
        break;
      case 'played':
        message = 'Song marked as played';
        break;
      case 'skip':
        message = 'Song skipped in queue';
        break;
    }
    
    toast({
      title: "Playback Updated",
      description: message,
    });
  };

  const moveInQueue = (id: number, direction: 'up' | 'down') => {
    const song = queuedSongs.find((s: QueuedSong) => s.id === id);
    if (!song) return;

    const newPosition = direction === 'up' 
      ? Math.max(1, song.queuePosition - 1)
      : song.queuePosition + 1;

    reorderMutation.mutate({ id, newPosition });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-mono">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold text-gray-900 mb-2">Radio Queue</h1>
          <p className="text-gray-600 font-mono">
            Manage your live radio playlist and track currently playing songs
          </p>
        </div>

        {/* Currently Playing Section */}
        {currentlyPlaying && (
          <Card className="mb-8 border-navy border-2">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-600 font-mono">
                <Radio className="w-5 h-5" />
                NOW PLAYING LIVE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-mono text-gray-900">
                    {currentlyPlaying.songTitle}
                  </h3>
                  <p className="text-lg text-gray-700 font-mono">
                    by {currentlyPlaying.artistName}
                  </p>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    Suggested by {currentlyPlaying.submitterName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePlaybackAction(currentlyPlaying.id, 'played')}
                    className="bg-green-600 hover:bg-green-700 font-mono"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Played
                  </Button>
                  <Button
                    onClick={() => handlePlaybackAction(currentlyPlaying.id, 'skip')}
                    variant="outline"
                    className="font-mono"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {queuedSongs.filter((s: QueuedSong) => s.playbackStatus === 'queued').length}
              </div>
              <div className="text-sm text-gray-600 font-mono">Songs in Queue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {queuedSongs.filter((s: QueuedSong) => s.playbackStatus === 'played').length}
              </div>
              <div className="text-sm text-gray-600 font-mono">Songs Played</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {queuedSongs.filter((s: QueuedSong) => s.currentlyPlaying).length}
              </div>
              <div className="text-sm text-gray-600 font-mono">Currently Playing</div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-mono text-gray-900 mb-4">Up Next</h2>
          
          {queuedSongs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-mono font-semibold text-gray-900 mb-2">Queue is Empty</h3>
                <p className="text-gray-600">Approve some song submissions to build your playlist.</p>
              </CardContent>
            </Card>
          ) : (
            queuedSongs
              .filter((song: QueuedSong) => song.playbackStatus === 'queued')
              .sort((a: QueuedSong, b: QueuedSong) => a.queuePosition - b.queuePosition)
              .map((song: QueuedSong) => {
                const metadata = parseMetadata(song.metadata);
                
                return (
                  <Card key={song.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-blue-600 font-mono">
                              #{song.queuePosition}
                            </span>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveInQueue(song.id, 'up')}
                                disabled={song.queuePosition === 1}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveInQueue(song.id, 'down')}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            {metadata?.imageUrl && (
                              <img 
                                src={metadata.imageUrl} 
                                alt={`${song.songTitle} artwork`}
                                className="w-16 h-16 rounded object-cover mr-4"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-bold font-mono text-gray-900">
                              {song.songTitle}
                            </h3>
                            <p className="text-gray-700 font-mono">by {song.artistName}</p>
                            {song.albumName && (
                              <p className="text-sm text-gray-500 font-mono">
                                from {song.albumName}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="font-mono">
                                {song.genre}
                              </Badge>
                              <span className="text-xs text-gray-500 font-mono">
                                Suggested by {song.submitterName}
                              </span>
                              {metadata?.duration && (
                                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handlePlaybackAction(song.id, 'play')}
                            className="bg-navy hover:bg-navy-dark font-mono"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play Now
                          </Button>
                          <Button
                            onClick={() => handlePlaybackAction(song.id, 'played')}
                            variant="outline"
                            className="font-mono"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark Played
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={song.platformUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-mono"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>

        {/* Recently Played */}
        <div className="mt-12">
          <h2 className="text-xl font-bold font-mono text-gray-900 mb-4">Recently Played</h2>
          <div className="space-y-2">
            {queuedSongs
              .filter((song: QueuedSong) => song.playbackStatus === 'played')
              .slice(-5)
              .reverse()
              .map((song: QueuedSong) => (
                <div key={song.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-mono font-semibold text-gray-900">
                      {song.songTitle}
                    </span>
                    <span className="text-gray-600 font-mono ml-2">
                      by {song.artistName}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    Played
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}