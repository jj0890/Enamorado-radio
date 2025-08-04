import { useState } from 'react';
import { Link, useLocation } from 'wouter';

export default function SubmitMix() {
  const [, setLocation] = useLocation();
  const [djName, setDjName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    console.log('Submitting mix:', { djName, title, description, soundcloudUrl, genre });

    try {
      const response = await fetch('/api/mix-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: djName,
          title: title,
          about: description,
          soundcloudUrl: soundcloudUrl,
          genre: genre
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setIsSuccess(true);
        // Redirect after 2 seconds
        setTimeout(() => {
          setLocation('/mixes');
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit mix');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-mono font-bold text-red-500 mb-4">Mix Submitted!</h1>
          <p className="text-gray-600 font-mono mb-4">Your mix has been submitted for review.</p>
          <p className="text-gray-500 font-mono text-sm">Redirecting to mixes page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* DEBUG: Diagnostic message */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 text-center font-mono">
        🟢 THIS IS THE SUBMIT-MIX PAGE (Simple Community Submission)
      </div>
      
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/mixes">
            <button className="text-red-500 font-mono mb-4 hover:underline">← Back to Mixes</button>
          </Link>
          <h1 className="text-3xl font-mono font-bold text-black mb-2">Submit Your Mix</h1>
          <p className="text-gray-600 font-mono">Share your music with the Enamorado Radio community</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Simple Form */}
        <div className="bg-white border-2 border-red-500 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-black font-mono font-medium mb-2">
                DJ Name *
              </label>
              <input
                type="text"
                value={djName}
                onChange={e => setDjName(e.target.value)}
                placeholder="DJ Name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-black font-mono font-medium mb-2">
                Mix Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Mix Title"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-black font-mono font-medium mb-2">
                Mix Description *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mix Description"
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono resize-none"
              />
            </div>

            <div>
              <label className="block text-black font-mono font-medium mb-2">
                SoundCloud URL *
              </label>
              <input
                type="url"
                value={soundcloudUrl}
                onChange={e => setSoundcloudUrl(e.target.value)}
                placeholder="SoundCloud URL"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-black font-mono font-medium mb-2">
                Genre *
              </label>
              <input
                type="text"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                placeholder="Genre"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-mono font-medium py-4 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}