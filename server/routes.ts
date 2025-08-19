import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { metadataService } from "./metadataService";
import { azuracastService } from "./azuracastService";
import { mixRouter } from "./mixRouter";
import { z } from "zod";
import http from "http";
import { 
  insertEpisodeSchema,
  insertGuideSchema,
  insertMixSubmissionSchema,
  insertScheduleSchema,
  insertSongSubmissionSchema,
  insertCurrentPlaybackSchema
} from "@shared/schema";

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
  // HTTPS PROXY for AzuraCast (fixes mixed-content blocking)
  // =================
  
  const AZ_BASE = 'http://24.199.109.18';
  const STREAM_PATH = '/radio/8000/radio.mp3';
  const NOWPLAYING_PATH = '/api/nowplaying/enamorado_radio';

  // Proxy the MP3 stream (HTTPS-safe)
  app.get('/stream.mp3', (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const upstream = http.request(`${AZ_BASE}${STREAM_PATH}`, { method: 'GET' }, up => {
      up.on('error', () => res.end());
      up.pipe(res);
    });

    upstream.on('error', () => {
      res.status(502).end('Stream error');
    });

    upstream.end();
  });

  // Proxy the nowplaying JSON
  app.get('/nowplaying', async (req, res) => {
    try {
      const response = await fetch(`${AZ_BASE}${NOWPLAYING_PATH}`, { 
        headers: { 'Accept': 'application/json' } 
      });
      const data = await response.json();
      res.set('Cache-Control', 'no-store');
      res.set('Access-Control-Allow-Origin', '*');
      res.json(data);
    } catch (error) {
      console.error('Nowplaying proxy error:', error);
      res.status(502).json({ error: 'nowplaying failed' });
    }
  });

  // =================
  // LATEST API - Recent episodes, shows, and mixes
  // =================

  app.get("/api/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;
      
      // Get recent episodes and approved mix submissions
      const [episodes, mixes] = await Promise.all([
        storage.getEpisodes({ limit: Math.ceil(limit / 2) }),
        storage.getMixSubmissions({ status: 'approved', limit: Math.ceil(limit / 2) })
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
      const episodes = await storage.getEpisodes({
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
      const episode = await storage.getEpisodeById(parseInt(req.params.id));
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
      const episode = await storage.createEpisode(validatedData);
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
      const guides = await storage.getGuides({
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
      const guide = await storage.getGuideBySlug(req.params.slug);
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
      const guide = await storage.createGuide(validatedData);
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
      const mixes = await storage.getMixSubmissions({
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
          const metadata = await metadataService.fetchSoundCloudMetadata(validatedData.url);
          validatedData.metadata = metadata;
        } catch (metaError) {
          console.warn('Failed to fetch SoundCloud metadata:', metaError);
        }
      }
      
      const mixSubmission = await storage.createMixSubmission(validatedData);
      res.status(201).json(mixSubmission);
    } catch (error) {
      console.error('Error creating mix submission:', error);
      res.status(400).json({ error: 'Invalid mix submission data' });
    }
  });

  app.patch("/api/mixes/:id/status", async (req, res) => {
    try {
      const { status, notes } = req.body;
      const mix = await storage.updateMixSubmissionStatus(
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
  // AUDIO MANAGEMENT API
  // =================
  
  // Get stream status for smart homepage CTA
  app.get("/api/stream-status", async (req, res) => {
    try {
      // Check Icecast stream status
      const icecastUrl = 'http://24.199.109.18:8000/stream';
      let isLive = false;
      let listenerCount = 0;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(icecastUrl, { 
          method: 'HEAD', 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        isLive = response.ok;
        // Could parse Icecast stats if available
      } catch (error) {
        console.log('Icecast stream check failed:', error);
        isLive = false;
      }

      res.json({
        isLive,
        listenerCount,
        currentShow: isLive ? 'Live Broadcast' : null,
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking stream status:', error);
      res.status(500).json({ error: 'Failed to check stream status' });
    }
  });

  // Get current playback for player display
  app.get("/api/current-playback", async (req, res) => {
    try {
      const currentPlayback = await storage.getCurrentPlayback();
      res.json(currentPlayback);
    } catch (error) {
      console.error('Error fetching current playback:', error);
      res.status(500).json({ error: 'Failed to fetch current playback' });
    }
  });

  // Update current playback (admin control)
  app.post("/api/current-playback", async (req, res) => {
    try {
      const { title, artist, artwork, mixId, trackUrl, isLive } = req.body;
      const playback = await storage.updateCurrentPlayback({
        title,
        artist,
        artwork,
        mixId,
        trackUrl,
        isLive: isLive || false
      });
      res.json(playback);
    } catch (error) {
      console.error('Error updating current playback:', error);
      res.status(500).json({ error: 'Failed to update current playback' });
    }
  });

  // =================
  // SONG SUBMISSIONS API
  // =================
  
  app.get("/api/song-submissions", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const submissions = await storage.getSongSubmissions({
        status: status as string || 'pending',
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
      const submission = await storage.createSongSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating song submission:', error);
      res.status(400).json({ error: 'Invalid song submission data' });
    }
  });

  app.patch("/api/song-submissions/:id/status", async (req, res) => {
    try {
      const { approvalStatus } = req.body;
      const submission = await storage.updateSongSubmissionStatus(
        parseInt(req.params.id),
        approvalStatus
      );
      res.json(submission);
    } catch (error) {
      console.error('Error updating song submission status:', error);
      res.status(500).json({ error: 'Failed to update song submission status' });
    }
  });

  // =================
  // SCHEDULE API - Programming grid
  // =================

  app.get("/api/schedule", async (req, res) => {
    try {
      const { upcoming, date, limit } = req.query;
      const schedule = await storage.getSchedule({
        upcoming: upcoming === 'true' ? true : undefined,
        date: date ? new Date(date as string) : null,
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
      const scheduleItem = await storage.createScheduleItem(validatedData);
      res.status(201).json(scheduleItem);
    } catch (error) {
      console.error('Error creating schedule item:', error);
      res.status(400).json({ error: 'Invalid schedule data' });
    }
  });

  // =================
  // AZURACAST INTEGRATION API
  // =================
  
  app.get("/api/azuracast/test", async (req, res) => {
    try {
      const result = await azuracastService.testConnection();
      res.json(result);
    } catch (error) {
      res.json({ success: false, error: 'Failed to connect to AzuraCast' });
    }
  });

  app.get("/api/azuracast/nowplaying", async (req, res) => {
    try {
      const nowPlaying = await azuracastService.getNowPlaying();
      res.json(nowPlaying);
    } catch (error) {
      res.json(null);
    }
  });

  app.post("/api/azuracast/process-mix/:id", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(mixId);
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }
      
      // Here you would download the audio and convert to MP3
      // For now, just return success for the workflow
      res.json({ 
        success: true, 
        message: 'Mix processed - ready for manual MP3 placement' 
      });
    } catch (error) {
      console.error('Error processing mix:', error);
      res.status(500).json({ error: 'Failed to process mix' });
    }
  });

  app.post("/api/azuracast/upload/:id", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(mixId);
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      // Simulate upload process (in real implementation, would use temp MP3 file)
      const result = await azuracastService.uploadMixToAzuraCast(
        mix.title, 
        mix.name, 
        `/tmp/${mix.title}.mp3` // This would be the actual MP3 file path
      );
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error uploading to AzuraCast:', error);
      res.status(500).json({ error: 'Failed to upload to AzuraCast' });
    }
  });

  // =================
  // SONG SUBMISSIONS API
  // =================

  app.get("/api/song-submissions", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const submissions = await storage.getSongSubmissions({
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
      const submission = await storage.createSongSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating song submission:', error);
      res.status(400).json({ error: 'Invalid song submission data' });
    }
  });

  app.patch("/api/song-submissions/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const submission = await storage.updateSongSubmissionStatus(
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
      const playback = await storage.getCurrentPlayback();
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
      const playback = await storage.updateCurrentPlayback(validatedData);
      
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
      const featuredMixes = await storage.getMixSubmissions({ 
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

  // Redirect to Google Form for resident applications
  app.get("/api/resident-application", (req, res) => {
    res.redirect("https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header");
  });

  app.get("/resident-application", (req, res) => {
    res.redirect("https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform?usp=header");
  });

  // Tags API for filtering
  app.get("/api/tags", async (req, res) => {
    try {
      const [episodes, guides, mixes] = await Promise.all([
        storage.getEpisodes(),
        storage.getGuides(),
        storage.getMixSubmissions()
      ]);
      
      const allTags = new Set<string>();
      
      episodes.forEach(e => e.tags?.forEach(tag => allTags.add(tag)));
      guides.forEach(g => g.tags?.forEach(tag => allTags.add(tag)));
      mixes.forEach(m => m.genre && allTags.add(m.genre));
      
      res.json(Array.from(allTags).sort());
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Initialize featured mixes from SoundCloud URLs
  const initFeaturedMixes = async () => {
    const featuredMixes = [
      {
        title: "454 presents: Florida man FM",
        name: "Stream 454",
        url: "https://soundcloud.com/user-626444105/454-presents-florida-man-fm-250723",
        genre: "Electronic",
        about: "A wild exploration through electronic soundscapes and experimental beats from Stream 454."
      },
      {
        title: "gum.mp3 Elevator Music",
        name: "Elevator Music Live", 
        url: "https://soundcloud.com/elevatormusiclive/gummp3-elevator-music",
        genre: "Ambient",
        about: "Atmospheric ambient music perfect for contemplative listening sessions."
      },
      {
        title: "New Mix (Mostly Footwork/Juke)",
        name: "scumbagjones1",
        url: "https://soundcloud.com/scumbagjones1/new-mix-mostly-footwork-juke",
        genre: "Electronic", 
        about: "High-energy footwork and juke tracks curated for the dancefloor."
      }
    ];

    console.log('Initializing featured mixes...');
    
    // Check if featured mixes already exist
    const existingFeatured = await storage.getMixSubmissions({ status: 'featured' });
    console.log(`Found ${existingFeatured.length} existing featured mixes`);
    
    if (existingFeatured.length === 0) {
      for (const mix of featuredMixes) {
        try {
          console.log(`Creating mix: ${mix.title}`);
          const submission = await storage.createMixSubmission(mix);
          console.log(`Created submission with ID: ${submission.id}`);
          
          const updatedSubmission = await storage.updateMixSubmissionStatus(submission.id, 'featured', 'Initial featured mix');
          console.log(`Updated submission ${submission.id} to featured status`);
        } catch (error) {
          console.error('Error creating featured mix:', mix.title, error);
        }
      }
      console.log('Featured mixes initialization complete');
    } else {
      console.log('Featured mixes already exist, skipping initialization');
    }
  };

  // Initialize featured mixes on server start
  initFeaturedMixes().catch(console.error);

  // =================
  // AZURACAST INTEGRATION ROUTES
  // =================

  // Test AzuraCast connection
  app.get('/api/azuracast/test', async (req, res) => {
    try {
      // Test connection by getting now playing
      const nowPlaying = await azuracastService.getNowPlaying();
      const stationInfo = await azuracastService.getStationInfo();
      
      res.json({
        success: true,
        nowPlaying,
        stationInfo,
        streamUrl: azuracastService.getStreamUrl(),
        publicPlayerUrl: azuracastService.getPublicPlayerUrl()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to connect to AzuraCast',
        message: error.message
      });
    }
  });

  // Get AzuraCast now playing info
  app.get('/api/azuracast/nowplaying', async (req, res) => {
    try {
      const nowPlaying = await azuracastService.getNowPlaying();
      res.json(nowPlaying || {});
    } catch (error) {
      res.status(500).json({ error: 'Failed to get now playing info' });
    }
  });

  // Process approved mix for AzuraCast upload
  app.post('/api/azuracast/process-mix/:id', async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(mixId);
      
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      if (mix.status !== 'approved') {
        return res.status(400).json({ error: 'Mix must be approved before processing' });
      }

      // Process for AzuraCast
      const processed = await audioProcessor.processSubmissionForAzuraCast(mix);
      
      if (processed) {
        res.json({ 
          success: true, 
          message: 'Mix processed for AzuraCast upload',
          tempDir: audioProcessor.getTempDirectory()
        });
      } else {
        res.status(500).json({ error: 'Failed to process mix' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Processing failed', message: error.message });
    }
  });

  // Upload processed audio to AzuraCast
  app.post('/api/azuracast/upload/:id', async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(mixId);
      
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      const uploaded = await audioProcessor.uploadToAzuraCast(mix);
      
      if (uploaded) {
        // Update mix status to indicate it's been uploaded to AzuraCast
        await storage.updateMixSubmission(mixId, { 
          ...mix, 
          status: 'featured', // Mark as featured since it's now in AzuraCast rotation
          azuracastUploaded: true 
        });
        
        res.json({ success: true, message: 'Mix uploaded to AzuraCast successfully' });
      } else {
        res.status(500).json({ error: 'Failed to upload to AzuraCast' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Upload failed', message: error.message });
    }
  });

  // List files ready for AzuraCast upload
  app.get('/api/azuracast/ready-files', (req, res) => {
    try {
      const readyFiles = audioProcessor.listReadyFiles();
      res.json({ 
        readyFiles,
        tempDir: audioProcessor.getTempDirectory(),
        count: readyFiles.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list ready files' });
    }
  });

  return httpServer;
}