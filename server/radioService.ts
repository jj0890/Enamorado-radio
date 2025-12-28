import { storage } from './storage';
import { trackMetadataService } from './trackMetadataService';

export interface RadioProgramInfo {
  type: 'auto' | 'live';
  currentShow?: {
    id: number;
    name: string;
    host: string;
    startTime: string;
    endTime: string;
    description?: string;
    genre?: string;
  };
  nextShow?: {
    id: number;
    name: string;
    host: string;
    startTime: string;
    dayOfWeek: number;
  };
  currentTrack?: {
    id: string;
    title: string;
    artist: string;
    sourceType: string;
    metadata?: any;
  };
}

export interface RadioTrack {
  id: string;
  title: string;
  artist: string;
  sourceType: 'upload' | 'soundcloud' | 'dj_submission';
  originalMetadata?: any;
  lastfmMetadata?: any;
  playCount: number;
  lastPlayed?: Date;
}

class RadioService {
  async getCurrentProgramInfo(): Promise<RadioProgramInfo> {
    const programState = await storage.getCurrentProgramState();
    const currentShow = programState?.currentShowId 
      ? await storage.getLiveShow(programState.currentShowId)
      : null;
    
    const nextShow = await this.getNextScheduledShow();
    
    const currentTrack = programState?.currentTrackId
      ? await storage.getRadioRotationTrack(programState.currentTrackId)
      : null;

    return {
      type: programState?.type || 'auto',
      currentShow: currentShow ? {
        id: currentShow.id,
        name: currentShow.showName,
        host: currentShow.hostName,
        startTime: currentShow.startTime,
        endTime: currentShow.endTime,
        description: currentShow.description || undefined,
        genre: currentShow.genre || undefined,
      } : undefined,
      nextShow: nextShow ? {
        id: nextShow.id,
        name: nextShow.showName,
        host: nextShow.hostName,
        startTime: nextShow.startTime,
        dayOfWeek: nextShow.dayOfWeek,
      } : undefined,
      currentTrack: currentTrack ? {
        id: currentTrack.trackId,
        title: currentTrack.title,
        artist: currentTrack.artist,
        sourceType: currentTrack.sourceType,
        metadata: currentTrack.lastfmMetadata ? JSON.parse(currentTrack.lastfmMetadata) : undefined,
      } : undefined,
    };
  }

  async getNextScheduledShow() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Get all active shows
    const shows = await storage.getAllLiveShows();
    const activeShows = shows.filter(show => show.isActive);

    // Find next show (today or future days)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const dayShows = activeShows
        .filter(show => show.dayOfWeek === checkDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (const show of dayShows) {
        if (dayOffset === 0 && show.startTime <= currentTime) {
          continue; // Skip shows that already started today
        }
        return show;
      }
    }

    return null;
  }

  async getRandomRotationTrack(): Promise<RadioTrack | null> {
    const tracks = await storage.getApprovedRotationTracks();
    if (tracks.length === 0) return null;

    // Simple random selection (could be enhanced with weighted selection)
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    
    // Update play count and last played
    await storage.incrementRotationPlayCount(randomTrack.trackId);

    return {
      id: randomTrack.trackId,
      title: randomTrack.title,
      artist: randomTrack.artist,
      sourceType: randomTrack.sourceType as 'upload' | 'soundcloud' | 'dj_submission',
      originalMetadata: randomTrack.originalMetadata ? JSON.parse(randomTrack.originalMetadata) : undefined,
      lastfmMetadata: randomTrack.lastfmMetadata ? JSON.parse(randomTrack.lastfmMetadata) : undefined,
      playCount: randomTrack.playCount,
      lastPlayed: randomTrack.lastPlayed || undefined,
    };
  }

  async switchToLiveMode(showId: number): Promise<void> {
    await storage.updateProgramState({
      type: 'live',
      currentShowId: showId,
      currentTrackId: null,
      lastUpdated: new Date(),
    });

    // Mark show as live
    await storage.updateLiveShowStatus(showId, true);
  }

  async switchToAutoMode(): Promise<void> {
    // Get current show to mark as not live
    const currentState = await storage.getCurrentProgramState();
    if (currentState?.currentShowId) {
      await storage.updateLiveShowStatus(currentState.currentShowId, false);
    }

    await storage.updateProgramState({
      type: 'auto',
      currentShowId: null,
      currentTrackId: null,
      lastUpdated: new Date(),
    });
  }

  async updateCurrentTrack(trackId: string): Promise<void> {
    const currentState = await storage.getCurrentProgramState();
    await storage.updateProgramState({
      ...currentState,
      currentTrackId: trackId,
      lastUpdated: new Date(),
    });
  }

  async submitTrackForRotation(trackData: {
    trackId: string;
    sourceType: 'upload' | 'soundcloud' | 'dj_submission';
    title: string;
    artist: string;
    originalMetadata?: any;
  }) {
    // Enhance with Last.fm metadata
    const lastfmData = await trackMetadataService.getOrFetchTrackInfo(`${trackData.artist} - ${trackData.title}.mp3`);

    await storage.createRadioRotationTrack({
      trackId: trackData.trackId,
      sourceType: trackData.sourceType,
      title: trackData.title,
      artist: trackData.artist,
      originalMetadata: trackData.originalMetadata ? JSON.stringify(trackData.originalMetadata) : null,
      lastfmMetadata: JSON.stringify(lastfmData),
      approvalStatus: 'pending',
      inRotation: false,
      playCount: 0,
      uploadedAt: new Date(),
    });
  }

  async approveTrackForRotation(trackId: string, approvedBy: string): Promise<void> {
    await storage.updateRotationTrackStatus(trackId, 'approved', approvedBy, true);
  }

  async rejectTrack(trackId: string, approvedBy: string): Promise<void> {
    await storage.updateRotationTrackStatus(trackId, 'rejected', approvedBy, false);
  }
}

export const radioService = new RadioService();