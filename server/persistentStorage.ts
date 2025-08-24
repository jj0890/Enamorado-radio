import fs from 'fs/promises';
import path from 'path';
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
import { IStorage } from "./storage";

// File-based persistent storage to solve the memory reset issue
export class FileStorage implements IStorage {
  private dataDir = './data';
  private nextIdFile = path.join(this.dataDir, 'nextId.json');
  
  private episodes: Episode[] = [];
  private guides: Guide[] = [];
  private mixSubmissions: MixSubmission[] = [];
  private scheduleItems: Schedule[] = [];
  private songSubmissions: SongSubmission[] = [];
  private admins: Admin[] = [];
  private currentPlayback: CurrentPlayback | null = null;
  private nextId = 1;

  constructor() {
    this.loadData();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  private async loadData() {
    await this.ensureDataDir();
    
    try {
      // Load all data files
      const files = [
        'episodes.json',
        'guides.json', 
        'mixSubmissions.json',
        'scheduleItems.json',
        'songSubmissions.json',
        'admins.json',
        'currentPlayback.json'
      ];

      for (const file of files) {
        try {
          const filePath = path.join(this.dataDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const parsed = JSON.parse(data);
          
          switch (file) {
            case 'episodes.json':
              this.episodes = parsed || [];
              break;
            case 'guides.json':
              this.guides = parsed || [];
              break;
            case 'mixSubmissions.json':
              this.mixSubmissions = parsed || [];
              break;
            case 'scheduleItems.json':
              this.scheduleItems = parsed || [];
              break;
            case 'songSubmissions.json':
              this.songSubmissions = parsed || [];
              break;
            case 'admins.json':
              this.admins = parsed || [];
              break;
            case 'currentPlayback.json':
              this.currentPlayback = parsed || null;
              break;
          }
        } catch (error) {
          // File doesn't exist yet - start with empty array
          console.log(`No existing ${file} found, starting fresh`);
        }
      }

      // Load next ID
      try {
        const idData = await fs.readFile(this.nextIdFile, 'utf8');
        this.nextId = JSON.parse(idData).nextId || 1;
      } catch (error) {
        this.nextId = 1;
      }

      console.log(`Loaded persistent data: ${this.mixSubmissions.length} mix submissions found`);
      
    } catch (error) {
      console.error('Error loading persistent data:', error);
    }
  }

  private async saveData(type: string, data: any) {
    await this.ensureDataDir();
    
    try {
      const filePath = path.join(this.dataDir, `${type}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      // Save next ID
      await fs.writeFile(this.nextIdFile, JSON.stringify({ nextId: this.nextId }));
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  }

  // Episodes
  async getEpisodes(filters?: { featured?: boolean; genre?: string; limit?: number }): Promise<Episode[]> {
    let filtered = [...this.episodes];
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(e => e.isFeatured === filters.featured);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(e => e.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
    }
    
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
      airDate: new Date(),
      updatedAt: new Date(),
    };
    this.episodes.push(newEpisode);
    await this.saveData('episodes', this.episodes);
    return newEpisode;
  }

  async updateEpisode(id: number, episode: Partial<Episode>): Promise<Episode> {
    const index = this.episodes.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Episode not found');
    
    this.episodes[index] = { ...this.episodes[index], ...episode, updatedAt: new Date() };
    await this.saveData('episodes', this.episodes);
    return this.episodes[index];
  }

  async deleteEpisode(id: number): Promise<void> {
    const index = this.episodes.findIndex(e => e.id === id);
    if (index !== -1) {
      this.episodes.splice(index, 1);
      await this.saveData('episodes', this.episodes);
    }
  }

  // Guides
  async getGuides(filters?: { featured?: boolean; type?: string; limit?: number }): Promise<Guide[]> {
    let filtered = [...this.guides];
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(g => g.featured === filters.featured);
    }
    
    if (filters?.type) {
      filtered = filtered.filter(g => g.type === filters.type);
    }
    
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
    await this.saveData('guides', this.guides);
    return newGuide;
  }

  async updateGuide(id: number, guide: Partial<Guide>): Promise<Guide> {
    const index = this.guides.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Guide not found');
    
    this.guides[index] = { ...this.guides[index], ...guide, updatedAt: new Date() };
    await this.saveData('guides', this.guides);
    return this.guides[index];
  }

  async deleteGuide(id: number): Promise<void> {
    const index = this.guides.findIndex(g => g.id === id);
    if (index !== -1) {
      this.guides.splice(index, 1);
      await this.saveData('guides', this.guides);
    }
  }

  // Mix Submissions - PERSISTENT STORAGE FOR YOUR MIX!
  async getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number; approved?: boolean; featured?: boolean }): Promise<MixSubmission[]> {
    let filtered = [...this.mixSubmissions];
    
    if (filters?.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(m => m.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
    }
    
    if (filters?.approved !== undefined) {
      filtered = filtered.filter(m => (m as any).approved === filters.approved);
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(m => (m as any).featured === filters.featured);
    }
    
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    console.log(`FileStorage: Found ${filtered.length} mixes with status: ${filters?.status || 'all'}`);
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
      metadata: submission.metadata || null,
    };
    this.mixSubmissions.push(newSubmission);
    await this.saveData('mixSubmissions', this.mixSubmissions);
    
    console.log(`FileStorage: Created mix submission ${newSubmission.id}: "${newSubmission.title}" by ${newSubmission.name}`);
    return newSubmission;
  }

  async getMixSubmission(id: number): Promise<MixSubmission | undefined> {
    return this.mixSubmissions.find(m => m.id === id);
  }

  async updateMixSubmissionStatus(id: number, status: string, notes?: string): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions[index] = {
      ...this.mixSubmissions[index],
      status,
      notes: notes || null,
      reviewedAt: new Date(),
      reviewedBy: 'Admin'
    };
    
    await this.saveData('mixSubmissions', this.mixSubmissions);
    console.log(`FileStorage: Updated mix ${id} status to "${status}"`);
    return this.mixSubmissions[index];
  }

  async updateMixSubmission(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions[index] = { ...this.mixSubmissions[index], ...updates };
    await this.saveData('mixSubmissions', this.mixSubmissions);
    console.log(`FileStorage: Updated mix ${id} with:`, updates);
    return this.mixSubmissions[index];
  }

  async toggleMixFeature(id: number): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    (this.mixSubmissions[index] as any).featured = !(this.mixSubmissions[index] as any).featured;
    await this.saveData('mixSubmissions', this.mixSubmissions);
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
    
    await this.saveData('mixSubmissions', this.mixSubmissions);
    return this.mixSubmissions[index];
  }

  async deleteMixSubmission(id: number): Promise<void> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    this.mixSubmissions.splice(index, 1);
    await this.saveData('mixSubmissions', this.mixSubmissions);
    console.log(`FileStorage: Deleted mix submission ${id}`);
  }

  // Schedule
  async getSchedule(filters?: { upcoming?: boolean; date?: Date; limit?: number }): Promise<Schedule[]> {
    let filtered = [...this.scheduleItems];
    
    const now = new Date();
    if (filters?.upcoming) {
      filtered = filtered.filter(s => new Date(s.startTime) > now);
    }
    
    if (filters?.date) {
      const targetDate = new Date(filters.date);
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.startTime);
        return scheduleDate.toDateString() === targetDate.toDateString();
      });
    }
    
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
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
      updatedAt: new Date(),
    };
    this.scheduleItems.push(newSchedule);
    await this.saveData('scheduleItems', this.scheduleItems);
    return newSchedule;
  }

  async updateScheduleItem(id: number, schedule: Partial<Schedule>): Promise<Schedule> {
    const index = this.scheduleItems.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Schedule item not found');
    
    this.scheduleItems[index] = { ...this.scheduleItems[index], ...schedule };
    await this.saveData('scheduleItems', this.scheduleItems);
    return this.scheduleItems[index];
  }

  async deleteScheduleItem(id: number): Promise<void> {
    const index = this.scheduleItems.findIndex(s => s.id === id);
    if (index !== -1) {
      this.scheduleItems.splice(index, 1);
      await this.saveData('scheduleItems', this.scheduleItems);
    }
  }

  // Song Submissions
  async getSongSubmissions(filters?: { status?: string; limit?: number }): Promise<SongSubmission[]> {
    let filtered = [...this.songSubmissions];
    
    if (filters?.status) {
      filtered = filtered.filter(s => s.approvalStatus === filters.status);
    }
    
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
    await this.saveData('songSubmissions', this.songSubmissions);
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
    
    await this.saveData('songSubmissions', this.songSubmissions);
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
    await this.saveData('admins', this.admins);
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
    await this.saveData('currentPlayback', this.currentPlayback);
    return newPlayback;
  }
}