import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Music, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CollegeRadioUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CollegeRadioUpload({ isOpen, onClose }: CollegeRadioUploadProps) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    genre: '',
    sourceType: 'upload' as 'upload' | 'soundcloud',
    soundcloudUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/radio/submit-track', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Track Submitted!",
        description: "Your track has been submitted for approval and will be reviewed by our hosts.",
      });
      onClose();
      setFormData({
        title: '',
        artist: '',
        description: '',
        genre: '',
        sourceType: 'upload',
        soundcloudUrl: '',
      });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sourceType === 'upload' && !selectedFile) {
      toast({
        title: "File Required",
        description: "Please select an MP3 file to upload",
        variant: "destructive",
      });
      return;
    }

    if (formData.sourceType === 'soundcloud' && !formData.soundcloudUrl) {
      toast({
        title: "SoundCloud URL Required",
        description: "Please provide a SoundCloud track URL",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('artist', formData.artist);
    data.append('description', formData.description);
    data.append('genre', formData.genre);
    data.append('sourceType', formData.sourceType);
    
    if (formData.sourceType === 'upload' && selectedFile) {
      data.append('audioFile', selectedFile);
    } else if (formData.sourceType === 'soundcloud') {
      data.append('soundcloudUrl', formData.soundcloudUrl);
    }

    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold font-mono text-gray-800">SUBMIT TRACK FOR RADIO</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Source Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="upload"
                  checked={formData.sourceType === 'upload'}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as 'upload' })}
                  className="mr-2"
                />
                <Upload className="w-4 h-4 mr-1" />
                Upload MP3
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="soundcloud"
                  checked={formData.sourceType === 'soundcloud'}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as 'soundcloud' })}
                  className="mr-2"
                />
                <Music className="w-4 h-4 mr-1" />
                SoundCloud Link
              </label>
            </div>
          </div>

          {/* File Upload or SoundCloud URL */}
          {formData.sourceType === 'upload' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File (Max 100MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Click to select an audio file</p>
                      <p className="text-sm text-gray-400">MP3, WAV, FLAC supported</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SoundCloud Track URL
              </label>
              <input
                type="url"
                value={formData.soundcloudUrl}
                onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                placeholder="https://soundcloud.com/artist/track"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
          )}

          {/* Track Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Track Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artist Name *
              </label>
              <input
                type="text"
                required
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre
            </label>
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
            >
              <option value="">Select a genre</option>
              <option value="Electronic">Electronic</option>
              <option value="House">House</option>
              <option value="Techno">Techno</option>
              <option value="Hip-Hop">Hip-Hop</option>
              <option value="Jazz">Jazz</option>
              <option value="Indie">Indie</option>
              <option value="Ambient">Ambient</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Tell us about your track..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>

          {/* Submission Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Submission Guidelines:</p>
                <ul className="text-xs space-y-1">
                  <li>• Tracks will be reviewed by our radio hosts before going live</li>
                  <li>• You retain all rights to your music</li>
                  <li>• Approved tracks enter our 24/7 rotation playlist</li>
                  <li>• You'll be notified when your track is approved or if changes are needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Track'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}