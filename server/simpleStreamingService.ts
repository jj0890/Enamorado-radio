// Simple streaming service - uses uploaded MP3 files and HTML5 audio
import { storage } from './storage';

interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  audioUrl: string; // path to MP3 file
  artworkUrl?: string;
  source: 'uploaded' | 'dj_mix' | 'submission';
  metadata?: any;
}

interface StreamState {
  currentTrack: PlaylistItem | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playlist: PlaylistItem[];
  currentIndex: number;
  listeners: number;
}

class SimpleStreamingService {
  private state: StreamState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 0.7,
    playlist: [],
    currentIndex: 0,
    listeners: Math.floor(Math.random() * 30) + 5
  };

  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(state: StreamState) => void> = new Set();

  constructor() {
    this.initializePlaylist();
    this.startProgressTracking();
  }

  // Initialize with real uploaded files
  private async initializePlaylist() {
    // Add Jarrad's mix (we have this file)
    this.state.playlist.push({
      id: 'jarrad_how_did_i_do',
      title: 'how did i do',
      artist: 'Jarrad',
      duration: 1800, // 30 minutes estimated
      audioUrl: '/attached_assets/how did i do_1753594094475.mp3',
      artworkUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      source: 'dj_mix'
    });

    // Load approved song submissions
    const approvedSongs = await storage.getApprovedSongSubmissions();
    for (const song of approvedSongs) {
      if (song.platform === 'spotify' && song.platformUrl) {
        // For Spotify tracks, we'd need to either:
        // 1. Use Spotify Web Playback SDK (requires Premium)
        // 2. Link to external Spotify player
        // 3. Use preview URLs (30 seconds only)
        
        let metadata;
        try {
          metadata = song.metadata ? JSON.parse(song.metadata) : null;
        } catch (e) {
          metadata = null;
        }

        this.state.playlist.push({
          id: `spotify_${song.id}`,
          title: song.songTitle,
          artist: song.artistName,
          duration: metadata?.duration || 30, // Spotify previews are 30s
          audioUrl: metadata?.preview_url || song.platformUrl, // Fall back to Spotify link
          artworkUrl: metadata?.imageUrl,
          source: 'submission',
          metadata: metadata
        });
      }
    }

    // Start playing first track
    if (this.state.playlist.length > 0) {
      this.state.currentTrack = this.state.playlist[0];
      this.state.currentIndex = 0;
      this.notifySubscribers();
    }

    console.log(`[streaming] Initialized playlist with ${this.state.playlist.length} tracks`);
  }

  // Track progress for auto-advance
  private startProgressTracking() {
    this.updateInterval = setInterval(() => {
      if (this.state.isPlaying && this.state.currentTrack) {
        this.state.currentTime += 1;
        
        // Auto-advance when track finishes
        if (this.state.currentTime >= this.state.currentTrack.duration) {
          this.playNext();
        }
        
        // Update listener count occasionally
        if (Math.random() < 0.1) {
          this.state.listeners = Math.floor(Math.random() * 50) + 5;
        }
        
        this.notifySubscribers();
      }
    }, 1000);
  }

  // Admin controls
  play() {
    this.state.isPlaying = true;
    this.notifySubscribers();
    console.log(`[streaming] Playing: ${this.state.currentTrack?.title}`);
  }

  pause() {
    this.state.isPlaying = false;
    this.notifySubscribers();
    console.log(`[streaming] Paused: ${this.state.currentTrack?.title}`);
  }

  playNext() {
    if (this.state.playlist.length === 0) return;
    
    this.state.currentIndex = (this.state.currentIndex + 1) % this.state.playlist.length;
    this.state.currentTrack = this.state.playlist[this.state.currentIndex];
    this.state.currentTime = 0;
    this.state.isPlaying = true;
    
    console.log(`[streaming] Now playing: ${this.state.currentTrack.title} by ${this.state.currentTrack.artist}`);
    this.notifySubscribers();
  }

  playPrevious() {
    if (this.state.playlist.length === 0) return;
    
    this.state.currentIndex = this.state.currentIndex === 0 
      ? this.state.playlist.length - 1 
      : this.state.currentIndex - 1;
    this.state.currentTrack = this.state.playlist[this.state.currentIndex];
    this.state.currentTime = 0;
    this.state.isPlaying = true;
    
    this.notifySubscribers();
  }

  setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.notifySubscribers();
  }

  seek(time: number) {
    if (this.state.currentTrack) {
      this.state.currentTime = Math.max(0, Math.min(this.state.currentTrack.duration, time));
      this.notifySubscribers();
    }
  }

  // Add new track to playlist (when approved)
  async addTrack(submission: any) {
    let newTrack: PlaylistItem;
    
    if (submission.platform === 'spotify') {
      let metadata;
      try {
        metadata = submission.metadata ? JSON.parse(submission.metadata) : null;
      } catch (e) {
        metadata = null;
      }

      newTrack = {
        id: `spotify_${submission.id}`,
        title: submission.songTitle,
        artist: submission.artistName,
        duration: metadata?.duration || 30,
        audioUrl: metadata?.preview_url || submission.platformUrl,
        artworkUrl: metadata?.imageUrl,
        source: 'submission',
        metadata: metadata
      };
    } else {
      // For uploaded files or other platforms
      newTrack = {
        id: `submission_${submission.id}`,
        title: submission.songTitle,
        artist: submission.artistName,
        duration: 180, // Default 3 minutes
        audioUrl: submission.audioUrl || submission.platformUrl,
        source: 'submission'
      };
    }

    this.state.playlist.push(newTrack);
    console.log(`[streaming] Added "${newTrack.title}" to playlist`);
    this.notifySubscribers();
  }

  // Get current state for API
  getState(): StreamState {
    return { ...this.state };
  }

  // Subscribe to updates
  subscribe(callback: (state: StreamState) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  // Admin: Update now playing manually
  setNowPlaying(title: string, artist: string, artworkUrl?: string) {
    this.state.currentTrack = {
      id: `manual_${Date.now()}`,
      title,
      artist,
      duration: 180, // Default duration
      audioUrl: '', // No actual audio for manual entries
      artworkUrl,
      source: 'uploaded'
    };
    this.state.currentTime = 0;
    this.notifySubscribers();
    console.log(`[streaming] Manually set now playing: ${title} by ${artist}`);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.subscribers.clear();
  }
}

// Singleton instance
export const simpleStreamingService = new SimpleStreamingService();

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('[streaming] Simple streaming service initialized');
  
  simpleStreamingService.subscribe((state) => {
    if (state.currentTrack && state.isPlaying) {
      const progress = `${Math.floor(state.currentTime/60)}:${(state.currentTime%60).toString().padStart(2,'0')}`;
      const duration = `${Math.floor(state.currentTrack.duration/60)}:${(state.currentTrack.duration%60).toString().padStart(2,'0')}`;
      console.log(`[streaming] ${state.currentTrack.title} - ${progress}/${duration} (${state.listeners} listeners)`);
    }
  });
}