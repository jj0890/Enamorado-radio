import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreHorizontal, ExternalLink, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Episode } from '@shared/schema';

interface EpisodePlayerProps {
  episode: Episode;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showTracklist, setShowTracklist] = useState(true);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse tracklist from JSON string
  const tracks: Array<{artist: string; title: string; timestamp?: number}> = 
    episode.tracklist ? JSON.parse(episode.tracklist) : [];
  const currentTrack = null;

  // Hide persistent radio player when on episode page
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const hidePlayer = () => {
      attempts++;
      const persistentPlayer = document.querySelector('[data-sticky-player]');
      console.log(`🎵 Attempt ${attempts}: Looking for sticky player...`, persistentPlayer);
      
      if (persistentPlayer) {
        (persistentPlayer as HTMLElement).style.display = 'none';
        console.log('✅ Sticky player HIDDEN successfully!');
        return true;
      }
      
      if (attempts < maxAttempts) {
        console.log(`⏳ Retry in 200ms (attempt ${attempts}/${maxAttempts})`);
        setTimeout(hidePlayer, 200);
      } else {
        console.log('❌ Could not find sticky player after', maxAttempts, 'attempts');
      }
      return false;
    };

    // Start trying to hide it
    hidePlayer();
    
    // Cleanup: Show it again when leaving
    return () => {
      const persistentPlayer = document.querySelector('[data-sticky-player]');
      if (persistentPlayer) {
        (persistentPlayer as HTMLElement).style.display = 'block';
        console.log('✅ Sticky player restored on cleanup');
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
      
      // Pause the live radio player first
      const liveRadioAudio = document.querySelector('audio[src*="/stream.mp3"]') as HTMLAudioElement;
      if (liveRadioAudio && !liveRadioAudio.paused) {
        console.log('⏸ Pausing live radio player to play episode');
        liveRadioAudio.pause();
      }
      
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
      <div className="p-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-white transition-colors font-mono text-sm"
            data-testid="link-back-home"
            aria-label="Back to home page"
          >
            ← Back to Home
          </Link>
          <Badge className="bg-navy text-white font-mono">EPISODE</Badge>
        </div>
      </div>

      {/* Episode Info with Prominent Play Button */}
      <div className="p-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Artwork with Hover Play Button */}
            <div className="relative w-full md:w-64 h-64 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 group shadow-2xl">
              {episode.artworkUrl ? (
                <img 
                  src={episode.artworkUrl} 
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Music className="w-24 h-24 text-gray-600" />
                </div>
              )}
              {/* Play/Pause Button Overlay - Only on Hover */}
              <button
                onClick={handlePlayPause}
                data-testid="button-play-episode"
                className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/0 hover:bg-black/60 transition-all"
              >
                <div className="w-20 h-20 rounded-full bg-navy hover:bg-navy-dark flex items-center justify-center transition-all transform hover:scale-110 shadow-lg">
                  {isPlaying ? (
                    <Pause className="h-10 w-10 text-white" />
                  ) : (
                    <Play className="h-10 w-10 text-white ml-1" />
                  )}
                </div>
              </button>
            </div>
            
            {/* Episode Details */}
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 font-mono">{episode.title}</h1>
              <p className="text-gray-400 text-lg mb-2 font-mono">{episode.hostName}</p>
              <p className="text-gray-500 text-sm mb-4 font-mono">
                {episode.seriesTitle} • {formatTime(episode.duration)}
              </p>
              {episode.description && (
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {episode.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {episode.tags?.map((tag: string, index: number) => (
                  <Link key={index} href={`/episodes?tag=${encodeURIComponent(tag)}`}>
                    <Badge className="bg-gray-800 text-gray-300 hover:bg-navy hover:text-white transition-colors font-mono cursor-pointer">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Track Display - disabled for now */}

      {/* Tracklist */}
      <div className="p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 font-mono">TRACKLIST</h3>
          {tracks.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <Music className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500 font-mono">
                No tracklist available for this episode
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-700 hover:border-sky-500 p-4 rounded-lg transition-all hover:bg-gray-900 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-sky-400 font-mono font-bold text-sm pt-0.5 min-w-[2rem]">
                      #{String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-white font-mono group-hover:text-sky-400 transition-colors">
                        {track.artist}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {track.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Controls - Fixed Bottom */}
      <div 
        data-testid="episode-player-controls"
        className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 p-4 z-[60]"
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-3">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:text-navy hover:bg-gray-900 transition-colors"
                data-testid="button-play-pause-controls"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>

              {/* Time Display */}
              <div className="flex items-center gap-2 text-sm font-mono">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-400">{formatTime(episode.duration)}</span>
              </div>
            </div>

            {/* Volume Control - Vertical SoundCloud-style Popover */}
            <Popover open={volumeOpen} onOpenChange={setVolumeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-sky-400 transition-colors"
                  data-testid="button-volume-episode"
                  aria-label={`Volume ${volume}%`}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="center"
                className="w-12 p-2 bg-gray-900/95 backdrop-blur-sm border-gray-700"
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Volume Percentage */}
                  <div className="text-xs font-mono text-white font-bold">
                    {volume}%
                  </div>
                  
                  {/* Vertical Slider */}
                  <div className="h-[100px] flex items-center">
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-full"
                      aria-label="Volume control"
                      data-testid="slider-volume-vertical"
                      style={{
                        writingMode: 'bt-lr' as any,
                        WebkitAppearance: 'slider-vertical' as any,
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}