type Meta = { 
  title?: string; 
  artist?: string; 
  artwork?: string; 
  isLive?: boolean;
};

class AudioController {
  private audio = new Audio();
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  constructor() {
    this.audio.preload = "none";
    ["play", "pause", "timeupdate", "ended", "error", "loadedmetadata"].forEach(ev =>
      this.audio.addEventListener(ev, () => this.emit(ev))
    );
    
    console.log('🎵 AudioController singleton initialized');
  }

  on(ev: string, fn: (...args: any[]) => void) {
    if (!this.listeners.has(ev)) {
      this.listeners.set(ev, new Set());
    }
    this.listeners.get(ev)!.add(fn);
    return () => this.listeners.get(ev)!.delete(fn);
  }

  private emit(ev: string, payload?: any) {
    this.listeners.get(ev)?.forEach(f => f(payload));
  }

  async play(src: string) {
    if (this.audio.src !== src) {
      this.audio.src = src;
      console.log('🎵 Audio source set to:', src);
    }
    try {
      await this.audio.play();
      console.log('▶️ Audio playback started');
    } catch (error) {
      console.error('❌ Audio play failed:', error);
      throw error;
    }
  }

  pause() {
    this.audio.pause();
    console.log('⏸ Audio paused');
  }

  toggle() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  setVolume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  seek(t: number) {
    this.audio.currentTime = t;
  }

  get el() {
    return this.audio;
  }

  get isPlaying() {
    return !this.audio.paused;
  }
}

export const audioController = new AudioController();
