import { 
  users, stations, shows, currentPlayback, djSubmissions, admins, zineSubmissions, zineContent,
  editorialWorkflow, physicalMedia, mixUploads, mixTracklist, episodes, episodeTracklist, trackMetadata,
  residentApplications, songSubmissions, themedPrograms,
  type User, type InsertUser, type Station, type InsertStation, 
  type Show, type InsertShow, type CurrentPlayback, type InsertCurrentPlayback,
  type DjSubmission, type InsertDjSubmission, type Admin, type InsertAdmin,
  type ZineSubmission, type InsertZineSubmission, type ZineContent, type InsertZineContent,
  type EditorialWorkflow, type InsertEditorialWorkflow, type PhysicalMedia, type InsertPhysicalMedia,
  type MixUpload, type InsertMixUpload, type MixTracklist, type InsertMixTracklist,
  type Episode, type InsertEpisode, type EpisodeTracklist, type InsertEpisodeTracklist,
  type TrackMetadata, type InsertTrackMetadata, type ResidentApplication, type InsertResidentApplication,
  type SongSubmission, type InsertSongSubmission, type ThemedProgram, type InsertThemedProgram
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
  
  // Queue management methods
  getQueuedSongs(): Promise<SongSubmission[]>;
  addToQueue(id: number, position?: number): Promise<SongSubmission | undefined>;
  updateQueuePosition(id: number, newPosition: number): Promise<SongSubmission | undefined>;
  updatePlaybackStatus(id: number, status: 'queued' | 'playing' | 'played'): Promise<SongSubmission | undefined>;
  getCurrentlyPlaying(): Promise<SongSubmission | undefined>;
  setCurrentlyPlaying(id: number): Promise<SongSubmission | undefined>;
  
  // Track like operations (requires user system)
  addTrackLike(like: {
    userId: string;
    trackId: string;
    trackTitle: string;
    artist?: string;
    timestamp: Date;
  }): Promise<any>;
  getSongSubmissionsByTheme(themeTag: string): Promise<SongSubmission[]>;
  getApprovedSongSubmissions(): Promise<SongSubmission[]>;
  
  // Themed Program methods
  getAllThemedPrograms(): Promise<ThemedProgram[]>;
  getThemedProgram(id: number): Promise<ThemedProgram | undefined>;
  createThemedProgram(program: InsertThemedProgram): Promise<ThemedProgram>;
  getActiveThemedPrograms(): Promise<ThemedProgram[]>;
  
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
  
  // Editorial Workflow methods
  getAllEditorialWorkflow(): Promise<EditorialWorkflow[]>;
  getEditorialWorkflowBySubmission(submissionId: number): Promise<EditorialWorkflow | undefined>;
  createEditorialWorkflow(workflow: InsertEditorialWorkflow): Promise<EditorialWorkflow>;
  updateEditorialWorkflowStage(id: number, stage: string, notes?: string): Promise<EditorialWorkflow | undefined>;
  updateIssuuDraftId(id: number, draftId: string): Promise<EditorialWorkflow | undefined>;
  updateIssuuPublicationId(id: number, publicationId: string): Promise<EditorialWorkflow | undefined>;
  
  // Physical Media methods
  getAllPhysicalMedia(): Promise<PhysicalMedia[]>;
  getPhysicalMediaBySubmission(submissionId: number): Promise<PhysicalMedia[]>;
  createPhysicalMedia(media: InsertPhysicalMedia): Promise<PhysicalMedia>;
  updatePhysicalMediaStatus(id: number, status: string): Promise<PhysicalMedia | undefined>;
  getPhysicalMediaByPhysicalId(physicalId: string): Promise<PhysicalMedia | undefined>;
  
  // Mix Upload methods
  getAllMixUploads(): Promise<MixUpload[]>;
  getMixUpload(id: number): Promise<MixUpload | undefined>;
  createMixUpload(upload: InsertMixUpload): Promise<MixUpload>;
  updateMixUploadStatus(id: number, isLive: boolean, isFeatured: boolean): Promise<MixUpload | undefined>;
  
  // Mix Tracklist methods
  getMixTracklist(mixId: number): Promise<MixTracklist[]>;
  createMixTrack(track: InsertMixTracklist): Promise<MixTracklist>;
  getCurrentTrackByTime(mixId: number, currentTime: number): Promise<MixTracklist | undefined>;
  
  // Episode methods
  getAllEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  getFeaturedEpisodes(): Promise<Episode[]>;
  getEpisodesByHost(hostName: string): Promise<Episode[]>;
  getEpisodesBySeries(seriesTitle: string): Promise<Episode[]>;
  
  // Episode Tracklist methods
  getEpisodeTracklist(episodeId: number): Promise<EpisodeTracklist[]>;
  createEpisodeTrack(track: InsertEpisodeTracklist): Promise<EpisodeTracklist>;
  getCurrentEpisodeTrackByTime(episodeId: number, currentTime: number): Promise<EpisodeTracklist | undefined>;
  
  // Radio Playlist methods
  getAllRadioPlaylist(): Promise<RadioPlaylist[]>;
  getActiveRadioPlaylist(): Promise<RadioPlaylist[]>;
  getRadioPlaylistItem(id: number): Promise<RadioPlaylist | undefined>;
  createRadioPlaylistItem(item: InsertRadioPlaylist): Promise<RadioPlaylist>;
  updateRadioPlaylistStatus(id: number, isActive: boolean): Promise<RadioPlaylist | undefined>;
  incrementPlayCount(id: number): Promise<void>;
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

    // Initialize with sample live shows for college radio
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample live shows
    const sampleShows = [
      {
        id: 1,
        showName: "Morning Vibes",
        hostName: "Sarah Chen",
        description: "Start your day with uplifting indie and electronic tracks",
        genre: "Indie Electronic",
        dayOfWeek: 1, // Monday
        startTime: "08:00",
        endTime: "10:00",
        isActive: true,
        isLive: false,
        startedAt: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        showName: "Late Night Jazz",
        hostName: "Lauren Elyse & Cameron Courtney",
        description: "Smooth jazz and experimental sounds for night owls",
        genre: "Jazz & Experimental",
        dayOfWeek: 5, // Friday
        startTime: "22:00",
        endTime: "24:00",
        isActive: true,
        isLive: false,
        startedAt: null,
        createdAt: new Date(),
      },
      {
        id: 3,
        showName: "Weekend House Sessions",
        hostName: "DJ Alex",
        description: "Deep house and tech house to get you moving",
        genre: "House & Techno",
        dayOfWeek: 6, // Saturday
        startTime: "20:00",
        endTime: "22:00",
        isActive: true,
        isLive: false,
        startedAt: null,
        createdAt: new Date(),
      }
    ];

    sampleShows.forEach(show => {
      this.liveShowsStore.set(show.id, show);
    });

    // Sample rotation tracks (approved)
    const sampleTracks = [
      {
        trackId: "upload_jarrad_track_1",
        sourceType: "upload",
        title: "How Did I Do",
        artist: "Jarrad",
        originalMetadata: JSON.stringify({
          description: "Demo track submission",
          genre: "Electronic",
          submittedAt: new Date(),
        }),
        lastfmMetadata: JSON.stringify({
          artist: "Jarrad",
          trackName: "How Did I Do",
          album: "Demo Submission",
          imageUrl: "https://i1.sndcdn.com/avatars-000123456789-abcdef-t500x500.jpg",
          displayTitle: "Jarrad - How Did I Do"
        }),
        approvalStatus: "approved",
        approvedBy: "admin",
        approvedAt: new Date(),
        inRotation: true,
        playCount: 12,
        lastPlayed: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        uploadedAt: new Date(),
        createdAt: new Date(),
      }
    ];

    sampleTracks.forEach(track => {
      this.radioRotationStore.set(track.trackId, track);
    });

    // Set initial program state to auto rotation
    this.programStateStore = {
      type: 'auto',
      currentShowId: null,
      currentTrackId: "upload_jarrad_track_1",
      lastUpdated: new Date(),
    };

    this.currentId = 10; // Start IDs after sample data
    
    // Initialize existing data
    this.initializeData();
    this.initializeMixData();
    this.initializeEpisodeData();
    this.initializeRadioPlaylist();
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

    // Initialize sample zine submission for testing editorial workflow
    const sampleZineSubmission: ZineSubmission = {
      id: 1,
      authorName: "Elena Martinez",
      authorEmail: "elena@example.com",
      authorBio: "Music journalist and cultural critic based in San Antonio",
      title: "The Underground Sound of San Antonio",
      subtitle: "A deep dive into the city's experimental music scene",
      contentType: "article",
      category: "music",
      content: `In the heart of San Antonio's Southtown district, a revolution is quietly taking place. Here, in converted warehouses and intimate venues, a new generation of musicians is crafting sounds that challenge conventional definitions of genre...

The scene is diverse, drawing influences from the city's rich cultural heritage while pushing forward into uncharted sonic territories. From the experimental hip-hop collective Ghetto Sage to the ambient soundscapes of Luna Park, these artists are creating something uniquely San Antonian...

What makes this movement particularly fascinating is its relationship with the city's history. The artists aren't rejecting the past but rather incorporating it into their futuristic visions, creating a sound that feels both deeply rooted and completely contemporary.`,
      excerpt: "Exploring the innovative music scene emerging from San Antonio's underground venues and the artists who are redefining the city's sonic identity.",
      tags: "san antonio, experimental music, underground scene, cultural criticism",
      imageUrls: null,
      audioUrls: null,
      externalLinks: null,
      collaborators: null,
      submissionNotes: "This piece includes interviews with 5 local artists and was researched over 3 months.",
      status: "submitted",
      publishedAt: null,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      editorNotes: null,
      featuredOrder: null,
      isFeatured: false,
      viewCount: 0
    };
    this.zineSubmissions.set(1, sampleZineSubmission);
    
    // Initialize corresponding editorial workflow
    const sampleWorkflow: EditorialWorkflow = {
      id: 1,
      submissionId: 1,
      workflowStage: "submitted",
      assignedEditor: null,
      copyEditorNotes: null,
      webEditorNotes: null,
      publisherNotes: null,
      estimatedPublishDate: null,
      actualPublishDate: null,
      priority: "normal",
      issuuDraftId: null,
      issuuPublicationId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.editorialWorkflow.set(1, sampleWorkflow);

    // Initialize sample DJ submissions (keeping minimal test data)
    const sampleSubmissions: DjSubmission[] = [
      {
        id: 15,
        djName: "Jarrad",
        realName: "Jarrad Jones",
        email: "jarrad@scumbagjones.com",
        location: "Chicago, IL",
        showTitle: "Footwork Sessions",
        showDescription: "Deep footwork and juke selections for the underground dance scene",
        primaryGenre: "Electronic",
        showLength: 45,
        additionalGenres: "Footwork, Juke, Electronic",
        djExperience: "10+ years in Chicago footwork scene",
        musicDiscovery: "Underground footwork producers and local Chicago scene",
        socialMedia: "https://soundcloud.com/scumbagjones1",
        demoMixTitle: "New Mix (Mostly Footwork/Juke)",
        demoMixDescription: "High energy footwork and juke tracks for the dance floor",
        soundcloudUrl: "https://soundcloud.com/scumbagjones1/new-mix-mostly-footwork-juke",
        status: "approved",
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewedBy: "admin",
        notes: "Featured footwork mix"
      },
      {
        id: 16,
        djName: "Stream 454",
        realName: "Stream 454",
        email: "stream454@example.com",
        location: "Miami, FL",
        showTitle: "Florida Man FM",
        showDescription: "Wild electronic sounds from the sunshine state",
        primaryGenre: "Electronic",
        showLength: 42,
        additionalGenres: "Bass, Experimental",
        djExperience: "Underground Florida scene",
        musicDiscovery: "SoundCloud, local scene",
        socialMedia: "https://soundcloud.com/stream454",
        demoMixTitle: "454 presents: Florida man FM",
        demoMixDescription: "High energy electronic mix from Miami underground",
        soundcloudUrl: "https://on.soundcloud.com/4eWzUF1TVIGlBVl5u9",
        status: "approved",
        submittedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        reviewedBy: "admin",
        notes: "Featured electronic mix"
      },
      {
        id: 17,
        djName: "Various Artists",
        realName: "Various Artists",
        email: "various@example.com", 
        location: "Global",
        showTitle: "Ambient Collection",
        showDescription: "Curated ambient and electronic selections from around the world",
        primaryGenre: "Ambient",
        showLength: 38,
        additionalGenres: "Electronic, Experimental",
        djExperience: "Collective curation",
        musicDiscovery: "Global underground scenes",
        socialMedia: "https://soundcloud.com/various-collective",
        demoMixTitle: "Ambient Collection",
        demoMixDescription: "Curated ambient and electronic selections",
        soundcloudUrl: "https://on.soundcloud.com/jD0a63lzBjp8mJiYTG",
        status: "pending",
        submittedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        id: 18,
        djName: "Jarrad Jones",
        realName: "Jarrad Jones",
        email: "jarrad@example.com",
        location: "Chicago, IL", 
        showTitle: "Ghettotech Sessions",
        showDescription: "High energy ghettotech and jungle selections from the Chicago scene",
        primaryGenre: "Electronic",
        showLength: 65,
        additionalGenres: "Ghettotech, Jungle, Footwork",
        djExperience: "Chicago underground veteran",
        musicDiscovery: "Local producers and vinyl digging",
        socialMedia: "https://mixcloud.com/jarradjones7",
        demoMixTitle: "Ghettotech and Jungle Mix",
        demoMixDescription: "High energy ghettotech and jungle selections",
        mixcloudUrl: "https://www.mixcloud.com/jarradjones7/ghettotech-and-jungle-mix/",
        status: "approved",
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        reviewedBy: "admin",
        notes: "Featured ghettotech mix"
      },
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
      demoMixDescription: submission.demoMixDescription ?? null,
      soundcloudUrl: submission.soundcloudUrl ?? null,
      mixcloudUrl: submission.mixcloudUrl ?? null,
      audiocomUrl: submission.audiocomUrl ?? null,
      otherUrl: submission.otherUrl ?? null
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

  // Resident Application methods
  async getAllResidentApplications(): Promise<ResidentApplication[]> {
    return Array.from(this.residentApplications.values());
  }

  async getResidentApplication(id: number): Promise<ResidentApplication | undefined> {
    return this.residentApplications.get(id);
  }

  async createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication> {
    const id = this.currentId++;
    const newApplication: ResidentApplication = {
      ...application,
      id,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null,
      pastWork: application.pastWork ?? null,
      socialMedia: application.socialMedia ?? null,
      additionalInfo: application.additionalInfo ?? null,
      mixSampleUrl: application.mixSampleUrl ?? null
    };
    this.residentApplications.set(id, newApplication);
    return newApplication;
  }

  async updateResidentApplicationStatus(
    id: number, 
    status: string, 
    reviewedBy: string, 
    notes?: string
  ): Promise<ResidentApplication | undefined> {
    const application = this.residentApplications.get(id);
    if (!application) return undefined;

    const updatedApplication: ResidentApplication = {
      ...application,
      status,
      reviewedBy,
      reviewedAt: new Date(),
      notes: notes ?? null
    };
    
    this.residentApplications.set(id, updatedApplication);
    return updatedApplication;
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

  private initializeMixData() {
    // Sample mix uploads with realistic data
    const sampleMixes: MixUpload[] = [
      {
        id: 1,
        title: "Footwork Sessions Vol. 1",
        artist: "Jarrad",
        description: "High energy footwork and juke tracks for the dance floor",
        genre: "Electronic",
        duration: 2700, // 45 minutes
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        artworkUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
        isLive: true,
        isFeatured: true,
        uploadedAt: new Date(),
        uploadedBy: "admin",
      },
      {
        id: 2,
        title: "how did i do",
        artist: "Jarrad Jones",
        description: "Hip-hop and grime mix showcasing raw talent and creativity",
        genre: "Hip-Hop",
        duration: 2516, // 41:56 minutes
        fileUrl: "https://audio.com/jarrad-jones/audio/how-did-i-do",
        artworkUrl: "https://audio.com/s3w/audio.com.static/user/avatar/06/05/1796473882060506.jpeg@300?qlt=75",
        isLive: false,
        isFeatured: true,
        uploadedAt: new Date(),
        uploadedBy: "jarrad-jones",
      },
    ];

    // Sample tracklist for the first mix
    const sampleTracklist: MixTracklist[] = [
      {
        id: 1,
        mixId: 1,
        trackNumber: 1,
        title: "Footwork Anthem",
        artist: "DJ Rashad",
        startTime: 0,
        endTime: 180,
        label: "Hyperdub",
        year: 2013,
        genre: "Footwork",
        bpm: 160,
        key: "Am",
        notes: "Opening track with heavy 808s",
      },
      {
        id: 2,
        mixId: 1,
        trackNumber: 2,
        title: "Juke Bounce",
        artist: "RP Boo",
        startTime: 180,
        endTime: 360,
        label: "Planet Mu",
        year: 2013,
        genre: "Juke",
        bpm: 155,
        key: "Cm",
        notes: "Classic juke rhythm",
      },
      {
        id: 3,
        mixId: 1,
        trackNumber: 3,
        title: "Teklife Forever",
        artist: "DJ Spinn",
        startTime: 360,
        endTime: 540,
        label: "Teklife",
        year: 2014,
        genre: "Footwork",
        bpm: 165,
        key: "Gm",
        notes: "Tribute to the scene",
      },
      {
        id: 4,
        mixId: 1,
        trackNumber: 4,
        title: "Ghost Notes",
        artist: "Machinedrum",
        startTime: 540,
        endTime: 720,
        label: "Ninja Tune",
        year: 2015,
        genre: "Electronic",
        bpm: 170,
        key: "Dm",
        notes: "Experimental footwork fusion",
      },
      {
        id: 5,
        mixId: 1,
        trackNumber: 5,
        title: "Texas Steppin",
        artist: "Traxman",
        startTime: 720,
        endTime: 900,
        label: "Dance Mania",
        year: 2012,
        genre: "Juke",
        bpm: 150,
        key: "F",
        notes: "Classic Texas sound",
      },
      // Jarrad's "how did i do" mix tracklist
      {
        id: 6,
        mixId: 2,
        trackNumber: 1,
        title: "Estate Sale",
        artist: "Arma",
        startTime: 0,
        endTime: 210,
        label: "SoundCloud",
        year: 2024,
        genre: "Hip-Hop",
        bpm: 140,
        key: "Am",
        notes: "Opening track",
      },
      {
        id: 7,
        mixId: 2,
        trackNumber: 2,
        title: "Sex & Pill",
        artist: "DJ Earl & Heavee",
        startTime: 210,
        endTime: 420,
        label: "Footwork",
        year: 2023,
        genre: "Footwork",
        bpm: 160,
        key: "Dm",
        notes: "Classic footwork collaboration",
      },
      {
        id: 8,
        mixId: 2,
        trackNumber: 3,
        title: "Let u know (flip)",
        artist: "DJ Rashad",
        startTime: 420,
        endTime: 630,
        label: "Hyperdub",
        year: 2024,
        genre: "Footwork",
        bpm: 155,
        key: "Gm",
        notes: "Rashad flip",
      },
      {
        id: 9,
        mixId: 2,
        trackNumber: 4,
        title: "Poe Mans Dream (flip)",
        artist: "Kendrick Lamar",
        startTime: 630,
        endTime: 840,
        label: "Bootleg",
        year: 2024,
        genre: "Hip-Hop",
        bpm: 140,
        key: "F",
        notes: "Kendrick flip",
      },
      {
        id: 10,
        mixId: 2,
        trackNumber: 5,
        title: "Yoshi's Theme",
        artist: "Nintendo",
        startTime: 840,
        endTime: 1050,
        label: "Video Game",
        year: 2024,
        genre: "Electronic",
        bpm: 120,
        key: "C",
        notes: "Video game sample",
      },
      {
        id: 11,
        mixId: 2,
        trackNumber: 6,
        title: "Jerrod (svh edit)",
        artist: "Selonge",
        startTime: 1050,
        endTime: 1260,
        label: "Edit",
        year: 2024,
        genre: "Electronic",
        bpm: 130,
        key: "Am",
        notes: "SVH edit",
      },
      {
        id: 12,
        mixId: 2,
        trackNumber: 7,
        title: "Drugs You Should Try It (J Bookey Bootleg)",
        artist: "Travis Scott",
        startTime: 1260,
        endTime: 1470,
        label: "Bootleg",
        year: 2024,
        genre: "Hip-Hop",
        bpm: 140,
        key: "Dm",
        notes: "Travis Scott bootleg",
      },
      {
        id: 13,
        mixId: 2,
        trackNumber: 8,
        title: "Provider (tee Vera edit)",
        artist: "Frank Ocean",
        startTime: 1470,
        endTime: 1680,
        label: "Edit",
        year: 2024,
        genre: "R&B",
        bpm: 120,
        key: "G",
        notes: "Frank Ocean edit",
      },
      {
        id: 14,
        mixId: 2,
        trackNumber: 9,
        title: "Just 4 Tonite",
        artist: "DJ Slimlocked",
        startTime: 1680,
        endTime: 1890,
        label: "SoundCloud",
        year: 2024,
        genre: "Electronic",
        bpm: 140,
        key: "F",
        notes: "DJ Slimlocked track",
      },
      {
        id: 15,
        mixId: 2,
        trackNumber: 10,
        title: "Mimosasa 2000",
        artist: "Furacao 2000",
        startTime: 1890,
        endTime: 2100,
        label: "Brazilian Funk",
        year: 2024,
        genre: "Funk",
        bpm: 150,
        key: "Am",
        notes: "Brazilian funk",
      },
      {
        id: 16,
        mixId: 2,
        trackNumber: 11,
        title: "Don't Say Goodnight to Me",
        artist: "Dazegxd",
        startTime: 2100,
        endTime: 2310,
        label: "SoundCloud",
        year: 2024,
        genre: "Electronic",
        bpm: 130,
        key: "Dm",
        notes: "Dazegxd track",
      },
      {
        id: 17,
        mixId: 2,
        trackNumber: 12,
        title: "Vision (454 flip)",
        artist: "454",
        startTime: 2310,
        endTime: 2516,
        label: "Bootleg",
        year: 2024,
        genre: "Hip-Hop",
        bpm: 140,
        key: "G",
        notes: "454 flip - closing track",
      },
    ];

    // Store the sample data
    sampleMixes.forEach(mix => {
      this.mixUploads.set(mix.id, mix);
      this.currentId = Math.max(this.currentId, mix.id + 1);
    });

    sampleTracklist.forEach(track => {
      this.mixTracklist.set(track.id, track);
      this.currentId = Math.max(this.currentId, track.id + 1);
    });
  }

  // Editorial Workflow methods
  async getAllEditorialWorkflow(): Promise<EditorialWorkflow[]> {
    return Array.from(this.editorialWorkflow.values());
  }

  async getEditorialWorkflowBySubmission(submissionId: number): Promise<EditorialWorkflow | undefined> {
    return Array.from(this.editorialWorkflow.values()).find(
      workflow => workflow.submissionId === submissionId
    );
  }

  async createEditorialWorkflow(workflow: InsertEditorialWorkflow): Promise<EditorialWorkflow> {
    const id = this.currentId++;
    const newWorkflow: EditorialWorkflow = {
      ...workflow,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedEditor: workflow.assignedEditor ?? null,
      copyEditorNotes: workflow.copyEditorNotes ?? null,
      webEditorNotes: workflow.webEditorNotes ?? null,
      publisherNotes: workflow.publisherNotes ?? null,
      estimatedPublishDate: workflow.estimatedPublishDate ?? null,
      actualPublishDate: workflow.actualPublishDate ?? null,
      issuuDraftId: workflow.issuuDraftId ?? null,
      issuuPublicationId: workflow.issuuPublicationId ?? null
    };
    this.editorialWorkflow.set(id, newWorkflow);
    return newWorkflow;
  }

  async updateEditorialWorkflowStage(id: number, stage: string, notes?: string): Promise<EditorialWorkflow | undefined> {
    const workflow = this.editorialWorkflow.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow: EditorialWorkflow = {
      ...workflow,
      workflowStage: stage,
      publisherNotes: notes ?? workflow.publisherNotes,
      updatedAt: new Date()
    };
    
    this.editorialWorkflow.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async updateIssuuDraftId(id: number, draftId: string): Promise<EditorialWorkflow | undefined> {
    const workflow = this.editorialWorkflow.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow: EditorialWorkflow = {
      ...workflow,
      issuuDraftId: draftId,
      updatedAt: new Date()
    };
    
    this.editorialWorkflow.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async updateIssuuPublicationId(id: number, publicationId: string): Promise<EditorialWorkflow | undefined> {
    const workflow = this.editorialWorkflow.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow: EditorialWorkflow = {
      ...workflow,
      issuuPublicationId: publicationId,
      workflowStage: "published",
      actualPublishDate: new Date(),
      updatedAt: new Date()
    };
    
    this.editorialWorkflow.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  // Physical Media methods
  async getAllPhysicalMedia(): Promise<PhysicalMedia[]> {
    return Array.from(this.physicalMedia.values());
  }

  async getPhysicalMediaBySubmission(submissionId: number): Promise<PhysicalMedia[]> {
    return Array.from(this.physicalMedia.values()).filter(
      media => media.submissionId === submissionId
    );
  }

  async createPhysicalMedia(media: InsertPhysicalMedia): Promise<PhysicalMedia> {
    const id = this.currentId++;
    const physicalId = `PM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate NFC data for Issuu.com loading
    const nfcData = JSON.stringify({
      action: "open_url",
      url: `https://issuu.com/enamorado-radio/docs/submission-${media.submissionId}`,
      title: `Enamorado Radio Zine - Submission ${media.submissionId}`,
      type: "magazine"
    });

    // Generate QR code content
    const qrCode = `https://issuu.com/enamorado-radio/docs/submission-${media.submissionId}`;

    // Generate print specifications based on media type
    const printSpecs = JSON.stringify({
      mediaType: media.mediaType,
      size: media.mediaType === 'mini_cd' ? '8cm diameter' : 
            media.mediaType === 'nfc_card' ? '85.60 × 53.98 mm' : 
            '2.5 × 2.5 cm',
      material: media.mediaType === 'mini_cd' ? 'CD-R with printable surface' : 
                media.mediaType === 'nfc_card' ? 'PVC card with NFC chip' : 
                'Vinyl sticker with QR code',
      nfcChip: media.mediaType === 'nfc_card' ? 'NTAG213' : null,
      printInstructions: media.mediaType === 'mini_cd' ? 'Print magazine artwork on CD surface' : 
                         media.mediaType === 'nfc_card' ? 'Magazine cover artwork with NFC chip embedded' : 
                         'QR code with magazine branding'
    });

    const newMedia: PhysicalMedia = {
      ...media,
      id,
      physicalId,
      nfcData,
      qrCode,
      printSpecs,
      createdAt: new Date(),
      shippedAt: null
    };
    
    this.physicalMedia.set(id, newMedia);
    return newMedia;
  }

  async updatePhysicalMediaStatus(id: number, status: string): Promise<PhysicalMedia | undefined> {
    const media = this.physicalMedia.get(id);
    if (!media) return undefined;

    const updatedMedia: PhysicalMedia = {
      ...media,
      productionStatus: status,
      shippedAt: status === 'shipped' ? new Date() : media.shippedAt
    };
    
    this.physicalMedia.set(id, updatedMedia);
    return updatedMedia;
  }

  async getPhysicalMediaByPhysicalId(physicalId: string): Promise<PhysicalMedia | undefined> {
    return Array.from(this.physicalMedia.values()).find(
      media => media.physicalId === physicalId
    );
  }

  // Mix Upload methods
  async getAllMixUploads(): Promise<MixUpload[]> {
    return Array.from(this.mixUploads.values());
  }

  async getMixUpload(id: number): Promise<MixUpload | undefined> {
    return this.mixUploads.get(id);
  }

  async createMixUpload(upload: InsertMixUpload): Promise<MixUpload> {
    const id = this.currentId++;
    const newMixUpload: MixUpload = {
      ...upload,
      id,
      uploadedAt: new Date(),
      isLive: upload.isLive ?? false,
      isFeatured: upload.isFeatured ?? false,
    };
    this.mixUploads.set(id, newMixUpload);
    return newMixUpload;
  }

  async updateMixUploadStatus(id: number, isLive: boolean, isFeatured: boolean): Promise<MixUpload | undefined> {
    const mixUpload = this.mixUploads.get(id);
    if (!mixUpload) return undefined;

    const updatedMixUpload: MixUpload = {
      ...mixUpload,
      isLive,
      isFeatured,
    };
    
    this.mixUploads.set(id, updatedMixUpload);
    return updatedMixUpload;
  }

  // Mix Tracklist methods
  async getMixTracklist(mixId: number): Promise<MixTracklist[]> {
    return Array.from(this.mixTracklist.values())
      .filter(track => track.mixId === mixId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  }

  async createMixTrack(track: InsertMixTracklist): Promise<MixTracklist> {
    const id = this.currentId++;
    const newTrack: MixTracklist = {
      ...track,
      id,
      endTime: track.endTime ?? null,
      label: track.label ?? null,
      year: track.year ?? null,
      genre: track.genre ?? null,
      bpm: track.bpm ?? null,
      key: track.key ?? null,
      notes: track.notes ?? null,
    };
    this.mixTracklist.set(id, newTrack);
    return newTrack;
  }

  async getCurrentTrackByTime(mixId: number, currentTime: number): Promise<MixTracklist | undefined> {
    const tracks = await this.getMixTracklist(mixId);
    return tracks.find(track => 
      track.startTime <= currentTime && 
      (track.endTime === null || track.endTime >= currentTime)
    );
  }

  // Episode methods
  async getAllEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values());
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = this.currentId++;
    const newEpisode: Episode = {
      id,
      ...episode,
      viewCount: 0,
      createdAt: new Date(),
    };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }

  async getFeaturedEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(episode => episode.isFeatured);
  }

  async getEpisodesByHost(hostName: string): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(episode => episode.hostName === hostName);
  }

  async getEpisodesBySeries(seriesTitle: string): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(episode => episode.seriesTitle === seriesTitle);
  }

  // Episode Tracklist methods
  async getEpisodeTracklist(episodeId: number): Promise<EpisodeTracklist[]> {
    return Array.from(this.episodeTracklist.values())
      .filter(track => track.episodeId === episodeId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  }

  async createEpisodeTrack(track: InsertEpisodeTracklist): Promise<EpisodeTracklist> {
    const id = this.currentId++;
    const newTrack: EpisodeTracklist = {
      id,
      ...track,
    };
    this.episodeTracklist.set(id, newTrack);
    return newTrack;
  }

  async getCurrentEpisodeTrackByTime(episodeId: number, currentTime: number): Promise<EpisodeTracklist | undefined> {
    const tracks = Array.from(this.episodeTracklist.values()).filter(track => track.episodeId === episodeId);
    return tracks.find(track => currentTime >= track.startTime && (track.endTime === null || currentTime < track.endTime));
  }

  // Initialize sample episode data
  private initializeEpisodeData() {
    // Convert your existing mix into an episode
    const jarradEpisode: Episode = {
      id: 1,
      title: "how did i do",
      description: "A footwork-heavy mix featuring tracks from Arma, DJ Earl, DJ Rashad, and more underground artists from the Texas scene.",
      episodeNumber: 1,
      seriesTitle: "Footwork Fridays",
      hostName: "Jarrad",
      airDate: new Date("2024-12-01"),
      duration: 2516, // 41:56 in seconds
      audioUrl: "https://on.soundcloud.com/JBVQVj7oTbVFUdARA",
      artworkUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      tags: ["RAP", "HIP HOP", "FOOTWORK", "ELECTRONIC"],
      isLive: false,
      isFeatured: true,
      viewCount: 0,
      createdAt: new Date(),
    };
    
    this.episodes.set(1, jarradEpisode);

    // Add episode tracklist with Spotify integration for Texas footwork scene
    const tracks: EpisodeTracklist[] = [
      {
        id: 1,
        episodeId: 1,
        trackNumber: 1,
        title: "Footwork Soldiers",
        artist: "Arma",
        startTime: 0,
        endTime: 185,
        spotifyId: "4uLU6hMCjMI75M1A2tKUQC",
        soundcloudUrl: "https://soundcloud.com/arma-chicago/footwork-soldiers",
        youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        discogsUrl: "https://discogs.com/release/12345",
        createdAt: new Date(),
      },
      {
        id: 2,
        episodeId: 1,
        trackNumber: 2,
        title: "Still Footworkin",
        artist: "DJ Earl",
        startTime: 185,
        endTime: 370,
        spotifyId: "0VjIjW4GlULA3wcmF4NWPO",
        soundcloudUrl: "https://soundcloud.com/dj-earl/still-footworkin",
        youtubeUrl: "https://youtube.com/watch?v=abc123",
        discogsUrl: "https://discogs.com/release/67890",
        createdAt: new Date(),
      },
      {
        id: 3,
        episodeId: 1,
        trackNumber: 3,
        title: "Let U No",
        artist: "DJ Rashad",
        startTime: 370,
        endTime: 555,
        spotifyId: "6KzqGFunpLsn1i7QqGk8mW",
        soundcloudUrl: "https://soundcloud.com/dj-rashad/let-u-no",
        youtubeUrl: "https://youtube.com/watch?v=def456",
        discogsUrl: "https://discogs.com/release/11111",
        createdAt: new Date(),
      },
      {
        id: 4,
        episodeId: 1,
        trackNumber: 4,
        title: "Ghetto Tekno",
        artist: "RP Boo",
        startTime: 555,
        endTime: 740,
        spotifyId: "1q8zFQNJzL8gQRTwJq5zjC",
        soundcloudUrl: "https://soundcloud.com/rp-boo/ghetto-tekno",
        youtubeUrl: "https://youtube.com/watch?v=ghi789",
        discogsUrl: "https://discogs.com/release/22222",
        createdAt: new Date(),
      },
      {
        id: 5,
        episodeId: 1,
        trackNumber: 5,
        title: "Work Dat",
        artist: "DJ Spinn",
        startTime: 740,
        endTime: 925,
        spotifyId: "3n3Ppam7vgaVa1iaRUc9LP",
        soundcloudUrl: "https://soundcloud.com/dj-spinn/work-dat",
        youtubeUrl: "https://youtube.com/watch?v=jkl012",
        discogsUrl: "https://discogs.com/release/33333",
        createdAt: new Date(),
      },
      {
        id: 6,
        episodeId: 1,
        trackNumber: 6,
        title: "Teklife Anthem",
        artist: "DJ Taye",
        startTime: 925,
        endTime: 1110,
        spotifyId: "6TBwBh5FqoTgNf0vJWUJm9",
        soundcloudUrl: "https://soundcloud.com/dj-taye/teklife-anthem",
        youtubeUrl: "https://youtube.com/watch?v=mno345",
        discogsUrl: "https://discogs.com/release/44444",
        createdAt: new Date(),
      },
      {
        id: 7,
        episodeId: 1,
        trackNumber: 7,
        title: "Smoking Good",
        artist: "Traxman",
        startTime: 1110,
        endTime: 1295,
        spotifyId: "0k6D1NJj3N5q6R9oFb7kZX",
        soundcloudUrl: "https://soundcloud.com/traxman/smoking-good",
        youtubeUrl: "https://youtube.com/watch?v=pqr678",
        discogsUrl: "https://discogs.com/release/55555",
        createdAt: new Date(),
      },
      {
        id: 8,
        episodeId: 1,
        trackNumber: 8,
        title: "Dallas Footwork",
        artist: "DJ Metro",
        startTime: 1295,
        endTime: 1480,
        spotifyId: "4dMy0DYeJj2o8s3rFz6kLp",
        soundcloudUrl: "https://soundcloud.com/dj-metro-dallas/dallas-footwork",
        youtubeUrl: "https://youtube.com/watch?v=stu901",
        discogsUrl: "https://discogs.com/release/66666",
        createdAt: new Date(),
      },
      {
        id: 9,
        episodeId: 1,
        trackNumber: 9,
        title: "Houston Bass",
        artist: "DJ Screw Jr",
        startTime: 1480,
        endTime: 1665,
        spotifyId: "7kY8ZnE3d5xJz4vLp9oKm2",
        soundcloudUrl: "https://soundcloud.com/dj-screw-jr/houston-bass",
        youtubeUrl: "https://youtube.com/watch?v=vwx234",
        discogsUrl: "https://discogs.com/release/77777",
        createdAt: new Date(),
      },
      {
        id: 10,
        episodeId: 1,
        trackNumber: 10,
        title: "Austin Underground",
        artist: "Lone Star Tekno",
        startTime: 1665,
        endTime: 1850,
        spotifyId: "9mX7RnK5j8pLz3vOq2kNf1",
        soundcloudUrl: "https://soundcloud.com/lone-star-tekno/austin-underground",
        youtubeUrl: "https://youtube.com/watch?v=yza567",
        discogsUrl: "https://discogs.com/release/88888",
        createdAt: new Date(),
      },
      {
        id: 11,
        episodeId: 1,
        trackNumber: 11,
        title: "San Antonio Juke",
        artist: "Alamo City Bass",
        startTime: 1850,
        endTime: 2035,
        spotifyId: "2bC9TmR6k4nLj7wPx5kOe3",
        soundcloudUrl: "https://soundcloud.com/alamo-city-bass/san-antonio-juke",
        youtubeUrl: "https://youtube.com/watch?v=bcd890",
        discogsUrl: "https://discogs.com/release/99999",
        createdAt: new Date(),
      },
      {
        id: 12,
        episodeId: 1,
        trackNumber: 12,
        title: "Texas Finale",
        artist: "Jarrad",
        startTime: 2035,
        endTime: 2516,
        spotifyId: "5eF2PnL8m7qKx9zRy3kMe4",
        soundcloudUrl: "https://soundcloud.com/jarrad-tx/texas-finale",
        youtubeUrl: "https://youtube.com/watch?v=efg123",
        discogsUrl: "https://discogs.com/release/10101",
        createdAt: new Date(),
      },
    ];

    tracks.forEach(track => {
      this.episodeTracklist.set(track.id, track);
    });
  }

  // Radio Playlist initialization
  private initializeRadioPlaylist() {
    // Initialize with your actual mix file
    const sampleRadioTracks: RadioPlaylist[] = [
      {
        id: 1,
        title: "how did i do",
        artist: "Jarrad",
        description: "Personal mix showcasing Chicago footwork and juke selections",
        genre: "Footwork/Juke",
        duration: 2700, // 45 minutes in seconds
        fileUrl: "/attached_assets/how did i do_1753594094475.mp3",
        artworkUrl: "https://via.placeholder.com/300x300/1a1a1a/ff0000?text=JARRAD",
        isActive: true,
        playCount: 0,
        uploadedAt: new Date(),
        uploadedBy: "admin"
      },
      // Additional sample tracks for testing rotation
      {
        id: 2,
        title: "Midnight Sessions",
        artist: "Luna Park",
        description: "Ambient and downtempo journey for late night listeners",
        genre: "Ambient",
        duration: 3600, // 60 minutes
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        artworkUrl: "https://via.placeholder.com/300x300/1a1a1a/ff0000?text=LUNA",
        isActive: true,
        playCount: 0,
        uploadedAt: new Date(),
        uploadedBy: "admin"
      },
      {
        id: 3,
        title: "Berlin Underground",
        artist: "Techno Collective",
        description: "Raw techno sounds from Berlin's underground scene",
        genre: "Techno",
        duration: 2400, // 40 minutes
        fileUrl: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
        artworkUrl: "https://via.placeholder.com/300x300/1a1a1a/ff0000?text=BERLIN",
        isActive: true,
        playCount: 0,
        uploadedAt: new Date(),
        uploadedBy: "admin"
      }
    ];

    sampleRadioTracks.forEach((track) => {
      this.radioPlaylist.set(track.id, track);
    });
  }

  // Radio Playlist Methods
  async getAllRadioPlaylist(): Promise<RadioPlaylist[]> {
    return Array.from(this.radioPlaylist.values());
  }

  async getActiveRadioPlaylist(): Promise<RadioPlaylist[]> {
    return Array.from(this.radioPlaylist.values()).filter(track => track.isActive);
  }

  async getRadioPlaylistItem(id: number): Promise<RadioPlaylist | undefined> {
    return this.radioPlaylist.get(id);
  }

  async createRadioPlaylistItem(item: InsertRadioPlaylist): Promise<RadioPlaylist> {
    const newItem: RadioPlaylist = {
      ...item,
      id: this.currentId++,
      playCount: 0,
      uploadedAt: new Date(),
    };
    this.radioPlaylist.set(newItem.id, newItem);
    return newItem;
  }

  async updateRadioPlaylistStatus(id: number, isActive: boolean): Promise<RadioPlaylist | undefined> {
    const item = this.radioPlaylist.get(id);
    if (item) {
      item.isActive = isActive;
      this.radioPlaylist.set(id, item);
      return item;
    }
    return undefined;
  }

  async incrementPlayCount(id: number): Promise<void> {
    const item = this.radioPlaylist.get(id);
    if (item) {
      item.playCount = (item.playCount || 0) + 1;
      this.radioPlaylist.set(id, item);
    }
  }

  // Track metadata methods for Last.fm integration
  async getTrackMetadata(filename: string): Promise<TrackMetadata | null> {
    return this.trackMetadataStore.get(filename) || null;
  }

  async saveTrackMetadata(metadata: InsertTrackMetadata): Promise<TrackMetadata> {
    const newMetadata: TrackMetadata = {
      id: this.currentId++,
      ...metadata,
      lastUpdated: new Date(),
      createdAt: new Date()
    };
    this.trackMetadataStore.set(metadata.filename, newMetadata);
    return newMetadata;
  }

  async updateTrackMetadata(filename: string, updates: Partial<InsertTrackMetadata>): Promise<TrackMetadata | null> {
    const existing = this.trackMetadataStore.get(filename);
    if (!existing) return null;
    
    const updated: TrackMetadata = {
      ...existing,
      ...updates,
      lastUpdated: new Date()
    };
    this.trackMetadataStore.set(filename, updated);
    return updated;
  }

  async deleteTrackMetadata(filename: string): Promise<void> {
    this.trackMetadataStore.delete(filename);
  }

  // College Radio Rotation methods
  private radioRotationStore: Map<string, any> = new Map();
  private liveShowsStore: Map<number, any> = new Map();
  private programStateStore: any = { type: 'auto', currentShowId: null, currentTrackId: null };

  async getApprovedRotationTracks(): Promise<any[]> {
    return Array.from(this.radioRotationStore.values()).filter(track => 
      track.approvalStatus === 'approved' && track.inRotation
    );
  }

  async getRadioRotationTrack(trackId: string): Promise<any | null> {
    return this.radioRotationStore.get(trackId) || null;
  }

  async createRadioRotationTrack(track: any): Promise<any> {
    this.radioRotationStore.set(track.trackId, track);
    return track;
  }

  async updateRotationTrackStatus(trackId: string, status: string, approvedBy: string, inRotation: boolean): Promise<void> {
    const track = this.radioRotationStore.get(trackId);
    if (track) {
      track.approvalStatus = status;
      track.approvedBy = approvedBy;
      track.inRotation = inRotation;
      track.approvedAt = new Date();
      this.radioRotationStore.set(trackId, track);
    }
  }

  async incrementRotationPlayCount(trackId: string): Promise<void> {
    const track = this.radioRotationStore.get(trackId);
    if (track) {
      track.playCount = (track.playCount || 0) + 1;
      track.lastPlayed = new Date();
      this.radioRotationStore.set(trackId, track);
    }
  }

  async getAllLiveShows(): Promise<any[]> {
    return Array.from(this.liveShowsStore.values());
  }

  async getLiveShow(id: number): Promise<any | null> {
    return this.liveShowsStore.get(id) || null;
  }

  async createLiveShow(show: any): Promise<any> {
    const newShow = { ...show, id: this.currentId++, createdAt: new Date() };
    this.liveShowsStore.set(newShow.id, newShow);
    return newShow;
  }

  async updateLiveShowStatus(id: number, isLive: boolean): Promise<void> {
    const show = this.liveShowsStore.get(id);
    if (show) {
      show.isLive = isLive;
      show.startedAt = isLive ? new Date() : null;
      this.liveShowsStore.set(id, show);
    }
  }

  async getCurrentProgramState(): Promise<any> {
    return this.programStateStore;
  }

  async updateProgramState(state: any): Promise<void> {
    this.programStateStore = { ...state };
  }

  // Song Submission methods implementation
  async getAllSongSubmissions(): Promise<SongSubmission[]> {
    return Array.from(this.songSubmissions.values());
  }

  async getSongSubmission(id: number): Promise<SongSubmission | undefined> {
    return this.songSubmissions.get(id);
  }

  async createSongSubmission(submission: InsertSongSubmission): Promise<SongSubmission> {
    const id = this.songSubmissions.size + 1;
    const newSubmission: SongSubmission = {
      id,
      ...submission,
      approvalStatus: 'pending',
      isScheduled: false,
      playCount: 0,
      submittedAt: new Date(),
      scheduledFor: null,
      approvedBy: null,
      approvedAt: null,
      playedAt: null,
      notes: null,
      queuePosition: null,
      playbackStatus: 'queued',
      currentlyPlaying: false,
    };
    this.songSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async getApprovedSongSubmissions(): Promise<SongSubmission[]> {
    return Array.from(this.songSubmissions.values()).filter(
      submission => submission.approvalStatus === 'approved'
    );
  }

  async updateSongSubmissionStatus(id: number, status: string, approvedBy: string, notes?: string): Promise<SongSubmission | undefined> {
    const submission = this.songSubmissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission: SongSubmission = {
      ...submission,
      approvalStatus: status,
      approvedBy,
      approvedAt: new Date(),
      notes: notes || submission.notes,
      queuePosition: null,
      playbackStatus: 'queued',
      currentlyPlaying: false,
    };
    this.songSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async getSongSubmissionsByTheme(themeTag: string): Promise<SongSubmission[]> {
    return Array.from(this.songSubmissions.values()).filter(s => s.themeTag === themeTag);
  }

  // Queue management implementation
  async getQueuedSongs(): Promise<SongSubmission[]> {
    return Array.from(this.songSubmissions.values())
      .filter(s => s.approvalStatus === 'approved' && s.queuePosition !== null)
      .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0));
  }

  async addToQueue(id: number, position?: number): Promise<SongSubmission | undefined> {
    const submission = this.songSubmissions.get(id);
    if (!submission || submission.approvalStatus !== 'approved') return undefined;

    const queuedSongs = await this.getQueuedSongs();
    const maxPosition = queuedSongs.length;
    const queuePosition = position || maxPosition + 1;

    // Shift other songs if needed
    if (position) {
      queuedSongs.forEach(song => {
        if (song.queuePosition && song.queuePosition >= position) {
          const updated = { ...song, queuePosition: song.queuePosition + 1 };
          this.songSubmissions.set(song.id, updated);
        }
      });
    }

    const updatedSubmission = {
      ...submission,
      queuePosition,
      playbackStatus: 'queued' as const,
    };
    this.songSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async updateQueuePosition(id: number, newPosition: number): Promise<SongSubmission | undefined> {
    const submission = this.songSubmissions.get(id);
    if (!submission || !submission.queuePosition) return undefined;

    const oldPosition = submission.queuePosition;
    const queuedSongs = await this.getQueuedSongs();

    // Reorder other songs
    queuedSongs.forEach(song => {
      if (song.id === id) return;
      
      if (oldPosition < newPosition) {
        // Moving down: shift songs up
        if (song.queuePosition && song.queuePosition > oldPosition && song.queuePosition <= newPosition) {
          const updated = { ...song, queuePosition: song.queuePosition - 1 };
          this.songSubmissions.set(song.id, updated);
        }
      } else {
        // Moving up: shift songs down
        if (song.queuePosition && song.queuePosition >= newPosition && song.queuePosition < oldPosition) {
          const updated = { ...song, queuePosition: song.queuePosition + 1 };
          this.songSubmissions.set(song.id, updated);
        }
      }
    });

    const updatedSubmission = { ...submission, queuePosition: newPosition };
    this.songSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async updatePlaybackStatus(id: number, status: 'queued' | 'playing' | 'played'): Promise<SongSubmission | undefined> {
    const submission = this.songSubmissions.get(id);
    if (!submission) return undefined;

    // Clear currently playing flag from all other songs
    if (status === 'playing') {
      Array.from(this.songSubmissions.values()).forEach(song => {
        if (song.currentlyPlaying && song.id !== id) {
          const updated = { ...song, currentlyPlaying: false, playbackStatus: 'queued' as const };
          this.songSubmissions.set(song.id, updated);
        }
      });
    }

    const updatedSubmission = {
      ...submission,
      playbackStatus: status,
      currentlyPlaying: status === 'playing',
      playedAt: status === 'played' ? new Date() : submission.playedAt,
      playCount: status === 'played' ? (submission.playCount || 0) + 1 : submission.playCount,
    };
    this.songSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async getCurrentlyPlaying(): Promise<SongSubmission | undefined> {
    return Array.from(this.songSubmissions.values()).find(s => s.currentlyPlaying);
  }

  async setCurrentlyPlaying(id: number): Promise<SongSubmission | undefined> {
    return this.updatePlaybackStatus(id, 'playing');
  }

  // Themed Program methods implementation
  async getAllThemedPrograms(): Promise<ThemedProgram[]> {
    return Array.from(this.themedPrograms.values());
  }

  async getThemedProgram(id: number): Promise<ThemedProgram | undefined> {
    return this.themedPrograms.get(id);
  }

  async createThemedProgram(program: InsertThemedProgram): Promise<ThemedProgram> {
    const id = this.themedPrograms.size + 1;
    const newProgram: ThemedProgram = {
      id,
      ...program,
      createdAt: new Date(),
    };
    this.themedPrograms.set(id, newProgram);
    return newProgram;
  }

  async getActiveThemedPrograms(): Promise<ThemedProgram[]> {
    return Array.from(this.themedPrograms.values()).filter(p => p.isActive);
  }
}

export const storage = new MemStorage();
