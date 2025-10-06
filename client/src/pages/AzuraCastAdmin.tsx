import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Play, CheckCircle, AlertCircle, RefreshCw, FolderOpen, Download } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';

export default function AzuraCastAdmin() {
  const queryClient = useQueryClient();
  const [processingMixId, setProcessingMixId] = useState<number | null>(null);
  const [uploadingMixId, setUploadingMixId] = useState<number | null>(null);
  const [processingMixTitle, setProcessingMixTitle] = useState<string>('');

  // Get approved mixes ready for AzuraCast upload (filter out already uploaded)
  const { data: allApprovedMixes = [] } = useQuery({
    queryKey: ['/api/mixes', 'approved'],
    queryFn: () => fetch('/api/mixes?status=approved').then(res => res.json())
  });

  // Filter to only show mixes that haven't been uploaded yet
  const approvedMixes = allApprovedMixes.filter((mix: any) => 
    !mix.azuraFilePath || !mix.uploadedAt
  );

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

  // Get downloaded files
  const { data: downloadedFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['/api/azuracast/downloaded-files'],
    queryFn: () => fetch('/api/azuracast/downloaded-files').then(res => res.json()),
    refetchInterval: 30000
  });

  // Process mix for upload mutation
  const processMutation = useMutation({
    mutationFn: ({ mixId, mixTitle }: { mixId: number; mixTitle: string }) => {
      setProcessingMixId(mixId);
      setProcessingMixTitle(mixTitle);
      return fetch(`/api/azuracast/process-mix/${mixId}`, { method: 'POST' }).then(res => res.json());
    },
    onSuccess: () => {
      // Don't show alert immediately - let progress tracker handle completion
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      refetchFiles(); // Refresh the downloaded files list
    },
    onError: () => {
      alert("Failed to process mix for AzuraCast");
      setProcessingMixId(null);
      setProcessingMixTitle('');
    }
  });

  // Upload to AzuraCast mutation
  const uploadMutation = useMutation({
    mutationFn: (mixId: number) => {
      setUploadingMixId(mixId);
      return fetch(`/api/azuracast/upload/${mixId}`, { method: 'POST' }).then(res => res.json());
    },
    onSuccess: () => {
      alert("Mix uploaded to AzuraCast successfully!");
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      setUploadingMixId(null);
    },
    onError: () => {
      alert("Failed to upload mix to AzuraCast");
      setUploadingMixId(null);
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
          
          <p className="text-sm text-gray-600 mb-3">
            Shows approved mixes that haven't been uploaded yet. Already uploaded mixes can be managed in <a href="/admin/routing" className="text-blue-600 hover:underline">/admin/routing</a>.
          </p>
          
          {approvedMixes.length === 0 ? (
            <p className="text-gray-500 italic">No approved mixes waiting for upload. All mixes have been processed!</p>
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
                      onClick={() => processMutation.mutate({ mixId: mix.id, mixTitle: mix.title })}
                      disabled={processingMixId === mix.id}
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {processingMixId === mix.id ? 'Processing...' : 'Process'}
                    </Button>
                    
                    <Button
                      onClick={() => uploadMutation.mutate(mix.id)}
                      disabled={uploadingMixId === mix.id}
                      variant="default"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadingMixId === mix.id ? 'Uploading...' : 'Upload to AzuraCast'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Tracker */}
        {processingMixId && (
          <div className="mb-8 flex justify-center">
            <ProgressTracker 
              mixId={processingMixId}
              mixTitle={processingMixTitle}
              onComplete={() => {
                setProcessingMixId(null);
                setProcessingMixTitle('');
                // Show success message after progress completes
                setTimeout(() => {
                  alert("Mix processed successfully! Check Downloaded Files section below.");
                }, 500);
              }}
              onError={(error) => {
                setProcessingMixId(null);
                setProcessingMixTitle('');
                alert(`Processing failed: ${error}`);
              }}
            />
          </div>
        )}

        {/* Instructions and AzuraCast Links */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. <strong>Process:</strong> Creates metadata and prepares the mix for upload</p>
              <p>2. <strong>Manual Step:</strong> Download the audio as MP3 and place in the temp directory</p>
              <p>3. <strong>Upload:</strong> Automatically uploads MP3 to AzuraCast via SFTP and adds to rotation</p>
              <p>4. <strong>Result:</strong> Mix becomes available in your AzuraCast station's auto-playlist</p>
            </div>
          </div>

          {/* Downloaded Files Browser */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3">Downloaded Files</h3>
            <div className="space-y-3">
              <div className="text-sm text-yellow-800">
                <p><strong>Directory:</strong> <code className="bg-yellow-100 px-2 py-1 rounded text-xs">{downloadedFiles?.directory || '/home/runner/workspace/temp_audio/'}</code></p>
              </div>
              
              {downloadedFiles?.files?.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-900">Files ({downloadedFiles.files.length}):</h4>
                  {downloadedFiles.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB • Modified: {new Date(file.modified).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            link.click();
                          }}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-yellow-700">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{downloadedFiles?.message || 'No files downloaded yet'}</p>
                  <p className="text-xs">Files will appear here after processing mixes</p>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchFiles()}
                className="bg-white hover:bg-yellow-50 border-yellow-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh Files
              </Button>
            </div>
          </div>

          {/* Direct AzuraCast Links */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">View Uploaded Files</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://24.199.109.18/station/1/files/Approved%20Mixes', '_blank')}
                className="bg-white hover:bg-green-50 border-green-300"
              >
                📁 View Approved Mixes in AzuraCast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://24.199.109.18/public/enamorado_radio', '_blank')}
                className="bg-white hover:bg-green-50 border-green-300"
              >
                📻 Public Player
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('http://24.199.109.18/station/1/', '_blank')}
                className="bg-white hover:bg-green-50 border-green-300"
              >
                ⚙️ Station Dashboard
              </Button>
            </div>
            <p className="text-sm text-green-700 mt-2">
              After processing, your files will appear in the Media Files section under "Community Mixes" folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}