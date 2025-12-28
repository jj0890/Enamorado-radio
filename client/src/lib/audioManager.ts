// Audio Manager - Handles switching between auto-rotation and user-selected mixes
export type AudioSource = 'live' | 'rotation' | 'user-selected';
export type PlaybackMode = 'auto' | 'manual';

export interface AudioState {
  isPlaying: boolean;
  currentTrack: {
    id?: number;
    title: string;
    artist: string;
    url?: string;
    imageUrl?: string;
    source: AudioSource;
  } | null;
  mode: PlaybackMode;
  volume: number;
  position: number;
  duration: number;
}

export interface FeaturedMix {
  id: number;
  title: string;
  name: string; // artist
  url: string;
  metadata?: {
    imageUrl?: string;
    platform?: string;
  };
}

class AudioManager {
  private listeners: ((state: AudioState) => void)[] = [];
  private state: AudioState = {
    isPlaying: false,
    currentTrack: null,
    mode: 'auto',
    volume: 0.7,
    position: 0,
    duration: 0,
  };

  private icecastUrl = 'http://24.199.109.18:8000/stream';
  private featuredMixRotation: FeaturedMix[] = [];
  private rotationIndex = 0;
  private rotationInterval: NodeJS.Timeout | null = null;

  // Subscribe to state changes
  subscribe(listener: (state: AudioState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Initialize with featured mixes for rotation
  setFeaturedMixes(mixes: FeaturedMix[]) {
    this.featuredMixRotation = mixes;
    console.log(`AudioManager: Loaded ${mixes.length} featured mixes for rotation`);
  }

  // Check if live stream is active
  async checkLiveStream(): Promise<boolean> {
    try {
      const response = await fetch(this.icecastUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Start auto-rotation mode (default behavior)
  async startAutoMode() {
    this.state.mode = 'auto';
    
    // Try live stream first
    const isLiveActive = await this.checkLiveStream();
    
    if (isLiveActive) {
      this.playLiveStream();
    } else {
      this.startFeaturedRotation();
    }
    
    this.notify();
  }

  // Play live Icecast stream
  private playLiveStream() {
    this.state.currentTrack = {
      title: 'Live Stream',
      artist: 'Enamorado Radio',
      url: this.icecastUrl,
      source: 'live',
    };
    this.state.isPlaying = true;
    console.log('AudioManager: Playing live stream');
    this.notify();
  }

  // Start rotating through featured mixes
  private startFeaturedRotation() {
    if (this.featuredMixRotation.length === 0) {
      this.state.currentTrack = {
        title: 'No mixes available',
        artist: 'Submit your mix!',
        source: 'rotation',
      };
      this.notify();
      return;
    }

    this.playNextInRotation();
    
    // Set up rotation timer (every 30 minutes)
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    this.rotationInterval = setInterval(() => {
      if (this.state.mode === 'auto') {
        this.playNextInRotation();
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  private playNextInRotation() {
    if (this.featuredMixRotation.length === 0) return;

    const mix = this.featuredMixRotation[this.rotationIndex];
    this.state.currentTrack = {
      id: mix.id,
      title: mix.title,
      artist: mix.name,
      url: mix.url,
      imageUrl: mix.metadata?.imageUrl,
      source: 'rotation',
    };
    this.state.isPlaying = true;
    
    this.rotationIndex = (this.rotationIndex + 1) % this.featuredMixRotation.length;
    
    console.log(`AudioManager: Playing featured mix - "${mix.title}" by ${mix.name}`);
    this.notify();
  }

  // User clicks on a specific mix (manual mode)
  playUserSelectedMix(mix: FeaturedMix) {
    // Stop auto-rotation
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }

    this.state.mode = 'manual';
    this.state.currentTrack = {
      id: mix.id,
      title: mix.title,
      artist: mix.name,
      url: mix.url,
      imageUrl: mix.metadata?.imageUrl,
      source: 'user-selected',
    };
    this.state.isPlaying = true;

    console.log(`AudioManager: User selected "${mix.title}" by ${mix.name}`);
    this.notify();

    // Show toast notification
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('audio-toast', {
        detail: { message: `Now playing: ${mix.title}` }
      }));
    }
  }

  // Return to auto-rotation mode
  returnToRotation() {
    console.log('AudioManager: Returning to auto-rotation mode');
    this.startAutoMode();
  }

  // Playback controls
  togglePlayback() {
    this.state.isPlaying = !this.state.isPlaying;
    this.notify();
  }

  setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.notify();
  }

  skip() {
    if (this.state.mode === 'auto' && this.state.currentTrack?.source === 'rotation') {
      this.playNextInRotation();
    }
  }

  // Get current state
  getState(): AudioState {
    return { ...this.state };
  }

  // Cleanup
  destroy() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    this.listeners = [];
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// React hook for using audio manager
import { useState, useEffect } from 'react';

export function useAudioManager() {
  const [state, setState] = useState<AudioState>(audioManager.getState());

  useEffect(() => {
    const unsubscribe = audioManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    playUserSelectedMix: audioManager.playUserSelectedMix.bind(audioManager),
    returnToRotation: audioManager.returnToRotation.bind(audioManager),
    togglePlayback: audioManager.togglePlayback.bind(audioManager),
    setVolume: audioManager.setVolume.bind(audioManager),
    skip: audioManager.skip.bind(audioManager),
  };
}