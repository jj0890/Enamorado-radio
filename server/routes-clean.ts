import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { cleanStorage } from "./storage-clean";
import { metadataService } from "./metadataService";
import { z } from "zod";
import { 
  insertEpisodeSchema,
  insertGuideSchema,
  insertMixSubmissionSchema,
  insertScheduleSchema,
  insertSongSubmissionSchema,
  insertCurrentPlaybackSchema
} from "@shared/schema-clean";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // =================
  // LATEST API - Recent episodes, shows, and mixes
  // =================

  app.get("/api/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;
      
      // Get recent episodes and approved mix submissions
      const [episodes, mixes] = await Promise.all([
        cleanStorage.getEpisodes({ limit: Math.ceil(limit / 2) }),
        cleanStorage.getMixSubmissions({ status: 'approved', limit: Math.ceil(limit / 2) })
      ]);
      
      // Combine and sort by date
      const latest = [
        ...episodes.map(e => ({ ...e, type: 'episode' })),
        ...mixes.map(m => ({ ...m, type: 'mix' }))
      ].sort((a, b) => {
        const dateA = 'airDate' in a ? new Date(a.airDate) : new Date(a.submittedAt);
        const dateB = 'airDate' in b ? new Date(b.airDate) : new Date(b.submittedAt);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, limit);
      
      res.json(latest);
    } catch (error) {
      console.error('Error fetching latest content:', error);
      res.status(500).json({ error: 'Failed to fetch latest content' });
    }
  });

  // =================
  // EPISODES API
  // =================

  app.get("/api/episodes", async (req, res) => {
    try {
      const { featured, genre, limit } = req.query;
      const episodes = await cleanStorage.getEpisodes({
        featured: featured === 'true' ? true : undefined,
        genre: genre as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      res.status(500).json({ error: 'Failed to fetch episodes' });
    }
  });

  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const episode = await cleanStorage.getEpisodeById(parseInt(req.params.id));
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      res.json(episode);
    } catch (error) {
      console.error('Error fetching episode:', error);
      res.status(500).json({ error: 'Failed to fetch episode' });
    }
  });

  app.post("/api/episodes", async (req, res) => {
    try {
      const validatedData = insertEpisodeSchema.parse(req.body);
      const episode = await cleanStorage.createEpisode(validatedData);
      res.status(201).json(episode);
    } catch (error) {
      console.error('Error creating episode:', error);
      res.status(400).json({ error: 'Invalid episode data' });
    }
  });

  // =================
  // GUIDES API - Thematic entry points
  // =================

  app.get("/api/guides", async (req, res) => {
    try {
      const { featured, type, limit } = req.query;
      const guides = await cleanStorage.getGuides({
        featured: featured === 'true' ? true : undefined,
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(guides);
    } catch (error) {
      console.error('Error fetching guides:', error);
      res.status(500).json({ error: 'Failed to fetch guides' });
    }
  });

  app.get("/api/guides/:slug", async (req, res) => {
    try {
      const guide = await cleanStorage.getGuideBySlug(req.params.slug);
      if (!guide) {
        return res.status(404).json({ error: 'Guide not found' });
      }
      res.json(guide);
    } catch (error) {
      console.error('Error fetching guide:', error);
      res.status(500).json({ error: 'Failed to fetch guide' });
    }
  });

  app.post("/api/guides", async (req, res) => {
    try {
      const validatedData = insertGuideSchema.parse(req.body);
      const guide = await cleanStorage.createGuide(validatedData);
      res.status(201).json(guide);
    } catch (error) {
      console.error('Error creating guide:', error);
      res.status(400).json({ error: 'Invalid guide data' });
    }
  });

  // =================
  // MIX SUBMISSIONS API
  // =================

  app.get("/api/mixes", async (req, res) => {
    try {
      const { status, genre, limit } = req.query;
      const mixes = await cleanStorage.getMixSubmissions({
        status: status as string || 'approved',
        genre: genre as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      console.log(`GET /api/mixes - Found ${mixes.length} mixes with status: ${status || 'approved'}, genre: ${genre || 'undefined'}`);
      res.json(mixes);
    } catch (error) {
      console.error('Error fetching mixes:', error);
      res.status(500).json({ error: 'Failed to fetch mixes' });
    }
  });

  app.post("/api/mixes", async (req, res) => {
    try {
      const validatedData = insertMixSubmissionSchema.parse(req.body);
      
      // Enhance metadata for SoundCloud URLs
      if (validatedData.url && validatedData.url.includes('soundcloud.com')) {
        try {
          const metadata = await metadataService.getSoundCloudMetadata(validatedData.url);
          validatedData.metadata = metadata;
        } catch (metaError) {
          console.warn('Failed to fetch SoundCloud metadata:', metaError);
        }
      }
      
      const mixSubmission = await cleanStorage.createMixSubmission(validatedData);
      res.status(201).json(mixSubmission);
    } catch (error) {
      console.error('Error creating mix submission:', error);
      res.status(400).json({ error: 'Invalid mix submission data' });
    }
  });

  app.patch("/api/mixes/:id/status", async (req, res) => {
    try {
      const { status, notes } = req.body;
      const mix = await cleanStorage.updateMixSubmissionStatus(
        parseInt(req.params.id), 
        status, 
        notes
      );
      res.json(mix);
    } catch (error) {
      console.error('Error updating mix status:', error);
      res.status(500).json({ error: 'Failed to update mix status' });
    }
  });

  // =================
  // SCHEDULE API - Programming grid
  // =================

  app.get("/api/schedule", async (req, res) => {
    try {
      const { upcoming, date, limit } = req.query;
      const schedule = await cleanStorage.getSchedule({
        upcoming: upcoming === 'true' ? true : undefined,
        date: date ? new Date(date as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  });

  app.post("/api/schedule", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const scheduleItem = await cleanStorage.createScheduleItem(validatedData);
      res.status(201).json(scheduleItem);
    } catch (error) {
      console.error('Error creating schedule item:', error);
      res.status(400).json({ error: 'Invalid schedule data' });
    }
  });

  // =================
  // SONG SUBMISSIONS API
  // =================

  app.get("/api/song-submissions", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const submissions = await cleanStorage.getSongSubmissions({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching song submissions:', error);
      res.status(500).json({ error: 'Failed to fetch song submissions' });
    }
  });

  app.post("/api/song-submissions", async (req, res) => {
    try {
      const validatedData = insertSongSubmissionSchema.parse(req.body);
      const submission = await cleanStorage.createSongSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating song submission:', error);
      res.status(400).json({ error: 'Invalid song submission data' });
    }
  });

  app.patch("/api/song-submissions/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const submission = await cleanStorage.updateSongSubmissionStatus(
        parseInt(req.params.id), 
        status
      );
      res.json(submission);
    } catch (error) {
      console.error('Error updating song submission status:', error);
      res.status(500).json({ error: 'Failed to update song submission status' });
    }
  });

  // =================
  // CURRENT PLAYBACK API - Radio player
  // =================

  app.get("/api/radio/current-track", async (req, res) => {
    try {
      const playback = await cleanStorage.getCurrentPlayback();
      if (!playback) {
        return res.json({ 
          title: "Enamorado Radio", 
          artist: "Live Stream",
          artwork: null,
          isLive: false 
        });
      }
      res.json(playback);
    } catch (error) {
      console.error('Error fetching current track:', error);
      res.status(500).json({ error: 'Failed to fetch current track' });
    }
  });

  app.post("/api/radio/current-track", async (req, res) => {
    try {
      const validatedData = insertCurrentPlaybackSchema.parse(req.body);
      const playback = await cleanStorage.updateCurrentPlayback(validatedData);
      
      // Broadcast to all connected clients
      broadcast({ type: 'track-update', data: playback });
      
      res.json(playback);
    } catch (error) {
      console.error('Error updating current track:', error);
      res.status(400).json({ error: 'Invalid playback data' });
    }
  });

  // =================
  // LEGACY API COMPATIBILITY - For existing components
  // =================

  // Map old /api/dj-submissions/featured to new mixes endpoint
  app.get("/api/dj-submissions/featured", async (req, res) => {
    try {
      const featuredMixes = await cleanStorage.getMixSubmissions({ 
        status: 'featured', 
        limit: 5 
      });
      res.json(featuredMixes);
    } catch (error) {
      console.error('Error fetching featured submissions:', error);
      res.json([]);
    }
  });

  // Stream status endpoint for radio player
  app.get("/api/stream/status", async (req, res) => {
    try {
      // Mock Icecast status for compatibility
      const status = {
        serverInfo: {
          admin: "icemaster@localhost",
          host: "localhost",
          location: "Enamorado Radio",
          serverTitle: "Enamorado Radio Stream"
        },
        sources: [{
          mount: "/stream",
          fallback: true,
          listenUrl: "/stream"
        }]
      };
      res.json(status);
    } catch (error) {
      console.error('Error fetching stream status:', error);
      res.status(500).json({ error: 'Stream status unavailable' });
    }
  });

  return httpServer;
}