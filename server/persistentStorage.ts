import fs from 'fs/promises';
import path from 'path';
import {
  Episode, 
  Guide, 
  MixSubmission, 
  Schedule, 
  SongSubmission,
  ResidentApplication,
  Admin,
  CurrentPlayback,
  AlbumSuggestion,
  AlbumVote,
  AlbumPick,
  AlbumPickItem,
  AlbumSuggestionNote,
  InsertEpisode,
  InsertGuide, 
  InsertMixSubmission,
  InsertSchedule,
  InsertSongSubmission,
  InsertResidentApplication,
  InsertAdmin,
  InsertCurrentPlayback,
  InsertAlbumSuggestion,
  InsertAlbumVote,
  InsertAlbumPick,
  InsertAlbumPickItem,
  InsertAlbumSuggestionNote
} from "@shared/schema";
import { IStorage } from "./storage";
import { backupManager } from "./backupManager";

// File-based persistent storage to solve the memory reset issue
export class FileStorage implements IStorage {
  private dataDir = './data';
  private nextIdFile = path.join(this.dataDir, 'nextId.json');
  
  private episodes: Episode[] = [];
  private guides: Guide[] = [];
  private mixSubmissions: MixSubmission[] = [];
  private scheduleItems: Schedule[] = [];
  private songSubmissions: SongSubmission[] = [];
  private residentApplications: ResidentApplication[] = [];
  private admins: Admin[] = [];
  private currentPlayback: CurrentPlayback | null = null;
  private albumSuggestions: AlbumSuggestion[] = [];
  private albumVotes: AlbumVote[] = [];
  private albumPicks: AlbumPick[] = [];
  private albumPickItems: AlbumPickItem[] = [];
  private albumSuggestionNotes: AlbumSuggestionNote[] = [];
  private nextId = 1;

  constructor() {
    this.loadData();
  }

  // Migrate data to ensure both status field and boolean flags are properly set
  private migrateMixData(mix: any): MixSubmission {
    // Preserve status field as primary source of truth, set boolean flags based on status
    if (mix.status && typeof mix.status === 'string') {
      const newMix = {
        ...mix,
        // Keep the status field as canonical source of truth
        status: mix.status,
        // Set boolean flags based on status for backward compatibility
        featureOnSite: mix.status === 'featured',
        pushToAzura: mix.status === 'approved' || mix.status === 'featured'
      };
      return newMix;
    }
    
    // If no status field, infer it from boolean flags (legacy data)
    let status = 'pending';
    if (mix.featureOnSite) {
      status = 'featured';
    } else if (mix.pushToAzura) {
      status = 'approved';
    }
    
    return {
      ...mix,
      status,
      featureOnSite: mix.featureOnSite ?? false,
      pushToAzura: mix.pushToAzura ?? false
    };
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  public async reloadData() {
    await this.loadData();
    console.log(`🔄 Storage data reloaded: ${this.mixSubmissions.length} mix submissions found`);
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
        'residentApplications.json',
        'admins.json',
        'currentPlayback.json',
        'albumSuggestions.json',
        'albumVotes.json',
        'albumPicks.json',
        'albumPickItems.json',
        'albumSuggestionNotes.json'
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
              this.mixSubmissions = (parsed || []).map((mix: any) => this.migrateMixData(mix));
              break;
            case 'scheduleItems.json':
              this.scheduleItems = parsed || [];
              break;
            case 'songSubmissions.json':
              this.songSubmissions = parsed || [];
              break;
            case 'residentApplications.json':
              this.residentApplications = parsed || [];
              break;
            case 'admins.json':
              this.admins = parsed || [];
              break;
            case 'currentPlayback.json':
              this.currentPlayback = parsed || null;
              break;
            case 'albumSuggestions.json':
              this.albumSuggestions = parsed || [];
              break;
            case 'albumVotes.json':
              this.albumVotes = parsed || [];
              break;
            case 'albumPicks.json':
              this.albumPicks = parsed || [];
              break;
            case 'albumPickItems.json':
              this.albumPickItems = parsed || [];
              break;
            case 'albumSuggestionNotes.json':
              this.albumSuggestionNotes = parsed || [];
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
      // Create backup before destructive operation
      await backupManager.createBackup(`Before deleting episode ${id}`);
      
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
      // Create backup before destructive operation
      await backupManager.createBackup(`Before deleting guide ${id}`);
      
      this.guides.splice(index, 1);
      await this.saveData('guides', this.guides);
    }
  }

  // Mix Submissions - PERSISTENT STORAGE FOR YOUR MIX!
  async getMixSubmissions(filters?: { status?: string; genre?: string; limit?: number; approved?: boolean; featured?: boolean }): Promise<MixSubmission[]> {
    let filtered = [...this.mixSubmissions];
    
    // Use status field as primary filter, fall back to boolean flags for legacy data
    if (filters?.status) {
      console.log(`FileStorage: Filtering by status: ${filters.status}`);
      if (filters.status === 'approved') {
        // Include both approved and featured mixes when requesting approved 
        filtered = filtered.filter(m => (m as any).status === 'approved' || (m as any).status === 'featured');
      } else if (filters.status === 'featured') {
        filtered = filtered.filter(m => (m as any).status === 'featured');
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(m => (m as any).status === 'pending');
      } else if (filters.status === 'all') {
        // Return all mixes
      }
    }
    
    // New boolean-based filtering
    if (filters?.approved !== undefined) {
      filtered = filtered.filter(m => ((m as any).featureOnSite || (m as any).pushToAzura) === filters.approved);
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(m => (m as any).featureOnSite === filters.featured);
    }
    
    if (filters?.genre) {
      filtered = filtered.filter(m => m.genre.toLowerCase().includes(filters.genre!.toLowerCase()));
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
    
    // Check if mix is approved first (has pushToAzura = true)
    if (!(this.mixSubmissions[index] as any).pushToAzura) {
      throw new Error('Mix must be approved before featuring');
    }
    
    (this.mixSubmissions[index] as any).featureOnSite = !(this.mixSubmissions[index] as any).featureOnSite;
    await this.saveData('mixSubmissions', this.mixSubmissions);
    return this.mixSubmissions[index];
  }

  async toggleMixApproval(id: number): Promise<MixSubmission> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    const currentApproved = (this.mixSubmissions[index] as any).approved;
    (this.mixSubmissions[index] as any).approved = !currentApproved;
    
    // Update new boolean fields instead of old status
    if ((this.mixSubmissions[index] as any).approved) {
      (this.mixSubmissions[index] as any).approvedAt = new Date();
      (this.mixSubmissions[index] as any).pushToAzura = true;
    } else {
      (this.mixSubmissions[index] as any).pushToAzura = false;
      (this.mixSubmissions[index] as any).featureOnSite = false; // If unapproving, also unfeature
    }
    
    await this.saveData('mixSubmissions', this.mixSubmissions);
    return this.mixSubmissions[index];
  }

  async deleteMixSubmission(id: number): Promise<void> {
    const index = this.mixSubmissions.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Mix submission not found');
    
    // Create backup before destructive operation
    await backupManager.createBackup(`Before deleting mix submission ${id}`);
    
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
      // Create backup before destructive operation
      await backupManager.createBackup(`Before deleting schedule item ${id}`);
      
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

  async getSongSubmissionById(id: number): Promise<SongSubmission | undefined> {
    return this.songSubmissions.find(s => s.id === id);
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
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
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
    };
    this.residentApplications.push(newApplication);
    await this.saveData('residentApplications', this.residentApplications);
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
    await this.saveData('residentApplications', this.residentApplications);
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
    await this.saveData('residentApplications', this.residentApplications);
    return this.residentApplications[index];
  }

  async deleteResidentApplication(id: number): Promise<void> {
    const index = this.residentApplications.findIndex(a => a.id === id);
    if (index !== -1) {
      // Create backup before destructive operation
      await backupManager.createBackup(`Before deleting resident application ${id}`);
      
      this.residentApplications.splice(index, 1);
      await this.saveData('residentApplications', this.residentApplications);
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

  // Albums of the Month
  // ===================
  
  async getAlbumSuggestions(filters?: { status?: string; limit?: number }): Promise<AlbumSuggestion[]> {
    let filtered = [...this.albumSuggestions];
    
    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getAlbumSuggestionById(id: number): Promise<AlbumSuggestion | undefined> {
    return this.albumSuggestions.find(s => s.id === id);
  }

  async createAlbumSuggestion(data: InsertAlbumSuggestion, mbData?: { musicbrainzId: string; releaseGroupId: string; coverArtUrl: string | null; artist: string; title: string }): Promise<AlbumSuggestion> {
    const suggestion: AlbumSuggestion = {
      ...data,
      id: this.nextId++,
      musicbrainzId: mbData?.musicbrainzId || null,
      releaseGroupId: mbData?.releaseGroupId || null,
      artist: mbData?.artist || data.artist,
      title: mbData?.title || data.title,
      coverArtUrl: mbData?.coverArtUrl || null,
      status: 'pending',
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };
    
    this.albumSuggestions.push(suggestion);
    await this.saveData('albumSuggestions', this.albumSuggestions);
    return suggestion;
  }

  async updateAlbumSuggestion(id: number, updates: Partial<AlbumSuggestion>): Promise<AlbumSuggestion> {
    const index = this.albumSuggestions.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Album suggestion not found');
    
    this.albumSuggestions[index] = { ...this.albumSuggestions[index], ...updates };
    await this.saveData('albumSuggestions', this.albumSuggestions);
    return this.albumSuggestions[index];
  }

  async acceptAlbumSuggestion(id: number, reviewedBy: string): Promise<AlbumSuggestion> {
    return this.updateAlbumSuggestion(id, {
      status: 'accepted',
      reviewedAt: new Date(),
      reviewedBy
    });
  }

  async rejectAlbumSuggestion(id: number, reviewedBy: string): Promise<AlbumSuggestion> {
    return this.updateAlbumSuggestion(id, {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy
    });
  }

  async voteOnAlbumSuggestion(suggestionId: number, voterUsername: string, value: 1 | -1): Promise<AlbumVote> {
    // Remove existing vote by this user for this suggestion
    this.albumVotes = this.albumVotes.filter(v => 
      !(v.suggestionId === suggestionId && v.voterUsername === voterUsername)
    );
    
    const vote: AlbumVote = {
      id: this.nextId++,
      suggestionId,
      voterUsername,
      value,
      createdAt: new Date(),
    };
    
    this.albumVotes.push(vote);
    await this.saveData('albumVotes', this.albumVotes);
    return vote;
  }

  async getAlbumVotesForSuggestion(suggestionId: number): Promise<AlbumVote[]> {
    return this.albumVotes.filter(v => v.suggestionId === suggestionId);
  }

  async getAlbumSuggestionsWithVotes(): Promise<Array<AlbumSuggestion & { voteCount: number; approvalCount: number; votes: AlbumVote[] }>> {
    return this.albumSuggestions.map(suggestion => {
      const votes = this.albumVotes.filter(v => v.suggestionId === suggestion.id);
      const voteCount = votes.reduce((sum, v) => sum + v.value, 0);
      const approvalCount = votes.filter(v => v.value > 0).length;
      
      return { ...suggestion, voteCount, approvalCount, votes };
    });
  }

  async createAlbumPick(data: InsertAlbumPick): Promise<AlbumPick> {
    const pick: AlbumPick = {
      ...data,
      id: this.nextId++,
      isPublished: false,
      publishedAt: null,
      createdAt: new Date(),
    };
    
    this.albumPicks.push(pick);
    await this.saveData('albumPicks', this.albumPicks);
    return pick;
  }

  async getAlbumPickByMonth(month: string): Promise<AlbumPick | undefined> {
    return this.albumPicks.find(p => p.month === month);
  }

  async getAlbumPickById(id: number): Promise<AlbumPick | undefined> {
    return this.albumPicks.find(p => p.id === id);
  }

  async getPublishedAlbumPicks(): Promise<AlbumPick[]> {
    return this.albumPicks.filter(p => p.isPublished).sort((a, b) => 
      new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    );
  }

  async addAlbumToPickDraft(data: InsertAlbumPickItem): Promise<AlbumPickItem> {
    const item: AlbumPickItem = {
      ...data,
      id: this.nextId++,
      createdAt: new Date(),
    };
    
    this.albumPickItems.push(item);
    await this.saveData('albumPickItems', this.albumPickItems);
    return item;
  }

  async getAlbumPickItems(pickId: number): Promise<AlbumPickItem[]> {
    return this.albumPickItems
      .filter(item => item.pickId === pickId)
      .sort((a, b) => a.rank - b.rank);
  }

  async updateAlbumPickItem(id: number, updates: Partial<AlbumPickItem>): Promise<AlbumPickItem> {
    const index = this.albumPickItems.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Album pick item not found');
    
    this.albumPickItems[index] = { ...this.albumPickItems[index], ...updates };
    await this.saveData('albumPickItems', this.albumPickItems);
    return this.albumPickItems[index];
  }

  async deleteAlbumPickItem(id: number): Promise<void> {
    const index = this.albumPickItems.findIndex(i => i.id === id);
    if (index !== -1) {
      this.albumPickItems.splice(index, 1);
      await this.saveData('albumPickItems', this.albumPickItems);
    }
  }

  async publishAlbumPick(pickId: number): Promise<AlbumPick> {
    const index = this.albumPicks.findIndex(p => p.id === pickId);
    if (index === -1) throw new Error('Album pick not found');
    
    this.albumPicks[index] = {
      ...this.albumPicks[index],
      isPublished: true,
      publishedAt: new Date(),
    };
    
    await this.saveData('albumPicks', this.albumPicks);
    return this.albumPicks[index];
  }

  async getPublishedAlbumPickWithItems(month: string): Promise<(AlbumPick & { items: Array<AlbumPickItem & { album: AlbumSuggestion }> }) | null> {
    const pick = this.albumPicks.find(p => p.month === month && p.isPublished);
    if (!pick) return null;
    
    const items = this.albumPickItems
      .filter(item => item.pickId === pick.id)
      .sort((a, b) => a.rank - b.rank)
      .map(item => {
        const album = this.albumSuggestions.find(s => s.id === item.suggestionId)!;
        return { ...item, album };
      });
    
    return { ...pick, items };
  }

  async addAlbumSuggestionNote(data: InsertAlbumSuggestionNote): Promise<AlbumSuggestionNote> {
    const note: AlbumSuggestionNote = {
      ...data,
      id: this.nextId++,
      createdAt: new Date(),
    };
    
    this.albumSuggestionNotes.push(note);
    await this.saveData('albumSuggestionNotes', this.albumSuggestionNotes);
    return note;
  }

  async getAlbumSuggestionNotes(suggestionId: number): Promise<AlbumSuggestionNote[]> {
    return this.albumSuggestionNotes
      .filter(n => n.suggestionId === suggestionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Emergency reset - clear all data
  async emergencyReset(): Promise<void> {
    await this.ensureDataDir();
    
    try {
      // Create emergency backup before clearing
      await backupManager.createBackup('EMERGENCY BACKUP - Before system reset');
      
      // Clear all in-memory data
      this.episodes = [];
      this.guides = [];
      this.mixSubmissions = [];
      this.scheduleItems = [];
      this.songSubmissions = [];
      this.residentApplications = [];
      this.admins = [];
      this.currentPlayback = null;
      this.albumSuggestions = [];
      this.albumVotes = [];
      this.albumPicks = [];
      this.albumPickItems = [];
      this.albumSuggestionNotes = [];
      this.nextId = 1;
      
      // Delete all data files
      const files = [
        'episodes.json',
        'guides.json',
        'mixSubmissions.json',
        'scheduleItems.json',
        'songSubmissions.json',
        'residentApplications.json',
        'admins.json',
        'currentPlayback.json',
        'albumSuggestions.json',
        'albumVotes.json',
        'albumPicks.json',
        'albumPickItems.json',
        'albumSuggestionNotes.json'
      ];
      
      for (const file of files) {
        try {
          const filePath = path.join(this.dataDir, file);
          await fs.unlink(filePath);
          console.log(`Deleted ${file}`);
        } catch (error) {
          // File might not exist, continue
        }
      }
      
      // Reset next ID
      await fs.writeFile(this.nextIdFile, JSON.stringify({ nextId: 1 }));
      
      console.log('Emergency reset completed - all data cleared');
    } catch (error) {
      console.error('Error during emergency reset:', error);
      throw error;
    }
  }
}