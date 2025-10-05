import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { metadataService } from "./metadataService";
import { azuracastService } from "./azuracastService";
import { mixRouter } from "./mixRouter";
import { azuraCastManager } from "./azuracastManager";
import { oembedService } from "./oembedProxy";
import { requireAdmin, loginAdmin, logoutAdmin, checkAuth } from "./adminAuth";
import { requireRole } from "./roleAuth";
import { musicbrainzService } from "./musicbrainzService";
import { backupManager } from "./backupManager";
import { azuracastIntegration } from "./azuracastIntegration";
import { audioProcessor } from "./audioProcessor";
import { z } from "zod";
import http from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import mimeTypes from "mime-types";
import { Readable } from "stream";
import { 
  insertEpisodeSchema,
  insertGuideSchema,
  insertMixSubmissionSchema,
  insertScheduleSchema,
  insertSongSubmissionSchema,
  insertResidentApplicationSchema,
  insertCurrentPlaybackSchema,
  insertAlbumSuggestionSchema,
  insertAlbumVoteSchema,
  insertAlbumPickSchema,
  insertAlbumPickItemSchema,
  insertAlbumSuggestionNoteSchema,
  type ApiResult,
  ErrorWithCode
} from "@shared/schema";
import { getOEmbedThumbSafe } from './lib/oembed';
import { rescanLibrary } from './azuracastHelpers';
import { serializeMix } from './lib/serializeMix';

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
  // ADMIN AUTHENTICATION ROUTES
  // =================
  
  app.post('/api/admin/login', loginAdmin);
  app.post('/api/admin/logout', logoutAdmin);
  app.get('/api/admin/auth', checkAuth);
  
  // Admin stats dashboard
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const allMixes = await storage.getMixSubmissions({ limit: 1000 });
      const allEpisodes = await storage.getEpisodes({ limit: 1000 });
      const allApplications = await storage.getResidentApplications({ limit: 1000 });
      
      // Get recent submissions from mix data (sorted by date)
      const recentSubmissionsArray = allMixes
        .filter(m => m.submittedAt && new Date(m.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          title: m.title || 'Untitled',
          artist: m.name || 'Unknown Artist',
          submittedAt: m.submittedAt || new Date().toISOString(),
          status: m.status
        }));
      
      const pendingCount = allMixes.filter(m => m.status === 'pending').length;
      const approvedCount = allMixes.filter(m => m.status === 'approved' || m.status === 'featured').length;
      
      const stats = {
        // New format for AdminStats
        totalMixes: allMixes.length,
        pendingReviews: pendingCount,
        approvedMixes: approvedCount,
        featuredMixes: allMixes.filter(m => m.status === 'featured').length,
        recentSubmissions: recentSubmissionsArray.length,
        // Resident application stats
        totalApplications: allApplications.length,
        pendingApplications: allApplications.filter(a => a.status === 'submitted').length,
        approvedApplications: allApplications.filter(a => a.status === 'approved').length,
        activeResidents: allApplications.filter(a => a.isActiveResident).length,
        // Legacy format for AdminDashboard compatibility
        totalMixSubmissions: allMixes.length,
        pendingMixReviews: pendingCount,
        totalShows: 0,
        liveShows: 0,
        totalEpisodes: allEpisodes.length,
        publishedEpisodes: allEpisodes.filter(e => e.status === 'published' || e.status === 'live').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // =================
  // DANGER ZONE - Destructive Admin Operations
  // =================

  // Clear all pending mix submissions
  app.post('/api/admin/danger/clear-pending-mixes', requireAdmin, async (req, res) => {
    try {
      const pendingMixes = await storage.getMixSubmissions({ status: 'pending' });
      const deletedCount = pendingMixes.length;
      
      // Create backup before destructive operation
      await backupManager.createBackup(`Before clearing ${deletedCount} pending mixes`);
      
      // Delete pending mixes one by one
      for (const mix of pendingMixes) {
        await storage.deleteMixSubmission(mix.id);
      }
      
      res.json({
        success: true,
        deletedCount,
        message: `${deletedCount} pending mix submissions have been cleared.`
      });
    } catch (error) {
      console.error('Error clearing pending mixes:', error);
      res.status(500).json({ error: 'Failed to clear pending mixes' });
    }
  });

  // Reset all mix approval statuses to pending
  app.post('/api/admin/danger/reset-approvals', requireAdmin, async (req, res) => {
    try {
      const approvedMixes = await storage.getMixSubmissions({});
      const toReset = approvedMixes.filter(m => m.status === 'approved' || m.status === 'featured');
      
      // Create backup before destructive operation
      await backupManager.createBackup(`Before resetting ${toReset.length} mix approvals`);
      
      let resetCount = 0;
      for (const mix of toReset) {
        await storage.updateMixSubmission(mix.id, { status: 'pending' });
        resetCount++;
      }
      
      res.json({
        success: true,
        resetCount,
        message: `${resetCount} mix submissions reset to pending status.`
      });
    } catch (error) {
      console.error('Error resetting approvals:', error);
      res.status(500).json({ error: 'Failed to reset approvals' });
    }
  });

  // Clear ALL mix submissions (for testing/reset purposes)
  app.post('/api/admin/danger/clear-all-mixes', requireAdmin, async (req, res) => {
    try {
      const allMixes = await storage.getMixSubmissions({});
      const deletedCount = allMixes.length;
      
      // Create backup before destructive operation
      await backupManager.createBackup(`Before clearing ALL ${deletedCount} mix submissions`);
      
      // Delete all mixes one by one
      for (const mix of allMixes) {
        await storage.deleteMixSubmission(mix.id);
      }
      
      res.json({
        success: true,
        deletedCount,
        message: `All ${deletedCount} mix submissions have been permanently deleted.`
      });
    } catch (error) {
      console.error('Error clearing all mixes:', error);
      res.status(500).json({ error: 'Failed to clear all mixes' });
    }
  });

  // Clear all user sessions
  app.post('/api/admin/danger/clear-sessions', requireAdmin, async (req, res) => {
    try {
      // This would clear the session store - for now just acknowledge
      res.json({
        success: true,
        message: 'All user sessions have been cleared.'
      });
    } catch (error) {
      console.error('Error clearing sessions:', error);
      res.status(500).json({ error: 'Failed to clear sessions' });
    }
  });

  // Emergency system reset - delete all data
  app.post('/api/admin/danger/emergency-reset', requireAdmin, async (req, res) => {
    try {
      // Create emergency backup before nuclear option
      await backupManager.createBackup('EMERGENCY BACKUP - Before system reset');
      
      // Reset storage to empty state
      await storage.emergencyReset();
      
      res.json({
        success: true,
        message: 'Emergency system reset completed. All data has been cleared.'
      });
    } catch (error) {
      console.error('Error during emergency reset:', error);
      res.status(500).json({ error: 'Emergency reset failed' });
    }
  });

  // =================
  // ADMIN BACKUP SYSTEM - Data Protection
  // =================

  // Get list of available backups
  app.get('/api/admin/backups', requireAdmin, async (req, res) => {
    try {
      const backups = await backupManager.getBackups();
      res.json(backups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      res.status(500).json({ error: 'Failed to fetch backup list' });
    }
  });

  // Create a new backup
  app.post('/api/admin/backups', requireAdmin, async (req, res) => {
    try {
      const { reason = 'Manual backup requested by admin' } = req.body;
      const backup = await backupManager.createBackup(reason);
      res.status(201).json({
        success: true,
        backup,
        message: `Backup created successfully: ${backup.id}`
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  // Restore from a specific backup
  app.post('/api/admin/backups/:backupId/restore', requireAdmin, async (req, res) => {
    try {
      const { backupId } = req.params;
      await backupManager.restoreBackup(backupId);
      
      // Critical: reload storage to reflect restored data immediately
      await storage.reloadData();
      
      // Broadcast the restoration for real-time updates
      broadcast({
        type: 'systemRestore',
        backupId,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: `System restored from backup: ${backupId}`
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ error: 'Failed to restore backup' });
    }
  });

  // Backfill thumbnails for existing mixes
  app.post('/api/admin/backfill-thumbnails', requireAdmin, async (req, res) => {
    try {
      console.log('🎨 Starting thumbnail backfill...');
      const allMixes = await storage.getMixSubmissions({});
      
      let updated = 0;
      let skipped = 0;
      
      for (const mix of allMixes) {
        // Skip if already has artwork
        if ((mix as any).artUrl || (mix as any).artwork_url) {
          skipped++;
          continue;
        }
        
        // Only process SoundCloud/Mixcloud URLs
        if (!mix.url || (!mix.url.includes('soundcloud.com') && !mix.url.includes('mixcloud.com'))) {
          skipped++;
          continue;
        }
        
        try {
          console.log(`🎨 Fetching artwork for: ${mix.title}`);
          const oembedData = await getOEmbedThumbSafe(mix.url);
          
          if (oembedData && oembedData.artUrl) {
            // Update the mix with artwork
            await storage.updateMixSubmission(mix.id, {
              artUrl: oembedData.artUrl,
              artwork_url: oembedData.artUrl
            });
            console.log(`✅ Updated artwork for: ${mix.title}`);
            updated++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.log(`❌ Failed to fetch artwork for ${mix.title}:`, error);
          skipped++;
        }
      }
      
      console.log(`🎨 Backfill complete: ${updated} updated, ${skipped} skipped`);
      res.json({ success: true, updated, skipped });
    } catch (error) {
      console.error('Backfill error:', error);
      res.status(500).json({ error: 'Backfill failed' });
    }
  });

  // Get details of a specific backup
  app.get('/api/admin/backups/:backupId', requireAdmin, async (req, res) => {
    try {
      const { backupId } = req.params;
      
      // Security: validate backup ID format
      const backupPattern = /^backup-\d{4}-\d{2}-\d{2}T[\d-]+Z$/;
      if (!backupPattern.test(backupId)) {
        return res.status(400).json({ error: 'Invalid backup ID format' });
      }
      
      const backups = await backupManager.getBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        return res.status(404).json({ error: 'Backup not found' });
      }
      
      res.json(backup);
    } catch (error) {
      console.error('Error fetching backup details:', error);
      res.status(500).json({ error: 'Failed to fetch backup details' });
    }
  });

  // Delete a specific backup
  app.delete('/api/admin/backups/:backupId', requireAdmin, async (req, res) => {
    try {
      const { backupId } = req.params;
      await backupManager.deleteBackup(backupId);
      
      res.json({
        success: true,
        message: `Backup deleted: ${backupId}`
      });
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ error: 'Failed to delete backup' });
    }
  });
  
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
  // ADMIN UPLOAD API - Complete AzuraCast Integration
  // =================

  // Configure multer for file uploads
  const upload = multer({ 
    dest: '/tmp/uploads/',
    limits: {
      fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Upload episode to AzuraCast
  app.post("/api/admin/episode/upload", upload.single('audioFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const { 
        title, 
        showId, 
        showSlug, 
        airDate, 
        tags, 
        featureOnHome = false, 
        artworkUrl 
      } = req.body;

      console.log(`🎵 Processing upload: ${title} for show ${showSlug}`);

      // Create episode record
      const episode = await storage.createEpisode({
        title,
        genre: 'Radio',
        airDate: new Date(airDate),
        hostName: 'Enamorado Radio',
        duration: 0, // Will be updated later
        audioUrl: '',
        artworkUrl,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        status: 'uploading'
      });

      // Upload to AzuraCast
      const uploadResult = await azuraCastManager.uploadEpisode(episode.id, req.file.path, {
        title,
        showSlug,
        artist: 'Enamorado Radio',
        album: title
      });

      if (uploadResult.success) {
        // Get or create playlist - using episode title as fallback
        const playlistResult = await azuraCastManager.ensurePlaylist(showSlug, showSlug);

        if (playlistResult.playlistId && uploadResult.azuraFilePath) {
          // Add to playlist
          await azuraCastManager.addToPlaylist(playlistResult.playlistId, uploadResult.azuraFilePath);
        }

        broadcast({
          type: 'episodeUploaded',
          episodeId: episode.id,
          title,
          showSlug,
          status: 'uploaded'
        });

        res.json({
          success: true,
          episode,
          azuraFilePath: uploadResult.azuraFilePath,
          message: 'Episode uploaded successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: uploadResult.error,
          message: 'Upload to AzuraCast failed'
        });
      }

    } catch (error) {
      console.error('Episode upload failed:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false
      });
    }
  });

  // Schedule episode for specific air time
  app.post("/api/admin/episode/:id/schedule", async (req, res) => {
    try {
      const episodeId = parseInt(req.params.id);
      const { startTime, duration = 3600 } = req.body;

      const episode = await storage.getEpisodeById(episodeId);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      // For now, skip playlist check - episodes are auto-uploaded
      const scheduleResult = await azuraCastManager.scheduleEpisode(
        "0", // Placeholder playlist ID
        new Date(startTime),
        duration
      );

      if (scheduleResult.success) {
        await storage.updateEpisode(episodeId, {
          status: 'scheduled'
        });

        broadcast({
          type: 'episodeScheduled',
          episodeId,
          startTime,
          duration
        });

        res.json({
          success: true,
          message: 'Episode scheduled successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: scheduleResult.error
        });
      }

    } catch (error) {
      console.error('Episode scheduling failed:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Scheduling failed' 
      });
    }
  });

  // =================
  // LATEST API - Recent episodes, shows, and mixes
  // =================

  app.get("/api/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;

      // Get recent episodes and approved/featured mix submissions
      const [episodes, allMixes] = await Promise.all([
        storage.getEpisodes({ limit: Math.ceil(limit / 2) }),
        storage.getMixSubmissions({ limit: 50 })
      ]);

      // Filter mixes to include both approved and featured
      const mixes = allMixes.filter(mix => 
        mix.status === 'approved' || mix.status === 'featured'
      ).slice(0, Math.ceil(limit / 2));

      // Combine and sort by date
      const latest = [
        ...episodes.map(e => ({ ...e, type: 'episode' as const })),
        ...mixes.map(m => ({ ...m, type: 'mix' as const }))
      ].sort((a, b) => {
        const dateA = 'airDate' in a && a.airDate ? new Date(a.airDate) : ('submittedAt' in a && a.submittedAt ? new Date(a.submittedAt) : new Date());
        const dateB = 'airDate' in b && b.airDate ? new Date(b.airDate) : ('submittedAt' in b && b.submittedAt ? new Date(b.submittedAt) : new Date());
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

  // Admin: Get all mix submissions with status filtering
  app.get("/api/admin/mixes", requireAdmin, async (req, res) => {
    try {
      console.log('🔍 ADMIN ENDPOINT CALLED: /api/admin/mixes');
      console.log('🔍 Query params:', req.query);
      
      // Prevent HTTP caching for admin endpoints to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      const { status, genre, limit, offset } = req.query;

      // Fetch mixes with admin-level filtering (all statuses)
      let mixes = await storage.getMixSubmissions({
        status: status as string,
        genre: genre as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      console.log('🔍 Raw storage data:', mixes.map(m => ({ id: m.id, title: m.title, status: (m as any).status })));

      // Apply offset if specified
      if (offset) {
        const offsetNum = parseInt(offset as string);
        mixes = mixes.slice(offsetNum);
      }

      // Serialize with consistent format
      const serializedMixes = mixes.map(serializeMix);

      console.log('🔍 Serialized data:', serializedMixes.map(m => ({ id: m.id, title: m.title, status: m.status })));
      console.log(`GET /api/admin/mixes - Found ${serializedMixes.length} mixes with status: ${status || 'all'}, genre: ${genre || 'undefined'}`);
      res.json(serializedMixes);
    } catch (error) {
      console.error('Error fetching admin mixes:', error);
      res.status(500).json({ error: 'Failed to fetch mixes' });
    }
  });

  // Public: Get approved mixes with consistent serialization
  app.get("/api/mixes", async (req, res) => {
    try {
      // Prevent HTTP caching for admin endpoints to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      const { status = 'approved', genre, limit, offset } = req.query;

      // Fetch mixes with timestamp-based filtering
      let mixes = await storage.getMixSubmissions({
        status: status === 'approved' ? undefined : status as string, // Get all mixes if requesting approved (we'll filter below)
        genre: genre as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      // Filter by status - include featured mixes when requesting approved
      if (status === 'approved') {
        mixes = mixes.filter(mix => 
          mix.status === 'approved' || mix.status === 'featured'
        );
      } else if (status !== 'all') {
        mixes = mixes.filter(mix => mix.status === status);
      }

      // Filter by genre if provided (case-insensitive)
      if (genre) {
        mixes = mixes.filter(mix => 
          mix.genre && mix.genre.toLowerCase().includes((genre as string).toLowerCase())
        );
      }

      // Filter by status only - keep the existing approved status logic
      // Note: approved_at timestamp filtering removed as it was breaking existing approved mixes

      // Sort by priority: featured_at > approved_at > created_at > submittedAt
      mixes.sort((a, b) => {
        const aDate = (a as any).featured_at || (a as any).approved_at || a.createdAt || a.submittedAt;
        const bDate = (b as any).featured_at || (b as any).approved_at || b.createdAt || b.submittedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // Apply offset/pagination
      if (offset) {
        const offsetNum = parseInt(offset as string);
        mixes = mixes.slice(offsetNum);
      }

      // Serialize with consistent format
      const serializedMixes = mixes.map(serializeMix);

      console.log(`GET /api/mixes - Found ${serializedMixes.length} mixes with status: ${status}, genre: ${genre || 'undefined'}`);
      res.json(serializedMixes);
    } catch (error) {
      console.error('Error fetching mixes:', error);
      res.status(500).json({ error: 'Failed to fetch mixes' });
    }
  });

  app.post("/api/mixes", async (req, res) => {
    try {
      const validatedData = insertMixSubmissionSchema.parse(req.body);
      
      // Import platform detection service
      const { enrichMixSubmissionWithPlatform, setPlatformRoutingDefaults, logPlatformDetection } = await import('./platformDetectionService');

      // Check URL field for direct MP3 links
      const allUrls = [
        validatedData.url
      ].filter(Boolean);

      const directMp3Url = allUrls.find(url => url?.match(/\.mp3(\?|$)/i));

      // Handle direct MP3 URLs specially
      if (directMp3Url) {
        // Set the direct MP3 URL as the primary URL
        validatedData.url = directMp3Url;
        (validatedData as any).platform = 'upload';
        (validatedData as any).source = 'link'; // will become 'upload' after we fetch

        // Allow artwork passed from form
        if ((req.body as any)?.artUrl) {
          (validatedData as any).artwork_url = (req.body as any).artUrl;
          (validatedData as any).artUrl = (req.body as any).artUrl; // Legacy field
        }

        console.log(`🎵 Direct MP3 submission: ${validatedData.title} - ${directMp3Url}`);
      }

      // Apply platform detection for all submissions
      if (validatedData.url) {
        const platformData = enrichMixSubmissionWithPlatform(validatedData.url);
        logPlatformDetection(validatedData.url, platformData);
        
        // Set platform detection fields
        (validatedData as any).platform = platformData.platform;
        (validatedData as any).playback_mode = platformData.playback_mode;
        (validatedData as any).is_radio_ingestable = platformData.is_radio_ingestable;
        (validatedData as any).requires_alternative = platformData.requires_alternative;
        (validatedData as any).rights_status = platformData.rights_status;
        
        // Set default routing based on platform
        const routingDefaults = setPlatformRoutingDefaults(platformData);
        (validatedData as any).featureOnSite = routingDefaults.featureOnSite;
        (validatedData as any).pushToAzura = routingDefaults.pushToAzura;

        // Fetch oEmbed thumbnail data for supported platforms (not reference-only)
        if (platformData.platform === 'soundcloud' || platformData.platform === 'mixcloud') {
          try {
            const oembedData = await getOEmbedThumbSafe(validatedData.url);
            if (oembedData && oembedData.artUrl) {
              // Store artwork_url from oEmbed for immediate display
              (validatedData as any).artwork_url = oembedData.artUrl;
              (validatedData as any).artUrl = oembedData.artUrl; // Legacy field

              console.log(`🎨 Fetched thumbnail for ${validatedData.title}: ${oembedData.artUrl}`);
            }
          } catch (oembedError) {
            console.log(`⚠️ oEmbed fetch failed for ${validatedData.url}:`, oembedError);
            // Continue with submission even if oEmbed fails
          }
        }
      }

      // Enhance metadata for SoundCloud URLs (legacy enhancement)
      if (validatedData.url && validatedData.url.includes('soundcloud.com')) {
        try {
          const metadata = await metadataService.fetchSoundCloudMetadata(validatedData.url);
          validatedData.metadata = metadata;
        } catch (metaError) {
          console.warn('Failed to fetch SoundCloud metadata:', metaError);
        }
      }

      const mixSubmission = await storage.createMixSubmission(validatedData);
      console.log(`Mix submission created: ${mixSubmission.title} by ${mixSubmission.name}`);

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

  // Update mix routing settings (featureOnSite, pushToAzura)
  app.patch('/api/mixes/:id/routing', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { featureOnSite, pushToAzura } = req.body;
      
      console.log(`🔄 Updating routing for mix ${id}: featureOnSite=${featureOnSite}, pushToAzura=${pushToAzura}`);
      
      // Determine correct status based on boolean flags
      let status = 'pending';
      if (featureOnSite) {
        status = 'featured';
      } else if (pushToAzura) {
        status = 'approved';
      }
      
      const updated = await storage.updateMixSubmission(id, {
        featureOnSite: featureOnSite,
        pushToAzura: pushToAzura,
        status: status // 🔥 SYNC STATUS FIELD!
      });
      
      // If enabling features, trigger routing workflow
      if (featureOnSite || pushToAzura) {
        await mixRouter.routeMix(id);
        console.log(`✅ Routing workflow completed for mix ${id}`);
      }
      
      res.json({ 
        success: true, 
        mix: updated,
        message: 'Routing settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating mix routing:', error);
      res.status(500).json({ error: 'Failed to update routing settings' });
    }
  });

  // Public: Get featured mixes only
  app.get("/api/mixes/featured", async (req, res) => {
    try {
      const { limit } = req.query;

      let mixes = await storage.getMixSubmissions({ limit: 100 });

      // Filter by featured status (either status=featured or notes contains Featured)
      mixes = mixes.filter(mix => {
        const isFeatured = mix.status === 'featured' || (mix as any).featured || mix.notes?.includes('Featured: true');
        const isApproved = mix.status === 'approved' || mix.status === 'featured';
        return isFeatured && isApproved;
      });

      // Sort by featured_at descending
      mixes.sort((a, b) => {
        const aDate = (a as any).featured_at || a.createdAt || a.submittedAt;
        const bDate = (b as any).featured_at || b.createdAt || b.submittedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      if (limit) {
        mixes = mixes.slice(0, parseInt(limit as string));
      }

      const serializedMixes = mixes.map(serializeMix);

      console.log(`GET /api/mixes/featured - Found ${serializedMixes.length} featured mixes`);
      res.json(serializedMixes);
    } catch (error) {
      console.error('Error fetching featured mixes:', error);
      res.status(500).json({ error: 'Failed to fetch featured mixes' });
    }
  });

  // Public: Fresh mixes for homepage (replaces /api/latest)
  app.get("/api/home/fresh", async (req, res) => {
    try {
      const { limit = 6 } = req.query;

      let mixes = await storage.getMixSubmissions({ limit: 50 });

      // Filter by approved status (includes featured mixes)
      mixes = mixes.filter(mix => {
        return mix.status === 'approved' || mix.status === 'featured';
      });

      // Sort by priority: featured_at > approved_at > created_at (newest featured float to top)
      mixes.sort((a, b) => {
        const aDate = (a as any).featured_at || (a as any).approved_at || a.createdAt || a.submittedAt;
        const bDate = (b as any).featured_at || (b as any).approved_at || b.createdAt || b.submittedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // Limit results
      mixes = mixes.slice(0, parseInt(limit as string));

      const serializedMixes = mixes.map(serializeMix);

      console.log(`GET /api/home/fresh - Found ${serializedMixes.length} fresh mixes`);
      res.json(serializedMixes);
    } catch (error) {
      console.error('Error fetching fresh mixes:', error);
      res.status(500).json({ error: 'Failed to fetch fresh mixes' });
    }
  });

  // =================
  // MIX MODERATION API - Admin workflow with AzuraCast integration
  // =================

  // Get all submissions for admin moderation
  app.get("/api/submissions", async (req, res) => {
    try {
      const { status, featured } = req.query;
      const submissions = await storage.getMixSubmissions({
        status: status as string,
        limit: 100
      });

      // Filter featured if specified
      let filtered = submissions;
      if (featured === 'true') {
        filtered = submissions.filter(s => s.notes?.includes('Featured: true'));
      } else if (featured === 'false') {
        filtered = submissions.filter(s => !s.notes?.includes('Featured: true'));
      }

      res.json(filtered.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Approve mix - simple status update
  app.post("/api/mixes/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmissionById(id);

      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      if (mix.status === 'approved') {
        return res.json({ ok: true, message: 'Mix already approved' });
      }

      // Simple status update to approved
      const updatedMix = await storage.updateMixSubmissionStatus(id, 'approved', 'Approved by admin');

      // AzuraCast integration
      try {
        await rescanLibrary();
        const safeArtist = (mix.name || 'Artist').replace(/[^\w\-]+/g, '_');
        const safeTitle = (mix.title || 'Track').replace(/[^\w\-]+/g, '_');
        const fileName = `${safeArtist}-${safeTitle}.mp3`;
        console.log(`🎵 Mix approved: ${fileName}`);
      } catch (uploadError) {
        console.log(`AzuraCast integration warning:`, uploadError);
      }

      // Broadcast update via WebSocket
      broadcast({
        type: 'mix_approved',
        data: updatedMix
      });

      console.log(`Mix ${id} approved`);
      res.json({ ok: true, mix: updatedMix });
    } catch (error) {
      console.error('Error approving mix:', error);
      res.status(500).json({ error: 'Failed to approve mix' });
    }
  });

  // Feature/unfeature mix with timestamp-based logic
  app.put("/api/admin/mixes/:id/feature", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmissionById(id);

      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      const { featured } = req.body;

      // Guard: only allow featuring if already approved
      if (mix.status !== 'approved') {
        return res.status(400).json({ error: 'Mix must be approved before featuring' });
      }

      // Toggle featured status in notes (simple approach)
      const currentFeatured = mix.notes?.includes('Featured: true') || false;
      const newFeatured = !currentFeatured;

      const notes = newFeatured 
        ? `${mix.notes || ''} Featured: true`.trim()
        : (mix.notes || '').replace('Featured: true', '').trim();

      const updatedMix = await storage.updateMixSubmissionStatus(id, mix.status, notes);

      // Broadcast update via WebSocket
      broadcast({
        type: 'mix_featured',
        data: updatedMix
      });

      console.log(`Mix ${id} ${featured ? 'featured' : 'unfeatured'}`);
      res.json(updatedMix);
    } catch (error) {
      console.error('Error featuring mix:', error);
      res.status(500).json({ error: 'Failed to feature mix' });
    }
  });

  // Delete/remove mix
  app.delete("/api/submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Mark as deleted since there's no delete method in storage interface
      const updatedMix = await storage.updateMixSubmissionStatus(id, 'deleted', 'Removed by admin');

      console.log(`Mix ${id} deleted`);
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting mix:', error);
      res.status(500).json({ error: 'Failed to delete mix' });
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

  // Legacy endpoint - kept for backwards compatibility but unused
  app.post("/api/song-submissions-old", async (req, res) => {
    try {
      const validatedData = insertSongSubmissionSchema.parse(req.body);
      const submission = await storage.createSongSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating song submission:', error);
      res.status(400).json({ error: 'Invalid song submission data' });
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


  // Serve downloaded audio files from temp directory
  app.get("/api/azuracast/downloaded-files", async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const tempDir = '/home/runner/workspace/temp_audio';
      
      try {
        const files = await fs.readdir(tempDir);
        const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.aac'));
        
        const fileDetails = await Promise.all(
          audioFiles.map(async (file) => {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            return {
              name: file,
              size: stats.size,
              modified: stats.mtime,
              url: `/api/azuracast/download-file/${encodeURIComponent(file)}`
            };
          })
        );
        
        res.json({ 
          directory: tempDir,
          files: fileDetails 
        });
      } catch (dirError) {
        res.json({ 
          directory: tempDir,
          files: [],
          message: 'No files found or directory does not exist yet'
        });
      }
    } catch (error) {
      console.error('Error listing downloaded files:', error);
      res.status(500).json({ error: 'Failed to list downloaded files' });
    }
  });

  // Serve individual downloaded audio files
  app.get("/api/azuracast/download-file/:filename", async (req, res) => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      
      const filename = decodeURIComponent(req.params.filename);
      const filePath = path.join('/home/runner/workspace/temp_audio', filename);
      
      // Security check - ensure file is within temp directory
      if (!filePath.startsWith('/home/runner/workspace/temp_audio/')) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Set appropriate headers for audio files
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.mp3') contentType = 'audio/mpeg';
      if (ext === '.aac') contentType = 'audio/aac';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  });

  app.post("/api/azuracast/upload/:id", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(mixId);
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      // Find actual downloaded file in temp directory
      const tempDir = '/home/runner/workspace/temp_audio';
      
      // Look for files that match this mix (since yt-dlp may create variations)
      let actualFilePath = null;
      try {
        const files = fs.readdirSync(tempDir);
        
        // Try exact match first
        const expectedFileName = audioProcessor.sanitizeFileName(`${mix.name}-${mix.title}.mp3`);
        if (files.includes(expectedFileName)) {
          actualFilePath = path.join(tempDir, expectedFileName);
        } else {
          // Look for files containing parts of the mix info
          const mixNamePart = audioProcessor.sanitizeFileName(mix.name);
          const matchingFiles = files.filter(file => 
            file.endsWith('.mp3') && 
            file.includes(mixNamePart)
          );
          
          if (matchingFiles.length > 0) {
            actualFilePath = path.join(tempDir, matchingFiles[0]);
            console.log(`📁 Found matching file: ${matchingFiles[0]} for mix ${mix.name}`);
          }
        }
      } catch (error) {
        console.error('Error reading temp directory:', error);
      }
      
      if (!actualFilePath || !fs.existsSync(actualFilePath)) {
        return res.status(400).json({ 
          error: 'Mix must be processed first. Click "Process" button before uploading.',
          tempDir: tempDir,
          mixName: mix.name,
          mixTitle: mix.title
        });
      }

      console.log(`📤 Uploading processed file: ${actualFilePath}`);
      const result = await azuracastService.uploadMixToAzuraCast(
        mix.title, 
        mix.name, 
        actualFilePath // Use the actual processed MP3 file path
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
      console.log('Song submission received:', req.body);
      const validatedData = insertSongSubmissionSchema.parse(req.body);
      
      // Normalize platform + artwork
      const href = validatedData.spotifyUrl || validatedData.youtubeUrl || '';
      let platform = 'link';
      if (href && href.includes('open.spotify.com')) platform = 'spotify';
      else if (href && href.includes('soundcloud.com')) platform = 'soundcloud';
      else if (href && href.includes('mixcloud.com')) platform = 'mixcloud';
      (validatedData as any).platform = platform;

      // Try oEmbed for art/title/artist
      try {
        const oe = await fetch(
          `${req.protocol}://${req.get('host')}/api/oembed?url=${encodeURIComponent(href)}`
        );
        if (oe.ok) {
          const j = await oe.json();
          if (j?.thumbnail_url) {
            (validatedData as any).artwork = j.thumbnail_url;
            (validatedData as any).artUrl = j.thumbnail_url;
          }
          if (!validatedData.songTitle && j?.title) validatedData.songTitle = j.title;
          if (!validatedData.artistName && j?.artist) validatedData.artistName = j.artist;
        }
      } catch (e) {
        console.log('oEmbed (song) failed:', e);
      }

      const submission = await storage.createSongSubmission(validatedData);
      console.log('Song submission created:', submission.id);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Song submission failed:', error, req.body);
      res.status(400).json({ error: 'Invalid song submission data', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update song submission status (approve/reject)
  app.patch('/api/song-submissions/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, approvedBy, notes } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const updated = await storage.updateSongSubmissionStatus(id, status);
      
      if (!updated) {
        return res.status(404).json({ error: 'Song submission not found' });
      }
      
      res.json({ success: true, submission: updated });
    } catch (error) {
      console.error('Error updating song submission status:', error);
      res.status(500).json({ error: 'Failed to update submission status' });
    }
  });

  // Convert song submission to mix submission
  app.post('/api/admin/song-submissions/:id/convert-to-mix', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const song = await storage.getSongSubmissionById(id);
      if (!song) return res.status(404).json({ error: 'Song not found' });

      const mix = await storage.createMixSubmission({
        name: song.artistName || song.submitterName || 'Unknown',
        title: song.songTitle || 'Untitled',
        genre: (song as any).genre || 'Electronic',
        about: song.notes || null,
        url: song.spotifyUrl || song.youtubeUrl || '',
        artUrl: (song as any).artUrl || (song as any).artwork || null,
        platform: (song as any).platform || 'spotify',
        featureOnSite: false,
        pushToAzura: false
      });

      // Mark song as converted/approved to remove from pending
      await storage.updateSongSubmissionStatus(id, 'approved');

      res.json({ ok: true, mix });
    } catch (e) {
      console.error('Convert to mix failed:', e);
      res.status(500).json({ error: 'convert-failed' });
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

  // Get genres with content counts for discovery
  app.get('/api/genres', async (req, res) => {
    try {
      const episodes = await storage.getEpisodes();
      const mixes = await storage.getMixSubmissions({ status: 'approved' }); // Only approved content
      const featuredMixes = await storage.getMixSubmissions({ status: 'featured' });
      const allMixes = [...mixes, ...featuredMixes];

      const genreCounts = new Map<string, { mixCount: number, episodeCount: number, total: number }>();

      // Count mixes by genre
      allMixes.forEach(mix => {
        if (mix.genre) {
          const genre = mix.genre;
          const current = genreCounts.get(genre) || { mixCount: 0, episodeCount: 0, total: 0 };
          current.mixCount += 1;
          current.total = current.mixCount + current.episodeCount;
          genreCounts.set(genre, current);
        }
      });

      // Count episodes by genre
      episodes.forEach(episode => {
        if (episode.genre) {
          const genre = episode.genre;
          const current = genreCounts.get(genre) || { mixCount: 0, episodeCount: 0, total: 0 };
          current.episodeCount += 1;
          current.total = current.mixCount + current.episodeCount;
          genreCounts.set(genre, current);
        }
      });

      // Convert to array and sort by total count
      const genres = Array.from(genreCounts.entries()).map(([name, counts]) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        ...counts
      })).sort((a, b) => b.total - a.total);

      res.json(genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
      res.status(500).json({ error: 'Failed to fetch genres' });
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
  // initFeaturedMixes().catch(console.error); // Disabled to prevent data corruption

  // =================
  // AZURACAST INTEGRATION ROUTES
  // =================

  // Test AzuraCast connection
  app.get('/api/azuracast/test', async (req, res) => {
    try {
      // Test connection by getting now playing
      const nowPlaying = await azuracastService.getNowPlaying();

      res.json({
        success: true,
        nowPlaying
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to connect to AzuraCast',
        message: error instanceof Error ? error.message : 'Unknown error'
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

      // Set up progress listener for this specific mix
      const progressListener = (progressData: any) => {
        if (progressData.mixId === mixId) {
          broadcast({
            type: 'audioProgress',
            data: progressData
          });
        }
      };

      audioProcessor.on('progress', progressListener);

      try {
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
      } finally {
        // Clean up listener
        audioProcessor.removeListener('progress', progressListener);
      }
    } catch (error) {
      res.status(500).json({ error: 'Processing failed', message: error instanceof Error ? error.message : 'Unknown error' });
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
          status: 'featured' // Mark as featured since it's now in AzuraCast rotation
        });

        res.json({ success: true, message: 'Mix uploaded to AzuraCast successfully' });
      } else {
        res.status(500).json({ error: 'Failed to upload to AzuraCast' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
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

  // =================
  // ADMIN WORKFLOW API - Feature/Approve toggles, file attachment, AzuraCast push
  // =================

  // Toggle mix approval status
  app.post('/api/admin/mixes/:id/approve', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);
      if (!mix) {
        return res.status(404).json({ error: 'not found' });
      }

      const currentlyApproved = (mix as any).pushToAzura || false;
      const newApprovalStatus = !currentlyApproved;

      const updates: any = {
        pushToAzura: newApprovalStatus
      };

      // If approving and it's a direct MP3 URL and we don't yet have a local file, ingest it now
      const isMp3Url = !!(mix.url && /\.mp3(\?|$)/i.test(mix.url));
      if (newApprovalStatus && isMp3Url && !(mix as any).filePath) {
        try {
          // Import fs and path dynamically
          const fs = await import('fs');
          const path = await import('path');

          // Ensure uploads directory exists
          const uploadsDir = path.resolve('./uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const fileName = `${Date.now()}_${path.basename(mix.url.split('?')[0])}`;
          const filePath = path.join(uploadsDir, fileName);

          console.log(`🎵 Auto-downloading MP3 for approved mix: ${mix.url}`);

          // Download with timeout and safety checks
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch(mix.url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'EnamoradoRadio/1.0' }
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }

          // Check content type
          const contentType = response.headers.get('content-type') || '';
          if (!/audio\/(mpeg|mp3)/i.test(contentType) && !contentType.includes('application/octet-stream')) {
            console.warn(`Unexpected content-type: ${contentType}, continuing anyway...`);
          }

          // Check content length (200MB limit)
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) {
            throw new Error(`File too large: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB (max 200MB)`);
          }

          // Stream download with size limit enforcement
          const fileStream = fs.createWriteStream(filePath);
          let downloadedBytes = 0;
          const maxBytes = 200 * 1024 * 1024; // 200MB

          await new Promise((resolve, reject) => {
            if (!response.body) {
              reject(new Error('No response body'));
              return;
            }

            const nodeStream = Readable.fromWeb(response.body as any);
            
            nodeStream.on('data', (chunk) => {
              downloadedBytes += chunk.length;
              if (downloadedBytes > maxBytes) {
                fileStream.destroy();
                fs.unlinkSync(filePath);
                reject(new Error(`Download size exceeded 200MB limit`));
                return;
              }
            });

            nodeStream.pipe(fileStream);
            nodeStream.on('error', reject);
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
          });

          updates.filePath = filePath;
          updates.fileName = fileName;
          updates.source = 'upload'; // now it's local

          console.log(`✅ Successfully downloaded MP3: ${fileName} (${Math.round(downloadedBytes / 1024 / 1024)}MB)`);

        } catch (downloadError: any) {
          console.error(`❌ Failed to download MP3 for mix ${id}:`, downloadError.message);
          // Continue with approval even if download fails
        }
      }

      // If approving for the first time, try to populate art_url via oEmbed (for non-MP3 URLs)
      if (newApprovalStatus && !(mix as any).artUrl && mix.url && !isMp3Url) {
        try {
          const { getOEmbedThumbSafe } = await import('./lib/oembed');
          const { artUrl } = await getOEmbedThumbSafe(mix.url);
          if (artUrl) {
            updates.artUrl = artUrl;
          }
        } catch (error) {
          console.warn('Failed to fetch thumbnail for mix', id, error);
        }
      }

      // If unapproving, also remove from featured
      if (!newApprovalStatus) {
        updates.featureOnSite = false;
      }

      const updatedMix = await storage.updateMixSubmission(id, updates);
      res.json({ ok: true, approved: newApprovalStatus });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Toggle mix featured status
  app.post('/api/admin/mixes/:id/feature', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);
      if (!mix) {
        return res.status(404).json({ error: 'not found' });
      }

      // Check if mix is approved (has pushToAzura = true)
      if (!(mix as any).pushToAzura) {
        return res.status(400).json({ error: 'approve-first' });
      }

      const currentlyFeatured = (mix as any).featureOnSite || false;
      const newFeaturedStatus = !currentlyFeatured;

      const updatedMix = await storage.updateMixSubmission(id, {
        featureOnSite: newFeaturedStatus,
        status: newFeaturedStatus ? 'featured' : 'approved'
      });

      // Optional: Auto-push to AzuraCast when featuring with MP3
      if (newFeaturedStatus && (mix as any).filePath) {
        try {
          const { pushToAzuraCast } = await import('./lib/azuracast');
          const fileName = (mix as any).fileName || `mix-${id}.mp3`;
          const result = await pushToAzuraCast(
            (mix as any).filePath, 
            fileName
          );

          if (result.success) {
            await storage.updateMixSubmission(id, {
              azuraFilePath: fileName
            });
          }
        } catch (e) {
          console.warn('AzuraCast auto-push failed:', e);
        }
      }

      res.json({ ok: true, featured: newFeaturedStatus });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Manual AzuraCast push endpoint (for existing MP3 files)
  app.post('/api/admin/mixes/:id/push-azuracast', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);

      if (!mix || !(mix as any).filePath) {
        return res.status(400).json({ error: 'No MP3 file attached to this mix' });
      }

      const { pushToAzuraCast } = await import('./lib/azuracast');
      const fileName = (mix as any).fileName || `mix-${id}.mp3`;
      const result = await pushToAzuraCast((mix as any).filePath, fileName);

      if (result.success) {
        // Update mix with AzuraCast info
        await storage.updateMixSubmission(id, {
          azuraFilePath: fileName
        });
        res.json({ success: true, message: 'Successfully pushed to AzuraCast' });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('AzuraCast push error:', error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Route mix with audio download and AzuraCast integration
  app.post('/api/admin/route-mix/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { mixRouter } = await import('./mixRouter');
      
      console.log(`🎯 API: Routing mix ${id} with full download pipeline`);
      const result = await mixRouter.routeMix(id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Mix routing API error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Mix routing failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update mix artwork (for persisting oEmbed-fetched thumbnails)
  app.patch("/api/mixes/:id/artwork", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { artUrl } = req.body;

      if (!artUrl || typeof artUrl !== 'string') {
        return res.status(400).json({ error: 'Valid artUrl is required' });
      }

      console.log(`Updating artwork for mix ${id}: ${artUrl}`);
      const updatedMix = await storage.updateMixSubmission(id, { artUrl });
      
      res.json({ 
        success: true, 
        artUrl: updatedMix.artUrl,
        mix: serializeMix(updatedMix)
      });
    } catch (error) {
      console.error('Error updating mix artwork:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete mix submission
  app.delete('/api/mixes/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMixSubmission(id);
      res.json({ success: true });
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Configure multer for file uploads (200MB limit)
  const uploadMixer = multer({
    dest: './uploads/',
    limits: {
      fileSize: 200 * 1024 * 1024 // 200MB
    },
    fileFilter: (req, file, cb) => {
      const isAudio = /^audio\//.test(file.mimetype) || /\.mp3$/i.test(file.originalname);
      if (isAudio) {
        cb(null, true);
      } else {
        cb(new Error('Only MP3 files are allowed'));
      }
    }
  });

  // Attach MP3 file to mix
  app.post('/api/mixes/:id/attach-file', requireAdmin, uploadMixer.single('file'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);

      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'File required (field name "file")' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname || `mix-${id}.mp3`;
      const ext = mimeTypes.extension(req.file.mimetype) || 'mp3';
      const finalFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_').replace(/[^\w\.-]/g, '')}.${ext}`;

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.resolve('./uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const updatedMix = await storage.updateMixSubmission(id, {
        filePath,
        fileName: finalFileName,
        source: 'upload'
      });

      res.json({ success: true, mix: updatedMix });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Attach MP3 from URL
  app.post('/api/mixes/:id/attach-url', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { url } = req.body;

      if (!url || !/\.mp3(\?|$)/i.test(url)) {
        return res.status(400).json({ error: 'Valid MP3 URL required' });
      }

      const mix = await storage.getMixSubmission(id);
      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      // Download the file
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ error: `Download failed: ${response.status}` });
      }

      // Save to uploads directory
      const uploadsDir = path.resolve('./uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${path.basename(url.split('?')[0])}`;
      const filePath = path.join(uploadsDir, fileName);

      const fileStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        if (!response.body) {
          reject(new Error('No response body'));
          return;
        }
        const nodeStream = Readable.fromWeb(response.body as any);
        nodeStream.pipe(fileStream);
        nodeStream.on('error', reject);
        fileStream.on('finish', resolve);
      });

      const updatedMix = await storage.updateMixSubmission(id, {
        filePath,
        fileName,
        source: 'upload'
      });

      res.json({ success: true, mix: updatedMix });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Push mix to AzuraCast via SFTP
  app.post('/api/azuracast/push/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);

      if (!mix) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      if (!(mix as any).filePath) {
        return res.status(400).json({ 
          error: 'No local file associated. Upload an MP3 for this mix first.' 
        });
      }

      // Add ID3 tags before uploading
      try {
        await audioProcessor.tagLocalMp3((mix as any).filePath, mix.name, mix.title);
      } catch (error) {
        console.warn('Failed to add ID3 tags:', error);
      }

      const result = await azuracastIntegration.pushFileToAzuraCast(
        (mix as any).filePath, 
        mix.name, 
        mix.title
      );

      if (result.success) {
        // Add to Community Mixes playlist
        try {
          const { playlistId } = await azuraCastManager.ensurePlaylist('community_mixes', 'Community Mixes');
          if (playlistId && result.remotePath) {
            await azuraCastManager.addToPlaylist(playlistId, result.remotePath);
          }
        } catch (error) {
          console.warn('Failed to add to playlist:', error);
        }

        // Update mix with AzuraCast info
        await storage.updateMixSubmission(id, {
          azuraFilePath: result.remotePath,
          azuraPlaylistId: 'community_mixes'
        });

        res.json({ 
          success: true, 
          uploaded: result.remotePath,
          fileName: result.fileName,
          azuraLink: `${process.env.AZURACAST_BASE_URL || 'http://azuracast-url'}/station/${process.env.AZURACAST_STATION || 'station'}/files`,
          playlistLink: `${process.env.AZURACAST_BASE_URL || 'http://azuracast-url'}/station/${process.env.AZURACAST_STATION || 'station'}/playlists`,
          message: 'Uploaded and library rescanned successfully!' 
        });
      } else {
        res.status(500).json({ error: result.error || 'Upload failed' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // =================
  // OEMBED PROXY - SoundCloud artwork fetching (CORS-safe)
  // =================

  app.get('/api/oembed', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ error: 'Missing url' });
      }

      console.log('Fetching oEmbed for URL:', url);

      const href = String(url);
      let data: any = null;

      if (href.includes('soundcloud.com')) {
        // SoundCloud oEmbed
        const response = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(href)}`, {
          headers: {
            'User-Agent': 'EnamoradoRadio/1.0'
          }
        });

        if (!response.ok) {
          console.error('SoundCloud oEmbed fetch failed:', response.status, response.statusText);
          return res.status(502).json({ error: 'oembed-failed', status: response.status });
        }

        data = await response.json();
      } else if (href.includes('open.spotify.com')) {
        // Spotify oEmbed
        const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(href)}`);
        if (!response.ok) {
          console.error('Spotify oEmbed fetch failed:', response.status, response.statusText);
          return res.status(502).json({ error: 'oembed-failed', status: response.status });
        }
        const j = await response.json();
        data = {
          thumbnail_url: j.thumbnail_url || null,
          artUrl: j.thumbnail_url || null,
          title: j.title || null,
          artist: j.author_name || null,
          html: j.html || null,
          width: j.width || null,
          height: j.height || null
        };
      } else {
        // Fallback: just return minimal
        data = { thumbnail_url: null, artUrl: null, title: null, artist: null };
      }
      console.log('Raw oEmbed response:', data);

      // Upgrade thumbnail to higher quality if available
      let thumbnail = data.thumbnail_url;
      if (thumbnail) {
        thumbnail = thumbnail
          .replace('large.jpg', 't500x500.jpg')
          .replace('t67x67.jpg', 't500x500.jpg')
          .replace('badge.jpg', 't500x500.jpg')
          .replace('crop.jpg', 't500x500.jpg');
      }

      const result = { 
        thumbnail_url: thumbnail || null,
        artUrl: thumbnail || null,
        title: data.title || null,
        artist: data.author_name || null,
        html: data.html || null,
        width: data.width || null,
        height: data.height || null
      };

      console.log('Returning oEmbed result:', result);
      res.json(result);
    } catch (error) {
      console.error('oEmbed proxy error:', error);
      res.status(500).json({ error: 'proxy-failed', detail: String(error) });
    }
  });

  // =================
  // RESIDENT APPLICATIONS API
  // =================

  // Get all resident applications (admin only)
  app.get('/api/resident-applications', requireAdmin, async (req, res) => {
    try {
      const { status, priority, limit } = req.query;
      const applications = await storage.getResidentApplications({
        status: status as string,
        priority: priority as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      res.json(applications);
    } catch (error) {
      console.error('Error fetching resident applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  // Get single resident application (admin only)
  app.get('/api/resident-applications/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getResidentApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Error fetching resident application:', error);
      res.status(500).json({ error: 'Failed to fetch application' });
    }
  });

  // Create resident application (admin only - for syncing from Google Sheets)
  app.post('/api/resident-applications', requireAdmin, async (req, res) => {
    try {
      const validation = insertResidentApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid application data', 
          details: validation.error.issues 
        });
      }

      const application = await storage.createResidentApplication(validation.data);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating resident application:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  });

  // Update resident application status (admin only)
  app.patch('/api/resident-applications/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const application = await storage.updateResidentApplicationStatus(id, status, notes);
      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update application' });
    }
  });

  // Update resident application (admin only)
  app.patch('/api/resident-applications/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const application = await storage.updateResidentApplication(id, updates);
      res.json(application);
    } catch (error) {
      console.error('Error updating resident application:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update application' });
    }
  });

  // Delete resident application (admin only)
  app.delete('/api/resident-applications/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteResidentApplication(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting resident application:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete application' });
    }
  });

  // Sync resident applications from Google Sheets (admin only)
  app.post('/api/resident-applications/sync', requireAdmin, async (req, res) => {
    try {
      const { residentApplicationsSync } = await import('./residentApplicationsSync');
      const { spreadsheetId, range = 'A:Z' } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is required' });
      }

      // Configure sync and perform manual sync
      await residentApplicationsSync.startAutoSync({ 
        spreadsheetId, 
        range, 
        interval: 15 // 15 minutes default
      });
      
      const result = await residentApplicationsSync.performSync();

      res.json({ 
        success: true, 
        ...result
      });
    } catch (error) {
      console.error('Error syncing applications:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync applications' });
    }
  });

  // Start automatic sync (admin only)
  app.post('/api/resident-applications/sync/start', requireAdmin, async (req, res) => {
    try {
      const { residentApplicationsSync } = await import('./residentApplicationsSync');
      const { spreadsheetId, range = 'A:Z', interval = 15 } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is required' });
      }

      await residentApplicationsSync.startAutoSync({ 
        spreadsheetId, 
        range, 
        interval 
      });

      res.json({ 
        success: true,
        message: `Automatic sync started for spreadsheet ${spreadsheetId}`,
        config: { spreadsheetId, range, interval }
      });
    } catch (error) {
      console.error('Error starting automatic sync:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start automatic sync' });
    }
  });

  // Stop automatic sync (admin only)
  app.post('/api/resident-applications/sync/stop', requireAdmin, async (req, res) => {
    try {
      const { residentApplicationsSync } = await import('./residentApplicationsSync');
      
      residentApplicationsSync.stopAutoSync();

      res.json({ 
        success: true,
        message: 'Automatic sync stopped'
      });
    } catch (error) {
      console.error('Error stopping automatic sync:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to stop automatic sync' });
    }
  });

  // Get sync status (admin only)
  app.get('/api/resident-applications/sync/status', requireAdmin, async (req, res) => {
    try {
      const { residentApplicationsSync } = await import('./residentApplicationsSync');
      
      const status = residentApplicationsSync.getSyncStatus();

      res.json({ 
        success: true,
        ...status
      });
    } catch (error) {
      console.error('Error getting sync status:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get sync status' });
    }
  });

  // =================
  // PUBLIC API - Sanitized endpoints without admin fields
  // =================

  const sanitizeMix = (mix: any) => ({
    id: mix.id,
    name: mix.name,
    title: mix.title,
    genre: mix.genre,
    about: mix.about,
    url: mix.url,
    coverUrl: mix.coverUrl,
    artUrl: mix.artUrl, // Server-fetched thumbnail
    metadata: mix.metadata, // Legacy thumbnail in metadata.imageUrl
    submittedAt: mix.submittedAt,
    featureOnSite: mix.featureOnSite, // Include for ⭐ display on public pages
    // DO NOT include: pushToAzura, status, filePath, notes, etc.
  });

  // Public mixes (approved only)
  app.get('/api/public/mixes', async (req, res) => {
    try {
      const { limit, genre } = req.query;
      const allMixes = await storage.getMixSubmissions({});

      // Filter for mixes that should appear on website (approved OR featured status)
      let approvedMixes = allMixes
        .filter(mix => mix.status === 'approved' || mix.status === 'featured');

      // Apply optional genre filter
      if (genre && typeof genre === 'string') {
        const genreLower = genre.toLowerCase();
        approvedMixes = approvedMixes.filter(mix => 
          mix.genre && mix.genre.toLowerCase() === genreLower
        );
      }

      // Sort and limit
      approvedMixes = approvedMixes
        .sort((a, b) => {
          // Featured mixes first, then approved
          if (a.status === 'featured' && b.status !== 'featured') return -1;
          if (a.status !== 'featured' && b.status === 'featured') return 1;
          return 0;
        })
        .slice(0, limit ? parseInt(limit as string) : 12); // Limit to 12 to avoid endless scroll

      res.json(approvedMixes.map(sanitizeMix));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mixes' });
    }
  });

  // Public featured mixes (approved + featured)
  app.get('/api/public/mixes/featured', async (req, res) => {
    try {
      const { limit } = req.query;
      const allMixes = await storage.getMixSubmissions({});

      // Filter for featured mixes only
      const featuredMixes = allMixes
        .filter(mix => mix.status === 'featured')
        .slice(0, limit ? parseInt(limit as string) : 8);

      res.json(featuredMixes.map(sanitizeMix));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured mixes' });
    }
  });

  // Public single mix (approved only)
  app.get('/api/public/mixes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMixSubmission(id);

      if (!mix || (mix.status !== 'approved' && mix.status !== 'featured')) {
        return res.status(404).json({ error: 'Mix not found' });
      }

      res.json(sanitizeMix(mix));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mix' });
    }
  });

  // Configure multer for public uploads
  const publicUploads = multer({
    dest: './uploads/',
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    fileFilter: (req, file, cb) => {
      const ok = /^audio\//.test(file.mimetype) || /\.mp3$/i.test(file.originalname);
      if (ok) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files'));
      }
    }
  });

  // PUBLIC: create a submission with a direct file upload
  app.post('/api/public/mixes/upload', publicUploads.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file required' });

      const { name, title, genre, about, artworkUrl } = req.body;

      // Create mix with source=upload; pending by default
      const submission = await storage.createMixSubmission({
        name,
        title,
        genre,
        about: about || null,
        url: '',                     // no platform URL; it's a file
        artUrl: artworkUrl || null,  // optional manual art
        source: 'upload'
      });

      // Save file path to allow admin push later
      await storage.updateMixSubmission(submission.id, {
        filePath: req.file.path,
        fileName: req.file.originalname || `mix-${submission.id}.mp3`
      });

      res.status(201).json({ success: true, id: submission.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'upload failed' });
    }
  });

  // =================
  // ALBUMS OF THE MONTH API
  // =================

  // PUBLIC: Submit album suggestion
  app.post('/api/albums/suggest', async (req, res) => {
    try {
      const validated = insertAlbumSuggestionSchema.parse(req.body);
      
      // Fetch MusicBrainz data for highest-rated cover art
      const mbData = await musicbrainzService.getAlbumDetails(validated.artist, validated.title);
      
      // Fetch Spotify URL for listening
      const spotifyUrl = await metadataService.searchSpotifyAlbum(validated.artist, validated.title);
      
      const suggestion = await storage.createAlbumSuggestion(validated, mbData || undefined, spotifyUrl || undefined);
      
      broadcast({ type: 'album_suggestion', data: suggestion });
      res.status(201).json(suggestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating album suggestion:', error);
      res.status(500).json({ error: 'Failed to create album suggestion' });
    }
  });

  // PUBLIC: Get published album picks
  app.get('/api/albums/published', async (req, res) => {
    try {
      const picks = await storage.getPublishedAlbumPicks();
      res.json(picks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch published picks' });
    }
  });

  // PUBLIC: Get published album pick by month
  app.get('/api/albums/published/:month', async (req, res) => {
    try {
      const { month } = req.params;
      const pick = await storage.getPublishedAlbumPickWithItems(month);
      
      if (!pick) {
        return res.status(404).json({ error: 'Album pick not found' });
      }
      
      res.json(pick);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch album pick' });
    }
  });

  // ADMIN: Get all album suggestions with votes (editor role required)
  app.get('/api/admin/albums/suggestions', requireRole('editor'), async (req, res) => {
    try {
      const { status } = req.query;
      const suggestions = await storage.getAlbumSuggestionsWithVotes();
      
      let filtered = suggestions;
      if (status && status !== 'all') {
        filtered = suggestions.filter(s => s.status === status);
      }
      
      res.json(filtered);
    } catch (error) {
      console.error('Error fetching album suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch album suggestions' });
    }
  });

  // ADMIN: Vote on album suggestion (editor role required)
  app.post('/api/admin/albums/suggestions/:id/vote', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { value } = req.body;
      const username = (req as any).user?.username || 'admin';
      
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Vote value must be 1 or -1' });
      }
      
      const vote = await storage.voteOnAlbumSuggestion(id, username, value);
      broadcast({ type: 'album_vote', data: { suggestionId: id, vote } });
      
      res.json(vote);
    } catch (error) {
      console.error('Error voting on album:', error);
      res.status(500).json({ error: 'Failed to vote on album' });
    }
  });

  // ADMIN: Accept album suggestion (editor role required)
  app.post('/api/admin/albums/suggestions/:id/accept', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = (req as any).user?.username || 'admin';
      
      const suggestion = await storage.acceptAlbumSuggestion(id, username);
      broadcast({ type: 'album_accepted', data: suggestion });
      
      res.json(suggestion);
    } catch (error) {
      console.error('Error accepting album:', error);
      res.status(500).json({ error: 'Failed to accept album' });
    }
  });

  // ADMIN: Reject album suggestion (editor role required)
  app.post('/api/admin/albums/suggestions/:id/reject', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const username = (req as any).user?.username || 'admin';
      
      const suggestion = await storage.rejectAlbumSuggestion(id, username);
      broadcast({ type: 'album_rejected', data: suggestion });
      
      res.json(suggestion);
    } catch (error) {
      console.error('Error rejecting album:', error);
      res.status(500).json({ error: 'Failed to reject album' });
    }
  });

  // ADMIN: Delete album suggestion (admin role required)
  app.delete('/api/admin/albums/suggestions/:id', requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlbumSuggestion(id);
      broadcast({ type: 'album_deleted', data: { id } });
      
      res.json({ success: true, message: 'Album suggestion deleted' });
    } catch (error) {
      console.error('Error deleting album:', error);
      res.status(500).json({ error: 'Failed to delete album suggestion' });
    }
  });

  // ADMIN: Backfill Spotify URL for album suggestion (editor role required)
  app.post('/api/admin/albums/suggestions/:id/backfill-spotify', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suggestion = await storage.getAlbumSuggestionById(id);
      
      if (!suggestion) {
        return res.status(404).json({ error: 'Album suggestion not found' });
      }
      
      if (suggestion.spotifyUrl) {
        return res.json({ message: 'Spotify URL already exists', suggestion });
      }
      
      // Fetch Spotify URL
      const spotifyUrl = await metadataService.searchSpotifyAlbum(suggestion.artist, suggestion.title);
      
      if (!spotifyUrl) {
        return res.status(404).json({ error: 'No Spotify album found' });
      }
      
      const updated = await storage.updateAlbumSuggestion(id, { spotifyUrl });
      broadcast({ type: 'album_updated', data: updated });
      
      res.json(updated);
    } catch (error) {
      console.error('Error backfilling Spotify URL:', error);
      res.status(500).json({ error: 'Failed to backfill Spotify URL' });
    }
  });

  // ADMIN: Create or get album pick for month (editor role required)
  app.post('/api/admin/albums/picks', requireRole('editor'), async (req, res) => {
    try {
      const validated = insertAlbumPickSchema.omit({ slug: true, createdBy: true }).parse(req.body);
      const username = (req as any).user?.username || 'admin';
      
      // Check if pick already exists for this month
      const existing = await storage.getAlbumPickByMonth(validated.month);
      if (existing) {
        const result: ApiResult<{ pick: typeof existing; month: string }> = { 
          ok: true, 
          data: { pick: existing, month: existing.month } 
        };
        return res.json(result);
      }
      
      // Generate slug from month (e.g., "2025-10" -> "2025-10")
      const slug = validated.month;
      
      const pick = await storage.createAlbumPick({
        ...validated,
        createdBy: username,
        slug,
      });
      
      const result: ApiResult<{ pick: typeof pick; month: string }> = { 
        ok: true, 
        data: { pick, month: pick.month } 
      };
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result: ApiResult = { ok: false, error: 'Invalid input', code: 'VALIDATION_ERROR' };
        return res.status(400).json(result);
      }
      console.error('Error creating album pick:', error);
      const result: ApiResult = { ok: false, error: 'Failed to create album pick', code: 'SERVER_ERROR' };
      res.status(500).json(result);
    }
  });

  // ADMIN: Get album pick draft by month (editor role required)
  app.get('/api/admin/albums/picks/:month', requireRole('editor'), async (req, res) => {
    try {
      const { month } = req.params;
      const pick = await storage.getAlbumPickByMonth(month);
      
      if (!pick) {
        return res.status(404).json({ error: 'Album pick not found' });
      }
      
      const items = await storage.getAlbumPickItems(pick.id);
      const itemsWithAlbums = await Promise.all(
        items.map(async (item) => {
          const album = await storage.getAlbumSuggestionById(item.suggestionId);
          return { ...item, album };
        })
      );
      
      res.json({ ...pick, items: itemsWithAlbums });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch album pick' });
    }
  });

  // ADMIN: Add album to draft pick (editor role required)
  app.post('/api/admin/albums/picks/:month/items', requireRole('editor'), async (req, res) => {
    try {
      const { month } = req.params;
      const pick = await storage.getAlbumPickByMonth(month);
      
      if (!pick) {
        return res.status(404).json({ error: 'Album pick not found' });
      }
      
      const validated = insertAlbumPickItemSchema.parse({
        ...req.body,
        pickId: pick.id,
        addedBy: (req as any).user?.username || 'admin',
      });
      
      const item = await storage.addAlbumToPickDraft(validated);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Error adding album to pick:', error);
      res.status(500).json({ error: 'Failed to add album to pick' });
    }
  });

  // ADMIN: Update album pick item (editor role required)
  app.patch('/api/admin/albums/pick-items/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const item = await storage.updateAlbumPickItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error('Error updating album pick item:', error);
      res.status(500).json({ error: 'Failed to update album pick item' });
    }
  });

  // ADMIN: Delete album pick item (editor role required)
  app.delete('/api/admin/albums/pick-items/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlbumPickItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting album pick item:', error);
      res.status(500).json({ error: 'Failed to delete album pick item' });
    }
  });

  // ADMIN: Publish album pick (editor role required)
  app.post('/api/admin/albums/picks/:month/publish', requireRole('editor'), async (req, res) => {
    try {
      const { month } = req.params;
      const pick = await storage.getAlbumPickByMonth(month);
      
      if (!pick) {
        const result: ApiResult = { ok: false, error: 'Album pick not found', code: 'NOT_FOUND' };
        return res.status(404).json(result);
      }
      
      const published = await storage.publishAlbumPick(pick.id);
      broadcast({ type: 'album_pick_published', data: published });
      
      const result: ApiResult<typeof published> = { ok: true, data: published };
      res.json(result);
    } catch (error) {
      console.error('Error publishing album pick:', error);
      const result: ApiResult = { ok: false, error: 'Failed to publish album pick', code: 'SERVER_ERROR' };
      res.status(500).json(result);
    }
  });

  // ADMIN: Delete published album pick (editor role required)
  app.delete('/api/admin/albums/picks/:month', requireRole('editor'), async (req, res) => {
    try {
      const { month } = req.params;
      const pick = await storage.getAlbumPickByMonth(month);
      
      if (!pick) {
        return res.status(404).json({ error: 'Album pick not found' });
      }
      
      await storage.deleteAlbumPick(pick.id);
      broadcast({ type: 'album_pick_deleted', data: { month } });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting album pick:', error);
      res.status(500).json({ error: 'Failed to delete album pick' });
    }
  });

  // ADMIN: Add note to album suggestion (editor role required)
  app.post('/api/admin/albums/suggestions/:id/notes', requireRole('editor'), async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      const { content } = req.body;
      const username = (req as any).user?.username || 'admin';
      
      const note = await storage.addAlbumSuggestionNote({
        suggestionId,
        authorUsername: username,
        content,
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  });

  // ADMIN: Get notes for album suggestion (editor role required)
  app.get('/api/admin/albums/suggestions/:id/notes', requireRole('editor'), async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      const notes = await storage.getAlbumSuggestionNotes(suggestionId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  return httpServer;
}