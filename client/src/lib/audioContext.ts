export class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentStream: string | null = null;
  private listeners: Map<string, (event: any) => void> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private createAudioElement(src: string): HTMLAudioElement {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'none';
    this.audioElement.src = src;

    // Connect to audio context if available
    if (this.audioContext && this.gainNode) {
      try {
        const source = this.audioContext.createMediaElementSource(this.audioElement);
        source.connect(this.gainNode);
      } catch (error) {
        console.warn('Failed to connect audio element to context:', error);
      }
    }

    return this.audioElement;
  }

  async loadStream(streamUrl: string): Promise<void> {
    if (this.currentStream === streamUrl && this.audioElement) {
      return;
    }

    this.currentStream = streamUrl;
    this.audioElement = this.createAudioElement(streamUrl);

    return new Promise((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error('Failed to create audio element'));
        return;
      }

      const onLoad = () => {
        this.audioElement?.removeEventListener('canplay', onLoad);
        this.audioElement?.removeEventListener('error', onError);
        resolve();
      };

      const onError = (error: Event) => {
        this.audioElement?.removeEventListener('canplay', onLoad);
        this.audioElement?.removeEventListener('error', onError);
        reject(new Error('Failed to load audio stream'));
      };

      this.audioElement.addEventListener('canplay', onLoad);
      this.audioElement.addEventListener('error', onError);
      this.audioElement.load();
    });
  }

  async play(): Promise<void> {
    if (!this.audioElement) {
      throw new Error('No audio element loaded');
    }

    // Resume audio context if needed
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      await this.audioElement.play();
      this.emit('play');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.emit('pause');
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.emit('stop');
    }
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
      this.emit('volumechange', volume);
    }
  }

  getVolume(): number {
    return this.audioElement?.volume || 0;
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  on(event: string, callback: (data?: any) => void): void {
    this.listeners.set(event, callback);
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  private emit(event: string, data?: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.listeners.clear();
  }
}

export const audioManager = new AudioManager();
