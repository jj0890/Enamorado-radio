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

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        submitterName: name || 'Anonymous',
        submitterEmail: email || 'anonymous@example.com',
        songTitle: song || 'Unknown Song',
        artistName: artist || 'Unknown Artist',
        albumName: '',
        genre: 'Other',
        submissionType: 'discovery',
        platform: 'spotify',
        platformUrl: url || 'https://example.com',
        description: '',
        requestedDate: 'none',
      };
      
      console.log('Submitting simple form:', data);
      return apiRequest('/api/song-submissions', 'POST', data);
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

  const handleSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Button clicked - submitting with data:', { name, email, song, artist, url });
    console.log('Mutation pending state:', mutation.isPending);
    
    if (!song || !artist) {
      toast({
        title: "Missing Information",
        description: "Please provide both song title and artist name.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-mono text-red-500">SUBMIT SONG</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded font-mono"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded font-mono"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1">Song Title</label>
            <input
              type="text"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              className="w-full p-2 border rounded font-mono"
              placeholder="Song name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2 border rounded font-mono"
              placeholder="Artist name"
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-1">Spotify/Music URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded font-mono"
              placeholder="https://open.spotify.com/..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded font-mono hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || (!song || !artist)}
              className="px-4 py-2 bg-red-500 text-white rounded font-mono hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}