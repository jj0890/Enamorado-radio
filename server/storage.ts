import { users, stations, shows, currentPlayback, type User, type InsertUser, type Station, type InsertStation, type Show, type InsertShow, type CurrentPlayback, type InsertCurrentPlayback } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stations: Map<number, Station>;
  private shows: Map<number, Show>;
  private currentPlayback: CurrentPlayback | undefined;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.stations = new Map();
    this.shows = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize sample stations
    const sampleStations: Station[] = [
      {
        id: 1,
        name: "Radio 1",
        slug: "radio-1",
        streamUrl: "https://stream.rinse.fm/rinse",
        genre: "Electronic",
        description: "Electronic • House • Techno",
        artworkUrl: "",
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
        title: "Deep House Sessions",
        host: "Marcus Rivera",
        description: "Journey through the depths of electronic music with curated deep house tracks from around the globe.",
        artworkUrl: "",
        genre: "Deep House",
        scheduledAt: new Date(),
        duration: 120,
        isLive: true,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: "Midnight Frequencies",
        host: "DJ Luna",
        description: "Late night techno journey through underground sounds",
        artworkUrl: "",
        genre: "Techno",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        isLive: false,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        title: "Urban Beats",
        host: "MC Flow",
        description: "The hottest hip-hop and R&B tracks",
        artworkUrl: "",
        genre: "Hip-Hop",
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        duration: 60,
        isLive: false,
        isFeatured: true,
        createdAt: new Date(),
      },
      {
        id: 4,
        title: "Jazz After Dark",
        host: "Sarah Miles",
        description: "Smooth jazz for late night listening",
        artworkUrl: "",
        genre: "Jazz",
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
      title: "Deep House Sessions",
      artist: "Marcus Rivera",
      artwork: "",
      startTime: new Date(),
      isLive: true,
    };

    this.currentId = 7;
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
}

export const storage = new MemStorage();
