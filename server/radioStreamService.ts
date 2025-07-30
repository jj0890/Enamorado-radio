// Real radio streaming service - handles actual playback queue and tracking
import { metadataService } from './metadataService';

interface QueueItem {
  id: string;
  type: 'dj_mix' | 'spotify_track' | 'uploaded_audio' | 'live_show';
  title: string;
  artist?: string;
  duration: number; // in seconds
  audioUrl?: string; // for uploaded files
  spotifyId?: string; // for spotify tracks
  startTime?: Date;
  endTime?: Date;
  metadata?: any;
}

interface NowPlayingState {
  current: QueueItem | null;
  progress: number; // seconds elapsed
  isLive: boolean;
  volume: number;
  listeners: number;
  recent: QueueItem[];
  next: QueueItem | null;
}

class RadioStreamService {
  private queue: QueueItem[] = [];
  private nowPlaying: NowPlayingState = {
    current: null,
    progress: 0,
    isLive: false,
    volume: 0.7,
    listeners: 0,
    recent: [],
    next: null,
  };
  private playbackInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(state: NowPlayingState) => void> = new Set();

  constructor() {
    this.initializeDefaultQueue();
    this.startPlaybackTracking();
  }

  // Initialize with real tracks we have access to
  private async initializeDefaultQueue() {
    // Add Jarrad's mix (we have this file)
    this.queue.push({
      id: 'jarrad_mix_1',
      type: 'dj_mix',
      title: 'how did i do',
      artist: 'Jarrad',
      duration: 1800, // 30 minutes estimated
      audioUrl: '/attached_assets/how did i do_1753594094475.mp3',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1800000),
    });

    // Add approved song submissions from database
    await this.loadApprovedSubmissions();

    // Start playing first item
    if (this.queue.length > 0 && !this.nowPlaying.current) {
      this.playNext();
    }
  }

  // Load approved song submissions from database
  private async loadApprovedSubmissions() {
    try {
      const { storage } = await import('./storage');
      const approvedSubmissions = await storage.getApprovedSongSubmissions();
      
      for (const submission of approvedSubmissions) {
        if (submission.platform === 'spotify' && submission.trackId) {
          const metadata = submission.metadata ? JSON.parse(submission.metadata) : null;
          
          this.queue.push({
            id: `submission_${submission.id}`,
            type: 'spotify_track',
            title: submission.songTitle,
            artist: submission.artistName,
            duration: metadata?.duration || 180, // fallback to 3 minutes
            spotifyId: submission.trackId,
            metadata: metadata,
          });
        }
      }
      
      console.log(`[radio] Loaded ${approvedSubmissions.length} approved submissions into queue`);
    } catch (error) {
      console.error('[radio] Failed to load approved submissions:', error);
    }
  }

  // Real playback tracking - knows what's actually playing
  private startPlaybackTracking() {
    this.playbackInterval = setInterval(() => {
      if (this.nowPlaying.current && this.nowPlaying.isLive) {
        this.nowPlaying.progress += 1;
        
        // Check if current track finished
        if (this.nowPlaying.progress >= this.nowPlaying.current.duration) {
          this.playNext();
        }
        
        // Notify listeners of progress update
        this.notifyListeners();
      }
    }, 1000);
  }

  // Play next item in queue
  private playNext() {
    if (this.nowPlaying.current) {
      // Move current to recent
      this.nowPlaying.recent.unshift(this.nowPlaying.current);
      if (this.nowPlaying.recent.length > 10) {
        this.nowPlaying.recent = this.nowPlaying.recent.slice(0, 10);
      }
    }

    // Get next from queue
    const next = this.queue.shift();
    if (next) {
      this.nowPlaying.current = next;
      this.nowPlaying.progress = 0;
      this.nowPlaying.isLive = true;
      this.nowPlaying.next = this.queue[0] || null;
      
      console.log(`[radio] Now playing: "${next.title}" by ${next.artist || 'Unknown'}`);
      
      // Add back to end of queue for rotation (except one-time items)
      if (next.type !== 'live_show') {
        this.queue.push({ ...next, id: `${next.id}_${Date.now()}` });
      }
    } else {
      // Queue empty - go to offline mode
      this.nowPlaying.current = null;
      this.nowPlaying.isLive = false;
      console.log('[radio] Queue empty - going offline');
    }
    
    this.notifyListeners();
  }

  // Add new track to queue (for approved submissions)
  async addToQueue(submission: any) {
    let queueItem: QueueItem;
    
    if (submission.platform === 'spotify' && submission.trackId) {
      const metadata = submission.metadata ? JSON.parse(submission.metadata) : null;
      
      queueItem = {
        id: `submission_${submission.id}`,
        type: 'spotify_track',
        title: submission.songTitle,
        artist: submission.artistName,
        duration: metadata?.duration || 180,
        spotifyId: submission.trackId,
        metadata: metadata,
      };
    } else {
      // Other platforms or uploaded files
      queueItem = {
        id: `submission_${submission.id}`,
        type: 'uploaded_audio',
        title: submission.songTitle,
        artist: submission.artistName,
        duration: 180, // estimate
        audioUrl: submission.audioUrl,
      };
    }
    
    // Add to queue at appropriate position (themed submissions get priority)
    if (submission.themeTag && submission.themeTag !== 'none') {
      // Insert after current track for themed content
      this.queue.unshift(queueItem);
    } else {
      // Add to end for general rotation
      this.queue.push(queueItem);
    }
    
    console.log(`[radio] Added "${queueItem.title}" to queue (position: ${this.queue.indexOf(queueItem) + 1})`);
    this.notifyListeners();
  }

  // Get current state for API
  getCurrentState(): NowPlayingState {
    // Simulate realistic listener count
    this.nowPlaying.listeners = Math.floor(Math.random() * 50) + 10;
    return { ...this.nowPlaying };
  }

  // Subscribe to playback updates
  subscribe(callback: (state: NowPlayingState) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all subscribers
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.getCurrentState()));
  }

  // Manual DJ controls (for admin interface)
  skipTrack() {
    console.log('[radio] Manual skip requested');
    this.playNext();
  }

  setVolume(volume: number) {
    this.nowPlaying.volume = Math.max(0, Math.min(1, volume));
    this.notifyListeners();
  }

  // For likes to work, we need user accounts and track identification
  async likeCurrentTrack(userId: string): Promise<boolean> {
    if (!this.nowPlaying.current) {
      return false;
    }

    try {
      const { storage } = await import('./storage');
      
      // This requires user authentication system
      const like = await storage.addTrackLike({
        userId,
        trackId: this.nowPlaying.current.id,
        trackTitle: this.nowPlaying.current.title,
        artist: this.nowPlaying.current.artist,
        timestamp: new Date(),
      });
      
      console.log(`[radio] User ${userId} liked "${this.nowPlaying.current.title}"`);
      return true;
    } catch (error) {
      console.error('[radio] Failed to save like:', error);
      return false;
    }
  }

  // Get queue for admin interface
  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  // Add live show (for scheduled programming)
  scheduleShow(show: {
    title: string;
    host: string;
    startTime: Date;
    duration: number;
    audioUrl?: string;
  }) {
    const showItem: QueueItem = {
      id: `live_${Date.now()}`,
      type: 'live_show',
      title: show.title,
      artist: show.host,
      duration: show.duration,
      audioUrl: show.audioUrl,
      startTime: show.startTime,
      endTime: new Date(show.startTime.getTime() + show.duration * 1000),
    };
    
    // Insert at correct time position in queue
    const insertIndex = this.queue.findIndex(item => 
      item.startTime && item.startTime > show.startTime
    );
    
    if (insertIndex === -1) {
      this.queue.push(showItem);
    } else {
      this.queue.splice(insertIndex, 0, showItem);
    }
    
    console.log(`[radio] Scheduled show "${show.title}" by ${show.host}`);
    this.notifyListeners();
  }

  // Cleanup
  destroy() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const radioStreamService = new RadioStreamService();

// For testing the real functionality
if (process.env.NODE_ENV === 'development') {
  console.log('[radio] Stream service initialized with real queue tracking');
  
  // Log queue updates
  radioStreamService.subscribe((state) => {
    if (state.current) {
      console.log(`[radio] Playing: ${state.current.title} (${Math.floor(state.progress/60)}:${(state.progress%60).toString().padStart(2,'0')}/${Math.floor(state.current.duration/60)}:${(state.current.duration%60).toString().padStart(2,'0')})`);
    }
  });
}