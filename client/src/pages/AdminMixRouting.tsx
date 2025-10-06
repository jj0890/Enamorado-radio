import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, Upload, Play, Settings, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminMixRouting() {
  const queryClient = useQueryClient();
  const [selectedMix, setSelectedMix] = useState<any>(null);

  // Get pending mixes
  const { data: pendingMixes = [] } = useQuery({
    queryKey: ['/api/mixes', 'pending'],
    queryFn: () => fetch('/api/mixes?status=pending').then(res => res.json())
  });

  // Get approved mixes for routing management
  const { data: approvedMixes = [] } = useQuery({
    queryKey: ['/api/mixes', 'approved'],
    queryFn: () => fetch('/api/mixes?status=approved').then(res => res.json())
  });

  // Approve mix with routing
  const approveMutation = useMutation({
    mutationFn: (data: any) => 
      fetch(`/api/mixes/${data.mixId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      alert('Mix approved and routed successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      setSelectedMix(null);
    }
  });

  // Update routing for approved mix
  const updateRoutingMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/mixes/${data.mixId}/routing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      alert('Mix routing updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    }
  });

  // Retry routing
  const retryMutation = useMutation({
    mutationFn: (mixId: number) =>
      fetch(`/api/mixes/${mixId}/retry`, { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      alert('Mix routing retried successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    }
  });

  const handleApprove = (mix: any, routing: any) => {
    approveMutation.mutate({
      mixId: mix.id,
      ...routing
    });
  };

  const RoutingStatus = ({ mix }: { mix: any }) => {
    const hasUploaded = mix.azuraFilePath && mix.uploadedAt;
    const hasRescanned = mix.rescannedAt;
    const hasPlaylist = mix.playlistLinkedAt;

    if (!mix.pushToAzura) {
      return <span className="text-blue-600">Website only</span>;
    }

    if (hasPlaylist) {
      return <span className="text-green-600 flex items-center gap-1">
        <CheckCircle className="w-4 h-4" /> Complete
      </span>;
    }

    if (hasRescanned) {
      return <span className="text-yellow-600 flex items-center gap-1">
        <Clock className="w-4 h-4" /> Adding to playlist...
      </span>;
    }

    if (hasUploaded) {
      return <span className="text-yellow-600 flex items-center gap-1">
        <Clock className="w-4 h-4" /> Rescanning library...
      </span>;
    }

    return <span className="text-orange-600 flex items-center gap-1">
      <Upload className="w-4 h-4" /> Processing...
    </span>;
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 font-mono text-red-500">
          MIX ROUTING CONTROL
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Approvals */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Pending Approvals ({pendingMixes.length})
            </h2>
            
            <div className="space-y-4">
              {pendingMixes.map((mix: any) => (
                <Card key={mix.id} className="border-l-4 border-l-orange-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{mix.title}</CardTitle>
                    <CardDescription>by {mix.name} • {mix.genre}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{mix.about}</p>
                    
                    {selectedMix?.id === mix.id ? (
                      <RoutingControls 
                        mix={mix} 
                        onApprove={handleApprove}
                        onCancel={() => setSelectedMix(null)}
                        isLoading={approveMutation.isPending}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(mix.url, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button 
                          onClick={() => setSelectedMix(mix)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Approve & Route
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {pendingMixes.length === 0 && (
                <p className="text-gray-500 italic">No mixes pending approval</p>
              )}
            </div>
          </div>

          {/* Approved Mixes - Routing Status */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Approved Mixes ({approvedMixes.length})
            </h2>
            
            <div className="space-y-4">
              {approvedMixes.map((mix: any) => (
                <Card key={mix.id} className="border-l-4 border-l-green-400">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{mix.title}</CardTitle>
                        <CardDescription>by {mix.name}</CardDescription>
                      </div>
                      <RoutingStatus mix={mix} />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Website:</span>{' '}
                        {mix.status === 'featured' ? '✅ Featured' : 
                         mix.status === 'approved' ? '✅ Visible' : '❌ Hidden'}
                      </div>
                      <div>
                        <span className="font-medium">AzuraCast:</span>{' '}
                        {mix.azuraFilePath && mix.uploadedAt 
                          ? '✅ Uploaded' 
                          : mix.pushToAzura 
                            ? '⏳ Pending' 
                            : '❌ Disabled'}
                      </div>
                      {mix.targetPlaylist && (
                        <div className="col-span-2">
                          <span className="font-medium">Playlist:</span> {mix.targetPlaylist}
                        </div>
                      )}
                      {mix.azuraFilePath && (
                        <div className="col-span-2 text-xs text-gray-500">
                          File: {mix.azuraFilePath}
                          {mix.uploadedAt && <span className="ml-2">• Uploaded {new Date(mix.uploadedAt).toLocaleDateString()}</span>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    {selectedMix?.id === mix.id ? (
                      <UpdateRoutingControls 
                        mix={mix} 
                        onUpdate={(updatedMix) => {
                          // Force immediate refetch to bypass HTTP caching
                          queryClient.refetchQueries({ queryKey: ['/api/mixes', 'approved'] });
                          queryClient.refetchQueries({ queryKey: ['/api/mixes', 'pending'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
                          setSelectedMix(null);
                        }}
                        onCancel={() => setSelectedMix(null)}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMix(mix)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Edit Routing
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryMutation.mutate(mix.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Retry
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(mix.url, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {approvedMixes.length === 0 && (
                <p className="text-gray-500 italic">No approved mixes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateRoutingControls({ 
  mix, 
  onUpdate, 
  onCancel 
}: { 
  mix: any; 
  onUpdate: (mix: any) => void; 
  onCancel: () => void; 
}) {
  const [featureOnSite, setFeatureOnSite] = useState(mix.featureOnSite || false);
  const [pushToAzura, setPushToAzura] = useState(mix.pushToAzura || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mixes/${mix.id}/routing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureOnSite,
          pushToAzura
        })
      });
      
      if (response.ok) {
        onUpdate({ ...mix, featureOnSite, pushToAzura });
      } else {
        alert('Failed to update routing');
      }
    } catch (error) {
      alert('Error updating routing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg">Update Routing Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Website Feature Toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="update-feature-site" 
            checked={featureOnSite} 
            onCheckedChange={setFeatureOnSite}
          />
          <Label htmlFor="update-feature-site" className="font-medium">
            🌐 Feature on Website
          </Label>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          Show in Latest, Mixes page, and featured collections
        </p>

        {/* AzuraCast Toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="update-push-azura" 
            checked={pushToAzura} 
            onCheckedChange={setPushToAzura}
          />
          <Label htmlFor="update-push-azura" className="font-medium">
            📻 Send to AzuraCast Radio
          </Label>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          {mix.azuraFilePath && mix.uploadedAt 
            ? '✅ Already uploaded to AzuraCast radio library'
            : 'Automatically process and upload to radio library (or use /admin/azuracast for manual control)'}
        </p>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Updating...' : 'Update Routing'}
        </Button>
        
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}

function RoutingControls({ 
  mix, 
  onApprove, 
  onCancel, 
  isLoading 
}: { 
  mix: any; 
  onApprove: (mix: any, routing: any) => void; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const [featureOnSite, setFeatureOnSite] = useState(true);
  const [pushToAzura, setPushToAzura] = useState(false);
  const [targetPlaylist, setTargetPlaylist] = useState('General Rotation');
  const [airDate, setAirDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onApprove(mix, {
      featureOnSite,
      pushToAzura,
      targetPlaylist,
      airDate: airDate || undefined,
      notes
    });
  };

  return (
    <Card className="border-2 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-lg text-red-700">Routing Configuration</CardTitle>
        <CardDescription>Choose where this mix should go after approval</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Website Feature Toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="feature-site" 
            checked={featureOnSite} 
            onCheckedChange={setFeatureOnSite}
          />
          <Label htmlFor="feature-site" className="font-medium">
            📄 Feature on Website
          </Label>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          Show in Latest, Mixes page, and featured collections
        </p>

        {/* AzuraCast Toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="push-azura" 
            checked={pushToAzura} 
            onCheckedChange={setPushToAzura}
          />
          <Label htmlFor="push-azura" className="font-medium">
            📻 Send to AzuraCast Radio
          </Label>
        </div>
        <p className="text-sm text-gray-600 ml-6">
          Upload to radio library and add to rotation
        </p>

        {/* AzuraCast Options */}
        {pushToAzura && (
          <div className="ml-6 space-y-3 p-3 bg-blue-50 rounded">
            <div>
              <Label htmlFor="playlist">Target Playlist</Label>
              <Select value={targetPlaylist} onValueChange={setTargetPlaylist}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Rotation">General Rotation</SelectItem>
                  <SelectItem value="Community Mixes">Community Mixes</SelectItem>
                  <SelectItem value="Featured">Featured</SelectItem>
                  <SelectItem value="Late Night">Late Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="airDate">First Air Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={airDate}
                onChange={(e) => setAirDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <Label htmlFor="notes">Admin Notes (Optional)</Label>
          <Textarea
            placeholder="Internal notes about this approval..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Processing...' : 'Approve & Route'}
        </Button>
        
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}