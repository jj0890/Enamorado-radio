import { 
  Episode, 
  Guide, 
  MixSubmission, 
  Schedule, 
  SongSubmission,
  ResidentApplication,
  Admin,
  CurrentPlayback,
  InsertEpisode,
  InsertGuide, 
  InsertMixSubmission,
  InsertSchedule,
  InsertSongSubmission,
  InsertResidentApplication,
  InsertAdmin,
  InsertCurrentPlayback
} from "@shared/schema";

// Clean Storage Interface - Single source of truth for all data operations
export interface IStorage {
  // Episodes - Latest content
  getEpisodes(filters?: { featured?: boolean; genre?: string; limit?: number }): Promise<Episode[]>;
  getEpisodeById(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<Episode>): Promise<Episode>;
  deleteEpisode(id: number): Promise<void>;

  // Guides - Explore content
  getGuides(filters?: { featured?: boolean; type?: string; limit?: number }): Promise<Guide[]>;
  getGuideById(id: number): Promise<Guide | undefined>;
  getGuideBySlug(slug: string): Promise<Guide | undefined>;
  createGuide(guide: InsertGuide): Promise<Guide>;
  updateGuide(id: number, guide: Partial<Guide>): Promise<Guide>;
  deleteGuide(id: number): Promise<void>;

  // Mix Submissions - Community content
  getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number; featured?: boolean; approved?: boolean }): Promise<MixSubmission[]>;
  getMixSubmissionById(id: number): Promise<MixSubmission | undefined>;
  getMixSubmission(id: number): Promise<MixSubmission | undefined>;
  createMixSubmission(submission: InsertMixSubmission): Promise<MixSubmission>;
  updateMixSubmissionStatus(id: number, status: string, notes?: string): Promise<MixSubmission>;
  updateMixSubmission(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission>;
  toggleMixFeature(id: number): Promise<MixSubmission>;
  toggleMixApproval(id: number): Promise<MixSubmission>;
  deleteMixSubmission(id: number): Promise<void>;

  // Schedule - Programming grid
  getSchedule(filters?: { upcoming?: boolean; date?: Date; limit?: number }): Promise<Schedule[]>;
  getScheduleById(id: number): Promise<Schedule | undefined>;
  createScheduleItem(schedule: InsertSchedule): Promise<Schedule>;
  updateScheduleItem(id: number, schedule: Partial<Schedule>): Promise<Schedule>;
  deleteScheduleItem(id: number): Promise<void>;

  // Song Submissions - Community suggestions
  getSongSubmissions(filters?: { status?: string; limit?: number }): Promise<SongSubmission[]>;
  createSongSubmission(submission: InsertSongSubmission): Promise<SongSubmission>;
  updateSongSubmissionStatus(id: number, status: string): Promise<SongSubmission>;

  // Resident Applications - DJ/Host applications
  getResidentApplications(filters?: { status?: string; priority?: string; limit?: number }): Promise<ResidentApplication[]>;
  getResidentApplicationById(id: number): Promise<ResidentApplication | undefined>;
  createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication>;
  updateResidentApplication(id: number, updates: Partial<ResidentApplication>): Promise<ResidentApplication>;
  updateResidentApplicationStatus(id: number, status: string, notes?: string): Promise<ResidentApplication>;
  deleteResidentApplication(id: number): Promise<void>;

  // Admin & System
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getCurrentPlayback(): Promise<CurrentPlayback | undefined>;
  updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback>;
}

// In-Memory Implementation
class MemStorage implements IStorage {
  private episodes: Episode[] = [];
  private guides: Guide[] = [];
  private mixSubmissions: MixSubmission[] = [];
  private scheduleItems: Schedule[] = [];
  private songSubmissions: SongSubmission[] = [];
  private residentApplications: ResidentApplication[] = [];
  private admins: Admin[] = [];
  private currentPlayback: CurrentPlayback | null = null;
  private nextId = 1;

  // Episodes
  async getEpisodes(filters?: { featured?: boolean; genre?: string; limit?: number }): Promise<Episode[]> {
    let filtered = [...this.episodes];
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(e => e.isFeatured === filters.featured);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(e => e.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
    }
    
    // Sort by air date descending (most recent first)
    filtered.sort((a, b) => new Date(b.airDate).getTime() - new Date(a.airDate).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getEpisodeById(id: number): Promise<Episode | undefined> {
    return this.episodes.find(e => e.id === id);
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const newEpisode: Episode = {
      ...episode,
      id: this.nextId++,
      viewCount: 0,
      createdAt: new Date(),
      status: episode.status || 'published',
      description: episode.description || null,
      seriesTitle: episode.seriesTitle || null,
      episodeNumber: episode.episodeNumber || null,
      artworkUrl: episode.artworkUrl || null,
      tags: episode.tags || null,
      isLive: episode.isLive ?? false,
      isFeatured: episode.isFeatured ?? false,
    };
    this.episodes.push(newEpisode);
    return newEpisode;
  }

  async updateEpisode(id: number, episode: Partial<Episode>): Promise<Episode> {
    const index = this.episodes.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Episode not found');
    
    this.episodes[index] = { ...this.episodes[index], ...episode };
    return this.episodes[index];
  }

  async deleteEpisode(id: number): Promise<void> {
    const index = this.episodes.findIndex(e => e.id === id);
    if (index !== -1) {
      this.episodes.splice(index, 1);
    }
  }

  // Guides
  async getGuides(filters?: { featured?: boolean; type?: string; limit?: number }): Promise<Guide[]> {
    let filtered = [...this.guides];
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(g => g.isFeatured === filters.featured);
    }
    
    if (filters?.type) {
      filtered = filtered.filter(g => g.guideType === filters.type);
    }
    
    // Sort by published date descending
    filtered.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getGuideById(id: number): Promise<Guide | undefined> {
    return this.guides.find(g => g.id === id);
  }

  async getGuideBySlug(slug: string): Promise<Guide | undefined> {
    return this.guides.find(g => g.slug === slug);
  }

  async createGuide(guide: InsertGuide): Promise<Guide> {
    const newGuide: Guide = {
      ...guide,
      id: this.nextId++,
      viewCount: 0,
      publishedAt: new Date(),
      updatedAt: new Date(),
      status: guide.status || 'published',
      tags: guide.tags || null,
      sections: guide.sections || null,
      coverImageUrl: guide.coverImageUrl || null,
      isFeatured: guide.isFeatured ?? false,
    };
    this.guides.push(newGuide);
    return newGuide;
  }

  async updateGuide(id: number, guide: Partial<Guide>): Promise<Guide> {
    const index = this.guides.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Guide not found');
    
    this.guides[index] = { ...this.guides[index], ...guide, updatedAt: new Date() };
    return this.guides[index];
  }

  async deleteGuide(id: number): Promise<void> {
    const index = this.guides.findIndex(g => g.id === id);
    if (index !== -1) {
      this.guides.splice(index, 1);
    }
  }

  // Mix Submissions
  async getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number; featured?: boolean; approved?: boolean }): Promise<MixSubmission[]> {
    let filtered = [...this.mixSubmissions];
    
    if (filters?.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(m => m.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(m => (m as any).featured === filters.featured);
    }
    
    if (filters?.approved !== undefined) {
      filtered = filtered.filter(m => (m as any).approved === filters.approved);
    }
    
    // Sort by submitted date descending
    filtered.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getMixSubmissionById(id: number): Promise<MixSubmission | undefined> {
    return this.mixSubmissions.find(m => m.id === id);
  }

  async getMixSubmission(id: number): Promise<MixSubmission | undefined> {
    return this.mixSubmissions.find(m => m.id === id);
  }

  async createMixSubmission(submission: InsertMixSubmission): Promise<MixSubmission> {
    const newSubmission: MixSubmission = {
      ...submission,
      id: this.nextId++,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null,
      metadata: null,
      about: submission.about || null,
      approved_at: null,
      featured_at: null,
      artwork_url: submission.artwork_url || null,
      platform: submission.platform || null,
      playback_mode: submission.playback_mode || 'stream',
      is_radio_ingestable: submission.is_radio_ingestable ?? true,
      requires_alternative: submission.requires_alternative ?? false,
      radio_alt_url: submission.radio_alt_url || null,
      radio_file_path: submission.radio_file_path || null,
      rights_status: submission.rights_status || 'unverified',
      featured: submission.featured ?? false,
      approved: submission.approved ?? false,
      coverUrl: submission.coverUrl || null,
      artUrl: submission.artUrl || null,
      source: submission.source || 'url',
      sourceUrl: submission.sourceUrl || null,
      filePath: submission.filePath || null,
      fileName: submission.fileName || null,
      featureOnSite: submission.featureOnSite ?? true,
      pushToAzura: submission.pushToAzura ?? false,
      targetPlaylist: submission.targetPlaylist || 'General Rotation',
      airDate: submission.airDate || null,
      azuraFilePath: submission.azuraFilePath || null,
      azuraPlaylistId: submission.azuraPlaylistId || null,
      approvedAt: submission.approvedAt || null,
      uploadedAt: submission.uploadedAt || null,
      rescannedAt: submission.rescannedAt || null,
      playlistLinkedAt: submission.playlistLinkedAt || null,
      createdAt: submission.createdAt || new Date(),
    };
    this.mixSubmissions.push(newSubmission);
    return newSubmission;
  }

  async updateMixSubmissionStatus(id: number, status: string, notes?: string): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions[index] = {
      ...this.mixSubmissions[index],
      status,
      notes: notes || this.mixSubmissions[index].notes,
      reviewedAt: new Date(),
      reviewedBy: 'Admin'
    };
    return this.mixSubmissions[index];
  }

  async updateMixSubmission(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions[index] = { ...this.mixSubmissions[index], ...updates };
    return this.mixSubmissions[index];
  }

  async toggleMixFeature(id: number): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    (this.mixSubmissions[index] as any).featured = !(this.mixSubmissions[index] as any).featured;
    return this.mixSubmissions[index];
  }

  async toggleMixApproval(id: number): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    const currentApproved = (this.mixSubmissions[index] as any).approved;
    (this.mixSubmissions[index] as any).approved = !currentApproved;
    
    if ((this.mixSubmissions[index] as any).approved) {
      (this.mixSubmissions[index] as any).approvedAt = new Date();
      this.mixSubmissions[index].status = 'approved';
    } else {
      this.mixSubmissions[index].status = 'pending';
    }
    
    return this.mixSubmissions[index];
  }

  async deleteMixSubmission(id: number): Promise<void> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions.splice(index, 1);
  }

  // Schedule
  async getSchedule(filters?: { upcoming?: boolean; date?: Date; limit?: number }): Promise<Schedule[]> {
    let filtered = [...this.scheduleItems];
    
    if (filters?.upcoming) {
      const now = new Date();
      filtered = filtered.filter(s => new Date(s.scheduledAt) > now);
    }
    
    if (filters?.date) {
      const targetDate = filters.date;
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.scheduledAt);
        return scheduleDate.toDateString() === targetDate.toDateString();
      });
    }
    
    // Sort by scheduled time
    filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getScheduleById(id: number): Promise<Schedule | undefined> {
    return this.scheduleItems.find(s => s.id === id);
  }

  async createScheduleItem(schedule: InsertSchedule): Promise<Schedule> {
    const newSchedule: Schedule = {
      ...schedule,
      id: this.nextId++,
      createdAt: new Date(),
      status: schedule.status || 'scheduled',
      description: schedule.description || null,
      episodeId: schedule.episodeId || null,
      isLive: schedule.isLive ?? false,
      isRecurring: schedule.isRecurring ?? false,
      recurrencePattern: schedule.recurrencePattern || null,
      artworkUrl: schedule.artworkUrl || null,
    };
    this.scheduleItems.push(newSchedule);
    return newSchedule;
  }

  async updateScheduleItem(id: number, schedule: Partial<Schedule>): Promise<Schedule> {
    const index = this.scheduleItems.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Schedule item not found');
    
    this.scheduleItems[index] = { ...this.scheduleItems[index], ...schedule };
    return this.scheduleItems[index];
  }

  async deleteScheduleItem(id: number): Promise<void> {
    const index = this.scheduleItems.findIndex(s => s.id === id);
    if (index !== -1) {
      this.scheduleItems.splice(index, 1);
    }
  }

  // Song Submissions
  async getSongSubmissions(filters?: { status?: string; limit?: number }): Promise<SongSubmission[]> {
    let filtered = [...this.songSubmissions];
    
    if (filters?.status) {
      filtered = filtered.filter(s => s.approvalStatus === filters.status);
    }
    
    // Sort by submitted date descending
    filtered.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getSongSubmissionById(id: number): Promise<SongSubmission | undefined> {
    return this.songSubmissions.find(s => s.id === id);
  }

  async createSongSubmission(submission: InsertSongSubmission): Promise<SongSubmission> {
    const newSubmission: SongSubmission = {
      ...submission,
      id: this.nextId++,
      approvalStatus: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      notes: submission.notes || null,
      spotifyUrl: submission.spotifyUrl || null,
      youtubeUrl: submission.youtubeUrl || null,
    };
    this.songSubmissions.push(newSubmission);
    return newSubmission;
  }

  async updateSongSubmissionStatus(id: number, status: string): Promise<SongSubmission> {
    const index = this.songSubmissions.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Song submission not found');
    
    this.songSubmissions[index] = {
      ...this.songSubmissions[index],
      approvalStatus: status,
      reviewedAt: new Date()
    };
    return this.songSubmissions[index];
  }

  // Resident Applications
  async getResidentApplications(filters?: { status?: string; priority?: string; limit?: number }): Promise<ResidentApplication[]> {
    let filtered = [...this.residentApplications];
    
    if (filters?.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    if (filters?.priority) {
      filtered = filtered.filter(a => a.priority === filters.priority);
    }
    
    // Sort by submitted date descending (most recent first)
    filtered.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getResidentApplicationById(id: number): Promise<ResidentApplication | undefined> {
    return this.residentApplications.find(a => a.id === id);
  }

  async createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication> {
    const newApplication: ResidentApplication = {
      ...application,
      id: this.nextId++,
      status: 'submitted',
      reviewStage: 'initial',
      priority: 'normal',
      isActiveResident: false,
      onboardingCompleted: false,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: application.reviewNotes || null,
      interviewScheduled: application.interviewScheduled || null,
      trialShowDate: application.trialShowDate || null,
      approvalDate: application.approvalDate || null,
      showSlot: application.showSlot || null,
      googleFormResponseId: application.googleFormResponseId || null,
      googleSheetRowNumber: application.googleSheetRowNumber || null,
      phone: application.phone || null,
      location: application.location || null,
      experience: application.experience || null,
      genre: application.genre || null,
      bio: application.bio || null,
      mixUrl: application.mixUrl || null,
      socialLinks: application.socialLinks || null,
      availability: application.availability || null,
      showConcept: application.showConcept || null,
      equipment: application.equipment || null,
      additionalInfo: application.additionalInfo || null,
    };
    this.residentApplications.push(newApplication);
    return newApplication;
  }

  async updateResidentApplication(id: number, updates: Partial<ResidentApplication>): Promise<ResidentApplication> {
    const index = this.residentApplications.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Resident application not found');
    
    this.residentApplications[index] = { 
      ...this.residentApplications[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.residentApplications[index];
  }

  async updateResidentApplicationStatus(id: number, status: string, notes?: string): Promise<ResidentApplication> {
    const index = this.residentApplications.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Resident application not found');
    
    this.residentApplications[index] = {
      ...this.residentApplications[index],
      status,
      reviewNotes: notes || this.residentApplications[index].reviewNotes,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };
    return this.residentApplications[index];
  }

  async deleteResidentApplication(id: number): Promise<void> {
    const index = this.residentApplications.findIndex(a => a.id === id);
    if (index !== -1) {
      this.residentApplications.splice(index, 1);
    }
  }

  // Admin & System
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return this.admins.find(a => a.username === username);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin: Admin = {
      ...admin,
      id: this.nextId++,
      createdAt: new Date(),
      role: admin.role || 'admin',
    };
    this.admins.push(newAdmin);
    return newAdmin;
  }

  async getCurrentPlayback(): Promise<CurrentPlayback | undefined> {
    return this.currentPlayback || undefined;
  }

  async updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback> {
    const newPlayback: CurrentPlayback = {
      ...playback,
      id: 1,
      startTime: new Date(),
      artist: playback.artist || null,
      artwork: playback.artwork || null,
      episodeId: playback.episodeId || null,
      mixId: playback.mixId || null,
      trackUrl: playback.trackUrl || null,
      isLive: playback.isLive ?? true,
    };
    this.currentPlayback = newPlayback;
    return newPlayback;
  }
}

import { FileStorage } from './persistentStorage';

export const storage = new FileStorage();