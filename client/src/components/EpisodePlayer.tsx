import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, SkipBack, SkipForward, Volume2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { Episode, EpisodeTracklist } from '@shared/schema';

interface EpisodePlayerProps {
  episode: Episode;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showTracklist, setShowTracklist] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch episode tracklist
  const { data: tracks = [] } = useQuery<EpisodeTracklist[]>({
    queryKey: ['/api/episode-tracklist', episode.id],
    queryFn: async () => {
      const response = await fetch(`/api/episode-tracklist/${episode.id}`);
      if (!response.ok) throw new Error('Failed to fetch tracklist');
      return response.json();
    },
  });

  // Get current track based on time
  const currentTrack = tracks.find(track => 
    currentTime >= track.startTime && 
    (track.endTime === null || currentTime < track.endTime)
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
              {episode.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Track Display */}
      {currentTrack && (
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentTrack.title}</p>
              <p className="text-sm text-gray-400">{currentTrack.artist}</p>
            </div>
            <div className="flex space-x-2">
              {currentTrack.spotifyId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openSpotifyTrack(currentTrack.spotifyId!)}
                  className="text-green-500 hover:text-green-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  Spotify
                </Button>
              )}
              {currentTrack.soundcloudUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openSoundCloudTrack(currentTrack.soundcloudUrl!)}
                  className="text-orange-500 hover:text-orange-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  SoundCloud
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracklist */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">TRACKLIST</h3>
        <div className="space-y-3">
          {tracks.map((track) => (
            <div key={track.id} className="group relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 w-8">
                      {track.trackNumber}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowTracklist(!showTracklist)}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Track actions (similar to NTS) */}
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col space-y-1 text-xs">
                  {track.spotifyId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSpotifyTrack(track.spotifyId!)}
                      className="justify-start h-8 text-green-500 hover:text-green-400"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      SEARCH ON SPOTIFY
                    </Button>
                  )}
                  {track.soundcloudUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSoundCloudTrack(track.soundcloudUrl!)}
                      className="justify-start h-8 text-orange-500 hover:text-orange-400"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      SEARCH ON SOUNDCLOUD
                    </Button>
                  )}
                  {track.youtubeUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openYouTubeTrack(track.youtubeUrl!)}
                      className="justify-start h-8 text-red-500 hover:text-red-400"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      SEARCH ON YOUTUBE
                    </Button>
                  )}
                  {track.discogsUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDiscogsTrack(track.discogsUrl!)}
                      className="justify-start h-8 text-purple-500 hover:text-purple-400"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      SEARCH ON DISCOGS
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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