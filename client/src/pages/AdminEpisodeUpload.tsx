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
      setUploadStage('uploading');
      setUploadProgress('Uploading files to server...');
      setUploadError(null);
      
      const response = await fetch('/api/admin/episode/upload', {
        method: 'POST',
        body: data
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw { 
          ...result, 
          statusCode: response.status 
        };
      }
      
      return result;
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
    if (uploadMutation.isError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (uploadMutation.isSuccess) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Upload className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 font-mono text-red-500">
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <p className="text-sm text-gray-600 mt-1">
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
                  <Label htmlFor="showSlug">Show Slug *</Label>
                  <Select value={formData.showSlug} onValueChange={(value) => setFormData(prev => ({ ...prev, showSlug: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a show..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="late-night-sessions">Late Night Sessions</SelectItem>
                      <SelectItem value="footwork-fridays">Footwork Fridays</SelectItem>
                      <SelectItem value="community-spotlight">Community Spotlight</SelectItem>
                      <SelectItem value="guest-mix">Guest Mix</SelectItem>
                      <SelectItem value="deep-cuts">Deep Cuts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>

                {/* Artwork - File or URL */}
                <div className="space-y-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded">
                  <Label className="text-sm font-medium">Episode Artwork</Label>
                  
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

                {/* Feature on Homepage */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featureOnHome"
                    checked={formData.featureOnHome}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featureOnHome: checked }))}
                  />
                  <Label htmlFor="featureOnHome">Feature on Homepage</Label>
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
                  className="w-full bg-red-600 hover:bg-red-700"
                  data-testid="button-upload"
                >
                  {getStatusIcon()}
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload to AzuraCast'}
                </Button>

                {/* Error Display with Retry */}
                {uploadError && (
                  <div className="p-4 border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 dark:text-red-100">Upload Failed</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{uploadError.message}</p>
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
                        className="w-full border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
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