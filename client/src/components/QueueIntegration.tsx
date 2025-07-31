import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Music, Radio } from "lucide-react";

interface CurrentlyPlayingData {
  id: number;
  songTitle: string;
  artistName: string;
  submitterName: string;
  metadata?: string;
}

export function CurrentlyPlayingWidget() {
  const { data: currentlyPlaying } = useQuery({
    queryKey: ['/api/admin/currently-playing'],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const parseMetadata = (metadataString?: string) => {
    try {
      return metadataString ? JSON.parse(metadataString) : null;
    } catch {
      return null;
    }
  };

  if (!currentlyPlaying) {
    return (
      <div className="fixed top-4 right-4 bg-gray-100 border border-gray-200 rounded-lg p-3 shadow-md max-w-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Music className="w-4 h-4" />
          <span className="text-sm font-mono">No song currently playing</span>
        </div>
      </div>
    );
  }

  const metadata = parseMetadata(currentlyPlaying.metadata);

  return (
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-4 h-4 text-red-600" />
        <Badge variant="secondary" className="text-xs font-mono bg-red-100 text-red-700">
          NOW PLAYING
        </Badge>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-bold font-mono text-gray-900 text-sm leading-tight">
          {currentlyPlaying.songTitle}
        </h3>
        <p className="text-gray-700 font-mono text-sm">
          by {currentlyPlaying.artistName}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          Suggested by {currentlyPlaying.submitterName}
        </p>
      </div>

      {metadata?.imageUrl && (
        <img 
          src={metadata.imageUrl} 
          alt={`${currentlyPlaying.songTitle} artwork`}
          className="w-12 h-12 rounded mt-2 object-cover"
        />
      )}
    </div>
  );
}

export function UpNextWidget() {
  const { data: queue = [] } = useQuery({
    queryKey: ['/api/admin/queue'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const upNext = queue
    .filter((song: any) => song.playbackStatus === 'queued')
    .sort((a: any, b: any) => a.queuePosition - b.queuePosition)
    .slice(0, 3);

  if (upNext.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm">
      <h4 className="font-bold font-mono text-blue-900 text-sm mb-2 flex items-center gap-2">
        <Music className="w-4 h-4" />
        Up Next
      </h4>
      
      <div className="space-y-2">
        {upNext.map((song: any, index: number) => (
          <div key={song.id} className="text-xs">
            <span className="text-blue-600 font-mono font-bold">#{song.queuePosition}</span>
            <span className="ml-2 font-mono text-gray-900">{song.songTitle}</span>
            <span className="text-gray-600 font-mono"> by {song.artistName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}