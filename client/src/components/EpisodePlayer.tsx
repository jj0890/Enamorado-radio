import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Play, Pause, SkipBack, SkipForward, Volume2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { Episode } from '@shared/schema';

interface EpisodePlayerProps {
  episode: Episode;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showTracklist, setShowTracklist] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse tracklist from JSON string
  const tracks: Array<{artist: string; title: string; timestamp?: number}> = 
    episode.tracklist ? JSON.parse(episode.tracklist) : [];
  const currentTrack = null;

  // Hide persistent radio player when on episode page
  useEffect(() => {
    const hidePlayer = () => {
      const persistentPlayer = document.querySelector('[data-sticky-player]');
      console.log('🎵 Looking for sticky player...', persistentPlayer);
      if (persistentPlayer) {
        (persistentPlayer as HTMLElement).style.display = 'none';
        console.log('✅ Sticky player hidden');
        return true;
      }
      return false;
    };

    // Try immediately
    if (!hidePlayer()) {
      // If not found, try again after a short delay
      const timeout = setTimeout(hidePlayer, 100);
      
      return () => {
        clearTimeout(timeout);
        const persistentPlayer = document.querySelector('[data-sticky-player]');
        if (persistentPlayer) {
          (persistentPlayer as HTMLElement).style.display = 'block';
          console.log('✅ Sticky player restored');
        }
      };
    }
    
    // Show it again when leaving
    return () => {
      const persistentPlayer = document.querySelector('[data-sticky-player]');
      if (persistentPlayer) {
        (persistentPlayer as HTMLElement).style.display = 'block';
        console.log('✅ Sticky player restored');
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    
    console.log('🎵 Episode player: handlePlayPause, isPlaying:', isPlaying);
    
    if (isPlaying) {
      console.log('⏸ Pausing episode audio...');
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('▶️ Playing episode audio...');
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('❌ Episode play error:', error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * episode.duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const openSpotifyTrack = (spotifyId: string) => {
    window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank');
  };

  const openSoundCloudTrack = (soundcloudUrl: string) => {
    window.open(soundcloudUrl, '_blank');
  };

  const openYouTubeTrack = (youtubeUrl: string) => {
    window.open(youtubeUrl, '_blank');
  };

  const openDiscogsTrack = (discogsUrl: string) => {
    window.open(discogsUrl, '_blank');
  };

  const progress = (currentTime / episode.duration) * 100;

  return (
    <div className="bg-black text-white min-h-screen">
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.volume = volume / 100;
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">EPISODE</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-400">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Episode Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex space-x-4">
          <div className="w-24 h-24 bg-gray-800 rounded overflow-hidden">
            {episode.artworkUrl && (
              <img 
                src={episode.artworkUrl} 
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{episode.title}</h2>
            <p className="text-gray-400 text-sm">{episode.hostName}</p>
            <p className="text-gray-500 text-xs mt-1">
              {episode.seriesTitle} • {formatTime(episode.duration)}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {episode.tags?.map((tag: string, index: number) => (
                <Link key={index} href={`/episodes?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 cursor-pointer hover:bg-red-500 hover:text-white transition-colors">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Track Display - disabled for now */}

      {/* Tracklist */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">TRACKLIST</h3>
        {tracks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Tracklist functionality will be available when track data is integrated.
          </p>
        ) : (
          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div
                key={index}
                className="border-l-2 border-gray-800 pl-3 hover:border-gray-600 transition-colors"
              >
                <div className="text-sm font-bold text-white uppercase tracking-wide">
                  {track.artist}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {track.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Controls - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:text-gray-300"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-32"
              />
              <span className="text-sm text-gray-400">{formatTime(episode.duration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}