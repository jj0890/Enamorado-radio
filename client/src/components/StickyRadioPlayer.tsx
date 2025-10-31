import { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/providers/AudioProvider';
import AudioProgressBar from '@/components/AudioProgressBar';
import { audioController } from '@/lib/audioController';
import { Volume2, VolumeX } from 'lucide-react';

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

  const [isExpanded, setIsExpanded] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({
    title: 'Enamorado Radio',
    subtitle: 'Click to tune in'
  });
  const [artwork, setArtwork] = useState<string | null>(null);
  const [previousArtwork, setPreviousArtwork] = useState<string | null>(null); // Prevent flicker
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const volumePopoverRef = useRef<HTMLDivElement>(null);

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
      
      const isLive = data.live?.is_live;
      const subtitle = isLive
        ? `LIVE • ${data.live?.streamer_name || 'On Air'}`
        : track === 'Station Offline' ? 'Station Offline' : '';

      setNowPlaying({ title: displayTitle, subtitle });
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
          setArtwork(cachedArtwork);
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
                setArtwork(artworkData.artwork);
                console.log('🎨 StickyPlayer artwork fetched and cached:', artworkData.artwork);
              } else if (!artwork) {
                setArtwork(null);
              }
            }
          } catch (artworkError) {
            console.error('❌ StickyPlayer artwork fetch error:', artworkError);
            // Keep previous artwork on error to prevent flicker
          }
        }
      } else if (!artwork) {
        setArtwork(null);
        setPreviousArtwork(null);
      }
    } catch (error) {
      console.error('❌ StickyPlayer NowPlaying fetch error:', error);
      setNowPlaying({ 
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

  return (
    <>
      {/* Bottom sticky player - Translucent NTS-style */}
      <div 
        data-sticky-player
        data-testid="sticky-radio-player"
        className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 dark:bg-black/90 backdrop-blur-lg text-white border-t border-white/10"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center h-16 px-2 md:px-4 gap-2 md:gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={handleToggle}
            data-testid="button-sticky-play-pause"
            className="w-10 h-10 md:w-12 md:h-12 bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 rounded"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Now Playing Info with Artwork */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {/* Album Artwork - hidden on mobile */}
            {(artwork || previousArtwork) && (
              <div className="hidden md:block w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800 relative">
                {previousArtwork && previousArtwork !== artwork && (
                  <img 
                    src={previousArtwork} 
                    alt="Previous artwork" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {artwork && (
                  <img 
                    src={artwork} 
                    alt="Album artwork" 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    onError={() => setArtwork(null)}
                    onLoad={() => setPreviousArtwork(null)}
                  />
                )}
              </div>
            )}
            
            {/* Track Info - Truncated */}
            <div className="min-w-0 flex-1">
              <div className="text-xs md:text-sm font-medium truncate">
                {nowPlaying.title}
              </div>
              {nowPlaying.subtitle && (
                <div className="text-[10px] md:text-xs text-gray-400 truncate">
                  {nowPlaying.subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Volume Control Popover - hidden on mobile */}
          <div className="hidden md:block relative flex-shrink-0" ref={volumePopoverRef}>
            <button
              onClick={() => setShowVolumePopover(!showVolumePopover)}
              data-testid="button-volume-toggle"
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded"
              title="Volume"
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            {showVolumePopover && (
              <div 
                className="absolute bottom-12 right-0 bg-neutral-900 rounded-xl p-3 w-32 shadow-lg border border-white/10"
                data-testid="volume-popover"
              >
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-400 font-mono">Volume</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    data-testid="volume-slider"
                    className="w-full accent-white"
                    style={{
                      background: `linear-gradient(to right, white ${volume * 100}%, #4b5563 ${volume * 100}%)`
                    }}
                  />
                  <div className="text-xs text-gray-400 font-mono text-center">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Row - Always visible for better UX */}
        <div className="px-4 pb-2">
          {/* Live streams are never seekable, regardless of AutoDJ vs Live DJ */}
          <AudioProgressBar seekable={false} />
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-16" />
    </>
  );
}
