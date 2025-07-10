import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertStationSchema, insertShowSchema, insertCurrentPlaybackSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Send current playback on connection
    storage.getCurrentPlayback().then((playback) => {
      if (playback && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'currentPlayback',
          data: playback
        }));
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });
  
  // Broadcast to all connected clients
  function broadcast(message: any) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
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
  
  // Audio tracks endpoint - SoundCloud-style
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = [
        {
          id: "1",
          title: "Midnight Drive",
          artist: "DJ Amadeezy",
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          duration: 180,
          genre: "Hip-Hop"
        },
        {
          id: "2",
          title: "San Antonio Nights",
          artist: "SAC Students",
          artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          duration: 200,
          genre: "Experimental"
        },
        {
          id: "3",
          title: "Austin Frequencies",
          artist: "Austin Sound Lab",
          artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
          streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          duration: 160,
          genre: "Electronic"
        }
      ];
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tracks" });
    }
  });

  // Mobile shows endpoint
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
          artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
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
          artwork: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
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
          artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
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

  // Simulate live updates (in real app, this would be triggered by audio system)
  setInterval(() => {
    broadcast({
      type: 'liveUpdate',
      data: {
        timestamp: new Date(),
        listeners: Math.floor(Math.random() * 1000) + 500
      }
    });
  }, 30000); // Every 30 seconds
  
  return httpServer;
}
