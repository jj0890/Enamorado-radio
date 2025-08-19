import { useEffect, useRef, useState } from 'react';

// HTTPS-safe proxy URLs (routes through our server)
const STREAM_URL = '/stream.mp3'; // Proxied stream
const NOWPLAYING_URL = '/nowplaying'; // Proxied now playing

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [nowPlaying, setNowPlaying] = useState({
    title: 'Enamorado Radio',
    subtitle: 'Click to tune in'
  });
  const [sourceSet, setSourceSet] = useState(false);

  // Ensure audio source is set only when user plays (saves bandwidth)
  const ensureSource = () => {
    console.log('🎵 ensureSource called, sourceSet:', sourceSet);
    if (!sourceSet && audioRef.current) {
      const streamUrl = `${STREAM_URL}?t=${Date.now()}`;
      audioRef.current.src = streamUrl;
      setSourceSet(true);
      console.log('🎵 Audio source set to:', streamUrl);
    }
  };

  // Play/Pause toggle
  const handleToggle = async () => {
    console.log('🎵 handleToggle called, isPlaying:', isPlaying);
    if (!audioRef.current) {
      console.error('❌ audioRef.current is null');
      return;
    }
    
    ensureSource();
    
    if (!isPlaying) {
      try {
        console.log('🎵 Attempting to play audio...');
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('✅ Audio playing successfully');
      } catch (error) {
        console.error('❌ Audio play failed:', error);
        alert('Failed to start audio: ' + (error as Error).message);
      }
    } else {
      console.log('⏸ Pausing audio...');
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    console.log('🔊 Volume set to:', newVolume);
  };

  // Poll AzuraCast for now playing info
  const pollNowPlaying = async () => {
    try {
      console.log('📡 Polling now playing...');
      const response = await fetch(NOWPLAYING_URL, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: NowPlayingData = await response.json();
      console.log('📡 Now playing response:', data);

      const song = data.now_playing?.song || {};
      const artist = song.artist || '';
      const track = song.title || 'Live Stream';

      const title = artist && track && track !== 'Station Offline' 
        ? `${artist} — ${track}` 
        : 'Enamorado Radio';
      
      const isLive = data.live?.is_live;
      const subtitle = isLive
        ? `LIVE • ${data.live.streamer_name || 'On Air'}`
        : track === 'Station Offline' ? 'Station Offline' : 'AutoDJ';

      setNowPlaying({ title, subtitle });
      console.log('✅ Metadata updated:', { title, subtitle });
    } catch (error) {
      console.error('❌ NowPlaying fetch error:', error);
      setNowPlaying({ 
        title: 'Enamorado Radio', 
        subtitle: 'Connection Error' 
      });
    }
  };

  // Initialize audio volume and polling
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      // Add event listeners for debugging
      const audio = audioRef.current;
      
      const onLoadStart = () => console.log('🎵 Audio loadstart');
      const onCanPlay = () => console.log('🎵 Audio canplay');
      const onPlaying = () => console.log('🎵 Audio playing event');
      const onPause = () => console.log('🎵 Audio pause event');
      const onError = (e: Event) => console.error('🎵 Audio error:', e);
      
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('error', onError);
      
      return () => {
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('error', onError);
      };
    }
    
    // Initial poll and set up interval
    pollNowPlaying();
    const interval = setInterval(pollNowPlaying, 15000); // Poll every 15 seconds
    
    return () => clearInterval(interval);
  }, [volume]);

  return (
    <>
      {/* Top-right "Listen Live" button - matches sharedfrequenciesradio.com */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
          {isExpanded ? (
            // Expanded player
            <div className="bg-black text-white rounded-lg shadow-xl p-4 border border-red-600">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-mono text-red-500">ENAMORADO RADIO</div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white text-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleToggle}
                  className="bg-red-600 hover:bg-red-700 rounded-full w-12 h-12 flex items-center justify-center text-lg transition-colors"
                >
                  {isPlaying ? '⏸' : '▶️'}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {nowPlaying.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {nowPlaying.subtitle}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 accent-red-600"
                />
              </div>
            </div>
          ) : (
            // Collapsed "Listen Live" button - exactly like sharedfrequenciesradio.com
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-mono text-sm transition-all duration-200 shadow-lg flex items-center gap-2"
            >
              🎵 Listen Live
              {isPlaying && <span className="animate-pulse">●</span>}
            </button>
          )}
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
      />
    </>
  );
}