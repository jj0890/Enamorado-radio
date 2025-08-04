import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Upload, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface SubmissionFormData {
  djName: string;
  email: string;
  demoMixTitle: string;
  demoMixDescription: string;
  primaryGenre: string;
  soundcloudUrl: string;
  mixcloudUrl: string;
  audiocomUrl: string;
  otherUrl: string;
  location?: string;
  tags?: string;
}

export default function SubmitMix() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<SubmissionFormData>({
    djName: '',
    email: '',
    demoMixTitle: '',
    demoMixDescription: '',
    primaryGenre: '',
    soundcloudUrl: '',
    mixcloudUrl: '',
    audiocomUrl: '',
    otherUrl: '',
    location: '',
    tags: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const genres = [
    'Hip-Hop', 'House', 'Techno', 'Electronic', 'Jazz', 'Funk', 'Soul', 'R&B',
    'Rock', 'Pop', 'Indie', 'Alternative', 'Experimental', 'Ambient', 'Footwork',
    'Juke', 'Club', 'Garage', 'Dubstep', 'Drum & Bass', 'Breakbeat', 'Downtempo',
    'Lo-Fi', 'Disco', 'Reggae', 'Latin', 'World', 'Other'
  ];

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    if (!form.djName.trim()) {
      setError('DJ Name is required');
      setIsSubmitting(false);
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      setIsSubmitting(false);
      return;
    }

    if (!form.demoMixTitle.trim()) {
      setError('Mix Title is required');
      setIsSubmitting(false);
      return;
    }

    if (!form.primaryGenre) {
      setError('Please select a genre');
      setIsSubmitting(false);
      return;
    }

    // Validate at least one URL is provided
    if (!form.soundcloudUrl && !form.mixcloudUrl && !form.audiocomUrl && !form.otherUrl) {
      setError('Please provide at least one platform URL for your mix');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Submitting simplified form data:', form);
      
      // Convert to the format expected by the backend
      const submissionData = {
        djName: form.djName,
        realName: form.djName, // Use DJ name as real name for simplicity
        email: form.email,
        location: form.location || '',
        showTitle: form.demoMixTitle, // Use mix title as show title
        showDescription: form.demoMixDescription,
        demoMixTitle: form.demoMixTitle,
        demoMixDescription: form.demoMixDescription,
        primaryGenre: form.primaryGenre,
        showLength: 60, // Default to 60 minutes
        soundcloudUrl: form.soundcloudUrl,
        mixcloudUrl: form.mixcloudUrl,
        audiocomUrl: form.audiocomUrl,
        otherUrl: form.otherUrl,
        additionalGenres: form.tags || '',
        djExperience: '', // Optional fields left empty
        musicDiscovery: '',
        socialMedia: ''
      };
      
      const response = await fetch('/api/dj-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          setLocation('/mixes');
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit mix');
        console.error('Submission failed:', result);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-8 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 font-mono text-green-500">SUCCESS!</h1>
            <h2 className="text-2xl font-bold mb-6 font-mono text-black">Mix Submitted Successfully</h2>
            
            <div className="bg-gray-50 border-2 border-green-500 rounded-lg p-6 mb-8">
              <p className="text-gray-600 font-mono mb-4">
                <strong>"{form.demoMixTitle}"</strong> by <strong>{form.djName}</strong>
              </p>
              <p className="text-gray-600 font-mono mb-4">
                Your mix has been submitted for review and will appear in our community section once approved. 
                We'll send updates to <strong>{form.email}</strong>
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Redirecting you back to mixes page in a few seconds...
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/mixes">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold px-8 py-3">
                  Back to Mixes
                </Button>
              </Link>
              
              <div>
                <Link href="/submit-mix" className="text-red-500 hover:underline font-mono">
                  Submit Another Mix
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Back to Mixes */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <Link 
          href="/mixes"
          className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mixes
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 font-mono text-red-500">SUBMIT YOUR MIX</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-mono">
            Share your mix with our community. Keep it simple, keep it real.
          </p>
        </div>

        {/* Form */}
        <Card className="border-2 border-black">
          <CardHeader>
            <CardTitle className="text-2xl font-mono text-red-500">Mix Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-500 rounded-lg p-4 text-red-600 font-mono">
                  {error}
                </div>
              )}

              {/* Essential Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="djName" className="font-mono font-bold">DJ Name *</Label>
                  <Input
                    id="djName"
                    value={form.djName}
                    onChange={(e) => handleChange('djName', e.target.value)}
                    placeholder="Your DJ name or artist name"
                    className="font-mono"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="font-mono font-bold">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              {/* Mix Details */}
              <div>
                <Label htmlFor="demoMixTitle" className="font-mono font-bold">Mix Title *</Label>
                <Input
                  id="demoMixTitle"
                  value={form.demoMixTitle}
                  onChange={(e) => handleChange('demoMixTitle', e.target.value)}
                  placeholder="Name of your mix"
                  className="font-mono"
                  required
                />
              </div>

              <div>
                <Label htmlFor="demoMixDescription" className="font-mono font-bold">Mix Description</Label>
                <Textarea
                  id="demoMixDescription"
                  value={form.demoMixDescription}
                  onChange={(e) => handleChange('demoMixDescription', e.target.value)}
                  placeholder="Tell us about your mix - the vibe, influences, or anything you want to share..."
                  className="font-mono min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="primaryGenre" className="font-mono font-bold">Genre *</Label>
                <Select value={form.primaryGenre} onValueChange={(value) => handleChange('primaryGenre', value)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select the main genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre} className="font-mono">
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform URLs */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-mono text-red-500">Mix URL (At least one required) *</h3>
                
                <div>
                  <Label htmlFor="soundcloudUrl" className="font-mono">SoundCloud URL</Label>
                  <Input
                    id="soundcloudUrl"
                    value={form.soundcloudUrl}
                    onChange={(e) => handleChange('soundcloudUrl', e.target.value)}
                    placeholder="https://soundcloud.com/your-username/your-mix"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="mixcloudUrl" className="font-mono">Mixcloud URL</Label>
                  <Input
                    id="mixcloudUrl"
                    value={form.mixcloudUrl}
                    onChange={(e) => handleChange('mixcloudUrl', e.target.value)}
                    placeholder="https://mixcloud.com/your-username/your-mix"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="audiocomUrl" className="font-mono">Audio.com URL</Label>
                  <Input
                    id="audiocomUrl"
                    value={form.audiocomUrl}
                    onChange={(e) => handleChange('audiocomUrl', e.target.value)}
                    placeholder="https://audio.com/your-username/your-mix"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="otherUrl" className="font-mono">Other URL</Label>
                  <Input
                    id="otherUrl"
                    value={form.otherUrl}
                    onChange={(e) => handleChange('otherUrl', e.target.value)}
                    placeholder="Any other platform URL"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold font-mono text-gray-700 mb-4">Optional Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="location" className="font-mono">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="City, Country"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags" className="font-mono">Tags/Sub-genres</Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      placeholder="breakbeat, underground, experimental"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold px-12 py-4 text-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Upload className="w-6 h-6" />
                      Submit Mix
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}