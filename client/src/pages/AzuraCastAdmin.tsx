import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Upload, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AzuraCastAdmin() {
  const queryClient = useQueryClient();

  // Get approved mixes ready for AzuraCast upload
  const { data: approvedMixes = [] } = useQuery({
    queryKey: ['/api/mixes', 'approved'],
    queryFn: () => fetch('/api/mixes?status=approved').then(res => res.json())
  });

  // Get AzuraCast connection status
  const { data: azuracastStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/azuracast/test'],
    queryFn: () => fetch('/api/azuracast/test').then(res => res.json()),
    refetchInterval: 30000
  });

  // Get now playing from AzuraCast
  const { data: nowPlaying } = useQuery({
    queryKey: ['/api/azuracast/nowplaying'],
    queryFn: () => fetch('/api/azuracast/nowplaying').then(res => res.json()),
    refetchInterval: 15000
  });

  // Process mix for upload mutation
  const processMutation = useMutation({
    mutationFn: (mixId: number) => 
      fetch(`/api/azuracast/process-mix/${mixId}`, { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      alert("Mix processed successfully! Check temp directory for next steps.");
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    },
    onError: () => {
      alert("Failed to process mix for AzuraCast");
    }
  });

  // Upload to AzuraCast mutation
  const uploadMutation = useMutation({
    mutationFn: (mixId: number) => 
      fetch(`/api/azuracast/upload/${mixId}`, { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      alert("Mix uploaded to AzuraCast successfully!");
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    },
    onError: () => {
      alert("Failed to upload mix to AzuraCast");
    }
  });

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 font-mono text-red-500">
          AZURACAST INTEGRATION
        </h1>

        {/* Connection Status */}
        <div className="mb-8 p-4 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Testing connection...</span>
            </div>
          ) : azuracastStatus?.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Connected to AzuraCast</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Stream: {azuracastStatus.streamUrl}</p>
                <p>Public Player: {azuracastStatus.publicPlayerUrl}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Connection failed</span>
            </div>
          )}
        </div>

        {/* Now Playing */}
        {nowPlaying && (
          <div className="mb-8 p-4 bg-white rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Now Playing</h2>
            <div className="flex items-center gap-3">
              {nowPlaying.now_playing?.song?.art && (
                <img 
                  src={nowPlaying.now_playing.song.art} 
                  alt="Now playing"
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div>
                <h3 className="font-medium">
                  {nowPlaying.now_playing?.song?.title || 'Station Offline'}
                </h3>
                <p className="text-gray-600">
                  {nowPlaying.now_playing?.song?.artist || 'No artist'}
                </p>
                <p className="text-sm text-gray-500">
                  {nowPlaying.listeners?.current || 0} listeners
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approved Mixes for Upload */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Approved Mixes Ready for AzuraCast ({approvedMixes.length})
          </h2>
          
          {approvedMixes.length === 0 ? (
            <p className="text-gray-500 italic">No approved mixes waiting for upload</p>
          ) : (
            <div className="space-y-4">
              {approvedMixes.map((mix: any) => (
                <div key={mix.id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mix.metadata?.thumbnail && (
                      <img 
                        src={mix.metadata.thumbnail} 
                        alt={mix.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{mix.title}</h3>
                      <p className="text-gray-600">{mix.name}</p>
                      <p className="text-sm text-gray-500">{mix.genre}</p>
                    </div>
                  </div>
                  
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
                      onClick={() => processMutation.mutate(mix.id)}
                      disabled={processMutation.isPending}
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {processMutation.isPending ? 'Processing...' : 'Process'}
                    </Button>
                    
                    <Button
                      onClick={() => uploadMutation.mutate(mix.id)}
                      disabled={uploadMutation.isPending}
                      variant="default"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload to AzuraCast'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. <strong>Process:</strong> Creates metadata and prepares the mix for upload</p>
            <p>2. <strong>Manual Step:</strong> Download the audio as MP3 and place in the temp directory</p>
            <p>3. <strong>Upload:</strong> Automatically uploads MP3 to AzuraCast via SFTP and adds to rotation</p>
            <p>4. <strong>Result:</strong> Mix becomes available in your AzuraCast station's auto-playlist</p>
          </div>
        </div>
      </div>
    </div>
  );
}