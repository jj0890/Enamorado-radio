// Simplified Audio Manager for AzuraCast Compatibility
// Handles basic track info and manual overrides only
// AzuraCast will handle auto-playlists and complex rotation

import type { MixSubmission } from '@shared/schema';

export interface TrackInfo {
  title: string;
  artist?: string;
  artwork?: string;
  trackUrl: string;
  mixId?: number;
  source: 'manual' | 'azuracast';
}

class AudioManager {
  private currentTrack: TrackInfo | null = null;

  // Create track info from mix submission
  createTrackFromMix(mix: MixSubmission): TrackInfo {
    return {
      title: mix.title,
      artist: mix.name,
      artwork: mix.metadata?.thumbnail || null,
      trackUrl: mix.url,
      mixId: mix.id,
      source: 'manual' as const
    };
  }

  // Set manual track (when user clicks featured mix)
  setCurrentTrack(track: TrackInfo) {
    this.currentTrack = track;
    console.log(`AudioManager: Playing "${track.title}" by ${track.artist}`);
  }

  // Get current track info
  getCurrentTrack(): TrackInfo | null {
    return this.currentTrack;
  }

  // Clear current track
  clearCurrentTrack() {
    this.currentTrack = null;
  }

  // For compatibility with existing components
  playManualTrack(track: TrackInfo) {
    this.setCurrentTrack(track);
  }
}

export const audioManager = new AudioManager();