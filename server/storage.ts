import type {
  User, InsertUser,
  Station, InsertStation,
  Show, InsertShow,
  DjSubmission, InsertDjSubmission,
  ResidentApplication, InsertResidentApplication,
  SongSubmission, InsertSongSubmission,
  ThemedProgram, InsertThemedProgram,
  Admin, InsertAdmin,
  ZineSubmission, InsertZineSubmission,
  ZineContent, InsertZineContent,
  EditorialWorkflow, InsertEditorialWorkflow,
  PhysicalMedia, InsertPhysicalMedia,
  MixUpload, InsertMixUpload,
  MixTracklist, InsertMixTracklist,
  Episode, InsertEpisode,
  EpisodeTracklist, InsertEpisodeTracklist,
  RadioPlaylist, InsertRadioPlaylist,
  CurrentPlayback, InsertCurrentPlayback,
  TrackMetadata
} from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent JSON file-based storage for mix submissions
interface MixSubmissionData {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audioUrl?: string;
  status: 'pending' | 'approved' | 'featured';
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  // Metadata fields for SoundCloud/external platform integration
  dynamicTitle?: string;
  dynamicArtist?: string;
  thumbnail?: string;
  metadataFetched?: boolean;
}

interface MixStorageData {
  mixSubmissions: MixSubmissionData[];
  nextId: number;
}

class PersistentMixStorage {
  private storageFile = path.join(__dirname, 'mixStorage.json');
  
  private loadData(): MixStorageData {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading mix storage:', error);
    }
    return { mixSubmissions: [], nextId: 1 };
  }
  
  private saveData(data: MixStorageData): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving mix storage:', error);
    }
  }
  
  submitMix(submission: Omit<MixSubmissionData, 'id' | 'status' | 'submittedAt'>): MixSubmissionData {
    const data = this.loadData();
    const newSubmission: MixSubmissionData = {
      ...submission,
      id: data.nextId++,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    data.mixSubmissions.push(newSubmission);
    this.saveData(data);
    return newSubmission;
  }
  
  getMixes(status?: 'approved' | 'featured', genre?: string): MixSubmissionData[] {
    const data = this.loadData();
    let mixes = data.mixSubmissions;
    
    if (status) {
      mixes = mixes.filter(mix => mix.status === status || (status === 'approved' && mix.status === 'featured'));
    }
    
    if (genre) {
      mixes = mixes.filter(mix => mix.genre.toLowerCase() === genre.toLowerCase());
    }
    
    return mixes;
  }
  
  approveMix(submissionId: number, status: 'approved' | 'featured', approvedBy: string): MixSubmissionData | null {
    const data = this.loadData();
    const submission = data.mixSubmissions.find(mix => mix.id === submissionId);
    
    if (!submission) return null;
    
    submission.status = status;
    submission.approvedAt = new Date().toISOString();
    submission.approvedBy = approvedBy;
    
    this.saveData(data);
    return submission;
  }
  
  getAllSubmissions(): MixSubmissionData[] {
    const data = this.loadData();
    return data.mixSubmissions;
  }

  deleteSubmission(id: number): boolean {
    const data = this.loadData();
    const index = data.mixSubmissions.findIndex(submission => submission.id === id);
    
    if (index === -1) {
      return false;
    }
    
    data.mixSubmissions.splice(index, 1);
    this.saveData(data);
    return true;
  }

  getSubmission(id: number): MixSubmissionData | null {
    const data = this.loadData();
    return data.mixSubmissions.find(submission => submission.id === id) || null;
  }

  updateSubmissionMetadata(id: number, metadata: {
    dynamicTitle?: string;
    dynamicArtist?: string;
    thumbnail?: string;
    metadataFetched?: boolean;
  }): MixSubmissionData | null {
    const data = this.loadData();
    const submission = data.mixSubmissions.find(mix => mix.id === id);
    
    if (!submission) return null;
    
    // Update metadata fields
    Object.assign(submission, metadata);
    
    this.saveData(data);
    return submission;
  }
}

export const mixStorage = new PersistentMixStorage();

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Station methods
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;

  // Show methods
  getAllShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;

  // DJ Submission methods
  getAllDjSubmissions(): Promise<DjSubmission[]>;
  getDjSubmission(id: number): Promise<DjSubmission | undefined>;
  createDjSubmission(submission: InsertDjSubmission): Promise<DjSubmission>;
  updateDjSubmissionStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<DjSubmission | undefined>;

  // Resident Application methods
  getAllResidentApplications(): Promise<ResidentApplication[]>;
  getResidentApplication(id: number): Promise<ResidentApplication | undefined>;
  createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication>;
  updateResidentApplicationStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<ResidentApplication | undefined>;

  // Song Submission methods
  getAllSongSubmissions(): Promise<SongSubmission[]>;
  getSongSubmission(id: number): Promise<SongSubmission | undefined>;
  createSongSubmission(submission: InsertSongSubmission): Promise<SongSubmission>;
  updateSongSubmissionStatus(id: number, status: string, approvedBy: string, notes?: string): Promise<SongSubmission | undefined>;

  // Admin methods
  validateAdmin(username: string, password: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Playback methods
  getCurrentPlayback(): Promise<CurrentPlayback | undefined>;
  updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback>;

  // Queue management
  addToQueue(songSubmissionId: number): Promise<void>;
  getQueuedSongs(): Promise<any[]>;
  getCurrentlyPlaying(): Promise<any>;
  setCurrentlyPlaying(id: number): Promise<any>;
  skipCurrentTrack(): Promise<any>;

  // Track metadata
  storeTrackMetadata(filename: string, metadata: TrackMetadata): Promise<void>;
  getTrackMetadata(filename: string): Promise<TrackMetadata | undefined>;
  
  // Mix-related methods
  getAllMixUploads(): Promise<MixUpload[]>;
  getMixUpload(id: number): Promise<MixUpload | undefined>;
  createMixUpload(upload: InsertMixUpload): Promise<MixUpload>;
  updateMixUploadStatus(id: number, isLive: boolean, isFeatured: boolean): Promise<MixUpload | undefined>;
  getMixTracklist(mixId: number): Promise<MixTracklist[]>;
  createMixTrack(track: InsertMixTracklist): Promise<MixTracklist>;
  getCurrentTrackByTime(mixId: number, currentTime: number): Promise<MixTracklist | null>;
  
  // Additional missing methods
  getFeaturedShows(): Promise<Show[]>;
  getLiveShows(): Promise<Show[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stations: Map<number, Station>;
  private shows: Map<number, Show>;
  private djSubmissions: Map<number, DjSubmission>;
  private residentApplications: Map<number, ResidentApplication>;
  private songSubmissions: Map<number, SongSubmission>;
  private themedPrograms: Map<number, ThemedProgram>;
  private admins: Map<number, Admin>;
  private zineSubmissions: Map<number, ZineSubmission>;
  private zineContent: Map<number, ZineContent>;
  private editorialWorkflow: Map<number, EditorialWorkflow>;
  private physicalMedia: Map<number, PhysicalMedia>;
  private mixUploads: Map<number, MixUpload>;
  private mixTracklist: Map<number, MixTracklist>;
  private episodes: Map<number, Episode>;
  private episodeTracklist: Map<number, EpisodeTracklist>;
  private radioPlaylist: Map<number, any>;
  private trackMetadataStore: Map<string, TrackMetadata>;
  private currentPlayback: CurrentPlayback | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.stations = new Map();
    this.shows = new Map();
    this.djSubmissions = new Map();
    this.residentApplications = new Map();
    this.songSubmissions = new Map();
    this.themedPrograms = new Map();
    this.admins = new Map();
    this.zineSubmissions = new Map();
    this.zineContent = new Map();
    this.editorialWorkflow = new Map();
    this.physicalMedia = new Map();
    this.mixUploads = new Map();
    this.mixTracklist = new Map();
    this.episodes = new Map();
    this.episodeTracklist = new Map();
    this.radioPlaylist = new Map();
    this.trackMetadataStore = new Map();
    this.currentId = 1;

    // Initialize only essential admin account - NO FAKE DATA
    this.initializeAdmin();
  }

  private initializeAdmin() {
    // Only admin account for login - no fake content
    const defaultAdmin: Admin = {
      id: 1,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      createdAt: new Date()
    };
    this.admins.set(1, defaultAdmin);
  }

  private generateId(): number {
    return this.currentId++;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.generateId(),
      username: userData.username,
      password: userData.password
    };
    this.users.set(user.id, user);
    return user;
  }

  // Station methods
  async getAllStations(): Promise<Station[]> {
    return Array.from(this.stations.values());
  }

  async getStation(id: number): Promise<Station | undefined> {
    return this.stations.get(id);
  }

  async createStation(stationData: InsertStation): Promise<Station> {
    const station: Station = {
      id: this.generateId(),
      name: stationData.name,
      slug: stationData.slug,
      streamUrl: stationData.streamUrl,
      genre: stationData.genre,
      description: stationData.description || null,
      artworkUrl: stationData.artworkUrl || null,
      isLive: stationData.isLive || null,
      createdAt: new Date()
    };
    this.stations.set(station.id, station);
    return station;
  }

  // Show methods
  async getAllShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }

  async getShow(id: number): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async createShow(showData: InsertShow): Promise<Show> {
    const show: Show = {
      id: this.generateId(),
      title: showData.title,
      host: showData.host,
      genre: showData.genre,
      description: showData.description || null,
      artworkUrl: showData.artworkUrl || null,
      scheduledAt: showData.scheduledAt || null,
      duration: showData.duration || null,
      isLive: showData.isLive || null,
      isFeatured: showData.isFeatured || null,
      createdAt: new Date()
    };
    this.shows.set(show.id, show);
    return show;
  }

  // DJ Submission methods
  async getAllDjSubmissions(): Promise<DjSubmission[]> {
    return Array.from(this.djSubmissions.values());
  }

  async getDjSubmission(id: number): Promise<DjSubmission | undefined> {
    return this.djSubmissions.get(id);
  }

  async createDjSubmission(submissionData: InsertDjSubmission): Promise<DjSubmission> {
    const submission: DjSubmission = {
      id: this.generateId(),
      djName: submissionData.djName,
      realName: submissionData.realName,
      email: submissionData.email,
      location: submissionData.location || null,
      showTitle: submissionData.showTitle,
      showDescription: submissionData.showDescription,
      primaryGenre: submissionData.primaryGenre,
      showLength: submissionData.showLength,
      additionalGenres: submissionData.additionalGenres || null,
      djExperience: submissionData.djExperience || null,
      musicDiscovery: submissionData.musicDiscovery || null,
      socialMedia: submissionData.socialMedia || null,
      demoMixTitle: submissionData.demoMixTitle || null,
      demoMixDescription: submissionData.demoMixDescription || null,
      soundcloudUrl: submissionData.soundcloudUrl || null,
      mixcloudUrl: submissionData.mixcloudUrl || null,
      audiocomUrl: submissionData.audiocomUrl || null,
      otherUrl: submissionData.otherUrl || null,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null
    };
    this.djSubmissions.set(submission.id, submission);
    return submission;
  }

  async updateDjSubmissionStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<DjSubmission | undefined> {
    const submission = this.djSubmissions.get(id);
    if (!submission) return undefined;

    submission.status = status;
    submission.reviewedBy = reviewedBy;
    submission.reviewedAt = new Date();
    if (notes) submission.notes = notes;

    this.djSubmissions.set(id, submission);
    return submission;
  }

  // Resident Application methods
  async getAllResidentApplications(): Promise<ResidentApplication[]> {
    return Array.from(this.residentApplications.values());
  }

  async getResidentApplication(id: number): Promise<ResidentApplication | undefined> {
    return this.residentApplications.get(id);
  }

  async createResidentApplication(applicationData: InsertResidentApplication): Promise<ResidentApplication> {
    const application: ResidentApplication = {
      id: this.generateId(),
      djName: applicationData.djName,
      realName: applicationData.realName,
      email: applicationData.email,
      phoneNumber: applicationData.phoneNumber,
      location: applicationData.location,
      bio: applicationData.bio,
      experience: applicationData.experience,
      preferredGenres: applicationData.preferredGenres,
      showConcept: applicationData.showConcept,
      availableDays: applicationData.availableDays,
      preferredTimeSlot: applicationData.preferredTimeSlot,
      showLength: applicationData.showLength,
      techSetup: applicationData.techSetup,
      pastWork: applicationData.pastWork || null,
      socialMedia: applicationData.socialMedia || null,
      additionalInfo: applicationData.additionalInfo || null,
      mixSampleUrl: applicationData.mixSampleUrl || null,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null
    };
    this.residentApplications.set(application.id, application);
    return application;
  }

  async updateResidentApplicationStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<ResidentApplication | undefined> {
    const application = this.residentApplications.get(id);
    if (!application) return undefined;

    application.status = status;
    application.reviewedBy = reviewedBy;
    application.reviewedAt = new Date();
    if (notes) application.notes = notes;

    this.residentApplications.set(id, application);
    return application;
  }

  // Song Submission methods
  async getAllSongSubmissions(): Promise<SongSubmission[]> {
    return Array.from(this.songSubmissions.values());
  }

  async getSongSubmission(id: number): Promise<SongSubmission | undefined> {
    return this.songSubmissions.get(id);
  }

  async createSongSubmission(submissionData: InsertSongSubmission): Promise<SongSubmission> {
    const submission: SongSubmission = {
      id: this.generateId(),
      submitterName: submissionData.submitterName,
      submitterEmail: submissionData.submitterEmail,
      songTitle: submissionData.songTitle,
      artistName: submissionData.artistName,
      albumName: submissionData.albumName || null,
      genre: submissionData.genre,
      submissionType: submissionData.submissionType,
      platform: submissionData.platform,
      platformUrl: submissionData.platformUrl,
      trackId: submissionData.trackId || null,
      description: submissionData.description || null,
      requestedDate: submissionData.requestedDate || null,
      isScheduled: submissionData.isScheduled || false,
      scheduledFor: submissionData.scheduledFor || null,
      themeTag: submissionData.themeTag || null,
      metadata: submissionData.metadata || null,
      approvalStatus: "pending",
      approvedBy: null,
      approvedAt: null,
      playedAt: null,
      playCount: 0,
      submittedAt: new Date(),
      notes: submissionData.notes || null,
      queuePosition: submissionData.queuePosition || null,
      playbackStatus: submissionData.playbackStatus || "queued",
      currentlyPlaying: submissionData.currentlyPlaying || false
    };
    this.songSubmissions.set(submission.id, submission);
    return submission;
  }

  async updateSongSubmissionStatus(id: number, status: string, approvedBy: string, notes?: string): Promise<SongSubmission | undefined> {
    const submission = this.songSubmissions.get(id);
    if (!submission) return undefined;

    // Note: SongSubmission doesn't have status, approvedBy, or reviewedAt fields based on schema
    // This method should be updated based on actual SongSubmission fields
    if (notes) submission.notes = notes;

    this.songSubmissions.set(id, submission);
    return submission;
  }

  // Admin methods
  async validateAdmin(username: string, password: string): Promise<Admin | undefined> {
    for (const admin of Array.from(this.admins.values())) {
      if (admin.username === username && admin.password === password) {
        return admin;
      }
    }
    return undefined;
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const admin: Admin = {
      id: this.generateId(),
      username: adminData.username,
      password: adminData.password,
      role: adminData.role || "admin",
      createdAt: new Date()
    };
    this.admins.set(admin.id, admin);
    return admin;
  }

  // Playback methods
  async getCurrentPlayback(): Promise<CurrentPlayback | undefined> {
    return this.currentPlayback;
  }

  async updateCurrentPlayback(playbackData: InsertCurrentPlayback): Promise<CurrentPlayback> {
    this.currentPlayback = {
      id: this.currentPlayback?.id || 1,
      title: playbackData.title,
      stationId: playbackData.stationId || null,
      showId: playbackData.showId || null,
      artist: playbackData.artist || null,
      artwork: playbackData.artwork || null,
      isLive: playbackData.isLive || null,
      startTime: new Date()
    };
    return this.currentPlayback;
  }

  // Queue management methods
  async addToQueue(songSubmissionId: number): Promise<void> {
    // Implementation for adding to queue
  }

  async getQueuedSongs(): Promise<any[]> {
    return [];
  }

  async getCurrentlyPlaying(): Promise<any> {
    return null;
  }

  async setCurrentlyPlaying(id: number): Promise<any> {
    return null;
  }

  async skipCurrentTrack(): Promise<any> {
    return null;
  }

  // Track metadata methods
  async storeTrackMetadata(filename: string, metadata: TrackMetadata): Promise<void> {
    this.trackMetadataStore.set(filename, metadata);
  }

  async getTrackMetadata(filename: string): Promise<TrackMetadata | undefined> {
    return this.trackMetadataStore.get(filename);
  }

  // Mix-related methods
  async getAllMixUploads(): Promise<MixUpload[]> {
    return Array.from(this.mixUploads.values());
  }

  async getMixUpload(id: number): Promise<MixUpload | undefined> {
    return this.mixUploads.get(id);
  }

  async createMixUpload(uploadData: InsertMixUpload): Promise<MixUpload> {
    const upload: MixUpload = {
      id: this.generateId(),
      title: uploadData.title,
      artist: uploadData.artist,
      description: uploadData.description || null,
      genre: uploadData.genre,
      duration: uploadData.duration,
      fileUrl: uploadData.fileUrl,
      artworkUrl: uploadData.artworkUrl || null,
      isLive: uploadData.isLive || false,
      isFeatured: uploadData.isFeatured || false,
      uploadedBy: uploadData.uploadedBy,
      uploadedAt: new Date()
    };
    this.mixUploads.set(upload.id, upload);
    return upload;
  }

  async updateMixUploadStatus(id: number, isLive: boolean, isFeatured: boolean): Promise<MixUpload | undefined> {
    const upload = this.mixUploads.get(id);
    if (!upload) return undefined;

    upload.isLive = isLive;
    upload.isFeatured = isFeatured;
    this.mixUploads.set(id, upload);
    return upload;
  }

  async getMixTracklist(mixId: number): Promise<MixTracklist[]> {
    return Array.from(this.mixTracklist.values()).filter(track => track.mixId === mixId);
  }

  async createMixTrack(trackData: InsertMixTracklist): Promise<MixTracklist> {
    const track: MixTracklist = {
      id: this.generateId(),
      mixId: trackData.mixId,
      trackNumber: trackData.trackNumber,
      title: trackData.title,
      artist: trackData.artist,
      startTime: trackData.startTime,
      endTime: trackData.endTime || null,
      label: trackData.label || null,
      year: trackData.year || null,
      genre: trackData.genre || null,
      bpm: trackData.bpm || null,
      key: trackData.key || null,
      notes: trackData.notes || null,
      spotifyId: trackData.spotifyId || null,
      soundcloudUrl: trackData.soundcloudUrl || null,
      youtubeUrl: trackData.youtubeUrl || null,
      discogsUrl: trackData.discogsUrl || null,
      isSpotifyAvailable: trackData.isSpotifyAvailable || false
    };
    this.mixTracklist.set(track.id, track);
    return track;
  }

  async getCurrentTrackByTime(mixId: number, currentTime: number): Promise<MixTracklist | null> {
    const tracklist = await this.getMixTracklist(mixId);
    const currentTrack = tracklist.find(track => 
      track.startTime <= currentTime && 
      (track.endTime === null || track.endTime >= currentTime)
    );
    return currentTrack || null;
  }

  // Additional missing methods
  async getFeaturedShows(): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => show.isFeatured === true);
  }

  async getLiveShows(): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => show.isLive === true);
  }
}

// Export singleton instance
export const storage = new MemStorage();