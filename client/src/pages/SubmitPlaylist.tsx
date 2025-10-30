import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Music2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function SubmitPlaylist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    curatorName: "",
    title: "",
    playlistUrl: "",
    description: "",
    tags: "",
    artworkUrl: "",
    curatorEmail: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/public/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curatorName: data.curatorName,
          title: data.title,
          playlistUrl: data.playlistUrl,
          description: data.description || null,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : null,
          artworkUrl: data.artworkUrl || null,
          curatorEmail: data.curatorEmail || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setIsSubmitting(false);
      
      toast({
        title: "Playlist Submitted Successfully!",
        description: "We'll review your submission and feature it soon.",
      });
      
      // Invalidate community cache to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      
      // Redirect to community page after a delay
      setTimeout(() => {
        setLocation('/community');
      }, 2000);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.curatorName || !formData.title || !formData.playlistUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL is from supported platform
    const url = formData.playlistUrl.toLowerCase();
    const isSpotify = url.includes('spotify.com');
    const isAppleMusic = url.includes('apple.com') || url.includes('music.apple');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    if (!isSpotify && !isAppleMusic && !isYouTube) {
      toast({
        title: "Invalid URL",
        description: "Please use a Spotify, Apple Music, or YouTube playlist URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate(formData);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <StickyRadioPlayer />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="text-4xl font-bold">Playlist Submitted!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for sharing your playlist with the community. Our editors will review it soon.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild variant="default" data-testid="button-view-community">
                <Link href="/community">
                  <Music2 className="w-4 h-4 mr-2" />
                  View Community
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-submit-another">
                <Link href="/submit-playlist">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Another
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyRadioPlayer />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <Link href="/community">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Submit a Playlist</h1>
          <p className="text-lg text-muted-foreground">
            Share your curated Spotify, Apple Music, or YouTube playlists with the community.
          </p>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-lg p-6">
          {/* Curator Name */}
          <div className="space-y-2">
            <Label htmlFor="curatorName">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="curatorName"
              data-testid="input-curator-name"
              placeholder="e.g., DJ Shadow, Curator Name"
              value={formData.curatorName}
              onChange={(e) => handleInputChange('curatorName', e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              How should we credit you?
            </p>
          </div>

          {/* Playlist Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Playlist Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              data-testid="input-playlist-title"
              placeholder="e.g., Late Night Vibes, Sunday Morning Jazz"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          {/* Playlist URL */}
          <div className="space-y-2">
            <Label htmlFor="playlistUrl">
              Playlist URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="playlistUrl"
              data-testid="input-playlist-url"
              type="url"
              placeholder="https://open.spotify.com/playlist/..."
              value={formData.playlistUrl}
              onChange={(e) => handleInputChange('playlistUrl', e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Spotify, Apple Music, or YouTube playlist link
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="input-playlist-description"
              placeholder="Tell us about your playlist - what's the vibe, when to listen, etc."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              data-testid="input-playlist-tags"
              placeholder="e.g., house, techno, chill, 90s"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Optional: Custom Artwork URL */}
          <div className="space-y-2">
            <Label htmlFor="artworkUrl">Custom Artwork URL (Optional)</Label>
            <Input
              id="artworkUrl"
              data-testid="input-artwork-url"
              type="url"
              placeholder="https://..."
              value={formData.artworkUrl}
              onChange={(e) => handleInputChange('artworkUrl', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Override the default playlist artwork (optional)
            </p>
          </div>

          {/* Optional: Email */}
          <div className="space-y-2">
            <Label htmlFor="curatorEmail">Email (Optional)</Label>
            <Input
              id="curatorEmail"
              data-testid="input-curator-email"
              type="email"
              placeholder="your@email.com"
              value={formData.curatorEmail}
              onChange={(e) => handleInputChange('curatorEmail', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              For updates about your submission (we won't spam you)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              data-testid="button-submit-playlist"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Playlist
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            By submitting, you confirm this playlist is yours to share. We'll review it and feature it on the community page.
          </p>
        </form>
      </div>
    </div>
  );
}
