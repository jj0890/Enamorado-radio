import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertStationSchema, 
  insertShowSchema, 
  insertCurrentPlaybackSchema,
  insertDjSubmissionSchema,
  insertAdminSchema,
  insertZineSubmissionSchema,
  insertZineContentSchema,
  insertEditorialWorkflowSchema,
  insertPhysicalMediaSchema
} from "@shared/schema";

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



  // DJ Submission API
  app.get('/api/dj-submissions', async (req, res) => {
    try {
      const submissions = await storage.getAllDjSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/dj-submissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getDjSubmission(id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  app.post('/api/dj-submissions', async (req, res) => {
    try {
      const validatedData = insertDjSubmissionSchema.parse(req.body);
      const submission = await storage.createDjSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: 'Invalid submission data' });
    }
  });

  app.patch('/api/dj-submissions/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewedBy, notes } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const submission = await storage.updateDjSubmissionStatus(id, status, reviewedBy, notes);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update submission status' });
    }
  });

  // Admin Authentication API
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      
      const admin = await storage.validateAdmin(username, password);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // In production, use JWT tokens for authentication
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/admin/register', async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      const admin = await storage.createAdmin(validatedData);
      res.status(201).json({
        id: admin.id,
        username: admin.username,
        role: admin.role
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid admin data' });
    }
  });

  // Simple middleware to check admin authentication (in production, use proper JWT)
  function requireAdmin(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Admin ')) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    // In production, verify JWT token here
    next();
  }

  // Protected admin routes
  app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllDjSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin submissions' });
    }
  });

  // Zine Submission API routes
  app.post('/api/zine-submissions', async (req, res) => {
    try {
      const validatedData = insertZineSubmissionSchema.parse(req.body);
      const submission = await storage.createZineSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: 'Invalid zine submission data' });
    }
  });

  // Public endpoints for admin panel (in production, secure with authentication)
  app.get('/api/zine-submissions', async (req, res) => {
    try {
      const submissions = await storage.getAllZineSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zine submissions' });
    }
  });

  app.get('/api/admin/zine-submissions', requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllZineSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zine submissions' });
    }
  });

  app.post('/api/admin/zine-submissions/:id/status', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const adminUsername = 'admin'; // In production, get from JWT token
      
      const updatedSubmission = await storage.updateZineSubmissionStatus(
        parseInt(id), 
        status, 
        adminUsername, 
        notes
      );
      
      if (!updatedSubmission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update submission status' });
    }
  });

  app.post('/api/admin/zine-submissions/:id/publish', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertZineContentSchema.parse(req.body);
      
      const publishedContent = await storage.publishZineSubmission(
        parseInt(id), 
        validatedData
      );
      
      res.json(publishedContent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to publish zine submission' });
    }
  });

  // Zine Content API routes
  app.get('/api/zine', async (req, res) => {
    try {
      const content = await storage.getAllZineContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zine content' });
    }
  });

  app.get('/api/zine/featured', async (req, res) => {
    try {
      const content = await storage.getFeaturedZineContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured zine content' });
    }
  });

  app.get('/api/zine/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const content = await storage.getZineContentByCategory(category);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zine content by category' });
    }
  });

  app.get('/api/zine/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const content = await storage.getZineContentBySlug(slug);
      
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
      
      // Update view count
      await storage.updateZineContentViews(content.id);
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zine content' });
    }
  });

  // Editorial Workflow API
  app.get('/api/editorial-workflow', async (req, res) => {
    try {
      const workflows = await storage.getAllEditorialWorkflow();
      // Join with submission data to create complete workflow view
      const workflowsWithSubmissions = await Promise.all(
        workflows.map(async (workflow) => {
          const submission = await storage.getZineSubmission(workflow.submissionId);
          return {
            ...workflow,
            title: submission?.title || 'Unknown',
            authorName: submission?.authorName || 'Unknown',
            authorEmail: submission?.authorEmail || 'Unknown',
            contentType: submission?.contentType || 'Unknown',
            category: submission?.category || 'Unknown',
            content: submission?.content || '',
            excerpt: submission?.excerpt || '',
            tags: submission?.tags || '',
            submittedAt: submission?.submittedAt || new Date(),
          };
        })
      );
      res.json(workflowsWithSubmissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch editorial workflows' });
    }
  });

  app.post('/api/editorial-workflow', async (req, res) => {
    try {
      const validatedData = insertEditorialWorkflowSchema.parse(req.body);
      const workflow = await storage.createEditorialWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: 'Invalid workflow data' });
    }
  });

  app.patch('/api/editorial-workflow/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { workflowStage, editorNotes } = req.body;
      
      const workflow = await storage.updateEditorialWorkflowStage(id, workflowStage, editorNotes);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  });

  app.post('/api/editorial-workflow/:id/issuu-draft', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Mock Issuu API call - in real implementation, this would use ISSUU API
      const mockDraftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const workflow = await storage.updateIssuuDraftId(id, mockDraftId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json({ message: 'Draft created successfully', draftId: mockDraftId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create Issuu draft' });
    }
  });

  app.post('/api/editorial-workflow/:id/issuu-publish', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Mock Issuu API call - in real implementation, this would use ISSUU API
      const mockPublicationId = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const workflow = await storage.updateIssuuPublicationId(id, mockPublicationId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json({ message: 'Published to Issuu successfully', publicationId: mockPublicationId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to publish to Issuu' });
    }
  });

  // Physical Media API
  app.get('/api/physical-media', async (req, res) => {
    try {
      const media = await storage.getAllPhysicalMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch physical media' });
    }
  });

  app.post('/api/physical-media', async (req, res) => {
    try {
      const validatedData = insertPhysicalMediaSchema.parse(req.body);
      const media = await storage.createPhysicalMedia(validatedData);
      res.status(201).json(media);
    } catch (error) {
      res.status(400).json({ error: 'Invalid physical media data' });
    }
  });

  app.patch('/api/physical-media/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { productionStatus } = req.body;
      
      const media = await storage.updatePhysicalMediaStatus(id, productionStatus);
      if (!media) {
        return res.status(404).json({ error: 'Physical media not found' });
      }
      
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update physical media status' });
    }
  });

  app.get('/api/physical-media/scan/:physicalId', async (req, res) => {
    try {
      const { physicalId } = req.params;
      const media = await storage.getPhysicalMediaByPhysicalId(physicalId);
      
      if (!media) {
        return res.status(404).json({ error: 'Physical media not found' });
      }
      
      // Parse NFC data and return URL to redirect to
      const nfcData = JSON.parse(media.nfcData || '{}');
      res.json({
        redirectUrl: nfcData.url,
        title: nfcData.title,
        type: nfcData.type
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process NFC scan' });
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
