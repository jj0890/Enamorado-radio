import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, CheckCircle, Music, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DJSubmit() {
  const [formData, setFormData] = useState({
    djName: "",
    realName: "",
    email: "",
    location: "",
    demoMixTitle: "",
    primaryGenre: "",
    soundcloudUrl: "",
    mixcloudUrl: "",
    audiocomUrl: "",
    otherUrl: "",
    tellUsAboutYourself: "",
    wantInterview: false,
    agreeTerms: false,
  });

  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/dj-submissions', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Submission failed');
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: "Mix Submitted Successfully!",
        description: "We'll review your submission and get back to you soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleArtworkUpload = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      setArtworkFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setArtworkPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value.toString());
    });

    if (artworkFile) {
      submitData.append('artwork', artworkFile);
    }

    submitMutation.mutate(submitData);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4 font-mono text-gray-900">
            Mix Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-8 font-mono">
            Thank you for sharing your work with us. We'll review your submission 
            and get back to you within 48 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-6 py-3 font-mono font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* DEBUG: Diagnostic message */}
      <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-2 text-center font-mono">
        🟠 THIS IS THE DJ-SUBMIT PAGE (Complex DJ Application Form)
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
              ENAMORADO
            </Link>
            <Link href="/" className="text-gray-600 hover:text-red-500 transition-colors text-sm font-mono">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">
            Submit a Mix
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-mono">
            Share your work with our community for potential featuring, 
            airplay, or collaboration opportunities.
          </p>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 max-w-3xl mx-auto">
            <p className="text-sm text-red-600 font-mono">
              <strong>Important:</strong> By submitting, you maintain full ownership of your work. 
              We only feature content with explicit artist consent.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="djName" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Artist Name *
              </label>
              <input
                type="text"
                id="djName"
                value={formData.djName}
                onChange={handleInputChange}
                required
                placeholder="Your stage name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label htmlFor="realName" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Real Name *
              </label>
              <input
                type="text"
                id="realName"
                value={formData.realName}
                onChange={handleInputChange}
                required
                placeholder="Your legal name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State/Country"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          {/* Mix Details */}
          <div className="space-y-6">
            <div>
              <label htmlFor="demoMixTitle" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Mix Title *
              </label>
              <input
                type="text"
                id="demoMixTitle"
                value={formData.demoMixTitle}
                onChange={handleInputChange}
                required
                placeholder="What's your mix called?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label htmlFor="primaryGenre" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                Genre *
              </label>
              <select
                id="primaryGenre"
                value={formData.primaryGenre}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              >
                <option value="">Select genre...</option>
                <option value="electronic">Electronic</option>
                <option value="experimental">Experimental</option>
                <option value="ambient">Ambient</option>
                <option value="techno">Techno</option>
                <option value="house">House</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="jazz">Jazz</option>
                <option value="indie">Indie</option>
                <option value="world">World Music</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Artwork Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-mono">
              Mix Artwork (Optional)
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors">
              {artworkPreview ? (
                <div className="space-y-4">
                  <img src={artworkPreview} alt="Preview" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setArtworkFile(null);
                      setArtworkPreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 font-mono"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 font-mono">Drop your artwork here or click to browse</p>
                    <p className="text-sm text-gray-500 font-mono">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleArtworkUpload(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 font-mono">Where can we find your mix?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="soundcloudUrl" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                  SoundCloud URL
                </label>
                <input
                  type="url"
                  id="soundcloudUrl"
                  value={formData.soundcloudUrl}
                  onChange={handleInputChange}
                  placeholder="https://soundcloud.com/your-mix"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label htmlFor="mixcloudUrl" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                  Mixcloud URL
                </label>
                <input
                  type="url"
                  id="mixcloudUrl"
                  value={formData.mixcloudUrl}
                  onChange={handleInputChange}
                  placeholder="https://mixcloud.com/your-mix"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label htmlFor="audiocomUrl" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                  Audio.com URL
                </label>
                <input
                  type="url"
                  id="audiocomUrl"
                  value={formData.audiocomUrl}
                  onChange={handleInputChange}
                  placeholder="https://audio.com/your-mix"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label htmlFor="otherUrl" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                  Other Platform URL
                </label>
                <input
                  type="url"
                  id="otherUrl"
                  value={formData.otherUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-platform.com/your-mix"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          {/* Tell Us About Yourself */}
          <div>
            <label htmlFor="tellUsAboutYourself" className="block text-sm font-medium text-gray-700 mb-2 font-mono">
              Tell us about yourself
            </label>
            <textarea
              id="tellUsAboutYourself"
              value={formData.tellUsAboutYourself}
              onChange={handleInputChange}
              placeholder="Share your story, your sound, what drives your music..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono resize-none"
            />
          </div>

          {/* Interview Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="wantInterview"
              checked={formData.wantInterview}
              onChange={handleInputChange}
              className="w-4 h-4 text-red-500 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
            />
            <label htmlFor="wantInterview" className="text-sm text-gray-700 font-mono">
              Would you like to be interviewed later?
            </label>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              required
              className="w-4 h-4 text-red-500 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2 mt-1"
            />
            <label htmlFor="agreeTerms" className="text-sm text-gray-700 font-mono">
              I agree that I own all rights to this content and consent to its potential use for 
              featuring, airplay, or promotional purposes with proper attribution.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeTerms}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-4 font-mono font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Mix"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}