import { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/providers/AudioProvider';
import AudioProgressBar from '@/components/AudioProgressBar';
import { audioController } from '@/lib/audioController';
import { Volume2, VolumeX, ChevronUp, ChevronDown, Play, Pause, Radio } from 'lucide-react';

// HTTPS-safe proxy URLs (routes through our server)
const STREAM_URL = '/stream.mp3';
const NOWPLAYING_URL = '/api/nowplaying';
const ARTWORK_URL = '/api/artwork';

interface NowPlayingData {
  now_playing?: {
    song?: {
      artist?: string;
      title?: string;
    };
  };
  live?: {
    is_live?: boolean;
    streamer_name?: string;
  };
}

export default function StickyRadioPlayer() {
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';
  const volume = state.volume;

  const isPlayingEpisode = state.src && !state.src.includes('stream.mp3') && state.isLive === false;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveNowPlaying, setLiveNowPlaying] = useState({
    title: 'Enamorado Radio',
    subtitle: 'Click to tune in',
  });
  const [isActuallyLive, setIsActuallyLive] = useState(false);
  const [streamerName, setStreamerName] = useState<string | null>(null);
  const [liveArtwork, setLiveArtwork] = useState<string | null>(null);
  const [previousArtwork, setPreviousArtwork] = useState<string | null>(null);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const volumePopoverRef = useRef<HTMLDivElement>(null);

  const nowPlaying = isPlayingEpisode
    ? { title: state.title || 'Episode', subtitle: state.artist || '' }
    : liveNowPlaying;

  const artwork = isPlayingEpisode ? (state.artwork || null) : liveArtwork;
  const displayArtwork = artwork || previousArtwork;

  // Lock body scroll when expanded
  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  const handleToggle = async () => {
    console.log('🎵 StickyPlayer handleToggle called, isPlaying:', isPlaying);
    if (isPlaying) {
      actions.pause();
    } else {
      try {
        console.log('🎵 StickyPlayer attempting to play audio...');
        await actions.play(STREAM_URL, {
          title: nowPlaying.title,
          isLive: nowPlaying.subtitle.includes('LIVE'),
        });
        console.log('✅ StickyPlayer audio playing successfully');
      } catch (error) {
        console.error('❌ StickyPlayer audio play failed:', error);
        alert('Failed to start audio: ' + (error as Error).message);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    actions.setVolume(newVolume);
    console.log('🔊 StickyPlayer volume set to:', newVolume);
  };

  const pollNowPlaying = async () => {
    try {
      console.log('📡 StickyPlayer polling now playing...');
      const response = await fetch(NOWPLAYING_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data: NowPlayingData = await response.json();
      console.log('📡 StickyPlayer now playing response:', data);

      const song = data.now_playing?.song || {};
      const artist = song.artist || '';
      const track = song.title || 'Live Stream';

      let displayTitle = 'Enamorado Radio';
      if (artist && track && track !== 'Station Offline') {
        displayTitle = `${artist} — ${track}`;
      } else if (track && track !== 'Station Offline' && track !== 'Live Stream') {
        displayTitle = track;
      }

      const isLive = data.live?.is_live ?? false;
      const djName = data.live?.streamer_name || null;
      const subtitle = isLive
        ? `${djName || 'On Air'}`
        : track === 'Station Offline' ? 'Station Offline' : '';

      setIsActuallyLive(isLive);
      setStreamerName(djName);
      setLiveNowPlaying({ title: displayTitle, subtitle });
      console.log('✅ StickyPlayer metadata updated:', { title: displayTitle, subtitle });

      if (artist && track && track !== 'Station Offline' && track !== 'Live Stream') {
        const cacheKey = `${artist}::${track}`;
        const cachedArtwork = audioController.getCachedArtwork(cacheKey);
        if (cachedArtwork) {
          console.log('🎨 StickyPlayer using cached artwork:', cachedArtwork);
          setPreviousArtwork(artwork);
          setLiveArtwork(cachedArtwork);
        } else {
          try {
            const artworkResponse = await fetch(
              `${ARTWORK_URL}?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(track)}`,
              { cache: 'no-store' }
            );
            if (artworkResponse.ok) {
              const artworkData = await artworkResponse.json();
              if (artworkData.artwork) {
                audioController.cacheArtwork(cacheKey, artworkData.artwork);
                setPreviousArtwork(artwork);
                setLiveArtwork(artworkData.artwork);
                console.log('🎨 StickyPlayer artwork fetched and cached:', artworkData.artwork);
              } else if (!artwork) {
                setLiveArtwork(null);
              }
            }
          } catch (artworkError) {
            console.error('❌ StickyPlayer artwork fetch error:', artworkError);
          }
        }
      } else if (!artwork) {
        setLiveArtwork(null);
        setPreviousArtwork(null);
      }
    } catch (error) {
      console.error('❌ StickyPlayer NowPlaying fetch error:', error);
      setLiveNowPlaying({ title: 'Enamorado Radio', subtitle: 'Connection Error' });
    }
  };

  useEffect(() => {
    pollNowPlaying();
    const interval = setInterval(pollNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePopoverRef.current && !volumePopoverRef.current.contains(event.target as Node)) {
        setShowVolumePopover(false);
      }
    };
    if (showVolumePopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVolumePopover]);

  return (
    <>
      {/* ── Full-screen expanded player ── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
          style={{ background: '#0a0a0a', paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Blurred artwork backdrop */}
          {displayArtwork && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${displayArtwork})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: 'scale(1.15)',
                  filter: 'blur(60px) brightness(0.2) saturate(1.8)',
                }}
              />
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            </>
          )}

          {/* Content */}
          <div className="relative flex flex-col h-full">

            {/* Header row */}
            <div className="flex items-center justify-center px-5 pt-5 pb-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute left-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-white/40" />
              </button>
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/30 select-none">
                Enamorado Radio
              </span>
            </div>

            {/* Artwork */}
            <div className="flex-1 flex items-center justify-center px-10 py-4 min-h-0">
              <div
                className="aspect-square rounded-2xl overflow-hidden"
                style={{
                  width: 'min(72vw, 320px)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                  flexShrink: 0,
                }}
              >
                {displayArtwork ? (
                  <img src={displayArtwork} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Radio className="w-16 h-16 text-white/10" />
                  </div>
                )}
              </div>
            </div>

            {/* Track info */}
            <div className="px-8 pb-4">
              {isActuallyLive && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">Live</span>
                  {streamerName && (
                    <span className="text-[10px] font-mono text-white/30">· {streamerName}</span>
                  )}
                </div>
              )}
              <div className="text-[22px] font-semibold text-white leading-tight truncate">
                {nowPlaying.title}
              </div>
              {nowPlaying.subtitle && (
                <div className="text-base text-white/45 mt-0.5 truncate">
                  {nowPlaying.subtitle}
                </div>
              )}
            </div>

            {/* Episode seek bar */}
            {isPlayingEpisode && (
              <div className="px-8 mb-2">
                <AudioProgressBar seekable />
              </div>
            )}

            {/* Controls */}
            <div
              className="px-8"
              style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
            >
              {/* Play / Pause */}
              <div className="flex items-center justify-center mb-8">
                <button
                  onClick={handleToggle}
                  className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all duration-100"
                >
                  {isPlaying
                    ? <Pause className="w-7 h-7 fill-black text-black" />
                    : <Play className="w-7 h-7 fill-black text-black translate-x-0.5" />
                  }
                </button>
              </div>

              {/* Volume row */}
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-white/25 flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 rounded-full appearance-none"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.85) ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%)`,
                    accentColor: 'white',
                  }}
                />
                <Volume2 className="w-4 h-4 text-white/25 flex-shrink-0" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Sticky mini bar ── */}
      <div
        data-sticky-player
        data-testid="sticky-radio-player"
        className="fixed bottom-0 left-0 right-0 z-50 text-white border-t border-white/10 transition-transform duration-300 ease-in-out"
        style={{
          background: 'rgba(10, 10, 10, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: isCollapsed ? 'translateY(calc(100% - 40px))' : 'translateY(0)',
        }}
      >
        {/* Collapse tab */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-testid="button-player-toggle"
          className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[rgba(10,10,10,0.96)] border border-white/10 border-b-0 rounded-t-md px-5 py-0.5 flex items-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          {isCollapsed
            ? <ChevronUp className="w-3.5 h-3.5 text-white/50" />
            : <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          }
        </button>

        {/* Collapsed mini bar */}
        <div className={`flex items-center h-10 px-3 gap-3 ${isCollapsed ? '' : 'hidden'}`}>
          <button
            onClick={handleToggle}
            data-testid="button-mini-play-pause"
            className="w-7 h-7 flex items-center justify-center text-white hover:text-white/70 transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {displayArtwork && (
            <div className="w-6 h-6 flex-shrink-0 overflow-hidden">
              <img src={displayArtwork} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate">{nowPlaying.title}</span>
          </div>

          {isActuallyLive && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">Live</span>
            </div>
          )}
        </div>

        {/* Full player bar */}
        <div className={isCollapsed ? 'hidden' : ''}>
          <div className="flex items-center h-[68px] px-3 md:px-5 gap-3 md:gap-4">

            {/* Artwork + track info — tap anywhere here to expand */}
            <button
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
              onClick={() => setIsExpanded(true)}
            >
              {/* Artwork thumbnail */}
              <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-white/5 relative">
                {displayArtwork ? (
                  <>
                    {previousArtwork && previousArtwork !== artwork && (
                      <img src={previousArtwork} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <img
                      src={displayArtwork}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                      onError={() => setLiveArtwork(null)}
                      onLoad={() => setPreviousArtwork(null)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="w-4 h-4 text-white/20" />
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                {isActuallyLive && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">Live</span>
                    {streamerName && (
                      <span className="text-[10px] font-mono text-white/40">· {streamerName}</span>
                    )}
                  </div>
                )}
                <div className="text-sm font-medium truncate leading-tight">
                  {nowPlaying.title}
                </div>
                {!isActuallyLive && nowPlaying.subtitle && (
                  <div className="text-[11px] text-white/40 truncate mt-0.5">
                    {nowPlaying.subtitle}
                  </div>
                )}
              </div>
            </button>

            {/* Play/Pause — separate from expand tap */}
            <button
              onClick={handleToggle}
              data-testid="button-sticky-play-pause"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 transition-colors flex-shrink-0"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 fill-black" />
                : <Play className="w-4 h-4 fill-black translate-x-px" />
              }
            </button>

            {/* Volume — desktop only */}
            <div className="hidden md:block relative flex-shrink-0" ref={volumePopoverRef}>
              <button
                onClick={() => setShowVolumePopover(!showVolumePopover)}
                data-testid="button-volume-toggle"
                className="w-9 h-9 flex items-center justify-center hover:bg-white/10 transition-colors rounded-full text-white/50 hover:text-white"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {showVolumePopover && (
                <div
                  className="absolute bottom-12 right-0 bg-[#1a1a1a] rounded-xl p-3 shadow-2xl border border-white/10 flex flex-col items-center"
                  data-testid="volume-popover"
                  style={{ width: '48px' }}
                >
                  <div className="text-[10px] text-white/40 font-mono mb-2">
                    {Math.round(volume * 100)}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    data-testid="volume-slider"
                    className="accent-white"
                    orient="vertical"
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '8px',
                      height: '80px',
                      background: `linear-gradient(to top, white ${volume * 100}%, #333 ${volume * 100}%)`
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-3 md:px-5 pb-2">
            <AudioProgressBar seekable={!!isPlayingEpisode} />
          </div>
        </div>
      </div>

      <div className={isCollapsed ? 'h-10' : 'h-[88px]'} />
    </>
  );
}
