import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, mixStorage } from "./storage";
import { trackMetadataService } from "./trackMetadataService";
import { metadataService } from "./metadataService";
import { z } from "zod";
import { 
  insertStationSchema, 
  insertShowSchema, 
  insertCurrentPlaybackSchema,
  insertDjSubmissionSchema,
  insertAdminSchema,
  insertZineSubmissionSchema,
  insertZineContentSchema,
  insertEditorialWorkflowSchema,
  insertPhysicalMediaSchema,
  insertMixUploadSchema,
  insertMixTracklistSchema,
  insertEpisodeSchema,
  insertEpisodeTracklistSchema,
  insertRadioPlaylistSchema,
  insertResidentApplicationSchema,
  insertSongSubmissionSchema
} from "@shared/schema";

// Mix submission schema
const mixSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  genre: z.string().min(1, "Genre is required"),
  about: z.string().min(1, "About description is required"),
  soundcloudUrl: z.string().url().optional(),
  mixcloudUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional()
}).refine(data => data.soundcloudUrl || data.mixcloudUrl || data.audioUrl, {
  message: "At least one audio URL (SoundCloud, Mixcloud, or Audio) is required"
});

// Error logging middleware
function logError(endpoint: string, error: any, req?: any) {
  console.error(`[ERROR] ${endpoint}:`, {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    params: req?.params,
    query: req?.query,
    body: req?.body,
    timestamp: new Date().toISOString()
  });
}

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
      logError('GET /api/stations', error, req);
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
      logError('GET /api/stations/:id', error, req);
      res.status(500).json({ error: 'Failed to fetch station' });
    }
  });
  
  app.post('/api/stations', async (req, res) => {
    try {
      const validatedData = insertStationSchema.parse(req.body);
      const station = await storage.createStation(validatedData);
      res.status(201).json(station);
    } catch (error) {
      logError('POST /api/stations', error, req);
      res.status(400).json({ error: 'Invalid station data' });
    }
  });
  
  // Shows API
  app.get('/api/shows', async (req, res) => {
    try {
      const shows = await storage.getAllShows();
      res.json(shows);
    } catch (error) {
      logError('GET /api/shows', error, req);
      res.status(500).json({ error: 'Failed to fetch shows' });
    }
  });
  
  app.get('/api/shows/featured', async (req, res) => {
    try {
      const shows = await storage.getFeaturedShows();
      res.json(shows);
    } catch (error) {
      logError('GET /api/shows/featured', error, req);
      res.status(500).json({ error: 'Failed to fetch featured shows' });
    }
  });
  
  app.get('/api/shows/live', async (req, res) => {
    try {
      const shows = await storage.getLiveShows();
      res.json(shows);
    } catch (error) {
      logError('GET /api/shows/live', error, req);
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

  // Albums of the Month API
  app.get('/api/albums', (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    
    // Real album data - no mock or placeholder content
    const allAlbums = [
      {
        id: "1",
        title: "Kind of Blue",
        artist: "Miles Davis",
        coverUrl: "",
        description: "The quintessential jazz album that changed music forever.",
        genre: ["Jazz", "Modal Jazz"],
        releaseYear: 1959,
        spotifyUrl: "https://open.spotify.com/album/1weenld61qoidwYuZ1GESA",
        featured: true,
        month: "January",
        year: 2025
      },
      {
        id: "2", 
        title: "The Velvet Underground & Nico",
        artist: "The Velvet Underground",
        coverUrl: "",
        description: "The album with the banana that launched a thousand art rock bands.",
        genre: ["Art Rock", "Experimental"],
        releaseYear: 1967,
        spotifyUrl: "https://open.spotify.com/album/4xwx0x7k6c5VuThz5qVqmV",
        featured: true,
        month: "January", 
        year: 2025
      },
      {
        id: "3",
        title: "Love Deluxe",
        artist: "Sade",
        coverUrl: "",
        description: "Smooth sophistication meets emotional depth in this timeless classic.",
        genre: ["R&B", "Soul"],
        releaseYear: 1992,
        spotifyUrl: "https://open.spotify.com/album/5th5BJGOc9RdyYKS9Kgm3A",
        featured: true,
        month: "January",
        year: 2025
      },
      {
        id: "4",
        title: "OK Computer", 
        artist: "Radiohead",
        coverUrl: "",
        description: "Prophetic and haunting - the album that predicted our digital future.",
        genre: ["Alternative Rock", "Electronic"],
        releaseYear: 1997,
        spotifyUrl: "https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE",
        featured: true,
        month: "January",
        year: 2025
      }
    ];
    
    const albums = allAlbums.slice(offset, offset + limit);
    const total = allAlbums.length;
    
    res.json({
      albums,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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

  // Community Submissions API (recent submissions regardless of approval status)
  app.get('/api/dj-submissions/community', async (req, res) => {
    try {
      const submissions = await storage.getAllDjSubmissions();
      const recentSubmissions = submissions
        .sort((a, b) => {
          const aTime = new Date(a.submittedAt!).getTime();
          const bTime = new Date(b.submittedAt!).getTime();
          return bTime - aTime;
        })
        .slice(0, 8); // Get 8 most recent submissions

      // Enrich submissions with metadata for thumbnails and dynamic titles
      const enrichedSubmissions = await Promise.all(
        recentSubmissions.map(async (submission) => {
          let thumbnail = null;
          let dynamicTitle = null;
          let dynamicArtist = null;
          
          // Only process SoundCloud URLs for metadata enrichment
          if (submission.soundcloudUrl) {
            try {
              // For SoundCloud, call oEmbed API directly for shortened URLs
              if (submission.soundcloudUrl.includes('soundcloud.com')) {
                const response = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(submission.soundcloudUrl)}`);
                if (response.ok) {
                  const data = await response.json();
                  
                  // Parse artist and title from the title field
                  const titleParts = data.title.split(' by ');
                  dynamicTitle = titleParts[0];
                  dynamicArtist = titleParts[1] || data.author_name;
                  thumbnail = data.thumbnail_url;
                  
                  console.log(`[soundcloud] Community submission oEmbed success: ${dynamicTitle} by ${dynamicArtist}`);
                } else {
                  console.log(`[soundcloud] Community submission oEmbed failed for ${submission.soundcloudUrl}: ${response.status}`);
                }
              }
            } catch (error) {
              console.log(`Failed to fetch SoundCloud metadata for community submission ${submission.id}:`, error);
            }
          }
          
          return {
            ...submission,
            thumbnail,
            dynamicTitle,
            dynamicArtist
          };
        })
      );

      res.json(enrichedSubmissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch community submissions' });
    }
  });

  // Featured DJ Submissions API (approved submissions for homepage)
  app.get('/api/dj-submissions/featured', async (req, res) => {
    try {
      const submissions = await storage.getAllDjSubmissions();
      const approvedSubmissions = submissions
        .filter(submission => submission.status === 'approved')
        .sort((a, b) => {
          // Sort by reviewedAt (newest first), then by submittedAt as fallback
          const aTime = a.reviewedAt ? new Date(a.reviewedAt).getTime() : new Date(a.submittedAt!).getTime();
          const bTime = b.reviewedAt ? new Date(b.reviewedAt).getTime() : new Date(b.submittedAt!).getTime();
          return bTime - aTime;
        })
        .slice(0, 4); // Get top 4 for homepage

      // Enrich submissions with metadata for thumbnails and dynamic titles
      const enrichedSubmissions = await Promise.all(
        approvedSubmissions.map(async (submission) => {
          let thumbnail = null;
          let dynamicTitle = null;
          let dynamicArtist = null;
          
          // Only process SoundCloud URLs for metadata enrichment
          if (submission.soundcloudUrl) {
            try {
              // For SoundCloud, call oEmbed API directly for shortened URLs
              if (submission.soundcloudUrl.includes('soundcloud.com')) {
                const response = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(submission.soundcloudUrl)}`);
                if (response.ok) {
                  const data = await response.json();
                  
                  // Parse artist and title from the title field
                  const titleParts = data.title.split(' by ');
                  dynamicTitle = titleParts[0];
                  dynamicArtist = titleParts[1] || data.author_name;
                  thumbnail = data.thumbnail_url;
                  
                  console.log(`[soundcloud] Direct oEmbed success: ${dynamicTitle} by ${dynamicArtist}`);
                } else {
                  console.log(`[soundcloud] Direct oEmbed failed for ${submission.soundcloudUrl}: ${response.status}`);
                }
              } else {
                // Fallback to the metadata service for other platforms
                const metadata = await metadataService.fetchMetadata(submission.soundcloudUrl);
                if (metadata?.imageUrl) {
                  thumbnail = metadata.imageUrl;
                }
                if (metadata?.title) {
                  dynamicTitle = metadata.title;
                }
                if (metadata?.artist) {
                  dynamicArtist = metadata.artist;
                }
              }
            } catch (error) {
              console.log(`Failed to fetch SoundCloud metadata for submission ${submission.id}:`, error);
            }
          }
          
          return {
            ...submission,
            thumbnail,
            dynamicTitle,
            dynamicArtist
          };
        })
      );

      res.json(enrichedSubmissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured DJ submissions' });
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

  // Metadata enrichment endpoint
  app.get('/api/metadata/enrich', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
      }
      
      const metadata = await metadataService.fetchMetadata(url);
      if (!metadata) {
        return res.status(404).json({ error: 'Could not fetch metadata for URL' });
      }
      
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  app.post('/api/dj-submissions', async (req, res) => {
    try {
      console.log('POST /api/dj-submissions - Received body:', JSON.stringify(req.body, null, 2));
      
      // Validate request body against schema
      const validatedData = insertDjSubmissionSchema.parse(req.body);
      console.log('POST /api/dj-submissions - Validated data:', JSON.stringify(validatedData, null, 2));
      
      // Create submission with "pending" status
      const submission = await storage.createDjSubmission(validatedData);
      console.log('POST /api/dj-submissions - Created submission:', JSON.stringify(submission, null, 2));
      
      // ALWAYS create a mix submission for the community section when someone submits a mix
      if (validatedData.demoMixTitle && (validatedData.soundcloudUrl || validatedData.mixcloudUrl || validatedData.audiocomUrl || validatedData.otherUrl)) {
        const mixSubmissionData = {
          name: validatedData.djName,
          title: validatedData.demoMixTitle,
          genre: validatedData.primaryGenre,
          about: validatedData.demoMixDescription || 'No description provided',
          soundcloudUrl: validatedData.soundcloudUrl || '',
          mixcloudUrl: validatedData.mixcloudUrl || '',
          audioUrl: validatedData.audiocomUrl || validatedData.otherUrl || ''
        };
        
        const mixSubmission = mixStorage.submitMix(mixSubmissionData);
        console.log('POST /api/dj-submissions - Also created mix submission:', mixSubmission);
      }
      
      // Note: WebSocket broadcasting could be added later for real-time updates
      
      res.status(201).json({
        success: true,
        submission,
        message: 'Mix submitted successfully! Your submission is now pending review.'
      });
    } catch (error: any) {
      console.error('POST /api/dj-submissions - Error:', error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid submission data',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to submit mix. Please try again.',
        details: error?.message || 'Unknown error'
      });
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

  // Mix Submission API Routes (Persistent JSON Storage)
  app.post('/api/submitMix', async (req, res) => {
    try {
      console.log('POST /api/submitMix - Received body:', JSON.stringify(req.body, null, 2));
      
      // Validate request body against schema
      const validatedData = mixSubmissionSchema.parse(req.body);
      console.log('POST /api/submitMix - Validated data:', JSON.stringify(validatedData, null, 2));
      
      // Create submission with "pending" status using persistent storage
      const submission = mixStorage.submitMix(validatedData);
      console.log('POST /api/submitMix - Created submission:', JSON.stringify(submission, null, 2));
      
      res.status(201).json({
        success: true,
        submission,
        message: 'Mix submitted successfully! Your submission is now pending review.'
      });
    } catch (error: any) {
      console.error('POST /api/submitMix - Error:', error);
      logError('POST /api/submitMix', error, req);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid submission data',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to submit mix. Please try again.',
        details: error?.message || 'Unknown error'
      });
    }
  });

  app.get('/api/mixes', async (req, res) => {
    try {
      const { featured, genre, community } = req.query;
      let status: 'approved' | 'featured' | undefined;
      
      if (community === 'true') {
        // For community section, get recent submissions regardless of status
        const allSubmissions = mixStorage.getAllSubmissions();
        const recentMixes = allSubmissions.slice(0, 10); // Show last 10 submissions
        console.log(`GET /api/mixes - Found ${recentMixes.length} community mixes`);
        return res.json(recentMixes);
      }
      
      // Only return approved or featured mixes for main sections
      if (featured === 'true') {
        status = 'featured';
      } else {
        status = 'approved';
      }
      
      const mixes = mixStorage.getMixes(status, genre as string);
      
      console.log(`GET /api/mixes - Found ${mixes.length} mixes with status: ${status}, genre: ${genre}`);
      res.json(mixes);
    } catch (error: any) {
      console.error('GET /api/mixes - Error:', error);
      logError('GET /api/mixes', error, req);
      res.status(500).json({ error: 'Failed to fetch mixes' });
    }
  });

  app.post('/api/approveMix', async (req, res) => {
    try {
      const { submissionId, status, approvedBy } = req.body;
      
      if (!submissionId || !status || !approvedBy) {
        return res.status(400).json({ 
          error: 'submissionId, status, and approvedBy are required' 
        });
      }
      
      if (!['approved', 'featured'].includes(status)) {
        return res.status(400).json({ 
          error: 'Status must be either "approved" or "featured"' 
        });
      }
      
      const approvedMix = mixStorage.approveMix(submissionId, status, approvedBy);
      
      if (!approvedMix) {
        return res.status(404).json({ error: 'Mix submission not found' });
      }
      
      console.log(`Mix ${submissionId} approved with status: ${status} by ${approvedBy}`);
      res.json({
        success: true,
        mix: approvedMix,
        message: `Mix ${status} successfully!`
      });
    } catch (error: any) {
      console.error('POST /api/approveMix - Error:', error);
      logError('POST /api/approveMix', error, req);
      res.status(500).json({ 
        error: 'Failed to approve mix',
        details: error?.message || 'Unknown error'
      });
    }
  });

  // Mix submission POST endpoint for frontend form
  app.post('/api/mix-submissions', async (req, res) => {
    try {
      console.log('POST /api/mix-submissions - Received body:', JSON.stringify(req.body, null, 2));
      
      // Submit to mix storage directly
      const mixSubmission = mixStorage.submitMix(req.body);
      console.log('POST /api/mix-submissions - Created mix submission:', mixSubmission);
      
      res.status(201).json({
        success: true,
        submission: mixSubmission,
        message: 'Mix submitted successfully! Your submission is now pending review.'
      });
    } catch (error: any) {
      console.error('POST /api/mix-submissions - Error:', error);
      res.status(500).json({ 
        error: 'Failed to submit mix. Please try again.',
        details: error?.message || 'Unknown error'
      });
    }
  });

  // Admin endpoint to view all mix submissions
  app.get('/api/admin/mix-submissions', async (req, res) => {
    try {
      const submissions = mixStorage.getAllSubmissions();
      res.json(submissions);
    } catch (error: any) {
      console.error('GET /api/admin/mix-submissions - Error:', error);
      logError('GET /api/admin/mix-submissions', error, req);
      res.status(500).json({ error: 'Failed to fetch mix submissions' });
    }
  });

  // Admin endpoint to delete a mix submission
  app.delete('/api/admin/mix-submissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = mixStorage.deleteSubmission(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Mix submission not found' });
      }
      
      console.log(`Admin deleted mix submission ${id}`);
      res.json({
        success: true,
        message: `Mix submission ${id} deleted successfully`
      });
    } catch (error: any) {
      console.error('DELETE /api/admin/mix-submissions/:id - Error:', error);
      logError('DELETE /api/admin/mix-submissions/:id', error, req);
      res.status(500).json({ 
        error: 'Failed to delete mix submission',
        details: error?.message || 'Unknown error'
      });
    }
  });

  // Resident Applications API
  app.get('/api/resident-applications', async (req, res) => {
    try {
      const applications = await storage.getAllResidentApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resident applications' });
    }
  });

  app.get('/api/resident-applications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getResidentApplication(id);
      if (!application) {
        return res.status(404).json({ error: 'Resident application not found' });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resident application' });
    }
  });

  app.post('/api/resident-applications', async (req, res) => {
    try {
      console.log('POST /api/resident-applications - Received body:', JSON.stringify(req.body, null, 2));
      
      const validatedData = insertResidentApplicationSchema.parse(req.body);
      const application = await storage.createResidentApplication(validatedData);
      
      console.log('POST /api/resident-applications - Created application:', JSON.stringify(application, null, 2));
      
      // ALWAYS create a mix submission when resident applies with a mix sample
      if (validatedData.mixSampleUrl) {
        const mixSubmissionData = {
          name: validatedData.djName,
          title: `${validatedData.djName} - Resident Application Sample`,
          genre: validatedData.preferredGenres.split(',')[0].trim(), // Use first genre
          about: `Resident application sample from ${validatedData.djName}. Show concept: ${validatedData.showConcept.substring(0, 100)}...`,
          audioUrl: validatedData.mixSampleUrl
        };
        
        const mixSubmission = mixStorage.submitMix(mixSubmissionData);
        console.log('POST /api/resident-applications - Also created mix submission:', mixSubmission);
      }
      
      res.status(201).json({
        success: true,
        application,
        message: 'Resident application submitted successfully! We\'ll review your application and get back to you soon.'
      });
    } catch (error: any) {
      console.error('POST /api/resident-applications - Error:', error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid resident application data',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to submit resident application. Please try again.',
        details: error?.message || 'Unknown error'
      });
    }
  });

  app.patch('/api/resident-applications/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewedBy, notes } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const application = await storage.updateResidentApplicationStatus(id, status, reviewedBy, notes);
      if (!application) {
        return res.status(404).json({ error: 'Resident application not found' });
      }
      
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update resident application status' });
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
          const submission = await storage.getZineSubmission(workflow.submissionId || 1);
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

  // Mix Upload API
  app.get('/api/mix-uploads', async (req, res) => {
    try {
      const uploads = await storage.getAllMixUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mix uploads' });
    }
  });

  app.get('/api/mix-uploads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.getMixUpload(id);
      if (!upload) {
        return res.status(404).json({ error: 'Mix upload not found' });
      }
      res.json(upload);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mix upload' });
    }
  });

  app.post('/api/mix-uploads', async (req, res) => {
    try {
      const validatedData = insertMixUploadSchema.parse(req.body);
      const upload = await storage.createMixUpload(validatedData);
      res.status(201).json(upload);
    } catch (error) {
      res.status(400).json({ error: 'Invalid mix upload data' });
    }
  });

  app.patch('/api/mix-uploads/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isLive, isFeatured } = req.body;
      
      const upload = await storage.updateMixUploadStatus(id, isLive, isFeatured);
      if (!upload) {
        return res.status(404).json({ error: 'Mix upload not found' });
      }
      
      res.json(upload);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update mix upload status' });
    }
  });

  // Mix Tracklist API
  app.get('/api/mix-uploads/:mixId/tracklist', async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const tracklist = await storage.getMixTracklist(mixId);
      res.json(tracklist);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tracklist' });
    }
  });

  app.post('/api/mix-uploads/:mixId/tracklist', async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const validatedData = insertMixTracklistSchema.parse({ ...req.body, mixId });
      const track = await storage.createMixTrack(validatedData);
      res.status(201).json(track);
    } catch (error) {
      res.status(400).json({ error: 'Invalid track data' });
    }
  });

  app.get('/api/mix-uploads/:mixId/current-track', async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const currentTime = parseInt(req.query.time as string) || 0;
      const track = await storage.getCurrentTrackByTime(mixId, currentTime);
      res.json(track || null);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current track' });
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

  // Episode routes
  app.get('/api/episodes', async (req, res) => {
    try {
      const episodes = await storage.getAllEpisodes();
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episodes' });
    }
  });

  app.get('/api/episodes/featured', async (req, res) => {
    try {
      const episodes = await storage.getFeaturedEpisodes();
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured episodes' });
    }
  });

  app.get('/api/episodes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const episode = await storage.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      res.json(episode);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episode' });
    }
  });

  app.post('/api/episodes', async (req, res) => {
    try {
      const validatedData = insertEpisodeSchema.parse(req.body);
      const episode = await storage.createEpisode(validatedData);
      res.status(201).json(episode);
    } catch (error) {
      res.status(400).json({ error: 'Invalid episode data' });
    }
  });

  app.get('/api/episodes/host/:hostName', async (req, res) => {
    try {
      const hostName = req.params.hostName;
      const episodes = await storage.getEpisodesByHost(hostName);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episodes by host' });
    }
  });

  app.get('/api/episodes/series/:seriesTitle', async (req, res) => {
    try {
      const seriesTitle = req.params.seriesTitle;
      const episodes = await storage.getEpisodesBySeries(seriesTitle);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episodes by series' });
    }
  });

  // Episode Tracklist routes
  app.get('/api/episode-tracklist/:episodeId', async (req, res) => {
    try {
      const episodeId = parseInt(req.params.episodeId);
      const tracks = await storage.getEpisodeTracklist(episodeId);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch episode tracklist' });
    }
  });

  app.post('/api/episode-tracklist', async (req, res) => {
    try {
      const validatedData = insertEpisodeTracklistSchema.parse(req.body);
      const track = await storage.createEpisodeTrack(validatedData);
      res.status(201).json(track);
    } catch (error) {
      res.status(400).json({ error: 'Invalid episode track data' });
    }
  });

  app.get('/api/episode-tracklist/:episodeId/current-track', async (req, res) => {
    try {
      const episodeId = parseInt(req.params.episodeId);
      const currentTime = parseInt(req.query.time as string) || 0;
      const track = await storage.getCurrentEpisodeTrackByTime(episodeId, currentTime);
      res.json(track || null);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current episode track' });
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
  
  // Radio Playlist API
  app.get('/api/radio/playlist', async (req, res) => {
    try {
      const tracks = await storage.getActiveRadioPlaylist();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch radio playlist' });
    }
  });

  app.get('/api/radio/playlist/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const track = await storage.getRadioPlaylistItem(id);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch track' });
    }
  });

  app.post('/api/radio/playlist/:id/play', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementPlayCount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update play count' });
    }
  });

  app.post('/api/radio/playlist', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertRadioPlaylistSchema.parse(req.body);
      const newTrack = await storage.createRadioPlaylistItem(validatedData);
      res.status(201).json(newTrack);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create track' });
    }
  });

  // Track metadata routes for Last.fm integration
  app.get('/api/track-metadata/:filename', async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log(`[api] Fetching metadata for: ${filename}`);
      
      const metadata = await trackMetadataService.getOrFetchTrackInfo(filename);
      console.log(`[api] Successfully fetched metadata:`, metadata);
      res.json(metadata);
    } catch (error) {
      console.error('[api] Error fetching track metadata:', error);
      console.error('[api] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: 'Failed to fetch track metadata', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Force refresh track metadata (for testing/debugging)
  app.post('/api/track-metadata/:filename/refresh', async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log(`[api] Force refreshing metadata for: ${filename}`);
      
      // Clear cached metadata first
      await storage.deleteTrackMetadata(filename);
      
      // Fetch fresh metadata
      const metadata = await trackMetadataService.getOrFetchTrackInfo(filename);
      console.log(`[api] Successfully refreshed metadata:`, metadata);
      res.json(metadata);
    } catch (error) {
      console.error('[api] Error refreshing track metadata:', error);
      res.status(500).json({ message: 'Failed to refresh track metadata', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // College Radio System Routes
  app.get('/api/radio/program-info', async (req, res) => {
    try {
      const radioService = (await import('./radioService')).radioService;
      const programInfo = await radioService.getCurrentProgramInfo();
      res.json(programInfo);
    } catch (error) {
      console.error('[api] Error fetching program info:', error);
      res.status(500).json({ message: 'Failed to fetch program info' });
    }
  });

  app.get('/api/radio/rotation/pending', async (req, res) => {
    try {
      const tracks = Array.from((storage as any).radioRotationStore?.values() || [])
        .filter((track: any) => track.approvalStatus === 'pending');
      res.json(tracks);
    } catch (error) {
      console.error('[api] Error fetching pending tracks:', error);
      res.status(500).json({ message: 'Failed to fetch pending tracks' });
    }
  });

  app.post('/api/radio/rotation/:trackId/approve', async (req, res) => {
    try {
      const { trackId } = req.params;
      const { approvedBy } = req.body;
      
      const radioService = (await import('./radioService')).radioService;
      await radioService.approveTrackForRotation(trackId, approvedBy);
      
      res.json({ message: 'Track approved for rotation' });
    } catch (error) {
      console.error('[api] Error approving track:', error);
      res.status(500).json({ message: 'Failed to approve track' });
    }
  });

  app.post('/api/radio/switch-to-live', async (req, res) => {
    try {
      const { showId } = req.body;
      const radioService = (await import('./radioService')).radioService;
      await radioService.switchToLiveMode(showId);
      res.json({ message: 'Switched to live mode' });
    } catch (error) {
      console.error('[api] Error switching to live mode:', error);
      res.status(500).json({ message: 'Failed to switch to live mode' });
    }
  });

  app.post('/api/radio/switch-to-auto', async (req, res) => {
    try {
      const radioService = (await import('./radioService')).radioService;
      await radioService.switchToAutoMode();
      res.json({ message: 'Switched to auto rotation' });
    } catch (error) {
      console.error('[api] Error switching to auto mode:', error);
      res.status(500).json({ message: 'Failed to switch to auto mode' });
    }
  });

  // College Radio Track Submission
  app.post('/api/radio/submit-track', async (req, res) => {
    try {
      const { title, artist, description, genre, sourceType, soundcloudUrl } = req.body;
      
      // Generate unique track ID
      const trackId = `${sourceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const trackData = {
        trackId,
        sourceType,
        title,
        artist,
        originalMetadata: {
          description,
          genre,
          soundcloudUrl: sourceType === 'soundcloud' ? soundcloudUrl : undefined,
          submittedAt: new Date(),
        }
      };

      const radioService = (await import('./radioService')).radioService;
      await radioService.submitTrackForRotation(trackData);
      
      res.json({ 
        message: 'Track submitted successfully',
        trackId,
        status: 'pending_approval'
      });
    } catch (error) {
      console.error('[api] Error submitting track:', error);
      res.status(500).json({ message: 'Failed to submit track for rotation' });
    }
  });

  // Force refresh metadata (admin endpoint)
  app.post('/api/track-metadata/:filename/refresh', async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log(`[api] Force refreshing metadata for: ${filename}`);
      
      const metadata = await trackMetadataService.refreshTrackMetadata(filename);
      res.json(metadata);
    } catch (error) {
      console.error('Error refreshing track metadata:', error);
      res.status(500).json({ message: 'Failed to refresh track metadata' });
    }
  });

  // Song Submission Routes
  app.get('/api/song-submissions', async (req, res) => {
    try {
      const submissions = await storage.getAllSongSubmissions();
      res.json(submissions);
    } catch (error) {
      logError('GET /api/song-submissions', error, req);
      res.status(500).json({ error: 'Failed to fetch song submissions' });
    }
  });

  app.get('/api/song-submissions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getSongSubmission(id);
      if (!submission) {
        return res.status(404).json({ error: 'Song submission not found' });
      }
      res.json(submission);
    } catch (error) {
      logError('GET /api/song-submissions/:id', error, req);
      res.status(500).json({ error: 'Failed to fetch song submission' });
    }
  });

  app.get('/api/song-submissions/approved', async (req, res) => {
    try {
      const submissions = await storage.getApprovedSongSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Failed to fetch approved submissions:', error);
      res.status(500).json({ error: 'Failed to fetch approved song submissions' });
    }
  });

  // Stream status proxy endpoint to solve CORS issues
  app.get('/api/stream/status', async (req, res) => {
    try {
      const response = await fetch('http://24.199.109.18:8000/status-json.xsl');
      const data = await response.json();
      
      // Check if there are any active streams
      const isLive = data.icestats.source && (
        Array.isArray(data.icestats.source) ? data.icestats.source.length > 0 : true
      );
      
      res.json({
        isLive,
        serverInfo: data.icestats,
        streamCount: Array.isArray(data.icestats.source) ? data.icestats.source.length : (data.icestats.source ? 1 : 0)
      });
    } catch (error) {
      console.log('Stream server offline or unreachable');
      res.json({
        isLive: false,
        serverInfo: null,
        streamCount: 0
      });
    }
  });

  app.post('/api/song-submissions', async (req, res) => {
    try {
      const validatedData = insertSongSubmissionSchema.parse(req.body);
      
      // Import metadata service and fetch track data
      const { metadataService } = await import('./metadataService');
      const metadata = await metadataService.fetchMetadata(validatedData.platformUrl);
      
      // Create submission with enhanced metadata
      const enhancedSubmission = {
        ...validatedData,
        trackId: metadata?.trackId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        themeTag: validatedData.requestedDate === 'none' ? null : validatedData.requestedDate,
      };
      
      const submission = await storage.createSongSubmission(enhancedSubmission);
      
      // Log the successful processing for demo
      if (metadata) {
        console.log(`[song-submission] Successfully processed: "${metadata.title}" by ${metadata.artist} from ${metadata.platform}`);
      }
      
      res.status(201).json(submission);
    } catch (error) {
      logError('POST /api/song-submissions', error, req);
      console.error('[song-submission] Error:', error);
      res.status(400).json({ error: 'Invalid submission data' });
    }
  });

  app.patch('/api/song-submissions/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, approvedBy, notes } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const submission = await storage.updateSongSubmissionStatus(id, status, approvedBy, notes);
      if (!submission) {
        return res.status(404).json({ error: 'Song submission not found' });
      }
      
      // Auto-add approved songs to queue
      if (status === 'approved') {
        await storage.addToQueue(id);
        console.log(`[queue] Added to queue: ${submission.songTitle} by ${submission.artistName}`);
      }
      
      console.log(`[song-submission] Status updated: ${submission.songTitle} by ${submission.artistName} -> ${status}`);
      res.json(submission);
    } catch (error) {
      logError('PATCH /api/song-submissions/:id/status', error, req);
      console.error('[song-submission] Failed to update status:', error);
      res.status(500).json({ error: 'Failed to update song submission status' });
    }
  });

  // Admin Queue Management API
  app.get('/api/admin/queue', async (req, res) => {
    try {
      const queuedSongs = await storage.getQueuedSongs();
      res.json(queuedSongs);
    } catch (error) {
      logError('GET /api/admin/queue', error, req);
      console.error('[queue] Failed to fetch queue:', error);
      res.status(500).json({ error: 'Failed to fetch queue' });
    }
  });

  app.get('/api/admin/currently-playing', async (req, res) => {
    try {
      const currentlyPlaying = await storage.getCurrentlyPlaying();
      res.json(currentlyPlaying);
    } catch (error) {
      logError('GET /api/admin/currently-playing', error, req);
      console.error('[queue] Failed to fetch currently playing:', error);
      res.status(500).json({ error: 'Failed to fetch currently playing' });
    }
  });

  app.patch('/api/admin/queue/:id/playback', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action } = req.body;
      
      let result;
      switch (action) {
        case 'play':
          result = await storage.setCurrentlyPlaying(id);
          break;
        case 'played':
          result = await storage.updatePlaybackStatus(id, 'played');
          break;
        case 'skip':
          result = await storage.updatePlaybackStatus(id, 'played');
          break;
        default:
          return res.status(400).json({ error: 'Invalid playback action' });
      }
      
      if (!result) {
        return res.status(404).json({ error: 'Song not found in queue' });
      }
      
      console.log(`[queue] Playback action: ${action} for "${result.songTitle}" by ${result.artistName}`);
      res.json(result);
    } catch (error) {
      logError('PATCH /api/admin/queue/:id/playback', error, req);
      console.error('[queue] Failed to update playback:', error);
      res.status(500).json({ error: 'Failed to update playback status' });
    }
  });

  app.patch('/api/admin/queue/:id/position', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPosition } = req.body;
      
      if (!newPosition || newPosition < 1) {
        return res.status(400).json({ error: 'Invalid position' });
      }
      
      const result = await storage.updateQueuePosition(id, newPosition);
      if (!result) {
        return res.status(404).json({ error: 'Song not found in queue' });
      }
      
      console.log(`[queue] Position updated: "${result.songTitle}" moved to position ${newPosition}`);
      res.json(result);
    } catch (error) {
      logError('PATCH /api/admin/queue/:id/position', error, req);
      console.error('[queue] Failed to update position:', error);
      res.status(500).json({ error: 'Failed to update queue position' });
    }
  });

  // Simple streaming endpoints
  app.get('/api/stream/state', async (req, res) => {
    try {
      const { simpleStreamingService } = await import('./simpleStreamingService');
      const state = simpleStreamingService.getState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream state' });
    }
  });

  app.post('/api/stream/play', async (req, res) => {
    try {
      const { simpleStreamingService } = await import('./simpleStreamingService');
      simpleStreamingService.play();
      res.json({ message: 'Playing' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to play' });
    }
  });

  app.post('/api/stream/pause', async (req, res) => {
    try {
      const { simpleStreamingService } = await import('./simpleStreamingService');
      simpleStreamingService.pause();
      res.json({ message: 'Paused' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to pause' });
    }
  });

  app.post('/api/stream/next', async (req, res) => {
    try {
      const { simpleStreamingService } = await import('./simpleStreamingService');
      simpleStreamingService.playNext();
      res.json({ message: 'Playing next track' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to skip track' });
    }
  });

  app.post('/api/stream/set-now-playing', async (req, res) => {
    try {
      const { title, artist, artworkUrl } = req.body;
      const { simpleStreamingService } = await import('./simpleStreamingService');
      simpleStreamingService.setNowPlaying(title, artist, artworkUrl);
      res.json({ message: 'Now playing updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update now playing' });
    }
  });

  // Real radio stream state endpoint (legacy)
  app.get('/api/radio/stream-state', async (req, res) => {
    try {
      const { simpleStreamingService } = await import('./simpleStreamingService');
      const state = simpleStreamingService.getState();
      
      // Convert to legacy format for existing frontend
      const legacyState = {
        current: state.currentTrack ? {
          id: state.currentTrack.id,
          title: state.currentTrack.title,
          artist: state.currentTrack.artist,
          duration: state.currentTrack.duration,
          audioUrl: state.currentTrack.audioUrl,
          type: state.currentTrack.source === 'dj_mix' ? 'dj_mix' : 'spotify_track'
        } : null,
        progress: state.currentTime,
        isLive: state.isPlaying,
        volume: state.volume,
        listeners: state.listeners,
        recent: [],
        next: state.playlist[state.currentIndex + 1] || null
      };
      
      res.json(legacyState);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream state' });
    }
  });

  // Like current track (requires real user system)
  app.post('/api/radio/like', async (req, res) => {
    try {
      const { userId } = req.body; // This would come from authenticated session
      const { radioStreamService } = await import('./radioStreamService');
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const success = await radioStreamService.likeCurrentTrack(userId);
      if (success) {
        res.json({ message: 'Track liked successfully' });
      } else {
        res.status(400).json({ error: 'No track currently playing' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to like track' });
    }
  });

  // Admin controls for queue management
  app.post('/api/radio/skip', async (req, res) => {
    try {
      // In real app, verify admin authentication
      const { radioStreamService } = await import('./radioStreamService');
      radioStreamService.skipTrack();
      res.json({ message: 'Track skipped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to skip track' });
    }
  });

  app.get('/api/radio/queue', async (req, res) => {
    try {
      const { radioStreamService } = await import('./radioStreamService');
      const queue = radioStreamService.getQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get queue' });
    }
  });

  // Test metadata endpoint - demonstrate with the user's Spotify URL
  app.post('/api/test-metadata', async (req, res) => {
    try {
      const { url } = req.body;
      const { metadataService } = await import('./metadataService');
      const metadata = await metadataService.fetchMetadata(url);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  return httpServer;
}
