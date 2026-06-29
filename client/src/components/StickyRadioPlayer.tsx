import { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/providers/AudioProvider';
import AudioProgressBar from '@/components/AudioProgressBar';
import { audioController } from '@/lib/audioController';
import { Volume2, VolumeX, ChevronUp, ChevronDown, Play, Pause, Radio } from 'lucide-react';

// HTTPS-safe proxy URLs (routes through our server)
const STREAM_URL = '/stream.mp3'; // Proxied stream
const NOWPLAYING_URL = '/api/nowplaying'; // Proxied now playing
const ARTWORK_URL = '/api/artwork'; // Spotify artwork

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
  // Use shared audio context
  const { state, actions } = useAudio();
  const isPlaying = state.status === 'playing';
  const volume = state.volume;
  
  // Check if we're playing episode content (not live stream)
  const isPlayingEpisode = state.src && !state.src.includes('stream.mp3') && state.isLive === false;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [liveNowPlaying, setLiveNowPlaying] = useState({
    title: 'Enamorado Radio',
    subtitle: 'Click to tune in'
  });
  const [isActuallyLive, setIsActuallyLive] = useState(false);
  const [streamerName, setStreamerName] = useState<string | null>(null);
  const [liveArtwork, setLiveArtwork] = useState<string | null>(null);
  const [previousArtwork, setPreviousArtwork] = useState<string | null>(null);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const volumePopoverRef = useRef<HTMLDivElement>(null);
  
  // Use episode metadata if playing an episode, otherwise use live data
  const nowPlaying = isPlayingEpisode 
    ? { 
        title: state.title || 'Episode', 
        subtitle: state.artist || '' 
      }
    : liveNowPlaying;
  
  const artwork = isPlayingEpisode ? (state.artwork || null) : liveArtwork;

  // Play/Pause toggle
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

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    actions.setVolume(newVolume);
    console.log('🔊 StickyPlayer volume set to:', newVolume);
  };

  // Poll AzuraCast for now playing info
  const pollNowPlaying = async () => {
    try {
      console.log('📡 StickyPlayer polling now playing...');
      const response = await fetch(NOWPLAYING_URL, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: NowPlayingData = await response.json();
      console.log('📡 StickyPlayer now playing response:', data);

      const song = data.now_playing?.song || {};
      const artist = song.artist || '';
      const track = song.title || 'Live Stream';

      // Enhanced title mapping for uploaded episodes
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
      
      // Fetch artwork if we have artist and title
      if (artist && track && track !== 'Station Offline' && track !== 'Live Stream') {
        // Create cache key from artist + track
        const cacheKey = `${artist}::${track}`;
        
        // Check cache first
        const cachedArtwork = audioController.getCachedArtwork(cacheKey);
        if (cachedArtwork) {
          console.log('🎨 StickyPlayer using cached artwork:', cachedArtwork);
          setPreviousArtwork(artwork);
          setLiveArtwork(cachedArtwork);
        } else {
          // Fetch from API
          try {
            const artworkResponse = await fetch(
              `${ARTWORK_URL}?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(track)}`,
              { cache: 'no-store' }
            );
            
            if (artworkResponse.ok) {
              const artworkData = await artworkResponse.json();
              if (artworkData.artwork) {
                // Cache the artwork for future use
                audioController.cacheArtwork(cacheKey, artworkData.artwork);
                
                // Keep previous artwork until new one loads to prevent flicker
                setPreviousArtwork(artwork);
                setLiveArtwork(artworkData.artwork);
                console.log('🎨 StickyPlayer artwork fetched and cached:', artworkData.artwork);
              } else if (!artwork) {
                setLiveArtwork(null);
              }
            }
          } catch (artworkError) {
            console.error('❌ StickyPlayer artwork fetch error:', artworkError);
            // Keep previous artwork on error to prevent flicker
          }
        }
      } else if (!artwork) {
        setLiveArtwork(null);
        setPreviousArtwork(null);
      }
    } catch (error) {
      console.error('❌ StickyPlayer NowPlaying fetch error:', error);
      setLiveNowPlaying({ 
        title: 'Enamorado Radio', 
        subtitle: 'Connection Error' 
      });
    }
  };

  // Initialize polling
  useEffect(() => {
    // Initial poll and set up interval
    pollNowPlaying();
    const interval = setInterval(pollNowPlaying, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Close volume popover when clicking outside
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

  const displayArtwork = artwork || previousArtwork;

  return (
    <>
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
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-white/50" /> : <ChevronDown className="w-3.5 h-3.5 text-white/50" />}
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

        {/* Full player */}
        <div className={isCollapsed ? 'hidden' : ''}>
          <div className="flex items-center h-[68px] px-3 md:px-5 gap-3 md:gap-4">

            {/* Artwork */}
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
              {/* LIVE badge + DJ name row */}
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

            {/* Play/Pause */}
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
