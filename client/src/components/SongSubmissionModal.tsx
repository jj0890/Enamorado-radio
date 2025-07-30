import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Music, Calendar, Hash, User, Mail, Type, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SongSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/track/...' },
  { value: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/us/album/...' },
  { value: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/artist/track' },
  { value: 'bandcamp', label: 'Bandcamp', placeholder: 'https://artist.bandcamp.com/track/...' },
  { value: 'youtube', label: 'YouTube Music', placeholder: 'https://music.youtube.com/watch?v=...' },
];

const GENRES = [
  'Hip-Hop', 'R&B', 'Electronic', 'House', 'Techno', 'Jazz', 'Rock', 'Pop',
  'Indie', 'Alternative', 'Folk', 'Country', 'Reggae', 'Funk', 'Soul',
  'Experimental', 'Ambient', 'Drum & Bass', 'Dubstep', 'Trap', 'Lo-Fi', 'Other'
];

const THEMED_DAYS = [
  { value: 'fan_music_friday', label: 'Fan Music Friday', description: 'Community favorites and discoveries' },
  { value: 'throwback_thursday', label: 'Throwback Thursday', description: 'Classic tracks and nostalgia' },
  { value: 'underground_monday', label: 'Underground Monday', description: 'Hidden gems and emerging artists' },
  { value: 'local_wednesday', label: 'Local Wednesday', description: 'San Antonio and Texas artists' },
  { value: 'international_tuesday', label: 'International Tuesday', description: 'Global sounds and world music' },
  { value: 'none', label: 'No Specific Day', description: 'General rotation consideration' },
];

export default function SongSubmissionModal({ isOpen, onClose }: SongSubmissionModalProps) {
  const [formData, setFormData] = useState({
    submitterName: '',
    submitterEmail: '',
    songTitle: '',
    artistName: '',
    albumName: '',
    genre: '',
    submissionType: 'discovery',
    platform: '',
    platformUrl: '',
    description: '',
    requestedDate: 'none',
  });
  
  const [metadataPreview, setMetadataPreview] = useState<any>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch metadata when URL changes
  const fetchMetadata = async (url: string) => {
    if (!url.trim()) {
      setMetadataPreview(null);
      return;
    }

    setFetchingMetadata(true);
    try {
      const response = await fetch('/api/test-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (response.ok) {
        const metadata = await response.json();
        setMetadataPreview(metadata);
        
        // Auto-fill form fields with fetched metadata
        if (metadata) {
          setFormData(prev => ({
            ...prev,
            songTitle: metadata.title || prev.songTitle,
            artistName: metadata.artist || prev.artistName,
            albumName: metadata.album || prev.albumName,
          }));
        }
      } else {
        setMetadataPreview(null);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      setMetadataPreview(null);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/song-submissions', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Submission Received!",
        description: "Your song suggestion has been submitted for review. We'll consider it for our programming.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/song-submissions'] });
      onClose();
      setFormData({
        submitterName: '',
        submitterEmail: '',
        songTitle: '',
        artistName: '',
        albumName: '',
        genre: '',
        submissionType: 'discovery',
        platform: '',
        platformUrl: '',
        description: '',
        requestedDate: 'none',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation check
    const requiredFields = ['submitterName', 'submitterEmail', 'songTitle', 'artistName', 'genre', 'platform', 'platformUrl'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    console.log('Form data being submitted:', formData);
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-mono text-red-500">SUBMIT TRACK FOR RADIO</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Submission Type */}
          <div className="space-y-3">
            <Label className="text-sm font-mono font-semibold">Submission Type</Label>
            <RadioGroup
              value={formData.submissionType}
              onValueChange={(value) => setFormData({ ...formData, submissionType: value })}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="discovery" id="discovery" />
                <div>
                  <Label htmlFor="discovery" className="font-mono text-sm font-medium">Discovery</Label>
                  <p className="text-xs text-gray-600">Share a track you love</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="promotion" id="promotion" />
                <div>
                  <Label htmlFor="promotion" className="font-mono text-sm font-medium">Promotion</Label>
                  <p className="text-xs text-gray-600">Promote your own music</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="testing" id="testing" />
                <div>
                  <Label htmlFor="testing" className="font-mono text-sm font-medium">Testing</Label>
                  <p className="text-xs text-gray-600">Test how the site works</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submitterName" className="flex items-center gap-2 text-sm font-mono font-semibold">
                <User className="w-4 h-4" />
                Your Name *
              </Label>
              <Input
                id="submitterName"
                value={formData.submitterName}
                onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitterEmail" className="flex items-center gap-2 text-sm font-mono font-semibold">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                className="font-mono"
                required
              />
            </div>
          </div>

          {/* Track Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="songTitle" className="flex items-center gap-2 text-sm font-mono font-semibold">
                <Music className="w-4 h-4" />
                Song Title *
              </Label>
              <Input
                id="songTitle"
                value={formData.songTitle}
                onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artistName" className="flex items-center gap-2 text-sm font-mono font-semibold">
                <Type className="w-4 h-4" />
                Artist Name *
              </Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="albumName" className="flex items-center gap-2 text-sm font-mono font-semibold">
                <Hash className="w-4 h-4" />
                Album Name
              </Label>
              <Input
                id="albumName"
                value={formData.albumName}
                onChange={(e) => setFormData({ ...formData, albumName: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-sm font-mono font-semibold">Genre *</Label>
              <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-sm font-mono font-semibold">Streaming Platform *</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value, platformUrl: '' })}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Choose platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.platform && (
              <div className="space-y-2">
                <Label htmlFor="platformUrl" className="flex items-center gap-2 text-sm font-mono font-semibold">
                  <Globe className="w-4 h-4" />
                  {PLATFORMS.find(p => p.value === formData.platform)?.label} URL *
                </Label>
                <Input
                  id="platformUrl"
                  type="url"
                  value={formData.platformUrl}
                  onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
                  placeholder={PLATFORMS.find(p => p.value === formData.platform)?.placeholder}
                  className="font-mono"
                  required
                />
              </div>
            )}
          </div>

          {/* Themed Day Request */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-mono font-semibold">
              <Calendar className="w-4 h-4" />
              Preferred Theme Day
            </Label>
            <Select value={formData.requestedDate} onValueChange={(value) => setFormData({ ...formData, requestedDate: value })}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMED_DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    <div>
                      <div className="font-semibold">{day.label}</div>
                      <div className="text-xs text-gray-600">{day.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-mono font-semibold">
              <MessageSquare className="w-4 h-4" />
              Why are you suggesting this track?
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about this track - what makes it special, why it fits our station, or how you discovered it..."
              className="font-mono resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-mono"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white font-mono"
              onClick={(e) => {
                console.log('Submit button clicked');
                console.log('Form data:', formData);
              }}
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Track'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}