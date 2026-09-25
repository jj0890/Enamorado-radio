import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Music,
  ListMusic,
  Disc,
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  Play,
  Radio,
  Sparkles,
  AlertCircle,
  Settings
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ContentItem {
  id: number;
  type: 'mix' | 'playlist' | 'album';
  title: string;
  submitter: string;
  genre?: string;
  status: 'pending' | 'approved' | 'routed';
  submittedAt: string;
  url?: string;
  routingStatus?: {
    uploaded: boolean;
    rescanned: boolean;
    addedToPlaylist: boolean;
    azuraPlaylistName?: string;
  };
}

interface RoutingConfig {
  targetPlaylist: string;
  schedule?: {
    enabled: boolean;
    days: number[];
    startTime: string;
    endTime: string;
  };
  priority: 'high' | 'medium' | 'low';
}

export default function AdminContentCurator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [routingConfig, setRoutingConfig] = useState<RoutingConfig>({
    targetPlaylist: 'community-picks',
    priority: 'medium'
  });

  // Fetch all content types
  const { data: mixes = [] } = useQuery<ContentItem[]>({
    queryKey: ['/api/mixes', 'approved'],
  });

  const { data: playlists = [] } = useQuery<ContentItem[]>({
    queryKey: ['/api/playlists/submissions'],
  });

  const { data: albums = [] } = useQuery<ContentItem[]>({
    queryKey: ['/api/albums/suggestions'],
  });

  // Get AzuraCast playlists
  const { data: azuracastPlaylists = [] } = useQuery<any[]>({
    queryKey: ['/api/azuracast/playlists'],
  });

  // Route content to AzuraCast
  const routeToAzuracastMutation = useMutation({
    mutationFn: async (data: { contentId: number; contentType: string; config: RoutingConfig }) => {
      return apiRequest('POST', '/api/admin/route-to-azuracast', data);
    },
    onSuccess: () => {
      toast({
        title: "Content Routed",
        description: "Content has been added to AzuraCast successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Routing Failed",
        description: error.message || "Failed to route content to AzuraCast",
        variant: "destructive",
      });
    },
  });

  const handleRouteContent = () => {
    if (!selectedItem) return;

    routeToAzuracastMutation.mutate({
      contentId: selectedItem.id,
      contentType: selectedItem.type,
      config: routingConfig,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>;
      case 'routed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Radio className="w-3 h-3 mr-1" /> On Air
        </Badge>;
      default:
        return null;
    }
  };

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <Card className={selectedItem?.id === item.id ? 'border-navy border-2' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">{item.title}</CardTitle>
          {getStatusBadge(item.status)}
        </div>
        <CardDescription className="font-mono">
          by {item.submitter} {item.genre && `• ${item.genre}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {item.routingStatus && (
          <div className="text-sm space-y-1 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              {item.routingStatus.uploaded ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span>Uploaded to AzuraCast</span>
            </div>
            <div className="flex items-center gap-2">
              {item.routingStatus.rescanned ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span>Library Rescanned</span>
            </div>
            <div className="flex items-center gap-2">
              {item.routingStatus.addedToPlaylist ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span>Added to Playlist</span>
            </div>
            {item.routingStatus.azuraPlaylistName && (
              <div className="text-xs text-gray-600 mt-2">
                → {item.routingStatus.azuraPlaylistName}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {item.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(item.url, '_blank')}
            >
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}

          {item.status === 'approved' && !item.routingStatus?.addedToPlaylist && (
            <Button
              size="sm"
              onClick={() => setSelectedItem(item)}
              variant={selectedItem?.id === item.id ? 'default' : 'outline'}
            >
              <Upload className="w-4 h-4 mr-1" />
              Route to AzuraCast
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono text-navy mb-2">
              COMMUNITY CONTENT CURATOR
            </h1>
            <p className="text-gray-600 font-mono">
              Promote community submissions to AzuraCast playlists
            </p>
          </div>

          <Button variant="outline" className="font-mono">
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Curate
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Browser */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="mixes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 font-mono">
                <TabsTrigger value="mixes" className="gap-2">
                  <Music className="w-4 h-4" />
                  Mixes ({mixes.length})
                </TabsTrigger>
                <TabsTrigger value="playlists" className="gap-2">
                  <ListMusic className="w-4 h-4" />
                  Playlists ({playlists.length})
                </TabsTrigger>
                <TabsTrigger value="albums" className="gap-2">
                  <Disc className="w-4 h-4" />
                  Albums ({albums.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mixes" className="space-y-4 mt-4">
                {mixes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-mono">
                    No mixes submitted yet
                  </div>
                ) : (
                  mixes.map((mix: any) => (
                    <ContentCard
                      key={mix.id}
                      item={{
                        id: mix.id,
                        type: 'mix',
                        title: mix.title,
                        submitter: mix.name,
                        genre: mix.genre,
                        status: mix.status,
                        submittedAt: mix.createdAt,
                        url: mix.url,
                        routingStatus: mix.azuraFilePath ? {
                          uploaded: !!mix.uploadedAt,
                          rescanned: !!mix.rescannedAt,
                          addedToPlaylist: !!mix.playlistLinkedAt,
                          azuraPlaylistName: mix.azuraPlaylistName
                        } : undefined
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="playlists" className="space-y-4 mt-4">
                {playlists.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-mono">
                    No playlists submitted yet
                  </div>
                ) : (
                  playlists.map((playlist: any) => (
                    <ContentCard
                      key={playlist.id}
                      item={{
                        id: playlist.id,
                        type: 'playlist',
                        title: playlist.title,
                        submitter: playlist.submitterName,
                        genre: playlist.genre,
                        status: playlist.status || 'pending',
                        submittedAt: playlist.createdAt,
                        url: playlist.platformUrl
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="albums" className="space-y-4 mt-4">
                {albums.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-mono">
                    No albums suggested yet
                  </div>
                ) : (
                  albums.map((album: any) => (
                    <ContentCard
                      key={album.id}
                      item={{
                        id: album.id,
                        type: 'album',
                        title: `${album.title} - ${album.artist}`,
                        submitter: album.submitterName || 'Anonymous',
                        genre: album.genre,
                        status: 'approved',
                        submittedAt: album.createdAt,
                        url: album.spotifyUrl
                      }}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Routing Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="font-mono flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Routing Config
                </CardTitle>
                {selectedItem && (
                  <CardDescription className="font-mono">
                    Routing: {selectedItem.title}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {!selectedItem ? (
                  <div className="text-center py-8 text-gray-500 text-sm font-mono">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    Select content to route
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="font-mono">Target Playlist</Label>
                      <Select
                        value={routingConfig.targetPlaylist}
                        onValueChange={(value) => setRoutingConfig({ ...routingConfig, targetPlaylist: value })}
                      >
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          <SelectItem value="community-picks">Community Picks</SelectItem>
                          <SelectItem value="friday-community">Friday Community Hour</SelectItem>
                          <SelectItem value="weekend-rotation">Weekend Rotation</SelectItem>
                          <SelectItem value="new-submissions">New Submissions</SelectItem>
                          {azuracastPlaylists.map((playlist: any) => (
                            <SelectItem key={playlist.id} value={playlist.name}>
                              {playlist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-mono">Priority</Label>
                      <Select
                        value={routingConfig.priority}
                        onValueChange={(value: any) => setRoutingConfig({ ...routingConfig, priority: value })}
                      >
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="font-mono">Schedule Playback</Label>
                        <Switch
                          checked={routingConfig.schedule?.enabled}
                          onCheckedChange={(enabled) => setRoutingConfig({
                            ...routingConfig,
                            schedule: {
                              ...routingConfig.schedule,
                              enabled,
                              days: routingConfig.schedule?.days || [5], // Friday
                              startTime: routingConfig.schedule?.startTime || '18:00',
                              endTime: routingConfig.schedule?.endTime || '20:00'
                            }
                          })}
                        />
                      </div>

                      {routingConfig.schedule?.enabled && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-mono">Days</Label>
                            <div className="grid grid-cols-7 gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <Button
                                  key={idx}
                                  variant={routingConfig.schedule?.days?.includes(idx) ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-8 text-xs font-mono"
                                  onClick={() => {
                                    const days = routingConfig.schedule?.days || [];
                                    const newDays = days.includes(idx)
                                      ? days.filter(d => d !== idx)
                                      : [...days, idx];
                                    setRoutingConfig({
                                      ...routingConfig,
                                      schedule: { ...routingConfig.schedule!, days: newDays }
                                    });
                                  }}
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-mono">Start</Label>
                              <Input
                                type="time"
                                className="font-mono text-xs"
                                value={routingConfig.schedule?.startTime}
                                onChange={(e) => setRoutingConfig({
                                  ...routingConfig,
                                  schedule: { ...routingConfig.schedule!, startTime: e.target.value }
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-mono">End</Label>
                              <Input
                                type="time"
                                className="font-mono text-xs"
                                value={routingConfig.schedule?.endTime}
                                onChange={(e) => setRoutingConfig({
                                  ...routingConfig,
                                  schedule: { ...routingConfig.schedule!, endTime: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full font-mono"
                      onClick={handleRouteContent}
                      disabled={routeToAzuracastMutation.isPending}
                    >
                      {routeToAzuracastMutation.isPending ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Routing...
                        </>
                      ) : (
                        <>
                          <Radio className="w-4 h-4 mr-2" />
                          Route to AzuraCast
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
