import { 
  users, stations, shows, currentPlayback, djSubmissions, admins, zineSubmissions, zineContent,
  type User, type InsertUser, type Station, type InsertStation, 
  type Show, type InsertShow, type CurrentPlayback, type InsertCurrentPlayback,
  type DjSubmission, type InsertDjSubmission, type Admin, type InsertAdmin,
  type ZineSubmission, type InsertZineSubmission, type ZineContent, type InsertZineContent
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Station methods
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  getStationBySlug(slug: string): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;
  
  // Show methods
  getAllShows(): Promise<Show[]>;
  getFeaturedShows(): Promise<Show[]>;
  getLiveShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  
  // Current playback methods
  getCurrentPlayback(): Promise<CurrentPlayback | undefined>;
  updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback>;
  
  // DJ Submission methods
  getAllDjSubmissions(): Promise<DjSubmission[]>;
  getDjSubmission(id: number): Promise<DjSubmission | undefined>;
  createDjSubmission(submission: InsertDjSubmission): Promise<DjSubmission>;
  updateDjSubmissionStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<DjSubmission | undefined>;
  
  // Admin methods
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  validateAdmin(username: string, password: string): Promise<Admin | undefined>;
  
  // Zine Submission methods
  getAllZineSubmissions(): Promise<ZineSubmission[]>;
  getZineSubmission(id: number): Promise<ZineSubmission | undefined>;
  createZineSubmission(submission: InsertZineSubmission): Promise<ZineSubmission>;
  updateZineSubmissionStatus(id: number, status: string, reviewedBy: string, notes?: string): Promise<ZineSubmission | undefined>;
  publishZineSubmission(submissionId: number, contentData: InsertZineContent): Promise<ZineContent>;
  
  // Zine Content methods
  getAllZineContent(): Promise<ZineContent[]>;
  getFeaturedZineContent(): Promise<ZineContent[]>;
  getZineContentByCategory(category: string): Promise<ZineContent[]>;
  getZineContentBySlug(slug: string): Promise<ZineContent | undefined>;
  updateZineContentViews(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stations: Map<number, Station>;
  private shows: Map<number, Show>;
  private djSubmissions: Map<number, DjSubmission>;
  private admins: Map<number, Admin>;
  private zineSubmissions: Map<number, ZineSubmission>;
  private zineContent: Map<number, ZineContent>;
  private currentPlayback: CurrentPlayback | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.stations = new Map();
    this.shows = new Map();
    this.djSubmissions = new Map();
    this.admins = new Map();
    this.zineSubmissions = new Map();
    this.zineContent = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize sample stations with SoundCloud-style data
    const sampleStations: Station[] = [
      {
        id: 1,
        name: "Enamorado Radio",
        slug: "enamorado-radio",
        streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        genre: "Electronic",
        description: "Electronic • Hip-Hop • SA Sound",
        artworkUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
        isLive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Hip-Hop Central",
        slug: "hip-hop-central",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Hip-Hop",
        description: "Rap • R&B • Urban",
        artworkUrl: "",
        isLive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Country Roads",
        slug: "country-roads",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Country",
        description: "Classic • Modern • Folk",
        artworkUrl: "",
        isLive: false,
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Jazz Café",
        slug: "jazz-cafe",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Jazz",
        description: "Smooth • Bebop • Fusion",
        artworkUrl: "",
        isLive: true,
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Chill Vibes",
        slug: "chill-vibes",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Chill",
        description: "Lofi • Ambient • Downtempo",
        artworkUrl: "",
        isLive: true,
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Rock Nation",
        slug: "rock-nation",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Rock",
        description: "Classic • Alternative • Indie",
        artworkUrl: "",
        isLive: false,
        createdAt: new Date(),
      },
    ];

    const sampleShows: Show[] = [
      {
        id: 1,
        title: "DJ Amadeezy Mix",
        host: "DJ Amadeezy",
        description: "Resident DJ mixing everything from classic hip-hop to electronic, bringing authentic SA sound to the airwaves",
        artworkUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
        genre: "Hip-Hop",
        scheduledAt: new Date(),
        duration: 120,
        isLive: true,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: "SAC Student Sessions",
        host: "Various Students",
        description: "Student-led radio programming showcasing local talent and experimental sounds from San Antonio College",
        artworkUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
        genre: "Experimental",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        isLive: false,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        title: "Austin Sound Lab",
        host: "Local Collective",
        description: "Collective of Austin musicians and producers sharing new sounds from the Live Music Capital",
        artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
        genre: "Electronic",
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        duration: 60,
        isLive: false,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 4,
        title: "Midday Vibes",
        host: "Maria Santos",
        description: "Local music curator focusing on San Antonio's diverse musical heritage and contemporary scene",
        artworkUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop",
        genre: "Contemporary",
        scheduledAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
        duration: 120,
        isLive: false,
        isFeatured: true,
        createdAt: new Date(),
      },
    ];

    sampleStations.forEach((station) => {
      this.stations.set(station.id, station);
    });

    sampleShows.forEach((show) => {
      this.shows.set(show.id, show);
    });

    this.currentPlayback = {
      id: 1,
      stationId: 1,
      showId: 1,
      title: "DJ Amadeezy Mix",
      artist: "DJ Amadeezy",
      artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      startTime: new Date(),
      isLive: true,
    };

    // Initialize sample admin
    const defaultAdmin: Admin = {
      id: 1,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      createdAt: new Date()
    };
    this.admins.set(1, defaultAdmin);

    // Initialize sample DJ submissions
    const sampleSubmissions: DjSubmission[] = [
      {
        id: 1,
        djName: "Luna Park",
        realName: "Luna Martinez",
        email: "luna@example.com",
        location: "Berlin, Germany",
        showTitle: "Midnight Sessions",
        showDescription: "Late night ambient and downtempo selections for the sleepless",
        primaryGenre: "ambient",
        showLength: 60,
        additionalGenres: "downtempo, chillout",
        djExperience: "5 years of DJing in Berlin underground scene",
        musicDiscovery: "SoundCloud, Bandcamp, vinyl digging",
        socialMedia: "https://soundcloud.com/lunapark",
        demoMixTitle: "Midnight Frequencies",
        demoMixDescription: "A journey through ambient soundscapes",
        status: "pending",
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        id: 2,
        djName: "Vinyl Junkie",
        realName: "David Chen",
        email: "david@example.com",
        location: "Austin, TX",
        showTitle: "Rare Grooves",
        showDescription: "Deep cuts and rare finds from decades of vinyl collecting",
        primaryGenre: "soul",
        showLength: 90,
        additionalGenres: "funk, jazz, r&b",
        djExperience: "10+ years collecting and DJing vinyl",
        musicDiscovery: "Record stores, estate sales, collector networks",
        socialMedia: "https://instagram.com/vinyljunkie",
        demoMixTitle: "Deep Cuts Vol. 1",
        demoMixDescription: "Rare soul and funk from my personal collection",
        status: "approved",
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reviewedBy: "admin",
        notes: "Great submission, approved for regular slot"
      }
    ];

    sampleSubmissions.forEach((submission) => {
      this.djSubmissions.set(submission.id, submission);
    });

    // Initialize sample zine submissions
    const sampleZineSubmissions: ZineSubmission[] = [
      {
        id: 3,
        authorName: "Alex Rivera",
        authorEmail: "alex@example.com",
        authorBio: "Music journalist and cultural critic based in Mexico City",
        title: "The Underground Renaissance",
        subtitle: "How Independent Artists Are Reshaping Music Culture",
        contentType: "article",
        category: "culture",
        content: "In the shadows of mainstream music, a vibrant ecosystem of independent artists is quietly revolutionizing how we discover, consume, and interact with music...",
        excerpt: "Exploring the resurgence of underground music scenes and their impact on modern culture",
        tags: "underground, independent, music culture, streaming",
        imageUrls: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800",
        audioUrls: null,
        externalLinks: "https://soundcloud.com/underground-collective",
        collaborators: null,
        submissionNotes: "Would love to include more interviews if possible",
        status: "pending",
        publishedAt: null,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewedAt: null,
        reviewedBy: null,
        editorNotes: null,
        featuredOrder: null,
        isFeatured: false,
        viewCount: 0
      },
      {
        id: 4,
        authorName: "Luna Park",
        authorEmail: "luna@example.com",
        authorBio: "Berlin-based ambient producer and sound designer",
        title: "Frequency Diaries",
        subtitle: "Notes from Late Night Sessions",
        contentType: "mixtape-notes",
        category: "music",
        content: "01. Biosphere - Kobresia // The perfect opener, like walking into a fog-covered forest...",
        excerpt: "Detailed track-by-track notes from my latest ambient mix",
        tags: "ambient, electronic, berlin, mixtape",
        imageUrls: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        audioUrls: "https://soundcloud.com/lunapark/frequency-diaries",
        externalLinks: null,
        collaborators: null,
        submissionNotes: "Audio mix is already live on SoundCloud",
        status: "approved",
        publishedAt: null,
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewedBy: "admin",
        editorNotes: "Great submission, approved for publication",
        featuredOrder: null,
        isFeatured: false,
        viewCount: 0
      }
    ];

    sampleZineSubmissions.forEach((submission) => {
      this.zineSubmissions.set(submission.id, submission);
    });

    // Initialize sample published zine content
    const sampleZineContent: ZineContent[] = [
      {
        id: 5,
        submissionId: null,
        title: "The Digital Vinyl Revolution",
        subtitle: "How Streaming Changed Everything",
        authorName: "Sarah Chen",
        authorBio: "Technology writer and music industry analyst",
        contentType: "article",
        category: "technology",
        content: "The relationship between music and technology has always been symbiotic, but never more so than in the digital age...",
        excerpt: "An in-depth look at how streaming platforms are reshaping music discovery and artist economics",
        tags: "streaming, technology, music industry, vinyl, digital",
        imageUrls: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        audioUrls: null,
        externalLinks: "https://example.com/music-tech-analysis",
        slug: "digital-vinyl-revolution",
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isFeatured: true,
        featuredOrder: 1,
        viewCount: 1250
      },
      {
        id: 6,
        submissionId: null,
        title: "Voices from the Underground",
        subtitle: "Interviews with Austin's Hidden Gems",
        authorName: "Marcus Thompson",
        authorBio: "Local music photographer and journalist",
        contentType: "interview",
        category: "music",
        content: "Sitting in a dimly lit coffee shop in East Austin, I'm across from three artists who represent the city's thriving underground scene...",
        excerpt: "Intimate conversations with the artists shaping Austin's alternative music landscape",
        tags: "austin, interview, underground, local music",
        imageUrls: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
        audioUrls: null,
        externalLinks: null,
        slug: "voices-from-underground",
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        isFeatured: true,
        featuredOrder: 2,
        viewCount: 890
      },
      {
        id: 7,
        submissionId: null,
        title: "The Art of Crate Digging",
        subtitle: "A Visual Journey Through Record Stores",
        authorName: "Elena Vasquez",
        authorBio: "Street photographer documenting music culture",
        contentType: "photo-essay",
        category: "art",
        content: "The ritual of crate digging is more than just shopping for records—it's a meditation, a treasure hunt, a connection to music history...",
        excerpt: "A photographic exploration of record stores and the people who love them",
        tags: "photography, vinyl, record stores, culture",
        imageUrls: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800,https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
        audioUrls: null,
        externalLinks: null,
        slug: "art-of-crate-digging",
        publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        isFeatured: false,
        featuredOrder: null,
        viewCount: 567
      }
    ];

    sampleZineContent.forEach((content) => {
      this.zineContent.set(content.id, content);
    });

    this.currentId = 15;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllStations(): Promise<Station[]> {
    return Array.from(this.stations.values());
  }

  async getStation(id: number): Promise<Station | undefined> {
    return this.stations.get(id);
  }

  async getStationBySlug(slug: string): Promise<Station | undefined> {
    return Array.from(this.stations.values()).find(
      (station) => station.slug === slug,
    );
  }

  async createStation(station: InsertStation): Promise<Station> {
    const id = this.currentId++;
    const newStation: Station = { 
      ...station, 
      id, 
      createdAt: new Date(),
      description: station.description ?? null,
      artworkUrl: station.artworkUrl ?? null,
      isLive: station.isLive ?? false
    };
    this.stations.set(id, newStation);
    return newStation;
  }

  async getAllShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }

  async getFeaturedShows(): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => show.isFeatured);
  }

  async getLiveShows(): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => show.isLive);
  }

  async getShow(id: number): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async createShow(show: InsertShow): Promise<Show> {
    const id = this.currentId++;
    const newShow: Show = { 
      ...show, 
      id, 
      createdAt: new Date(),
      description: show.description ?? null,
      artworkUrl: show.artworkUrl ?? null,
      isLive: show.isLive ?? false,
      scheduledAt: show.scheduledAt ?? null,
      duration: show.duration ?? null,
      isFeatured: show.isFeatured ?? false
    };
    this.shows.set(id, newShow);
    return newShow;
  }

  async getCurrentPlayback(): Promise<CurrentPlayback | undefined> {
    return this.currentPlayback || undefined;
  }

  async updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback> {
    const id = this.currentPlayback?.id || 1;
    this.currentPlayback = {
      ...playback,
      id,
      startTime: new Date(),
      isLive: playback.isLive ?? false,
      stationId: playback.stationId ?? null,
      showId: playback.showId ?? null,
      artist: playback.artist ?? null,
      artwork: playback.artwork ?? null
    };
    return this.currentPlayback;
  }

  // DJ Submission methods
  async getAllDjSubmissions(): Promise<DjSubmission[]> {
    return Array.from(this.djSubmissions.values());
  }

  async getDjSubmission(id: number): Promise<DjSubmission | undefined> {
    return this.djSubmissions.get(id);
  }

  async createDjSubmission(submission: InsertDjSubmission): Promise<DjSubmission> {
    const id = this.currentId++;
    const newSubmission: DjSubmission = {
      ...submission,
      id,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null,
      location: submission.location ?? null,
      additionalGenres: submission.additionalGenres ?? null,
      djExperience: submission.djExperience ?? null,
      musicDiscovery: submission.musicDiscovery ?? null,
      socialMedia: submission.socialMedia ?? null,
      demoMixTitle: submission.demoMixTitle ?? null,
      demoMixDescription: submission.demoMixDescription ?? null
    };
    this.djSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async updateDjSubmissionStatus(
    id: number, 
    status: string, 
    reviewedBy: string, 
    notes?: string
  ): Promise<DjSubmission | undefined> {
    const submission = this.djSubmissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission: DjSubmission = {
      ...submission,
      status,
      reviewedBy,
      reviewedAt: new Date(),
      notes: notes ?? null
    };
    
    this.djSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.currentId++;
    const newAdmin: Admin = {
      ...admin,
      id,
      createdAt: new Date()
    };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }

  async validateAdmin(username: string, password: string): Promise<Admin | undefined> {
    const admin = await this.getAdminByUsername(username);
    if (admin && admin.password === password) {
      return admin;
    }
    return undefined;
  }

  // Zine Submission methods
  async getAllZineSubmissions(): Promise<ZineSubmission[]> {
    return Array.from(this.zineSubmissions.values());
  }

  async getZineSubmission(id: number): Promise<ZineSubmission | undefined> {
    return this.zineSubmissions.get(id);
  }

  async createZineSubmission(submission: InsertZineSubmission): Promise<ZineSubmission> {
    const id = this.currentId++;
    const newSubmission: ZineSubmission = {
      ...submission,
      id,
      status: "pending",
      submittedAt: new Date(),
      publishedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      editorNotes: null,
      featuredOrder: null,
      isFeatured: false,
      viewCount: 0,
      authorBio: submission.authorBio ?? null,
      subtitle: submission.subtitle ?? null,
      excerpt: submission.excerpt ?? null,
      tags: submission.tags ?? null,
      imageUrls: submission.imageUrls ?? null,
      audioUrls: submission.audioUrls ?? null,
      externalLinks: submission.externalLinks ?? null,
      collaborators: submission.collaborators ?? null,
      submissionNotes: submission.submissionNotes ?? null
    };
    this.zineSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async updateZineSubmissionStatus(
    id: number, 
    status: string, 
    reviewedBy: string, 
    notes?: string
  ): Promise<ZineSubmission | undefined> {
    const submission = this.zineSubmissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission: ZineSubmission = {
      ...submission,
      status,
      reviewedBy,
      reviewedAt: new Date(),
      editorNotes: notes ?? null
    };
    
    this.zineSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async publishZineSubmission(submissionId: number, contentData: InsertZineContent): Promise<ZineContent> {
    const submission = this.zineSubmissions.get(submissionId);
    if (!submission) throw new Error('Submission not found');

    const id = this.currentId++;
    const slug = contentData.slug || this.generateSlug(contentData.title);
    
    const newContent: ZineContent = {
      ...contentData,
      id,
      submissionId,
      slug,
      publishedAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      authorBio: contentData.authorBio ?? null,
      subtitle: contentData.subtitle ?? null,
      excerpt: contentData.excerpt ?? null,
      tags: contentData.tags ?? null,
      imageUrls: contentData.imageUrls ?? null,
      audioUrls: contentData.audioUrls ?? null,
      externalLinks: contentData.externalLinks ?? null,
      isFeatured: contentData.isFeatured ?? false,
      featuredOrder: contentData.featuredOrder ?? null
    };

    this.zineContent.set(id, newContent);

    // Update submission status to published
    await this.updateZineSubmissionStatus(submissionId, "published", "admin", "Content published");

    return newContent;
  }

  // Zine Content methods
  async getAllZineContent(): Promise<ZineContent[]> {
    return Array.from(this.zineContent.values()).sort((a, b) => 
      new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    );
  }

  async getFeaturedZineContent(): Promise<ZineContent[]> {
    return Array.from(this.zineContent.values())
      .filter(content => content.isFeatured)
      .sort((a, b) => (a.featuredOrder || 999) - (b.featuredOrder || 999));
  }

  async getZineContentByCategory(category: string): Promise<ZineContent[]> {
    return Array.from(this.zineContent.values())
      .filter(content => content.category === category)
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
  }

  async getZineContentBySlug(slug: string): Promise<ZineContent | undefined> {
    return Array.from(this.zineContent.values()).find(content => content.slug === slug);
  }

  async updateZineContentViews(id: number): Promise<void> {
    const content = this.zineContent.get(id);
    if (content) {
      const updated = { ...content, viewCount: content.viewCount + 1 };
      this.zineContent.set(id, updated);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

export const storage = new MemStorage();
