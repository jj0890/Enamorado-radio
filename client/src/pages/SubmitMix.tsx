import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Upload, CheckCircle, Music, ExternalLink, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";

export default function SubmitMix() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    genre: "",
    about: "",
    url: "",
    artUrl: "",
    recommendedPlaylistUrl: ""
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (uploadMode === 'file' && selectedFile) {
        // File upload submission
        const formDataBody = new FormData();
        formDataBody.append('file', selectedFile);
        formDataBody.append('name', data.name);
        formDataBody.append('title', data.title);
        formDataBody.append('genre', data.genre);
        formDataBody.append('about', data.about || '');
        if (data.artUrl) formDataBody.append('artworkUrl', data.artUrl);
        if (data.recommendedPlaylistUrl) formDataBody.append('recommendedPlaylistUrl', data.recommendedPlaylistUrl);

        const response = await fetch('/api/public/mixes/upload', {
          method: 'POST',
          body: formDataBody,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        return response.json();
      } else {
        // URL submission
        const response = await fetch('/api/mixes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            ...(data.recommendedPlaylistUrl ? { recommendedPlaylistUrl: data.recommendedPlaylistUrl } : {})
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      setShowSuccess(true);
      setIsSubmitting(false);
      
      toast({
        title: "Mix Submitted Successfully!",
        description: "We'll review your submission and get back to you soon.",
      });
      
      // Invalidate mixes cache to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/mixes"] });
      
      // Redirect to mixes page after a delay
      setTimeout(() => {
        setLocation('/mixes');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form (about is now optional)
    if (!formData.name || !formData.title || !formData.genre) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === 'url') {
      // Validate URL
      if (!formData.url) {
        toast({
          title: "Missing URL",
          description: "Please enter a valid URL for your mix.",
          variant: "destructive",
        });
        return;
      }
      
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.url)) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (starting with http:// or https://)",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate file
      if (!selectedFile) {
        toast({
          title: "Missing File",
          description: "Please select an audio file to upload.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    submitMutation.mutate(formData);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <StickyRadioPlayer />
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-mono font-bold text-navy mb-4">Mix Submitted!</h1>
          <p className="text-gray-600 dark:text-gray-400 font-mono mb-4">Your mix has been submitted for review.</p>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Redirecting to mixes page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <StickyRadioPlayer />

      {/* Header */}
      <header className="border-b border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-navy">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-gray-600 dark:text-gray-400 hover:text-navy transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 dark:text-gray-400 hover:text-navy transition-colors">
                  EXPLORE
                </Link>
                <Link href="/schedule" className="text-gray-600 dark:text-gray-400 hover:text-navy transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 dark:text-gray-400 hover:text-navy transition-colors">
                  MIXES
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/mixes"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-navy transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mixes
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-mono text-navy">
            Submit a Mix
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 font-mono">
            Share your work with our community for potential featuring, 
            airplay, or collaboration opportunities.
          </p>
        </div>

        {/* How to Make a Mix Guide */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mb-8">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full bg-navy-light dark:bg-navy text-white p-6 rounded-lg flex items-center justify-between hover:bg-navy dark:hover:bg-navy-light transition-colors"
              data-testid="button-toggle-guide"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <div className="text-left">
                  <h2 className="text-xl font-mono font-bold">
                    How to Make a Mix
                  </h2>
                  <p className="text-sm text-white/80 font-mono">
                    New to mixing? Learn how to turn your Spotify playlist into a seamless mix
                  </p>
                </div>
              </div>
              {guideOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="bg-cream dark:bg-gray-900 border-2 border-navy dark:border-navy-light rounded-lg p-8 space-y-6">
              {/* Introduction */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Introduction
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed">
                  You don't need to be a professional DJ to create a great mix! If you have a curated Spotify playlist, 
                  you can turn it into a continuous mix using free software like Audacity. This guide will walk you through 
                  the entire process.
                </p>
              </div>

              {/* Step 1: Export Your Spotify Playlist */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 1: Export Your Spotify Playlist
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>Open Spotify and navigate to your playlist</li>
                  <li>Play the first track and let it run</li>
                  <li>Use a screen recording tool or Spotify Recorder to capture the audio</li>
                  <li>Alternatively, download individual tracks from legal sources and import into Audacity</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-2 italic">
                  Note: Make sure you have legal rights to use the music you're recording
                </p>
              </div>

              {/* Step 2: Download and Install Audacity */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 2: Download and Install Audacity (Free)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-2">
                  Audacity is a free, open-source audio editor available for Windows, Mac, and Linux.
                </p>
                <a
                  href="https://www.audacityteam.org/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-navy dark:text-navy-light hover:underline font-mono text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download Audacity
                </a>
              </div>

              {/* Step 3: Import and Arrange Tracks */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 3: Import and Arrange Your Tracks
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>Open Audacity and drag your audio files into the workspace</li>
                  <li>Arrange tracks in your desired order on the timeline</li>
                  <li>Use the Time Shift Tool (F5) to move tracks around</li>
                  <li>Overlap tracks slightly (2-4 seconds) where you want transitions</li>
                </ol>
              </div>

              {/* Step 4: Create Smooth Transitions */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 4: Create Smooth Transitions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>Select the end of the first track (last 4-8 seconds)</li>
                  <li>Apply <strong>Fade Out</strong> (Effect → Fade Out)</li>
                  <li>Select the beginning of the next track (first 4-8 seconds)</li>
                  <li>Apply <strong>Fade In</strong> (Effect → Fade In)</li>
                  <li>Repeat for each transition to create a seamless flow</li>
                </ol>
              </div>

              {/* Step 5: Fine-Tune Volume Levels */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 5: Fine-Tune Volume Levels
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>Listen to your mix and identify volume inconsistencies</li>
                  <li>Select quieter tracks and use Effect → Amplify to boost them</li>
                  <li>Use Effect → Normalize to ensure consistent loudness</li>
                  <li>Avoid clipping (red bars in the waveform)</li>
                </ol>
              </div>

              {/* Step 6: Export as MP3 */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 6: Export Your Mix as MP3
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>Click File → Export → Export as MP3</li>
                  <li>Set quality to 192-320 kbps for best results</li>
                  <li>Name your file (e.g., "YourName - MixTitle.mp3")</li>
                  <li>Click Save</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-2 italic">
                  Note: If MP3 export isn't available, you may need to install the LAME encoder (free)
                </p>
              </div>

              {/* Step 7: Upload Your Mix */}
              <div>
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-2">
                  Step 7: Upload Your Mix
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm mb-2">
                  You have two options for submitting your mix:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li><strong>Upload to a platform</strong> (SoundCloud, Mixcloud) and share the URL below</li>
                  <li><strong>Upload the file directly</strong> using the file upload option below</li>
                </ul>
              </div>

              {/* Tips and Best Practices */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-mono font-bold text-navy dark:text-navy-light mb-3">
                  💡 Tips for a Great Mix
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 font-mono text-sm">
                  <li>• Keep a consistent mood or energy level throughout</li>
                  <li>• Pay attention to BPM (beats per minute) for smoother transitions</li>
                  <li>• Consider harmonic mixing (matching musical keys)</li>
                  <li>• Don't rush - spend time getting transitions just right</li>
                  <li>• Listen to the full mix before uploading to catch any issues</li>
                  <li>• Add your own creative touches (effects, samples, voiceovers)</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 font-mono text-gray-900 dark:text-white flex items-center">
              <Music className="w-6 h-6 mr-3 text-navy" />
              Mix Information
            </h2>

            {/* Upload Mode Selector */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Label className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-3 block">
                How would you like to submit your mix? *
              </Label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 p-3 border-2 rounded-lg font-mono text-sm transition-colors ${
                    uploadMode === 'url' 
                      ? 'border-navy bg-red-50 dark:bg-red-950 text-red-600 dark:text-navy-light' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 mx-auto mb-1" />
                  Platform URL
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">SoundCloud, Mixcloud, direct .mp3 link</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 p-3 border-2 rounded-lg font-mono text-sm transition-colors ${
                    uploadMode === 'file' 
                      ? 'border-navy bg-red-50 dark:bg-red-950 text-red-600 dark:text-navy-light' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1" />
                  Upload File
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Direct MP3 file upload</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                  Your Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. DJ Shadow"
                  className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy"
                  required
                />
              </div>

              {/* Mix Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                  Mix Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Late Night Vibes Vol. 1"
                  className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy"
                  required
                />
              </div>

              {/* Genre */}
              <div>
                <Label htmlFor="genre" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                  Genre *
                </Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="techno">Techno</SelectItem>
                    <SelectItem value="hip-hop">Hip Hop</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="funk">Funk</SelectItem>
                    <SelectItem value="soul">Soul</SelectItem>
                    <SelectItem value="disco">Disco</SelectItem>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="indie">Indie</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mix URL or File Upload */}
              <div>
                {uploadMode === 'url' ? (
                  <>
                    <Label htmlFor="url" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                      Mix URL *
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="https://soundcloud.com/your-mix or https://example.com/mix.mp3"
                      className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy"
                      required
                    />
                    <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                      Supported: SoundCloud, Mixcloud, Audio.com, or direct .mp3 file links
                    </div>
                  </>
                ) : (
                  <>
                    <Label htmlFor="file" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                      Upload Audio File *
                    </Label>
                    <div className="relative">
                      <input
                        id="file"
                        type="file"
                        accept="audio/*,.mp3,.wav,.flac,.aiff,.alac"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 font-mono
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-mono
                          file:bg-red-50 file:text-red-700
                          dark:file:bg-red-900 dark:file:text-red-200
                          hover:file:bg-red-100 dark:hover:file:bg-red-800"
                        required
                      />
                      {selectedFile && (
                        <div className="mt-2 text-xs font-mono text-green-600">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                      Max file size: 200MB. Supported formats: MP3, WAV, FLAC, AIFF, ALAC
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Artwork URL (Optional) */}
            <div className="mt-6">
              <Label htmlFor="artUrl" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                Artwork URL (Optional)
              </Label>
              <Input
                id="artUrl"
                type="url"
                value={formData.artUrl}
                onChange={(e) => handleInputChange('artUrl', e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy"
              />
              <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                For direct .mp3 links without embedded artwork. SoundCloud/Mixcloud artwork is auto-fetched.
              </div>
            </div>

            {/* About */}
            <div className="mt-6">
              <Label htmlFor="about" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                About This Mix
              </Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Tell us about your mix - what inspired it, the mood, key tracks, or anything you'd like listeners to know..."
                rows={4}
                className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy resize-none"
              />
              <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                Optional — share anything you want listeners to know.
              </div>
            </div>
          </div>

            {/* Recommended Playlist (Optional) */}
            <div className="mt-6">
              <Label htmlFor="recommendedPlaylistUrl" className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2 block">
                What are you listening to right now? (Optional)
              </Label>
              <Input
                id="recommendedPlaylistUrl"
                type="url"
                value={formData.recommendedPlaylistUrl}
                onChange={(e) => handleInputChange('recommendedPlaylistUrl', e.target.value)}
                placeholder="Spotify, Apple Music, YouTube, or SoundCloud playlist URL"
                className="font-mono border-gray-300 dark:border-gray-600 focus:border-navy dark:focus:border-navy"
              />
              <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                Share a public playlist — it'll show up on your contributor profile as "Recommended Listening."
              </div>
            </div>

          {/* Submission Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 font-mono text-blue-900 dark:text-blue-100">Submission Guidelines</h3>
            <ul className="space-y-2 text-sm font-mono text-blue-800 dark:text-blue-200">
              <li>• Original mixes and DJ sets are preferred</li>
              <li>• All genres welcome - diversity is encouraged</li>
              <li>• Include track listings when possible</li>
              <li>• Community-friendly review process (no harsh rejections)</li>
              <li>• Featured mixes may be included in radio programming</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
              All submissions are reviewed by our team
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/mixes">
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-mono"
                >
                  Cancel
                </Button>
              </Link>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy-dark text-white font-mono px-8 py-2 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Mix
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 font-mono text-gray-900 dark:text-white">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono">
            <div>
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Platform Tips:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• SoundCloud: Use private or public track links</li>
                <li>• Mixcloud: Ensure mix is not set to private</li>
                <li>• Audio.com: Direct file links work best</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Questions?</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Want to become a resident DJ?
              </p>
              <a href="/resident-application" data-testid="link-resident-application">
                <Button size="sm" variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white font-mono">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Apply as Resident
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}