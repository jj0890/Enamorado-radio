import { create } from 'zustand';

interface RadioPlaybackState {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  volume: number;
  nowPlaying: {
    title: string;
    artist: string;
    isLive: boolean;
    streamerName?: string;
  };
  
  // Actions
  init: (streamUrl: string) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlayPause: () => Promise<void>;
  setVolume: (volume: number) => void;
  updateNowPlaying: (data: any) => void;
}

// Singleton audio element
let audioInstance: HTMLAudioElement | null = null;

const getAudioInstance = (streamUrl: string = '/stream.mp3'): HTMLAudioElement => {
  if (!audioInstance) {
    audioInstance = new Audio(streamUrl);
    audioInstance.volume = 0.7;
    audioInstance.preload = 'none';
  }
  return audioInstance;
};

export const useRadioPlayback = create<RadioPlaybackState>()((set, get) => ({
  audio: null,
  isPlaying: false,
  volume: 70,
  nowPlaying: {
    title: 'Enamorado Radio',
    artist: '',
    isLive: false,
  },

  init: (streamUrl: string) => {
    const audio = getAudioInstance(streamUrl);
    
    // Set up event listeners
    audio.addEventListener('play', () => {
      console.log('🎵 Radio playback started');
      set({ isPlaying: true });
    });
    
    audio.addEventListener('pause', () => {
      console.log('⏸ Radio playback paused');
      set({ isPlaying: false });
    });
    
    audio.addEventListener('ended', () => {
      set({ isPlaying: false });
    });

    set({ audio });
  },

  play: async () => {
    const { audio } = get();
    if (!audio) {
      console.warn('Audio not initialized');
      return;
    }
    
    try {
      await audio.play();
      set({ isPlaying: true });
    } catch (error) {
      console.error('Playback failed:', error);
      set({ isPlaying: false });
    }
  },

  pause: () => {
    const { audio } = get();
    if (!audio) {
      console.warn('Audio not initialized');
      return;
    }
    
    audio.pause();
    set({ isPlaying: false });
  },

  togglePlayPause: async () => {
    const { audio, isPlaying } = get();
    
    if (!audio) {
      // Initialize on first interaction
      get().init('/stream.mp3');
      return get().togglePlayPause(); // Retry after init
    }

    if (isPlaying) {
      get().pause();
    } else {
      await get().play();
    }
  },

  setVolume: (volume: number) => {
    const { audio } = get();
    if (audio) {
      audio.volume = volume / 100;
    }
    set({ volume });
  },

  updateNowPlaying: (data: any) => {
    const isLive = data?.live?.is_live || false;
    const streamerName = data?.live?.streamer_name || '';
    
    if (isLive && streamerName) {
      set({
        nowPlaying: {
          title: streamerName,
          artist: 'LIVE',
          isLive: true,
          streamerName,
        },
      });
    } else if (data?.now_playing?.song) {
      const { artist, title, text } = data.now_playing.song;
      set({
        nowPlaying: {
          title: title || text || 'Enamorado Radio',
          artist: artist || '',
          isLive: false,
        },
      });
    }
  },
}));
