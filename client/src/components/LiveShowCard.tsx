import { useQuery } from '@tanstack/react-query';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/providers/AudioProvider';
import type { HeroBanner } from '@shared/schema';

interface LiveShowCardProps {
  streamUrl?: string;
  fallbackImage?: string;
}

interface NowPlayingData {
  now_playing?: {
    song?: {
      title?: string;
      artist?: string;
      text?: string;
      art?: string;
    };
  };
  live?: {
    is_live?: boolean;
    streamer_name?: string;
  };
}

export default function LiveShowCard({
  streamUrl = '/stream.mp3',
  fallbackImage = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop'
}: LiveShowCardProps) {
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';

  const { data: activeBanner } = useQuery<HeroBanner | null>({
    queryKey: ['/api/hero-banners/active'],
    refetchInterval: 60000,
  });

  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000,
  });

  const isLive = nowPlaying?.live?.is_live || false;
  const streamerName = nowPlaying?.live?.streamer_name || '';
  const artist = nowPlaying?.now_playing?.song?.artist || '';
  const title = nowPlaying?.now_playing?.song?.title || 'Enamorado Radio';
  const songArtwork = nowPlaying?.now_playing?.song?.art || fallbackImage;
  const artwork = activeBanner?.imageUrl || songArtwork;

  const handlePlayPause = async () => {
    if (isPlaying) {
      actions.pause();
    } else {
      await actions.play(streamUrl, {
        title: isLive ? streamerName : title,
        artist: isLive ? 'Live' : artist,
        artwork,
        isLive,
      });
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '420px' }}
      onClick={handlePlayPause}
      role="button"
      aria-label={isPlaying ? 'Pause live radio' : 'Play live radio'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlayPause()}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      {/* Overlay — darker at bottom, lighter at top for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/85" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 md:p-10 text-white" style={{ minHeight: '420px' }}>

        {/* Top: station name + live badge */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-display font-black uppercase leading-none text-white"
              style={{ fontSize: 'clamp(2.8rem, 9vw, 6rem)', letterSpacing: '-0.01em' }}
            >
              Enamorado
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-white/70 mt-1">
              Internet Radio · San Antonio
            </p>
          </div>

          {isLive && (
            <div className="flex items-center gap-2 bg-[var(--live-dot)] text-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-live-pulse" />
              Live
            </div>
          )}
        </div>

        {/* Bottom: now playing + play button */}
        <div className="space-y-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/60 mb-1">
              {isLive ? 'On Air' : 'Now Playing'}
            </p>
            <p className="font-display font-700 uppercase text-white leading-tight"
              style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>
              {isLive ? streamerName : title}
            </p>
            {!isLive && artist && (
              <p className="font-mono text-sm text-white/80 mt-1">{artist}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
              className="flex items-center gap-3 bg-white text-[var(--ink)] hover:bg-[var(--olive-subtle)] px-7 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isPlaying
                ? <><Pause className="w-4 h-4" fill="currentColor" /> Pause</>
                : <><Play className="w-4 h-4" fill="currentColor" /> Listen Live</>
              }
            </button>

            <a
              href="#latest"
              className="font-mono text-xs uppercase tracking-widest text-white/70 hover:text-white underline-offset-4 hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Browse Archives →
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
