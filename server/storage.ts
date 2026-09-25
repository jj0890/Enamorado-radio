import { 
  Show,
  Episode, 
  Guide,
  HeroBanner,
  MixSubmission,
  PlaylistSubmission, 
  Schedule, 
  ResidentApplication,
  Resident,
  Admin,
  Settings,
  CurrentPlayback,
  Contributor,
  InsertShow,
  InsertEpisode,
  InsertGuide,
  InsertHeroBanner,
  InsertMixSubmission,
  InsertPlaylistSubmission,
  InsertSchedule,
  InsertResidentApplication,
  InsertResident,
  InsertAdmin,
  InsertSettings,
  InsertCurrentPlayback,
  InsertContributor
} from "@shared/schema";

// Clean Storage Interface - Single source of truth for all data operations
export interface IStorage {
  // Shows - Radio show series/programs
  getShows(filters?: { status?: string; limit?: number }): Promise<Show[]>;
  getShowById(id: number): Promise<Show | undefined>;
  getShowBySlug(slug: string): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  updateShow(id: number, show: Partial<Show>): Promise<Show>;
  deleteShow(id: number): Promise<void>;

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

  // Hero Banners - Seasonal homepage banners
  getHeroBanners(): Promise<HeroBanner[]>;
  getActiveBanner(): Promise<HeroBanner | undefined>;
  getHeroBannerById(id: number): Promise<HeroBanner | undefined>;
  createHeroBanner(banner: InsertHeroBanner): Promise<HeroBanner>;
  updateHeroBanner(id: number, banner: Partial<HeroBanner>): Promise<HeroBanner>;
  deleteHeroBanner(id: number): Promise<void>;
  setActiveBanner(id: number): Promise<HeroBanner>;

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

  // Playlist Submissions - Community curated playlists
  getPlaylistSubmissions(filters?: { status?: string; limit?: number; featured?: boolean; approved?: boolean }): Promise<PlaylistSubmission[]>;
  getPlaylistSubmissionById(id: number): Promise<PlaylistSubmission | undefined>;
  createPlaylistSubmission(submission: InsertPlaylistSubmission): Promise<PlaylistSubmission>;
  updatePlaylistSubmissionStatus(id: number, status: string, notes?: string): Promise<PlaylistSubmission>;
  updatePlaylistSubmission(id: number, updates: Partial<PlaylistSubmission>): Promise<PlaylistSubmission>;
  togglePlaylistFeature(id: number): Promise<PlaylistSubmission>;
  togglePlaylistApproval(id: number): Promise<PlaylistSubmission>;
  likePlaylistSubmission(id: number): Promise<PlaylistSubmission>;
  deletePlaylistSubmission(id: number): Promise<void>;

  // Schedule - Programming grid
  getSchedule(filters?: { upcoming?: boolean; date?: Date; limit?: number }): Promise<Schedule[]>;
  getScheduleById(id: number): Promise<Schedule | undefined>;
  createScheduleItem(schedule: InsertSchedule): Promise<Schedule>;
  updateScheduleItem(id: number, schedule: Partial<Schedule>): Promise<Schedule>;
  deleteScheduleItem(id: number): Promise<void>;

  // Resident Applications - DJ/Host applications
  getResidentApplications(filters?: { status?: string; priority?: string; limit?: number }): Promise<ResidentApplication[]>;
  getResidentApplicationById(id: number): Promise<ResidentApplication | undefined>;
  createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication>;
  updateResidentApplication(id: number, updates: Partial<ResidentApplication>): Promise<ResidentApplication>;
  updateResidentApplicationStatus(id: number, status: string, notes?: string): Promise<ResidentApplication>;
  deleteResidentApplication(id: number): Promise<void>;

  // Residents - DJs/Hosts with streaming access
  getResidents(filters?: { isActive?: boolean; limit?: number }): Promise<Resident[]>;
  getResidentById(id: number): Promise<Resident | undefined>;
  getResidentByUsername(username: string): Promise<Resident | undefined>;
  createResident(resident: InsertResident): Promise<Resident>;
  updateResident(id: number, updates: Partial<Resident>): Promise<Resident>;
  deleteResident(id: number): Promise<void>;

  // Admin & System
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getCurrentPlayback(): Promise<CurrentPlayback | undefined>;
  updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback>;
  
  // Settings - System configuration
  getSettings(): Promise<Settings[]>;
  getSettingByKey(key: string): Promise<Settings | undefined>;
  upsertSetting(key: string, value: string, description?: string, isSecret?: boolean): Promise<Settings>;
  deleteSetting(key: string): Promise<void>;

  // Contributors - Community members who submit content
  getContributors(): Promise<Contributor[]>;
  getContributorById(id: number): Promise<Contributor | undefined>;
  getContributorByHandle(handle: string): Promise<Contributor | undefined>;
  createContributor(contributor: InsertContributor): Promise<Contributor>;
  updateContributor(id: number, updates: Partial<Contributor>): Promise<Contributor | undefined>;

  // Alias convenience methods (used in routes.ts)
  getPlaylistSubmission(id: number): Promise<PlaylistSubmission | undefined>;
  getAlbumSuggestion(id: number): Promise<any | undefined>;
  updateMixRoutingStatus(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission>;

  // Episode Submissions - Resident-submitted episodes
  getEpisodeSubmissions(filters?: { status?: string; residentId?: number; limit?: number }): Promise<any[]>;
  getEpisodeSubmissionById(id: number): Promise<any | undefined>;
  createEpisodeSubmission(submission: any): Promise<any>;
  updateEpisodeSubmission(id: number, updates: any): Promise<any>;
  deleteEpisodeSubmission(id: number): Promise<void>;

  // Album of the Month
  getAlbumSuggestions(filters?: { status?: string; limit?: number }): Promise<any[]>;
  getAlbumSuggestionById(id: number): Promise<any | undefined>;
  createAlbumSuggestion(data: any, mbData?: any, spotifyUrl?: string): Promise<any>;
  updateAlbumSuggestion(id: number, updates: any): Promise<any>;
  acceptAlbumSuggestion(id: number, reviewedBy: string): Promise<any>;
  rejectAlbumSuggestion(id: number, reviewedBy: string): Promise<any>;
  deleteAlbumSuggestion(id: number): Promise<void>;
  voteOnAlbumSuggestion(suggestionId: number, voterUsername: string, value: 1 | -1): Promise<any>;
  getAlbumVotesForSuggestion(suggestionId: number): Promise<any[]>;
  getAlbumSuggestionsWithVotes(): Promise<any[]>;
  createAlbumPick(data: any): Promise<any>;
  getAlbumPickByMonth(month: string): Promise<any | undefined>;
  getAlbumPickById(id: number): Promise<any | undefined>;
  getAlbumPickItemById(id: number): Promise<any | undefined>;
  getPublishedAlbumPicks(): Promise<any[]>;
  getDraftAlbumPicks(): Promise<any[]>;
  addAlbumToPickDraft(data: any): Promise<any>;
  getAlbumPickItems(pickId: number): Promise<any[]>;
  updateAlbumPickItem(id: number, updates: any): Promise<any>;
  deleteAlbumPickItem(id: number): Promise<void>;
  publishAlbumPick(pickId: number): Promise<any>;
  deleteAlbumPick(pickId: number): Promise<void>;
  getPublishedAlbumPickWithItems(month: string): Promise<any | null>;
  addAlbumSuggestionNote(data: any): Promise<any>;
  getAlbumSuggestionNotes(suggestionId: number): Promise<any[]>;
  updateAlbumPick(id: number, updates: any): Promise<any>;

  // Year-End Lists
  getYearEndLists(): Promise<any[]>;
  getYearEndListBySlug(slug: string): Promise<any | undefined>;
  getYearEndListWithItems(slug: string): Promise<any | null>;

  // Radio stream service methods
  getApprovedSongSubmissions(): Promise<any[]>;
  addTrackLike(data: any): Promise<any>;

  // Track metadata service methods
  getTrackMetadata(filename: string): Promise<any | undefined>;
  saveTrackMetadata(data: any): Promise<any>;
  updateTrackMetadata(filename: string, updates: any): Promise<any>;

  // Radio Service methods
  getCurrentProgramState(): Promise<any | undefined>;
  updateProgramState(state: any): Promise<any>;
  getLiveShow(id: number): Promise<any | undefined>;
  getAllLiveShows(): Promise<any[]>;
  updateLiveShowStatus(id: number, isLive: boolean): Promise<void>;
  getRadioRotationTrack(trackId: string): Promise<any | undefined>;
  getApprovedRotationTracks(): Promise<any[]>;
  incrementRotationPlayCount(trackId: string): Promise<void>;
  createRadioRotationTrack(data: any): Promise<any>;
  updateRotationTrackStatus(trackId: string, status: string, approvedBy: string, inRotation: boolean): Promise<void>;
}

// In-Memory Implementation
class MemStorage implements IStorage {
  private episodes: Episode[] = [];
  private guides: Guide[] = [];
  private mixSubmissions: MixSubmission[] = [];
  private scheduleItems: Schedule[] = [];
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
      tracklist: episode.tracklist ?? null,
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
      handle: (submission as any).handle ?? null,
      contributorId: (submission as any).contributorId ?? null,
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
      residentId: schedule.residentId || null,
      isLive: schedule.isLive ?? false,
      isRecurring: schedule.isRecurring ?? false,
      recurrencePattern: schedule.recurrencePattern || null,
      artworkUrl: schedule.artworkUrl || null,
      liveStatus: schedule.liveStatus || 'scheduled',
      streamingCredentials: schedule.streamingCredentials || null,
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

  // Residents
  private residents: Resident[] = [];

  async getResidents(filters?: { isActive?: boolean; limit?: number }): Promise<Resident[]> {
    let filtered = [...this.residents];
    
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(r => r.isActive === filters.isActive);
    }
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  }

  async getResidentById(id: number): Promise<Resident | undefined> {
    return this.residents.find(r => r.id === id);
  }

  async getResidentByUsername(username: string): Promise<Resident | undefined> {
    return this.residents.find(r => r.username === username);
  }

  async createResident(resident: InsertResident): Promise<Resident> {
    const newResident: Resident = {
      ...resident,
      id: this.nextId++,
      email: resident.email || null,
      bio: resident.bio || null,
      avatarUrl: resident.avatarUrl || null,
      isActive: resident.isActive ?? true,
      canGoLive: resident.canGoLive ?? true,
      showTitle: resident.showTitle || null,
      showDescription: resident.showDescription || null,
      genres: resident.genres || null,
      socialLinks: resident.socialLinks || null,
      azuracastStreamerId: null,
      azuracastAutoCreated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.residents.push(newResident);
    return newResident;
  }

  async updateResident(id: number, updates: Partial<Resident>): Promise<Resident> {
    const index = this.residents.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Resident not found');
    
    this.residents[index] = {
      ...this.residents[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.residents[index];
  }

  async deleteResident(id: number): Promise<void> {
    const index = this.residents.findIndex(r => r.id === id);
    if (index !== -1) {
      this.residents.splice(index, 1);
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

  // Settings
  private settings: Settings[] = [];

  async getSettings(): Promise<Settings[]> {
    return [...this.settings];
  }

  async getSettingByKey(key: string): Promise<Settings | undefined> {
    return this.settings.find(s => s.key === key);
  }

  async upsertSetting(key: string, value: string, description?: string, isSecret?: boolean): Promise<Settings> {
    const existingIndex = this.settings.findIndex(s => s.key === key);
    
    if (existingIndex !== -1) {
      // Update existing
      this.settings[existingIndex] = {
        ...this.settings[existingIndex],
        value,
        description: description ?? this.settings[existingIndex].description,
        isSecret: isSecret ?? this.settings[existingIndex].isSecret,
        updatedAt: new Date(),
      };
      return this.settings[existingIndex];
    } else {
      // Create new
      const newSetting: Settings = {
        id: this.nextId++,
        key,
        value,
        description: description || null,
        isSecret: isSecret || false,
        updatedAt: new Date(),
      };
      this.settings.push(newSetting);
      return newSetting;
    }
  }

  async deleteSetting(key: string): Promise<void> {
    const index = this.settings.findIndex(s => s.key === key);
    if (index !== -1) {
      this.settings.splice(index, 1);
    }
  }

  // Shows - stub (not used in MemStorage)
  async getShows(): Promise<Show[]> { return []; }
  async getShowById(_id: number): Promise<Show | undefined> { return undefined; }
  async getShowBySlug(_slug: string): Promise<Show | undefined> { return undefined; }
  async createShow(_show: InsertShow): Promise<Show> { throw new Error('Not implemented'); }
  async updateShow(_id: number, _show: Partial<Show>): Promise<Show> { throw new Error('Not implemented'); }
  async deleteShow(_id: number): Promise<void> { }

  // Hero Banners - stubs
  async getHeroBanners(): Promise<HeroBanner[]> { return []; }
  async getActiveBanner(): Promise<HeroBanner | undefined> { return undefined; }
  async getHeroBannerById(_id: number): Promise<HeroBanner | undefined> { return undefined; }
  async createHeroBanner(_banner: InsertHeroBanner): Promise<HeroBanner> { throw new Error('Not implemented'); }
  async updateHeroBanner(_id: number, _banner: Partial<HeroBanner>): Promise<HeroBanner> { throw new Error('Not implemented'); }
  async deleteHeroBanner(_id: number): Promise<void> { }
  async setActiveBanner(_id: number): Promise<HeroBanner> { throw new Error('Not implemented'); }

  // Playlist Submissions - stubs
  async getPlaylistSubmissions(): Promise<PlaylistSubmission[]> { return []; }
  async getPlaylistSubmissionById(_id: number): Promise<PlaylistSubmission | undefined> { return undefined; }
  async createPlaylistSubmission(_submission: InsertPlaylistSubmission): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async updatePlaylistSubmissionStatus(_id: number, _status: string, _notes?: string): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async updatePlaylistSubmission(_id: number, _updates: Partial<PlaylistSubmission>): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async togglePlaylistFeature(_id: number): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async togglePlaylistApproval(_id: number): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async likePlaylistSubmission(_id: number): Promise<PlaylistSubmission> { throw new Error('Not implemented'); }
  async deletePlaylistSubmission(_id: number): Promise<void> { }

  // Contributors - stubs
  async getContributors(): Promise<Contributor[]> { return []; }
  async getContributorById(_id: number): Promise<Contributor | undefined> { return undefined; }
  async getContributorByHandle(_handle: string): Promise<Contributor | undefined> { return undefined; }
  async createContributor(_contributor: InsertContributor): Promise<Contributor> { throw new Error('Not implemented'); }
  async updateContributor(_id: number, _updates: Partial<Contributor>): Promise<Contributor | undefined> { return undefined; }

  // Alias convenience methods - stubs
  async getPlaylistSubmission(_id: number): Promise<PlaylistSubmission | undefined> { return undefined; }
  async getAlbumSuggestion(_id: number): Promise<any | undefined> { return undefined; }
  async updateMixRoutingStatus(_id: number, _updates: Partial<MixSubmission>): Promise<MixSubmission> { throw new Error('Not implemented'); }

  // Episode Submissions - stubs
  async getEpisodeSubmissions(): Promise<any[]> { return []; }
  async getEpisodeSubmissionById(_id: number): Promise<any | undefined> { return undefined; }
  async createEpisodeSubmission(_submission: any): Promise<any> { throw new Error('Not implemented'); }
  async updateEpisodeSubmission(_id: number, _updates: any): Promise<any> { throw new Error('Not implemented'); }
  async deleteEpisodeSubmission(_id: number): Promise<void> { }

  // Album of the Month - stubs
  async getAlbumSuggestions(): Promise<any[]> { return []; }
  async getAlbumSuggestionById(_id: number): Promise<any | undefined> { return undefined; }
  async createAlbumSuggestion(_data: any): Promise<any> { throw new Error('Not implemented'); }
  async updateAlbumSuggestion(_id: number, _updates: any): Promise<any> { throw new Error('Not implemented'); }
  async acceptAlbumSuggestion(_id: number, _reviewedBy: string): Promise<any> { throw new Error('Not implemented'); }
  async rejectAlbumSuggestion(_id: number, _reviewedBy: string): Promise<any> { throw new Error('Not implemented'); }
  async deleteAlbumSuggestion(_id: number): Promise<void> { }
  async voteOnAlbumSuggestion(_suggestionId: number, _voterUsername: string, _value: 1 | -1): Promise<any> { throw new Error('Not implemented'); }
  async getAlbumVotesForSuggestion(_suggestionId: number): Promise<any[]> { return []; }
  async getAlbumSuggestionsWithVotes(): Promise<any[]> { return []; }
  async createAlbumPick(_data: any): Promise<any> { throw new Error('Not implemented'); }
  async getAlbumPickByMonth(_month: string): Promise<any | undefined> { return undefined; }
  async getAlbumPickById(_id: number): Promise<any | undefined> { return undefined; }
  async getAlbumPickItemById(_id: number): Promise<any | undefined> { return undefined; }
  async getPublishedAlbumPicks(): Promise<any[]> { return []; }
  async getDraftAlbumPicks(): Promise<any[]> { return []; }
  async addAlbumToPickDraft(_data: any): Promise<any> { throw new Error('Not implemented'); }
  async getAlbumPickItems(_pickId: number): Promise<any[]> { return []; }
  async updateAlbumPickItem(_id: number, _updates: any): Promise<any> { throw new Error('Not implemented'); }
  async deleteAlbumPickItem(_id: number): Promise<void> { }
  async publishAlbumPick(_pickId: number): Promise<any> { throw new Error('Not implemented'); }
  async deleteAlbumPick(_pickId: number): Promise<void> { }
  async getPublishedAlbumPickWithItems(_month: string): Promise<any | null> { return null; }
  async addAlbumSuggestionNote(_data: any): Promise<any> { throw new Error('Not implemented'); }
  async getAlbumSuggestionNotes(_suggestionId: number): Promise<any[]> { return []; }
  async updateAlbumPick(_id: number, _updates: any): Promise<any> { throw new Error('Not implemented'); }

  // Year-End Lists - stubs
  async getYearEndLists(): Promise<any[]> { return []; }
  async getYearEndListBySlug(_slug: string): Promise<any | undefined> { return undefined; }
  async getYearEndListWithItems(_slug: string): Promise<any | null> { return null; }

  // Radio stream service - stubs
  async getApprovedSongSubmissions(): Promise<any[]> { return []; }
  async addTrackLike(_data: any): Promise<any> { return {}; }

  // Track metadata service - stubs
  async getTrackMetadata(_filename: string): Promise<any | undefined> { return undefined; }
  async saveTrackMetadata(_data: any): Promise<any> { return {}; }
  async updateTrackMetadata(_filename: string, _updates: any): Promise<any> { return {}; }

  // Radio Service - stubs
  async getCurrentProgramState(): Promise<any | undefined> { return undefined; }
  async updateProgramState(_state: any): Promise<any> { return {}; }
  async getLiveShow(_id: number): Promise<any | undefined> { return undefined; }
  async getAllLiveShows(): Promise<any[]> { return []; }
  async updateLiveShowStatus(_id: number, _isLive: boolean): Promise<void> { }
  async getRadioRotationTrack(_trackId: string): Promise<any | undefined> { return undefined; }
  async getApprovedRotationTracks(): Promise<any[]> { return []; }
  async incrementRotationPlayCount(_trackId: string): Promise<void> { }
  async createRadioRotationTrack(_data: any): Promise<any> { throw new Error('Not implemented'); }
  async updateRotationTrackStatus(_trackId: string, _status: string, _approvedBy: string, _inRotation: boolean): Promise<void> { }
}

// Storage is now DB-backed via DrizzleStorage (extends FileStorage as fallback)
export { storage } from './dbStorage';