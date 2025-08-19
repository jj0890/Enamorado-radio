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
  const [volume, setVolume] = useState(0.9);
  const [nowPlaying, setNowPlaying] = useState({
    title: 'Loading…',
    subtitle: 'Enamorado Radio • Live'
  });
  const [sourceSet, setSourceSet] = useState(false);

  // Ensure audio source is set only when user plays (saves bandwidth)
  const ensureSource = () => {
    if (!sourceSet && audioRef.current) {
      audioRef.current.src = `${STREAM_URL}?t=${Date.now()}`;
      setSourceSet(true);
    }
  };

  // Play/Pause toggle
  const handleToggle = async () => {
    if (!audioRef.current) return;
    
    ensureSource();
    
    if (!isPlaying) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Audio play failed:', error);
      }
    } else {
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
  };

  // Poll AzuraCast for now playing info
  const pollNowPlaying = async () => {
    try {
      const response = await fetch(NOWPLAYING_URL, { cache: 'no-store' });
      const data: NowPlayingData = await response.json();

      const song = data.now_playing?.song || {};
      const artist = song.artist || '';
      const track = song.title || 'Live Stream';

      const title = artist && track ? `${artist} — ${track}` : track;
      
      const isLive = data.live?.is_live;
      const subtitle = isLive
        ? `LIVE • ${data.live.streamer_name || 'On Air'}`
        : 'Enamorado Radio • AutoDJ';

      setNowPlaying({ title, subtitle });
    } catch (error) {
      console.debug('NowPlaying fetch error:', error);
    }
  };

  // Initialize audio volume and polling
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    
    // Initial poll and set up interval
    pollNowPlaying();
    const interval = setInterval(pollNowPlaying, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [volume]);

  return (
    <>
      {/* Sticky Radio Player Bar - matches lyl.live/sharedfrequenciesradio.com */}
      <div className="fixed left-0 right-0 bottom-0 z-50 flex items-center gap-3 px-4 py-3 bg-black text-white border-t border-gray-800 shadow-lg">
        {/* Play/Pause Button */}
        <button
          onClick={handleToggle}
          aria-label="Play/Pause"
          className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-full w-10 h-10 text-base cursor-pointer flex items-center justify-center transition-all duration-200 shadow-md"
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>

        {/* Metadata Display */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis text-sm">
            {nowPlaying.title}
          </div>
          <div className="text-xs opacity-70 text-gray-300">
            {nowPlaying.subtitle}
          </div>
        </div>

        {/* Volume Control */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-32 accent-red-600"
        />

        {/* Audio Element */}
        <audio
          ref={audioRef}
          preload="none"
          crossOrigin="anonymous"
        />
      </div>

      {/* Spacer to prevent content from being hidden behind the sticky player */}
      <div className="h-16" />
    </>
  );
}