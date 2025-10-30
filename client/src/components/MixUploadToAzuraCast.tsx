import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, AlertCircle, Radio } from 'lucide-react';

export default function MixUploadToAzuraCast() {
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  
  // Upload mix to AzuraCast mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setUploadProgress('Uploading to AzuraCast...');
      
      const response = await fetch('/api/azuracast/upload-direct', {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setUploadProgress(`✅ Upload completed! File: ${result.file}`);
      setSelectedFile(null);
      setFilename('');
      
      // Clear file input
      const fileInput = document.getElementById('mixFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error: Error) => {
      setUploadProgress(`❌ Upload failed: ${error.message}`);
      console.error('Upload error:', error);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate filename from file name
      const baseName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFilename(baseName);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (filename) {
      formData.append('filename', filename + '.mp3');
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-navy" />
          Upload Mix to AzuraCast
        </CardTitle>
        <CardDescription>
          Upload audio files directly to your AzuraCast station. Files will be added to the media library and can be scheduled for rotation.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="mixFile">Audio File (MP3, WAV, etc.)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="mixFile"
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.m4a"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
            />
            {selectedFile && (
              <div className="text-sm text-gray-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>
        </div>

        {/* Custom Filename */}
        <div className="space-y-2">
          <Label htmlFor="filename">Custom Filename (optional)</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. Artist - Title"
            disabled={uploadMutation.isPending}
          />
          <p className="text-xs text-gray-500">
            Leave blank to use original filename. Extension will be added automatically.
          </p>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload to AzuraCast'}
        </Button>

        {/* Progress Display */}
        {uploadProgress && (
          <div className={`p-3 rounded-lg text-sm ${
            uploadMutation.isError ? 'bg-red-50 text-red-700' :
            uploadMutation.isSuccess ? 'bg-green-50 text-green-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {uploadMutation.isError && <AlertCircle className="w-4 h-4 inline mr-2" />}
            {uploadMutation.isSuccess && <CheckCircle className="w-4 h-4 inline mr-2" />}
            {uploadProgress}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>File is uploaded to AzuraCast media directory via SFTP</li>
            <li>Library rescan is automatically triggered</li>
            <li>File becomes available in AzuraCast → Music Files</li>
            <li>Add to playlists for rotation or manual playback</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}