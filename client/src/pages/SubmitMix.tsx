import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function SubmitMix() {
  const [form, setForm] = useState({
    djName: '',
    realName: '',
    email: '',
    location: '',
    showTitle: '',
    showDescription: '',
    demoMixTitle: '',
    demoMixDescription: '',
    primaryGenre: '',
    showLength: 60,
    soundcloudUrl: '',
    mixcloudUrl: '',
    audiocomUrl: '',
    otherUrl: '',
    additionalGenres: '',
    djExperience: '',
    musicDiscovery: '',
    socialMedia: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name: string, value: string | number) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate at least one URL is provided
    if (!form.soundcloudUrl && !form.mixcloudUrl && !form.audiocomUrl && !form.otherUrl) {
      setError('Please provide at least one platform URL for your mix');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Submitting form data:', form);
      
      const response = await fetch('/api/dj-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          showLength: Number(form.showLength)
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        alert('Mix submitted successfully! Your submission is now pending review.');
        window.location.href = '/mixes';
      } else {
        setError(result.error || 'Failed to submit mix');
        console.error('Submission failed:', result);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/mixes">
              <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Mixes
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-red-500" />
              <h1 className="text-2xl font-mono font-bold text-black">SUBMIT MIX TO ENAMORADO RADIO</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-red-500">Mix Submission Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="djName" className="font-mono">DJ Name *</Label>
                  <Input
                    id="djName"
                    value={form.djName}
                    onChange={(e) => handleChange('djName', e.target.value)}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="realName" className="font-mono">Real Name *</Label>
                  <Input
                    id="realName"
                    value={form.realName}
                    onChange={(e) => handleChange('realName', e.target.value)}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-mono">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="font-mono">Location *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="border-black"
                    required
                  />
                </div>
              </div>

              {/* Show Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="showTitle" className="font-mono">Show Title *</Label>
                  <Input
                    id="showTitle"
                    value={form.showTitle}
                    onChange={(e) => handleChange('showTitle', e.target.value)}
                    className="border-black"
                    placeholder="e.g., 'Late Night Electronic Sessions'"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="showDescription" className="font-mono">Show Description *</Label>
                  <Textarea
                    id="showDescription"
                    value={form.showDescription}
                    onChange={(e) => handleChange('showDescription', e.target.value)}
                    className="border-black min-h-[100px]"
                    placeholder="Describe your show concept, style, and what listeners can expect..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="demoMixTitle" className="font-mono">Demo Mix Title *</Label>
                  <Input
                    id="demoMixTitle"
                    value={form.demoMixTitle}
                    onChange={(e) => handleChange('demoMixTitle', e.target.value)}
                    className="border-black"
                    placeholder="Title of your demo mix"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="demoMixDescription" className="font-mono">Demo Mix Description *</Label>
                  <Textarea
                    id="demoMixDescription"
                    value={form.demoMixDescription}
                    onChange={(e) => handleChange('demoMixDescription', e.target.value)}
                    className="border-black min-h-[100px]"
                    placeholder="Describe your demo mix style, influences, and what makes it unique..."
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryGenre" className="font-mono">Primary Genre *</Label>
                    <Select onValueChange={(value) => handleChange('primaryGenre', value)} required>
                      <SelectTrigger className="border-black">
                        <SelectValue placeholder="Select primary genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="techno">Techno</SelectItem>
                        <SelectItem value="drum-bass">Drum & Bass</SelectItem>
                        <SelectItem value="ambient">Ambient</SelectItem>
                        <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="experimental">Experimental</SelectItem>
                        <SelectItem value="disco">Disco</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="showLength" className="font-mono">Show Length (minutes) *</Label>
                    <Input
                      id="showLength"
                      type="number"
                      min="1"
                      max="240"
                      value={form.showLength}
                      onChange={(e) => handleChange('showLength', parseInt(e.target.value))}
                      className="border-black"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Platform URLs - At least one required */}
              <div className="space-y-4">
                <h3 className="font-mono font-bold text-lg">Platform URLs (at least one required)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="soundcloudUrl" className="font-mono">SoundCloud URL</Label>
                    <Input
                      id="soundcloudUrl"
                      type="url"
                      value={form.soundcloudUrl}
                      onChange={(e) => handleChange('soundcloudUrl', e.target.value)}
                      className="border-black"
                      placeholder="https://soundcloud.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="mixcloudUrl" className="font-mono">Mixcloud URL</Label>
                    <Input
                      id="mixcloudUrl"
                      type="url"
                      value={form.mixcloudUrl}
                      onChange={(e) => handleChange('mixcloudUrl', e.target.value)}
                      className="border-black"
                      placeholder="https://mixcloud.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="audiocomUrl" className="font-mono">Audio.com URL</Label>
                    <Input
                      id="audiocomUrl"
                      type="url"
                      value={form.audiocomUrl}
                      onChange={(e) => handleChange('audiocomUrl', e.target.value)}
                      className="border-black"
                      placeholder="https://audio.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherUrl" className="font-mono">Other Platform URL</Label>
                    <Input
                      id="otherUrl"
                      type="url"
                      value={form.otherUrl}
                      onChange={(e) => handleChange('otherUrl', e.target.value)}
                      className="border-black"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <h3 className="font-mono font-bold text-lg">Additional Information (Optional)</h3>
                <div>
                  <Label htmlFor="additionalGenres" className="font-mono">Additional Genres</Label>
                  <Input
                    id="additionalGenres"
                    value={form.additionalGenres}
                    onChange={(e) => handleChange('additionalGenres', e.target.value)}
                    className="border-black"
                    placeholder="Alternative, sub-genres, influences..."
                  />
                </div>
                <div>
                  <Label htmlFor="djExperience" className="font-mono">DJ Experience</Label>
                  <Textarea
                    id="djExperience"
                    value={form.djExperience}
                    onChange={(e) => handleChange('djExperience', e.target.value)}
                    className="border-black"
                    placeholder="Tell us about your DJing background..."
                  />
                </div>
                <div>
                  <Label htmlFor="musicDiscovery" className="font-mono">Music Discovery</Label>
                  <Textarea
                    id="musicDiscovery"
                    value={form.musicDiscovery}
                    onChange={(e) => handleChange('musicDiscovery', e.target.value)}
                    className="border-black"
                    placeholder="How do you discover new music? What inspires your selections?"
                  />
                </div>
                <div>
                  <Label htmlFor="socialMedia" className="font-mono">Social Media</Label>
                  <Input
                    id="socialMedia"
                    value={form.socialMedia}
                    onChange={(e) => handleChange('socialMedia', e.target.value)}
                    className="border-black"
                    placeholder="Instagram, Twitter, website, etc."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-mono border-black"
                >
                  {isSubmitting ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Mix for Review
                    </>
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