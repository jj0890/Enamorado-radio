import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface SimpleSongFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleSongForm({ isOpen, onClose }: SimpleSongFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  
  const { toast } = useToast();

  // Debug: Log all state changes
  console.log('SimpleSongForm state:', { name, email, song, artist, url, isOpen });

  const mutation = useMutation({
    mutationFn: async () => {
      const urlOk = /^https?:\/\/[^\s]+$/i.test(url || '');
      if (url && !urlOk) {
        throw new Error('Please paste a valid link (Spotify, Apple Music, Bandcamp, SoundCloud, YouTube, etc.)');
      }

      // derive platform
      const host = (() => {
        try { return new URL(url || '').hostname.replace('www.', ''); }
        catch { return ''; }
      })();
      const platform =
        host.includes('spotify') ? 'spotify' :
        host.includes('music.apple') || host.includes('itunes') ? 'apple_music' :
        host.includes('soundcloud') ? 'soundcloud' :
        host.includes('bandcamp') ? 'bandcamp' :
        host.includes('youtube') || host.includes('youtu.be') ? 'youtube' :
        'link';

      const data = {
        submitterName: name || 'Anonymous',
        submitterEmail: email || 'anonymous@example.com',
        songTitle: song || 'Unknown Song',
        artistName: artist || 'Unknown Artist',
        albumName: '',
        genre: 'Other',
        submissionType: 'discovery',
        platform,
        platformUrl: url || 'https://example.com',
        description: '',
        requestedDate: 'none',
      };
      
      console.log('Submitting simple form:', data);
      return apiRequest('POST', '/api/song-submissions', data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your song was submitted successfully.",
      });
      onClose();
      setName('');
      setEmail('');
      setSong('');
      setArtist('');
      setUrl('');
    },
    onError: (error: Error) => {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    console.log('SUBMIT BUTTON CLICKED');
    console.log('Current form data:', { name, email, song, artist, url });
    console.log('Mutation pending:', mutation.isPending);
    
    // Force submission with current data
    mutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-mono text-red-500">SUBMIT SONG</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono mb-1 text-gray-700 dark:text-gray-300">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1 text-gray-700 dark:text-gray-300">Song Title</label>
            <input
              type="text"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Song name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1 text-gray-700 dark:text-gray-300">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Artist name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1 text-gray-700 dark:text-gray-300">Music URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Spotify, Apple Music, Bandcamp, SoundCloud, YouTube, etc."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded font-mono hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="px-4 py-2 bg-red-500 text-white rounded font-mono hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ pointerEvents: 'auto', zIndex: 1000 }}
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}