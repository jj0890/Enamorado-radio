import { 
  Episode, 
  Guide, 
  MixSubmission, 
  Schedule, 
  SongSubmission,
  Admin,
  CurrentPlayback,
  InsertEpisode,
  InsertGuide, 
  InsertMixSubmission,
  InsertSchedule,
  InsertSongSubmission,
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
  getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number }): Promise<MixSubmission[]>;
  getMixSubmissionById(id: number): Promise<MixSubmission | undefined>;
  createMixSubmission(submission: InsertMixSubmission): Promise<MixSubmission>;
  updateMixSubmissionStatus(id: number, status: string, notes?: string): Promise<MixSubmission>;

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
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
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
  async getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number }): Promise<MixSubmission[]> {
    let filtered = [...this.mixSubmissions];
    
    if (filters?.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(m => m.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
    }
    
    // Sort by submitted date descending
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getMixSubmissionById(id: number): Promise<MixSubmission | undefined> {
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
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async createSongSubmission(submission: InsertSongSubmission): Promise<SongSubmission> {
    const newSubmission: SongSubmission = {
      ...submission,
      id: this.nextId++,
      approvalStatus: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
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

  // Admin & System
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return this.admins.find(a => a.username === username);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin: Admin = {
      ...admin,
      id: this.nextId++,
      createdAt: new Date(),
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
    };
    this.currentPlayback = newPlayback;
    return newPlayback;
  }
}

export const storage = new MemStorage();