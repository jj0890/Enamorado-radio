import { useEffect, useState } from 'react';
import { useAudio } from '@/providers/AudioProvider';

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
        : track === 'Station Offline' ? 'Station Offline' : 'AutoDJ';

      setNowPlaying({ title: displayTitle, subtitle });
      console.log('✅ StickyPlayer metadata updated:', { title: displayTitle, subtitle });
      
      // Fetch artwork if we have artist and title
      if (artist && track && track !== 'Station Offline' && track !== 'Live Stream') {
        try {
          const artworkResponse = await fetch(
            `${ARTWORK_URL}?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(track)}`,
            { cache: 'no-store' }
          );
          
          if (artworkResponse.ok) {
            const artworkData = await artworkResponse.json();
            if (artworkData.artwork) {
              setArtwork(artworkData.artwork);
              console.log('🎨 StickyPlayer artwork updated:', artworkData.artwork);
            } else {
              setArtwork(null);
            }
          }
        } catch (artworkError) {
          console.error('❌ StickyPlayer artwork fetch error:', artworkError);
          setArtwork(null);
        }
      } else {
        setArtwork(null);
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

  return (
    <>
      {/* Bottom sticky player */}
      <div 
        data-sticky-player
        data-testid="sticky-radio-player"
        className="fixed bottom-0 left-0 right-0 z-50 bg-black text-white border-t border-gray-800"
      >
        <div className="flex items-center h-16 px-4">
          {/* Station Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-lg">
              E
            </div>
            <div className="font-mono text-sm">
              <div className="text-red-500 font-bold">ENAMORADO</div>
              <div className="text-gray-400 text-xs">RADIO</div>
            </div>
          </div>

          {/* Play/Pause Controls */}
          <div className="flex items-center gap-2 ml-6">
            <button
              onClick={handleToggle}
              data-testid="button-sticky-play-pause"
              className="w-8 h-8 bg-white text-black flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="text-sm font-medium">
              {isPlaying ? 'On Air' : 'Off Air'}
            </div>
          </div>

          {/* Now Playing Info with Artwork */}
          <div className="flex-1 mx-6 flex items-center justify-center gap-3">
            {/* Album Artwork */}
            {artwork && (
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={artwork} 
                  alt="Album artwork" 
                  className="w-full h-full object-cover"
                  onError={() => setArtwork(null)}
                />
              </div>
            )}
            
            {/* Track Info */}
            <div className="text-center">
              <div className="text-sm font-medium">
                {nowPlaying.title}
              </div>
              <div className="text-xs text-gray-400">
                {nowPlaying.subtitle}
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              data-testid="volume-slider"
              className="w-20 accent-red-600"
            />
          </div>
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-16" />
    </>
  );
}
