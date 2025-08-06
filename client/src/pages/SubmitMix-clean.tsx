import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, CheckCircle, Music, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PersistentRadioPlayer from "@/components/PersistentRadioPlayer";

export default function SubmitMix() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    genre: "",
    about: "",
    url: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/mixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.title || !formData.genre || !formData.about || !formData.url) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(formData.url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (starting with http:// or https://)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate(formData);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PersistentRadioPlayer />
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-mono font-bold text-red-500 mb-4">Mix Submitted!</h1>
          <p className="text-gray-600 font-mono mb-4">Your mix has been submitted for review.</p>
          <p className="text-gray-500 font-mono text-sm">Redirecting to mixes page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <PersistentRadioPlayer />

      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO
              </Link>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-mono">
                <Link href="/latest" className="text-gray-600 hover:text-red-500 transition-colors">
                  LATEST
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-red-500 transition-colors">
                  EXPLORE
                </Link>
                <Link href="/schedule" className="text-gray-600 hover:text-red-500 transition-colors">
                  SCHEDULE
                </Link>
                <Link href="/mixes" className="text-gray-600 hover:text-red-500 transition-colors">
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
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mixes
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">
            Submit a Mix
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-mono">
            Share your work with our community for potential featuring, 
            airplay, or collaboration opportunities.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-50 border-2 border-black rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 font-mono text-gray-900 flex items-center">
              <Music className="w-6 h-6 mr-3 text-red-500" />
              Mix Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-mono text-gray-700 mb-2 block">
                  Your Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. DJ Shadow"
                  className="font-mono border-gray-300 focus:border-red-500"
                  required
                />
              </div>

              {/* Mix Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-mono text-gray-700 mb-2 block">
                  Mix Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Late Night Vibes Vol. 1"
                  className="font-mono border-gray-300 focus:border-red-500"
                  required
                />
              </div>

              {/* Genre */}
              <div>
                <Label htmlFor="genre" className="text-sm font-mono text-gray-700 mb-2 block">
                  Genre *
                </Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger className="font-mono border-gray-300 focus:border-red-500">
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

              {/* Mix URL */}
              <div>
                <Label htmlFor="url" className="text-sm font-mono text-gray-700 mb-2 block">
                  Mix URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://soundcloud.com/your-mix"
                  className="font-mono border-gray-300 focus:border-red-500"
                  required
                />
                <div className="mt-2 text-xs font-mono text-gray-500">
                  Supported: SoundCloud, Mixcloud, Audio.com, or direct file links
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-6">
              <Label htmlFor="about" className="text-sm font-mono text-gray-700 mb-2 block">
                About This Mix *
              </Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Tell us about your mix - what inspired it, the mood, key tracks, or anything you'd like listeners to know..."
                rows={4}
                className="font-mono border-gray-300 focus:border-red-500 resize-none"
                required
              />
              <div className="mt-2 text-xs font-mono text-gray-500">
                Minimum 50 characters. Be descriptive to help listeners discover your work.
              </div>
            </div>
          </div>

          {/* Submission Guidelines */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 font-mono text-blue-900">Submission Guidelines</h3>
            <ul className="space-y-2 text-sm font-mono text-blue-800">
              <li>• Original mixes and DJ sets are preferred</li>
              <li>• All genres welcome - diversity is encouraged</li>
              <li>• Include track listings when possible</li>
              <li>• Community-friendly review process (no harsh rejections)</li>
              <li>• Featured mixes may be included in radio programming</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm font-mono text-gray-500">
              All submissions are reviewed by our team
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/mixes">
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 font-mono"
                >
                  Cancel
                </Button>
              </Link>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600 text-white font-mono px-8 py-2 flex items-center"
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
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold mb-4 font-mono text-gray-900">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono">
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Platform Tips:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• SoundCloud: Use private or public track links</li>
                <li>• Mixcloud: Ensure mix is not set to private</li>
                <li>• Audio.com: Direct file links work best</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Questions?</h4>
              <p className="text-gray-600 mb-2">
                Want to become a resident DJ?
              </p>
              <Link href="/resident-application">
                <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Apply as Resident
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}