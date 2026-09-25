import { Music, ExternalLink, Clock } from "lucide-react";

interface PlaylistEmbedProps {
  url: string;
  title: string;
  description: string;
  compact?: boolean;
}

export default function PlaylistEmbed({ url, title, description, compact = false }: PlaylistEmbedProps) {
  // Extract Spotify playlist ID
  const getSpotifyEmbedUrl = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`;
    }
    return null;
  };

  // Extract Apple Music playlist info
  const getAppleMusicEmbedUrl = (url: string) => {
    // Apple Music playlist URLs: https://music.apple.com/us/playlist/name/pl.u-xxxxx
    const match = url.match(/playlist\/[^\/]+\/(pl\.[a-zA-Z0-9\-_]+)/);
    if (match) {
      return `https://embed.music.apple.com/us/playlist/${match[1]}`;
    }
    return null;
  };

  const spotifyEmbedUrl = getSpotifyEmbedUrl(url);
  const appleMusicEmbedUrl = getAppleMusicEmbedUrl(url);
  const isSpotify = url.includes('open.spotify.com/playlist/');
  const isAppleMusic = url.includes('music.apple.com') && url.includes('playlist');
  const isYouTube = url.includes('youtube.com/playlist');

  if (spotifyEmbedUrl) {
    if (compact) {
      return (
        <div className="w-full h-full">
          <iframe 
            src={spotifyEmbedUrl}
            width="100%" 
            height="100%" 
            frameBorder={0} 
            allowTransparency={true} 
            allow="encrypted-media"
            className="rounded-t-lg"
          />
        </div>
      );
    }

    return (
      <div className="bg-[var(--charcoal)] border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Music className="w-5 h-5 text-green-400" />
          <span className="text-white font-medium">Spotify Playlist</span>
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">Under 1 hour</span>
        </div>
        
        <div className="mb-4">
          <h3 className="text-white font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="rounded-lg overflow-hidden">
          <iframe 
            src={spotifyEmbedUrl}
            width="100%" 
            height="320" 
            frameBorder={0} 
            allowTransparency={true} 
            allow="encrypted-media"
            className="rounded-lg"
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-400">Listen on Spotify</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Apple Music embed
  if (appleMusicEmbedUrl) {
    if (compact) {
      return (
        <div className="w-full h-full">
          <iframe 
            src={appleMusicEmbedUrl}
            width="100%" 
            height="100%" 
            frameBorder={0} 
            allow="autoplay *; encrypted-media *; fullscreen *"
            className="rounded-t-lg"
            style={{ background: 'transparent', colorScheme: 'auto' }}
          />
        </div>
      );
    }

    return (
      <div className="bg-[var(--charcoal)] border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Music className="w-5 h-5 text-red-400" />
          <span className="text-white font-medium">Apple Music Playlist</span>
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">Under 1 hour</span>
        </div>
        
        <div className="mb-4">
          <h3 className="text-white font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="rounded-lg overflow-hidden">
          <iframe 
            src={appleMusicEmbedUrl}
            width="100%" 
            height="320" 
            frameBorder={0} 
            allow="autoplay *; encrypted-media *; fullscreen *"
            className="rounded-lg"
            style={{ background: 'transparent', colorScheme: 'auto' }}
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-400">Listen on Apple Music</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Fallback for other playlist types
  if (compact) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <Music className="w-12 h-12 text-purple-400" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--charcoal)] border border-border rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Music className="w-5 h-5 text-purple-400" />
        <span className="text-white font-medium">
          {isAppleMusic ? 'Apple Music' : isYouTube ? 'YouTube' : 'Music'} Playlist
        </span>
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-400 text-sm">Under 1 hour</span>
      </div>
      
      <div className="mb-4">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6 text-center">
        <Music className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-2">Community Playlist</p>
        <p className="text-muted-foreground text-sm mb-4">
          Check out this curated selection of tracks
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span>Listen Now</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}