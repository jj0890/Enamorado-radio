# Complete Code Files Part 3 - Server & Shared Files

## Server Files

### server/index.ts
```typescript
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());

const server = await registerRoutes(app);

// Setup Vite or serve static files
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

### server/vite.ts
```typescript
import { Express } from "express";
import { createServer as createViteServer, ViteDevServer } from "vite";
import { Server } from "http";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Serve index.html for SPA routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    const url = req.originalUrl;
    vite.transformIndexHtml(url, fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8"))
      .then((html) => {
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      })
      .catch((error) => {
        vite.ssrFixStacktrace(error);
        next(error);
      });
  });
}

export function serveStatic(app: Express) {
  app.use(express.static(path.join(process.cwd(), "dist/public")));
  
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    
    res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
  });
}
```

### server/storage.ts
```typescript
import { 
  type User, 
  type Station, 
  type Show, 
  type CurrentPlayback,
  type InsertUser,
  type InsertStation,
  type InsertShow,
  type InsertCurrentPlayback
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
    this.currentPlayback = undefined;
    this.currentId = 1;
    
    this.initializeData();
  }

  private initializeData() {
    // Create sample station
    const station: Station = {
      id: 1,
      name: "Enamorado Radio",
      slug: "enamorado",
      streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      genre: "Mixed",
      description: "Authentic radio experience with curated shows",
      artworkUrl: "",
      isLive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stations.set(1, station);

    // Create sample show
    const show: Show = {
      id: 1,
      title: "DJ Amadeezy Mix",
      host: "DJ Amadeezy",
      description: "Hip-hop and electronic music mix",
      artworkUrl: "",
      genre: "Hip-Hop",
      scheduledAt: new Date(),
      duration: 60,
      isLive: true,
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.shows.set(1, show);

    // Create current playback
    this.currentPlayback = {
      id: 1,
      stationId: 1,
      showId: 1,
      title: "DJ Amadeezy Mix",
      artist: "DJ Amadeezy",
      artwork: "",
      startTime: new Date(),
      isLive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
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
    for (const station of this.stations.values()) {
      if (station.slug === slug) {
        return station;
      }
    }
    return undefined;
  }

  async createStation(station: InsertStation): Promise<Station> {
    const id = this.currentId++;
    const now = new Date();
    const newStation: Station = { 
      ...station, 
      id, 
      createdAt: now, 
      updatedAt: now 
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
    const now = new Date();
    const newShow: Show = { 
      ...show, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.shows.set(id, newShow);
    return newShow;
  }

  async getCurrentPlayback(): Promise<CurrentPlayback | undefined> {
    return this.currentPlayback;
  }

  async updateCurrentPlayback(playback: InsertCurrentPlayback): Promise<CurrentPlayback> {
    const id = this.currentPlayback?.id || this.currentId++;
    const now = new Date();
    this.currentPlayback = { 
      ...playback, 
      id, 
      createdAt: this.currentPlayback?.createdAt || now, 
      updatedAt: now 
    };
    return this.currentPlayback;
  }
}

export const storage = new MemStorage();
```

### server/routes.ts
```typescript
import { Express } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertStationSchema, 
  insertShowSchema, 
  insertCurrentPlaybackSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const server = new Server(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  function broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // Stations API
  app.get('/api/stations', async (req, res) => {
    try {
      const stations = await storage.getAllStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stations' });
    }
  });
  
  app.get('/api/stations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const station = await storage.getStation(id);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      res.json(station);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch station' });
    }
  });
  
  app.post('/api/stations', async (req, res) => {
    try {
      const validatedData = insertStationSchema.parse(req.body);
      const station = await storage.createStation(validatedData);
      res.status(201).json(station);
    } catch (error) {
      res.status(400).json({ error: 'Invalid station data' });
    }
  });
  
  // Shows API
  app.get('/api/shows', async (req, res) => {
    try {
      const shows = await storage.getAllShows();
      res.json(shows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch shows' });
    }
  });
  
  app.get('/api/shows/featured', async (req, res) => {
    try {
      const shows = await storage.getFeaturedShows();
      res.json(shows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured shows' });
    }
  });
  
  app.get('/api/shows/live', async (req, res) => {
    try {
      const shows = await storage.getLiveShows();
      res.json(shows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch live shows' });
    }
  });

  // Mobile shows endpoint - must come before parameterized route
  app.get("/api/shows/mobile", async (req, res) => {
    try {
      const shows = [
        {
          id: 1,
          title: "DJ AMADEEZY MIX",
          host: "DJ Amadeezy",
          location: "SAN ANTONIO",
          description: "Resident DJ mixing everything from classic hip-hop to electronic, bringing authentic SA sound to the airwaves",
          tags: ["HIP-HOP", "ELECTRONIC", "SA-SOUND"],
          isLive: true,
          artwork: "",
          date: "7.7.2025",
          time: "10:00 - 11:00",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        },
        {
          id: 2,
          title: "SAC STUDENT SESSIONS",
          host: "Various Students",
          location: "SAN ANTONIO COLLEGE",
          description: "Student-led radio programming showcasing local talent and experimental sounds from the college community",
          tags: ["STUDENT", "EXPERIMENTAL", "LOCAL"],
          isLive: false,
          artwork: "",
          date: "7.7.2025",
          time: "11:00 - 12:00",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        },
        {
          id: 3,
          title: "AUSTIN SOUND LAB",
          host: "Local Collective",
          location: "AUSTIN",
          description: "Collective of Austin musicians and producers sharing new sounds from the Live Music Capital",
          tags: ["AUSTIN", "LIVE-MUSIC", "COLLECTIVE"],
          isLive: false,
          artwork: "",
          date: "7.7.2025",
          time: "12:00 - 13:00",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        }
      ];
      res.json(shows);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mobile shows" });
    }
  });
  
  app.get('/api/shows/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const show = await storage.getShow(id);
      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }
      res.json(show);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch show' });
    }
  });
  
  app.post('/api/shows', async (req, res) => {
    try {
      const validatedData = insertShowSchema.parse(req.body);
      const show = await storage.createShow(validatedData);
      res.status(201).json(show);
    } catch (error) {
      res.status(400).json({ error: 'Invalid show data' });
    }
  });
  
  // Current playback API
  app.get('/api/playback/current', async (req, res) => {
    try {
      const playback = await storage.getCurrentPlayback();
      if (!playback) {
        return res.status(404).json({ error: 'No current playback' });
      }
      res.json(playback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current playback' });
    }
  });
  
  app.post('/api/playback/current', async (req, res) => {
    try {
      const validatedData = insertCurrentPlaybackSchema.parse(req.body);
      const playback = await storage.updateCurrentPlayback(validatedData);
      
      // Broadcast update to all connected clients
      broadcast({
        type: 'currentPlayback',
        data: playback
      });
      
      res.json(playback);
    } catch (error) {
      res.status(400).json({ error: 'Invalid playback data' });
    }
  });
  
  // Audio tracks endpoint
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = [
        {
          id: "1",
          title: "Midnight Drive",
          artist: "DJ Amadeezy",
          artwork: "",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          duration: 180,
          genre: "Hip-Hop"
        },
        {
          id: "2",
          title: "Electronic Vibes",
          artist: "Student Collective",
          artwork: "",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          duration: 240,
          genre: "Electronic"
        },
        {
          id: "3",
          title: "Austin Sound",
          artist: "Local Artist",
          artwork: "",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          duration: 200,
          genre: "Indie"
        }
      ];
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tracks" });
    }
  });

  // Simulate live updates
  setInterval(() => {
    broadcast({
      type: 'currentPlayback',
      data: {
        id: 1,
        stationId: 1,
        showId: 1,
        title: "DJ Amadeezy Mix",
        artist: "DJ Amadeezy",
        artwork: "",
        startTime: new Date(),
        isLive: true
      }
    });
  }, 30000); // Every 30 seconds

  return server;
}
```

## Shared Files

### shared/schema.ts
```typescript
import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stations = pgTable("stations", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  streamUrl: text("stream_url").notNull(),
  genre: text("genre").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  isLive: boolean("is_live").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shows = pgTable("shows", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"), // in minutes
  isLive: boolean("is_live").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const currentPlayback = pgTable("current_playback", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  stationId: integer("station_id").references(() => stations.id),
  showId: integer("show_id").references(() => shows.id),
  title: text("title").notNull(),
  artist: text("artist"),
  artwork: text("artwork"),
  startTime: timestamp("start_time").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
```

## Setup Commands

After creating all files, run these commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to
http://localhost:5000/mobile
```

## Key Changes Made

1. **Symbol-based artwork**: Replaced generic photos with beautiful gradient backgrounds and lucide-react icons
2. **Updated API responses**: Removed placeholder image URLs, now using empty strings for artwork
3. **Enhanced visual design**: Each show type (DJ, Student, Collective, Live) gets its own color scheme and icon
4. **Working audio streaming**: Real SoundHelix audio streams with proper HTML5 audio controls
5. **Clean NTS-style interface**: Dark theme with professional radio station aesthetics

The mobile radio player should now load at `http://localhost:5000/mobile` with beautiful symbol-based artwork instead of generic photos!