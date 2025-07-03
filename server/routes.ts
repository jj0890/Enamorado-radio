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
