import { useState } from 'react';
import { Link } from 'wouter';
import { Play, Pause, Volume2, VolumeX, Music, Share2, Link2, Check } from 'lucide-react';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import type { Episode } from '@shared/schema';
import { useAudio } from '@/providers/AudioProvider';

interface EpisodePlayerProps {
  episode: Episode;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const { state, actions } = useAudio();
  const { toast } = useToast();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Check if this specific episode is currently loaded/playing
  const isThisEpisodeLoaded = state.src === episode.audioUrl;
  const isPlaying = isThisEpisodeLoaded && state.status === 'playing';
  const currentTime = isThisEpisodeLoaded ? state.currentTime : 0;
  const volume = state.volume * 100;
  
  // Get the shareable URL for this episode
  const getShareUrl = () => {
    return `${window.location.origin}/episode/${episode.id}`;
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Episode link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL from your browser",
        variant: "destructive",
      });
    }
  };
  
  const handleShareTwitter = () => {
    const text = `Check out "${episode.title}" by ${episode.hostName} on Enamorado Radio`;
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
    setShareOpen(false);
  };
  
  const handleShareFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    setShareOpen(false);
  };

  // Parse tracklist from JSON string
  const tracks: Array<{artist: string; title: string; timestamp?: number}> = (() => {
    try { return episode.tracklist ? JSON.parse(episode.tracklist) : []; }
    catch { return []; }
  })();

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTrackSeek = async (track: typeof tracks[number]) => {
    if (track.timestamp == null) return;
    if (!isThisEpisodeLoaded) {
      await actions.play(episode.audioUrl, {
        title: episode.title,
        artist: episode.hostName,
        artwork: episode.artworkUrl || undefined,
        isLive: false,
      });
    }
    actions.seek(track.timestamp);
  };

  // Which track is currently active (highest timestamp ≤ currentTime)
  const activeTrackIndex = tracks.reduce<number>((active, track, i) => {
    if (track.timestamp != null && track.timestamp <= currentTime) return i;
    return active;
  }, -1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    console.log('🎵 Episode player: handlePlayPause, isPlaying:', isPlaying, 'isLoaded:', isThisEpisodeLoaded);
    
    if (isPlaying) {
      console.log('⏸ Pausing episode audio...');
      actions.pause();
    } else if (isThisEpisodeLoaded) {
      console.log('▶️ Resuming episode audio...');
      actions.toggle();
    } else {
      console.log('▶️ Starting episode audio...');
      try {
        await actions.play(episode.audioUrl, {
          title: episode.title,
          artist: episode.hostName,
          artwork: episode.artworkUrl || undefined,
          isLive: false,
        });
        console.log('✅ Episode playback started via shared AudioProvider');
      } catch (error) {
        console.error('❌ Episode play error:', error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * episode.duration;
    actions.seek(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    actions.setVolume(newVolume);
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

  const progress = episode.duration > 0 ? (currentTime / episode.duration) * 100 : 0;

  return (
    <div className="bg-black text-white min-h-screen pb-20">
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
          <div className="flex items-center gap-3">
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="button-share-episode"
                  aria-label="Share episode"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                align="end"
                className="w-48 p-2 bg-gray-900/95 backdrop-blur-sm border-gray-700"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="justify-start text-white hover:bg-gray-800"
                    data-testid="button-copy-link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareTwitter}
                    className="justify-start text-white hover:bg-gray-800"
                    data-testid="button-share-twitter"
                  >
                    <PlatformIcon platform="x" size={16} className="mr-2" />
                    Share on X
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareFacebook}
                    className="justify-start text-white hover:bg-gray-800"
                    data-testid="button-share-facebook"
                  >
                    <PlatformIcon platform="facebook" size={16} className="mr-2" />
                    Share on Facebook
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Badge className="bg-navy text-white font-mono">EPISODE</Badge>
          </div>
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
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-display font-black uppercase text-2xl tracking-wide text-white">Tracklist</h3>
            {tracks.length > 0 && (
              <span className="font-mono text-xs uppercase tracking-widest text-white/30">{tracks.length} tracks</span>
            )}
          </div>

          {tracks.length === 0 ? (
            <div className="border border-white/10 py-12 flex flex-col items-center gap-3">
              <Music className="w-8 h-8 text-white/20" />
              <p className="font-mono text-xs uppercase tracking-widest text-white/30">
                No tracklist for this episode
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {tracks.map((track, index) => {
                const isActive = index === activeTrackIndex;
                const hasTimestamp = track.timestamp != null;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTrackSeek(track)}
                    disabled={!hasTimestamp}
                    className={[
                      "w-full flex items-center gap-5 px-4 py-3 text-left transition-colors",
                      hasTimestamp ? "hover:bg-white/[0.04] cursor-pointer group" : "cursor-default",
                      isActive ? "bg-white/[0.06]" : "",
                    ].join(" ")}
                  >
                    {/* Timestamp */}
                    <span className={[
                      "font-mono text-[11px] tabular-nums min-w-[36px] shrink-0 transition-colors",
                      isActive ? "text-blue" : "text-white/25 group-hover:text-white/50",
                    ].join(" ")}>
                      {hasTimestamp ? formatTimestamp(track.timestamp!) : `${String(index + 1).padStart(2, '0')}`}
                    </span>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <span className={[
                        "font-mono text-[13px] font-medium transition-colors",
                        isActive ? "text-blue" : "text-white group-hover:text-white",
                      ].join(" ")}>
                        {track.artist}
                      </span>
                      {track.title && (
                        <span className="font-mono text-[13px] text-white/40 transition-colors group-hover:text-white/60">
                          {" "}— {track.title}
                        </span>
                      )}
                    </div>

                    {/* Active waveform indicator */}
                    {isActive && isPlaying && (
                      <div className="flex items-end gap-[2px] h-3 shrink-0">
                        {[5, 10, 7, 12, 4].map((h, i) => (
                          <div key={i} className="w-[2px] bg-blue rounded-[1px] hero-wave-bar"
                               style={{ height: h, animationDelay: `${[0,.1,.05,.15,.08][i]}s` }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
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
              
              {/* Persistent playback indicator */}
              {isThisEpisodeLoaded && (
                <span className="text-xs text-sky-400 font-mono hidden sm:inline">
                  Browse the site while listening
                </span>
              )}
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