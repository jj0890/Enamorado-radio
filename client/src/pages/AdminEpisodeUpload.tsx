import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, Radio, Clock, CheckCircle, AlertCircle, RefreshCw, Wifi, HardDrive, Radio as RadioIcon } from 'lucide-react';

type UploadStage = 'idle' | 'uploading' | 'connecting' | 'transferring' | 'rescanning' | 'completed' | 'failed';

export default function AdminEpisodeUpload() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadError, setUploadError] = useState<{ message: string; retryable: boolean; episodeId?: number } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    showSlug: '',
    audioFile: null as File | null,
    artworkFile: null as File | null,
    airDate: '',
    tags: '',
    featureOnHome: false,
    artworkUrl: '',
    scheduleImmediate: false,
    scheduledTime: ''
  });

  // Upload episode mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        setUploadError(null);
        
        // Stage 1: Uploading to server
        setUploadStage('uploading');
        setUploadProgress('Uploading files to server...');
        
        console.log('🎵 Starting episode upload...');
        
        const response = await fetch('/api/admin/episode/upload', {
          method: 'POST',
          body: data
        });
        
        console.log('📡 Upload response received:', response.status);
        
        const result = await response.json();
        console.log('📦 Upload result:', result);
        
        if (!response.ok) {
          console.error('❌ Upload failed:', result);
          throw { 
            ...result, 
            statusCode: response.status 
          };
        }
        
        // Stage 2: Connecting to AzuraCast
        setUploadStage('connecting');
        setUploadProgress('Connecting to AzuraCast SFTP...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
        
        // Stage 3: Transferring audio file
        setUploadStage('transferring');
        setUploadProgress('Transferring audio file...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
        
        // Stage 4: Rescanning library
        setUploadStage('rescanning');
        setUploadProgress('Updating media library...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
        
        console.log('✅ Upload completed successfully!');
        return result;
      } catch (error) {
        console.error('💥 Upload mutation error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      setUploadStage('completed');
      setUploadProgress('✅ Episode uploaded successfully!');
      setUploadError(null);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          title: '',
          showSlug: '',
          audioFile: null,
          artworkFile: null,
          airDate: '',
          tags: '',
          featureOnHome: false,
          artworkUrl: '',
          scheduleImmediate: false,
          scheduledTime: ''
        });
        
        // Clear file inputs
        const audioInput = document.getElementById('audioFile') as HTMLInputElement;
        if (audioInput) audioInput.value = '';
        const artworkInput = document.getElementById('artworkFile') as HTMLInputElement;
        if (artworkInput) artworkInput.value = '';
        
        setUploadStage('idle');
        setUploadProgress('');
      }, 3000);
      
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
    },
    onError: (error: any) => {
      setUploadStage('failed');
      setUploadError({
        message: error.message || 'Upload failed',
        retryable: error.retryable !== false,
        episodeId: error.episodeId
      });
      setUploadProgress(`❌ Upload failed: ${error.message}`);
      console.error('Upload error:', error);
    }
  });

  // Schedule episode mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ episodeId, startTime }: { episodeId: number; startTime: string }) => {
      const response = await fetch(`/api/admin/episode/${episodeId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Scheduling failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      alert('Episode scheduled successfully!');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.audioFile) {
      alert('Please select an audio file');
      return;
    }

    if (!formData.title || !formData.showSlug) {
      alert('Please fill in all required fields');
      return;
    }

    const data = new FormData();
    data.append('audioFile', formData.audioFile);
    if (formData.artworkFile) {
      data.append('artworkFile', formData.artworkFile);
    }
    data.append('title', formData.title);
    data.append('showSlug', formData.showSlug);
    data.append('airDate', formData.airDate || new Date().toISOString());
    data.append('tags', formData.tags);
    data.append('featureOnHome', formData.featureOnHome.toString());
    data.append('artworkUrl', formData.artworkUrl);
    data.append('showId', '1'); // Default show ID

    setUploadProgress('Starting upload...');
    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, audioFile: file }));
    }
  };

  const getStatusIcon = () => {
    if (uploadMutation.isPending) return <Clock className="w-4 h-4 animate-spin" />;
    if (uploadMutation.isError) return <AlertCircle className="w-4 h-4 text-navy" />;
    if (uploadMutation.isSuccess) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Upload className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 font-mono text-navy">
          EPISODE UPLOAD & SCHEDULING
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Upload New Episode
              </CardTitle>
              <CardDescription>
                Upload audio files directly to AzuraCast for live streaming
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION: Core Episode Details */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="font-mono uppercase text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                    Core Episode Details
                  </h3>
                  
                  {/* Audio File */}
                  <div>
                    <Label htmlFor="audioFile">Audio File *</Label>
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*,.mp3"
                      onChange={handleFileChange}
                      className="mt-1"
                      required
                    />
                    {formData.audioFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Selected: {formData.audioFile.name} ({(formData.audioFile.size / 1024 / 1024).toFixed(1)} MB)
                      </p>
                    )}
                  </div>

                  {/* Episode Title */}
                  <div>
                    <Label htmlFor="title">Episode Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Late Night Sessions #42"
                      className="mt-1"
                      required
                    />
                  </div>

                  {/* Show Slug */}
                  <div>
                    <Label htmlFor="showSlug">Show Slug (for file organization) *</Label>
                    <Input
                      id="showSlug"
                      type="text"
                      value={formData.showSlug}
                      onChange={(e) => {
                        // Auto-convert to slug format (lowercase, hyphens)
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setFormData(prev => ({ ...prev, showSlug: slug }));
                      }}
                      placeholder="e.g., footwork-fridays"
                      required
                      data-testid="input-showSlug"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used for file organization and playlists. Letters, numbers, and hyphens only.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold w-full">Quick suggestions:</p>
                      {['footwork-fridays', 'late-night-sessions', 'community-showcase', 'resident-spotlight', 'guest-mix', 'deep-cuts'].map(slug => (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, showSlug: slug }))}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          data-testid={`suggest-${slug}`}
                        >
                          {slug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION: Metadata */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="font-mono uppercase text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                    Metadata
                  </h3>
                  
                  {/* Air Date */}
                  <div>
                    <Label htmlFor="airDate">Air Date</Label>
                    <Input
                      id="airDate"
                      type="datetime-local"
                      value={formData.airDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, airDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="house, techno, ambient"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate tags with commas</p>
                  </div>
                </div>

                {/* SECTION: Artwork */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="font-mono uppercase text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                    Episode Artwork
                  </h3>
                  
                  {/* Artwork File Upload */}
                  <div>
                    <Label htmlFor="artworkFile" className="text-sm text-gray-600 dark:text-gray-400">Upload Image File</Label>
                    <Input
                      id="artworkFile"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, artworkFile: file, artworkUrl: '' }));
                        }
                      }}
                      className="mt-1"
                    />
                    {formData.artworkFile && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        ✓ Selected: {formData.artworkFile.name}
                      </p>
                    )}
                  </div>

                  <div className="text-center text-xs text-gray-500 dark:text-gray-400">— OR —</div>

                  {/* Artwork URL */}
                  <div>
                    <Label htmlFor="artworkUrl" className="text-sm text-gray-600 dark:text-gray-400">Artwork URL</Label>
                    <Input
                      id="artworkUrl"
                      type="url"
                      value={formData.artworkUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, artworkUrl: e.target.value, artworkFile: null }))}
                      placeholder="https://example.com/artwork.jpg"
                      className="mt-1"
                      disabled={!!formData.artworkFile}
                    />
                    {formData.artworkUrl && !formData.artworkFile && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Using URL: {formData.artworkUrl.substring(0, 40)}...
                      </p>
                    )}
                  </div>
                </div>

                {/* SECTION: Display Options */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="font-mono uppercase text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                    Display Options
                  </h3>
                  
                  {/* Feature on Homepage */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featureOnHome"
                        checked={formData.featureOnHome}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featureOnHome: checked }))}
                      />
                      <Label htmlFor="featureOnHome">Feature on Homepage</Label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
                      If enabled, this episode will appear in the homepage banner rotation
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {(uploadStage !== 'idle' && uploadStage !== 'failed') && (
                  <div className="space-y-2">
                    <Progress 
                      value={
                        uploadStage === 'uploading' ? 33 :
                        uploadStage === 'connecting' ? 50 :
                        uploadStage === 'transferring' ? 75 :
                        uploadStage === 'rescanning' ? 90 :
                        100
                      } 
                      className="h-2"
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {uploadStage === 'uploading' && (
                        <>
                          <HardDrive className="w-4 h-4 animate-pulse" />
                          <span>Uploading files to server...</span>
                        </>
                      )}
                      {uploadStage === 'connecting' && (
                        <>
                          <Wifi className="w-4 h-4 animate-pulse" />
                          <span>Connecting to AzuraCast...</span>
                        </>
                      )}
                      {uploadStage === 'transferring' && (
                        <>
                          <Upload className="w-4 h-4 animate-pulse" />
                          <span>Transferring audio file...</span>
                        </>
                      )}
                      {uploadStage === 'rescanning' && (
                        <>
                          <RadioIcon className="w-4 h-4 animate-spin" />
                          <span>Updating media library...</span>
                        </>
                      )}
                      {uploadStage === 'completed' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Upload completed successfully!</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending || !formData.audioFile}
                  className="w-full bg-navy-dark hover:bg-red-700"
                  data-testid="button-upload"
                >
                  {getStatusIcon()}
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload to AzuraCast'}
                </Button>

                {/* Error Display with Retry */}
                {uploadError && (
                  <div className="p-4 border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-navy-light flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 dark:text-red-100">Upload Failed</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{uploadError.message}</p>
                        
                        {/* Stage-specific troubleshooting */}
                        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                          <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">💡 Troubleshooting Tips:</p>
                          <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                            {uploadError.message.includes('Connection') && (
                              <>
                                <li>Verify AzuraCast server is online and accessible</li>
                                <li>Check SFTP port (2022) is not blocked by firewall</li>
                                <li>Confirm AZURACAST_BASE_URL environment variable is correct</li>
                              </>
                            )}
                            {uploadError.message.includes('Authentication') && (
                              <>
                                <li>Verify SFTP credentials in Admin Settings</li>
                                <li>Confirm SFTP_USER and SFTP_PASS are correct</li>
                                <li>Check if SFTP user has write permissions</li>
                              </>
                            )}
                            {uploadError.message.includes('upload') && !uploadError.message.includes('Connection') && (
                              <>
                                <li>Check if file size exceeds server limits</li>
                                <li>Verify network connection is stable</li>
                                <li>Ensure sufficient disk space on AzuraCast server</li>
                              </>
                            )}
                            {uploadError.message.includes('rescan') && (
                              <>
                                <li>File was uploaded successfully but may not appear yet</li>
                                <li>AzuraCast will automatically rescan within 5 minutes</li>
                                <li>Or manually trigger rescan in AzuraCast admin panel</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {uploadError.retryable && (
                      <Button
                        onClick={() => {
                          // Clear error and let user try again
                          setUploadError(null);
                          setUploadStage('idle');
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full border-navy-light text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                        data-testid="button-retry"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    )}
                    {!uploadError.retryable && (
                      <p className="text-xs text-red-600 dark:text-navy-light italic">
                        ⚠️ This error requires manual intervention. Please check settings and try uploading a new episode.
                      </p>
                    )}
                  </div>
                )}

                {/* Success Message */}
                {uploadProgress && uploadStage === 'completed' && (
                  <div className="p-3 rounded text-sm bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    {uploadProgress}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Process Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Process</CardTitle>
              <CardDescription>
                What happens when you upload an episode
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-mono">1</div>
                <div>
                  <h4 className="font-medium">File Upload</h4>
                  <p className="text-sm text-gray-600">Audio file is uploaded to Replit servers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-mono">2</div>
                <div>
                  <h4 className="font-medium">SFTP Transfer</h4>
                  <p className="text-sm text-gray-600">File is transferred to AzuraCast media directory via SFTP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-mono">3</div>
                <div>
                  <h4 className="font-medium">Library Rescan</h4>
                  <p className="text-sm text-gray-600">AzuraCast rescans its media library to include the new file</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-mono">4</div>
                <div>
                  <h4 className="font-medium">Playlist Addition</h4>
                  <p className="text-sm text-gray-600">File is automatically added to the show's playlist</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-mono">✓</div>
                <div>
                  <h4 className="font-medium">Ready for Air</h4>
                  <p className="text-sm text-gray-600">Episode is now available for live streaming and scheduling</p>
                </div>
              </div>

              <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-1">Requirements</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Audio files must be MP3 format</li>
                  <li>• Maximum file size: 500MB</li>
                  <li>• SFTP credentials must be configured</li>
                  <li>• AzuraCast API key required</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}