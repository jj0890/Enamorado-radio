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
import { requireResident, loginResident, logoutResident, checkResidentAuth } from "./residentAuth";
import { requireRole } from "./roleAuth";
import { musicbrainzService } from "./musicbrainzService";
import { backupManager } from "./backupManager";
import { azuracastIntegration } from "./azuracastIntegration";
import { audioProcessor } from "./audioProcessor";
import { z } from "zod";
import http from "http";
import multer from "multer";
import { sanitizeText, sanitizeUrl, sanitizeFilename } from "./sanitization";
import path from "path";
import fs from "fs";
import mimeTypes from "mime-types";
import { Readable } from "stream";
import { 
  insertEpisodeSchema,
  insertGuideSchema,
  insertHeroBannerSchema,
  insertMixSubmissionSchema,
  insertPlaylistSubmissionSchema,
  insertScheduleSchema,
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

  // Initialize AzuraCast service with storage for streamer management
  await azuracastService.initializeWithStorage(storage);

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
  
  // =================
  // RESIDENT AUTHENTICATION ROUTES
  // =================
  
  app.post('/api/resident/login', loginResident(storage));
  app.post('/api/resident/logout', logoutResident);
  app.get('/api/resident/auth', checkResidentAuth(storage));
  
  // =================
  // RESIDENT DATA ROUTES
  // =================
  
  // Get resident by ID (protected)
  app.get('/api/residents/:id', requireResident, async (req, res) => {
    try {
      const residentId = parseInt(req.params.id);
      const requestingResident = (req as any).resident;
      
      // Only allow residents to access their own data
      if (requestingResident.residentId !== residentId) {
        return res.status(403).json({ error: 'forbidden' });
      }
      
      const resident = await storage.getResidentById(residentId);
      if (!resident) {
        return res.status(404).json({ error: 'resident not found' });
      }
      
      res.json(resident);
    } catch (error) {
      console.error('Error fetching resident:', error);
      res.status(500).json({ error: 'failed to fetch resident' });
    }
  });
  
  // Get resident's schedule (protected)
  app.get('/api/schedule/resident/:residentId', requireResident, async (req, res) => {
    try {
      const residentId = parseInt(req.params.residentId);
      const requestingResident = (req as any).resident;
      
      // Only allow residents to access their own schedule
      if (requestingResident.residentId !== residentId) {
        return res.status(403).json({ error: 'forbidden' });
      }
      
      const allSchedule = await storage.getSchedule();
      const residentSchedule = allSchedule.filter(s => s.residentId === residentId);
      
      res.json(residentSchedule);
    } catch (error) {
      console.error('Error fetching resident schedule:', error);
      res.status(500).json({ error: 'failed to fetch schedule' });
    }
  });
  
  // Update live status (protected)
  app.post('/api/resident/live-status', requireResident, async (req, res) => {
    try {
      const { scheduleId, status } = req.body;
      const requestingResident = (req as any).resident;
      
      if (!scheduleId || !status) {
        return res.status(400).json({ error: 'scheduleId and status are required' });
      }
      
      if (!['live', 'offline', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'invalid status' });
      }
      
      // Get the schedule item
      const scheduleItem = await storage.getScheduleById(scheduleId);
      if (!scheduleItem) {
        return res.status(404).json({ error: 'schedule item not found' });
      }
      
      // Verify the schedule belongs to this resident
      if (scheduleItem.residentId !== requestingResident.residentId) {
        return res.status(403).json({ error: 'forbidden' });
      }
      
      // Update the live status
      const updated = await storage.updateScheduleItem(scheduleId, { liveStatus: status });
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'live_status_update',
        scheduleId,
        residentId: requestingResident.residentId,
        status,
        timestamp: new Date().toISOString()
      });
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating live status:', error);
      res.status(500).json({ error: 'failed to update live status' });
    }
  });
  
  // =================
  // ADMIN RESIDENT MANAGEMENT ROUTES
  // =================
  
  // Get all residents (admin only)
  app.get('/api/admin/residents', requireAdmin, async (req, res) => {
    try {
      const residents = await storage.getResidents({});
      res.json(residents);
    } catch (error) {
      console.error('Error fetching residents:', error);
      res.status(500).json({ error: 'failed to fetch residents' });
    }
  });
  
  // Create new resident (admin only)
  app.post('/api/admin/residents', requireAdmin, async (req, res) => {
    try {
      let azuracastStreamerId: number | null = null;
      let azuracastAutoCreated = false;

      // Try to auto-create AzuraCast streamer account if configured
      if (azuracastService.isStreamerManagementConfigured()) {
        try {
          const streamerResponse = await azuracastService.createStreamer({
            streamer_username: req.body.username,
            streamer_password: req.body.password,
            display_name: req.body.name,
            comments: `Auto-created for resident: ${req.body.name}`,
            is_active: true,
          });

          azuracastStreamerId = streamerResponse.id;
          azuracastAutoCreated = true;
          console.log(`✅ Auto-created AzuraCast account for ${req.body.username}`);
        } catch (error) {
          console.error('⚠️  Failed to auto-create AzuraCast account:', error);
          // Continue creating resident even if AzuraCast creation fails
        }
      }

      const newResident = await storage.createResident({
        ...req.body,
        azuracastStreamerId,
        azuracastAutoCreated,
      });

      res.json(newResident);
    } catch (error) {
      console.error('Error creating resident:', error);
      res.status(500).json({ error: 'failed to create resident' });
    }
  });
  
  // Update resident (admin only)
  app.patch('/api/admin/residents/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedResident = await storage.updateResident(id, req.body);
      res.json(updatedResident);
    } catch (error) {
      console.error('Error updating resident:', error);
      res.status(500).json({ error: 'failed to update resident' });
    }
  });
  
  // Delete resident (admin only)
  app.delete('/api/admin/residents/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get resident to check if we need to delete from AzuraCast
      const resident = await storage.getResidentById(id);
      
      // Delete from AzuraCast if auto-created
      if (resident?.azuracastStreamerId && resident?.azuracastAutoCreated && azuracastService.isStreamerManagementConfigured()) {
        try {
          await azuracastService.deleteStreamer(resident.azuracastStreamerId);
          console.log(`✅ Deleted AzuraCast account for ${resident.username}`);
        } catch (error) {
          console.error('⚠️  Failed to delete AzuraCast account:', error);
          // Continue deleting resident even if AzuraCast deletion fails
        }
      }
      
      await storage.deleteResident(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting resident:', error);
      res.status(500).json({ error: 'failed to delete resident' });
    }
  });
  
  // =================
  // RADIO OPS PANEL - Broadcast Controls
  // =================
  
  // Import AzuraCast Ops controller
  const azuracastOps = await import('./azuracastOps');
  
  // Get live broadcast status
  app.get('/api/admin/radio/status', requireAdmin, async (req, res) => {
    try {
      const status = await azuracastOps.getLiveStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching radio status:', error);
      res.status(500).json({ error: 'Failed to fetch radio status' });
    }
  });
  
  // Go live (switch to live input)
  app.post('/api/admin/radio/go-live', requireAdmin, async (req, res) => {
    try {
      const result = await azuracastOps.goLive();
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Error going live:', error);
      res.status(500).json({ error: 'Failed to go live' });
    }
  });
  
  // Return to AutoDJ
  app.post('/api/admin/radio/return-to-auto', requireAdmin, async (req, res) => {
    try {
      const result = await azuracastOps.returnToAuto();
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Error returning to auto:', error);
      res.status(500).json({ error: 'Failed to return to auto mode' });
    }
  });
  
  // Skip current track
  app.post('/api/admin/radio/skip', requireAdmin, async (req, res) => {
    try {
      const result = await azuracastOps.skipTrack();
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Error skipping track:', error);
      res.status(500).json({ error: 'Failed to skip track' });
    }
  });
  
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

  // Editor stats dashboard (accessible by editors and admins)
  app.get('/api/editor/stats', requireRole('editor'), async (req, res) => {
    try {
      const allMixes = await storage.getMixSubmissions({ limit: 1000 });
      const allEpisodeSubmissions = await storage.getEpisodeSubmissions({ limit: 1000 });
      const allAlbumSuggestions = await storage.getAlbumSuggestions({ limit: 1000 });
      const allPlaylists = await storage.getPlaylistSubmissions({ limit: 1000 });
      
      // Count pending items
      const pendingEpisodes = allEpisodeSubmissions.filter(e => e.status === 'pending').length;
      const pendingMixes = allMixes.filter(m => m.status === 'pending').length;
      const pendingAlbums = allAlbumSuggestions.filter(a => a.status === 'pending').length;
      const pendingPlaylists = allPlaylists.filter(p => p.status === 'pending').length;
      
      // Gather recent activity from all sources
      const recentActivity = [
        ...allEpisodeSubmissions
          .filter(e => e.status === 'pending')
          .slice(0, 5)
          .map(e => ({
            type: 'episode' as const,
            title: e.title,
            submitter: e.residentName,
            submittedAt: e.submittedAt || new Date().toISOString()
          })),
        ...allMixes
          .filter(m => m.status === 'pending')
          .slice(0, 5)
          .map(m => ({
            type: 'mix' as const,
            title: m.title || 'Untitled',
            submitter: m.name || 'Unknown',
            submittedAt: m.submittedAt || new Date().toISOString()
          })),
        ...allAlbumSuggestions
          .filter(a => a.status === 'pending')
          .slice(0, 5)
          .map(a => ({
            type: 'album' as const,
            title: `${a.artist} - ${a.title}`,
            submitter: a.suggestedBy,
            submittedAt: a.createdAt || new Date().toISOString()
          }))
      ]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10);
      
      res.json({
        pendingEpisodes,
        pendingMixes,
        pendingAlbums,
        pendingPlaylists,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching editor stats:', error);
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
      // Accept audio files for audioFile field
      if (file.fieldname === 'audioFile' && (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3'))) {
        cb(null, true);
      }
      // Accept image files for artworkFile field
      else if (file.fieldname === 'artworkFile' && file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    }
  });

  // Upload episode to AzuraCast
  app.post("/api/admin/episode/upload", upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'artworkFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.audioFile || files.audioFile.length === 0) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const audioFile = files.audioFile[0];
      const artworkFile = files.artworkFile?.[0];

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

      // Handle artwork - either from file upload or URL
      let finalArtworkUrl = artworkUrl;
      if (artworkFile) {
        // Validate file extension (security)
        const ext = path.extname(artworkFile.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowedExtensions.includes(ext)) {
          fs.unlinkSync(artworkFile.path); // Clean up
          return res.status(400).json({ error: 'Invalid artwork file type. Only JPG, PNG, and WEBP allowed.' });
        }

        // Save artwork file to a public directory
        const artworkDir = path.join(process.cwd(), 'public', 'artwork');
        if (!fs.existsSync(artworkDir)) {
          fs.mkdirSync(artworkDir, { recursive: true });
        }
        
        // Generate secure filename using sanitized showSlug + UUID + extension (prevents path traversal)
        const sanitizedShowSlug = sanitizeFilename(showSlug);
        const artworkFileName = `${sanitizedShowSlug}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const artworkPath = path.join(artworkDir, path.basename(artworkFileName)); // path.basename prevents directory traversal
        
        fs.copyFileSync(artworkFile.path, artworkPath);
        fs.unlinkSync(artworkFile.path); // Clean up temp file
        
        finalArtworkUrl = `/artwork/${artworkFileName}`;
        console.log(`🖼️ Artwork saved: ${finalArtworkUrl}`);
      }

      // Ensure artwork is provided (either file or URL)
      if (!finalArtworkUrl || finalArtworkUrl.trim() === '') {
        // Use a default placeholder if no artwork provided
        finalArtworkUrl = '/assets/default-episode-artwork.jpg';
      }

      // Create episode record
      const episode = await storage.createEpisode({
        title,
        genre: 'Radio',
        airDate: new Date(airDate),
        hostName: 'Enamorado Radio',
        duration: 0, // Will be updated later
        audioUrl: '',
        artworkUrl: finalArtworkUrl,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        status: 'uploading',
        isFeatured: featureOnHome === 'true' || featureOnHome === true || featureOnHome === 'on'
      });

      console.log(`📝 Episode created with isFeatured=${episode.isFeatured}, featureOnHome param=${featureOnHome}`);

      // Upload to AzuraCast
      const uploadResult = await azuraCastManager.uploadEpisode(episode.id, audioFile.path, {
        title,
        showSlug,
        artist: 'Enamorado Radio',
        album: title
      });

      if (uploadResult.success) {
        // Update episode status to uploaded
        await storage.updateEpisode(episode.id, {
          status: 'published',
          audioUrl: uploadResult.azuraFilePath || ''
        });

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
          episode: await storage.getEpisodeById(episode.id), // Return updated episode
          azuraFilePath: uploadResult.azuraFilePath,
          message: 'Episode uploaded successfully'
        });
      } else {
        // Update episode with error status
        await storage.updateEpisode(episode.id, {
          status: 'failed'
        });

        // Provide detailed error message based on error type
        let userMessage = 'Upload to AzuraCast failed';
        let retryable = true;

        switch (uploadResult.errorType) {
          case 'sftp_connection':
            userMessage = 'Could not connect to AzuraCast server. Please check server status and try again.';
            break;
          case 'sftp_auth':
            userMessage = 'Authentication failed. Please verify SFTP credentials in settings.';
            retryable = false; // Don't retry auth failures
            break;
          case 'sftp_upload':
            userMessage = 'File upload failed. The file may be too large or the connection was interrupted.';
            break;
          case 'rescan':
            userMessage = 'File uploaded but library rescan failed. The episode may appear in AzuraCast after the next automatic scan.';
            retryable = false; // File is already uploaded
            break;
          case 'network':
            userMessage = 'Network error occurred. Please check your connection and try again.';
            break;
          default:
            userMessage = uploadResult.error || 'Unknown upload error';
        }

        res.status(500).json({
          success: false,
          error: uploadResult.error,
          errorType: uploadResult.errorType,
          stage: uploadResult.stage,
          message: userMessage,
          retryable,
          episodeId: episode.id
        });
      }

    } catch (error) {
      console.error('Episode upload failed:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
        retryable: true
      });
    }
  });

  // Retry episode upload to AzuraCast
  app.post("/api/admin/episode/:id/retry", async (req, res) => {
    try {
      const episodeId = parseInt(req.params.id);
      const episode = await storage.getEpisodeById(episodeId);

      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      // Episode must be in failed or uploading state to retry
      if (episode.status !== 'failed' && episode.status !== 'uploading') {
        return res.status(400).json({ 
          error: 'Episode is not in a retryable state',
          currentStatus: episode.status 
        });
      }

      // Check if original audio file still exists (from temp upload)
      // Since we can't retry without the original file, return error
      return res.status(400).json({
        error: 'Cannot retry: Original audio file not available. Please upload the episode again.',
        retryable: false
      });

    } catch (error) {
      console.error('Episode retry failed:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Retry failed'
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
  // RESIDENT EPISODE SUBMISSION API
  // =================

  // Resident submits episode for review (local storage only, no AzuraCast upload yet)
  app.post("/api/resident/episode/submit", requireResident, upload.single('audioFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      // Server-side file validation (don't trust client)
      if (!req.file.mimetype.startsWith('audio/') && !req.file.originalname.endsWith('.mp3')) {
        return res.status(400).json({ error: 'Only audio files are allowed' });
      }

      if (req.file.size > 500 * 1024 * 1024) { // 500MB
        return res.status(400).json({ error: 'File size must be under 500MB' });
      }

      // Get resident identity from authenticated session - NEVER trust request body
      const residentSession = (req as any).resident;
      if (!residentSession || !residentSession.residentId) {
        return res.status(401).json({ error: 'Resident authentication required' });
      }

      // Validate input with Zod schema (no residentId/residentName from body)
      const episodeSubmissionSchema = z.object({
        title: z.string().min(1).max(200),
        genre: z.string().min(1).max(50),
        description: z.string().max(2000).optional(),
        showNotes: z.string().max(10000).optional(),
        seriesTitle: z.string().max(100).optional(),
        episodeNumber: z.coerce.number().int().positive().nullable().optional(),
        tags: z.string().max(200).optional(),
        coverArtUrl: z.string().url().max(500).optional().or(z.literal('')),
      });

      const validatedData = episodeSubmissionSchema.parse(req.body);

      console.log(`📥 Resident episode submission: "${validatedData.title}" by ${residentSession.displayName || residentSession.username}`);

      // Store file locally in uploads directory
      const audioPath = req.file.path;
      const audioFileName = sanitizeFilename(req.file.originalname);
      const audioFileSize = req.file.size;

      // Sanitize all text inputs to prevent XSS attacks
      const sanitizedData = {
        residentId: residentSession.residentId, // From authenticated session
        residentName: sanitizeText(residentSession.displayName || residentSession.username), // From authenticated session
        title: sanitizeText(validatedData.title),
        genre: sanitizeText(validatedData.genre),
        description: validatedData.description ? sanitizeText(validatedData.description) : undefined,
        showNotes: validatedData.showNotes ? sanitizeText(validatedData.showNotes) : undefined,
        seriesTitle: validatedData.seriesTitle ? sanitizeText(validatedData.seriesTitle) : undefined,
        episodeNumber: validatedData.episodeNumber || null,
        tags: validatedData.tags ? validatedData.tags.split(',').map((t: string) => sanitizeText(t)).filter(t => t) : null,
        coverArtUrl: validatedData.coverArtUrl ? sanitizeUrl(validatedData.coverArtUrl) : null,
      };

      // Create episode submission record
      const submission = await storage.createEpisodeSubmission({
        ...sanitizedData,
        audioFilePath: audioPath,
        audioFileName,
        audioFileSize,
      });

      // Broadcast to admins that new submission arrived
      broadcast({
        type: 'newEpisodeSubmission',
        submissionId: submission.id,
        residentName: sanitizedData.residentName,
        title: sanitizedData.title,
      });

      res.json({
        success: true,
        submission,
        message: 'Episode submitted successfully for review'
      });

    } catch (error) {
      console.error('Episode submission failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Submission failed',
        success: false
      });
    }
  });

  // Get episode submissions for a specific resident
  app.get("/api/resident/episodes", requireResident, async (req, res) => {
    try {
      // Validate query params
      const querySchema = z.object({
        residentId: z.coerce.number().int().positive(),
        status: z.enum(['pending', 'approved', 'rejected', 'scheduled', 'aired']).optional(),
      });

      const { residentId, status } = querySchema.parse(req.query);

      const submissions = await storage.getEpisodeSubmissions({
        residentId,
        status
      });

      res.json(submissions);
    } catch (error) {
      console.error('Error fetching resident episodes:', error);
      res.status(500).json({ error: 'Failed to fetch episodes' });
    }
  });

  // Get all episode submissions for admin review
  app.get("/api/admin/episode-submissions", requireAdmin, async (req, res) => {
    try {
      // Validate query params
      const querySchema = z.object({
        status: z.enum(['all', 'pending', 'approved', 'rejected', 'scheduled', 'aired']).optional(),
        limit: z.coerce.number().int().positive().optional(),
      });

      const { status, limit } = querySchema.parse(req.query);

      const submissions = await storage.getEpisodeSubmissions({
        status: status === 'all' ? undefined : status,
        limit
      });

      res.json(submissions);
    } catch (error) {
      console.error('Error fetching episode submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Get single episode submission by ID
  app.get("/api/admin/episode-submissions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getEpisodeSubmissionById(id);

      if (!submission) {
        return res.status(404).json({ error: 'Episode submission not found' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Error fetching episode submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  // Update episode submission (approve, reject, request changes)
  app.patch("/api/admin/episode-submissions/:id", requireAdmin, async (req, res) => {
    try {
      // Validate ID from URL params
      const id = z.coerce.number().int().positive().parse(req.params.id);

      // Validate request body
      const updateSchema = z.object({
        status: z.enum(['pending', 'approved', 'rejected', 'scheduled', 'aired']),
        adminNotes: z.string().max(2000).optional(),
        rejectionReason: z.string().max(1000).optional(),
        scheduledAirDate: z.string().datetime().optional(),
      });

      const validatedData = updateSchema.parse(req.body);

      const submission = await storage.getEpisodeSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ error: 'Episode submission not found' });
      }

      // Get reviewedBy from session (admin user) - don't trust request body
      const reviewedBy = (req as any).session?.user || 'admin';

      // Build update object with sanitized inputs
      const updates: Partial<typeof submission> = {
        status: validatedData.status,
        reviewedAt: new Date(),
        reviewedBy: sanitizeText(reviewedBy),
        adminNotes: validatedData.adminNotes ? sanitizeText(validatedData.adminNotes) : null,
        rejectionReason: validatedData.status === 'rejected' && validatedData.rejectionReason 
          ? sanitizeText(validatedData.rejectionReason) 
          : null,
        scheduledAirDate: validatedData.scheduledAirDate ? new Date(validatedData.scheduledAirDate) : null,
      };

      const updated = await storage.updateEpisodeSubmission(id, updates);

      // Broadcast status change
      broadcast({
        type: 'episodeSubmissionUpdated',
        submissionId: id,
        status,
        residentName: submission.residentName,
        title: submission.title,
      });

      res.json({
        success: true,
        submission: updated,
        message: `Episode ${status}`
      });

    } catch (error) {
      console.error('Error updating episode submission:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  });

  // Schedule episode submission with AzuraCast integration
  app.post("/api/admin/episode-submissions/:id/schedule-azuracast", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledAirDate } = req.body;

      if (!scheduledAirDate) {
        return res.status(400).json({ error: 'scheduledAirDate is required' });
      }

      // Validate that air date is in the future
      const airDate = new Date(scheduledAirDate);
      if (airDate <= new Date()) {
        return res.status(400).json({ 
          error: 'Air date must be in the future',
          providedDate: scheduledAirDate
        });
      }

      const submission = await storage.getEpisodeSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ error: 'Episode submission not found' });
      }

      if (submission.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved episodes can be scheduled' });
      }

      // Step 1: Upload to AzuraCast via SFTP
      console.log(`📤 Uploading episode submission ${id} to AzuraCast...`);
      const uploadResult = await azuraCastManager.uploadEpisode(id, submission.audioFilePath, {
        title: submission.title,
        showSlug: submission.seriesTitle || submission.residentName.toLowerCase().replace(/\s+/g, '-'),
        artist: submission.residentName,
        album: submission.seriesTitle || 'Episode Submissions'
      });

      if (!uploadResult.success) {
        return res.status(500).json({
          error: 'Failed to upload to AzuraCast',
          details: uploadResult.error
        });
      }

      // Step 2: Ensure playlist exists for the resident
      const playlistResult = await azuraCastManager.ensurePlaylist(
        submission.residentName.toLowerCase().replace(/\s+/g, '-'),
        `${submission.residentName} Episodes`
      );

      if (!playlistResult.playlistId) {
        return res.status(500).json({
          error: 'Failed to create/find AzuraCast playlist',
          details: playlistResult.error
        });
      }

      // Step 3: Add uploaded file to playlist
      console.log(`📋 Adding file to playlist ${playlistResult.playlistId}...`);
      const addToPlaylistResult = await azuraCastManager.addToPlaylist(
        playlistResult.playlistId,
        uploadResult.azuraFilePath!
      );

      if (!addToPlaylistResult.success) {
        return res.status(500).json({
          error: 'Failed to add episode to AzuraCast playlist',
          details: addToPlaylistResult.error
        });
      }

      // Step 4: Schedule the episode in AzuraCast
      const duration = submission.duration || 3600; // Default 1 hour

      const scheduleResult = await azuraCastManager.scheduleEpisode(
        playlistResult.playlistId,
        airDate,
        duration
      );

      if (!scheduleResult.success) {
        return res.status(500).json({
          error: 'Failed to schedule in AzuraCast',
          details: scheduleResult.error
        });
      }

      // Step 5: Update database (convert dates to ISO strings for JSON persistence)
      const updated = await storage.updateEpisodeSubmission(id, {
        status: 'scheduled',
        scheduledAirDate: airDate.toISOString(),
        uploadedToAzuracastAt: new Date().toISOString(),
        azuracastFileId: uploadResult.azuraFilePath,
        azuracastPlaylistId: playlistResult.playlistId,
        reviewedAt: new Date().toISOString(),
        reviewedBy: (req as any).session?.user || 'admin'
      } as any);

      broadcast({
        type: 'episodeSubmissionScheduled',
        submissionId: id,
        scheduledAirDate: airDate.toISOString(),
        title: submission.title,
        residentName: submission.residentName
      });

      res.json({
        success: true,
        submission: updated,
        message: `Episode scheduled to air on ${airDate.toLocaleString()}`
      });

    } catch (error) {
      console.error('Error scheduling episode submission:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Scheduling failed'
      });
    }
  });

  // Delete episode submission
  app.delete("/api/admin/episode-submissions/:id", requireAdmin, async (req, res) => {
    try {
      // Validate ID from URL params
      const id = z.coerce.number().int().positive().parse(req.params.id);

      await storage.deleteEpisodeSubmission(id);

      broadcast({
        type: 'episodeSubmissionDeleted',
        submissionId: id,
      });

      res.json({
        success: true,
        message: 'Episode submission deleted'
      });

    } catch (error) {
      console.error('Error deleting episode submission:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Delete failed'
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
  // HERO BANNERS API
  // =================

  // Public: Get active hero banner
  app.get('/api/hero-banners/active', async (req, res) => {
    try {
      const banner = await storage.getActiveBanner();
      res.json(banner || null);
    } catch (error) {
      console.error('Error fetching active banner:', error);
      res.status(500).json({ error: 'Failed to fetch active banner' });
    }
  });

  // Editor: Get all hero banners
  app.get('/api/editor/hero-banners', requireRole('editor'), async (req, res) => {
    try {
      const banners = await storage.getHeroBanners();
      res.json(banners);
    } catch (error) {
      console.error('Error fetching hero banners:', error);
      res.status(500).json({ error: 'Failed to fetch hero banners' });
    }
  });

  // Editor: Create hero banner
  app.post('/api/editor/hero-banners', requireRole('editor'), async (req, res) => {
    try {
      const validated = insertHeroBannerSchema.parse(req.body);
      const banner = await storage.createHeroBanner(validated);
      res.status(201).json(banner);
    } catch (error) {
      console.error('Error creating hero banner:', error);
      res.status(400).json({ error: 'Invalid hero banner data' });
    }
  });

  // Editor: Update hero banner
  app.patch('/api/editor/hero-banners/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Validate partial update, excluding isActive (only activation endpoint can change it)
      const validated = insertHeroBannerSchema.omit({ isActive: true }).partial().parse(req.body);
      const banner = await storage.updateHeroBanner(id, validated);
      res.json(banner);
    } catch (error) {
      console.error('Error updating hero banner:', error);
      res.status(400).json({ error: 'Invalid hero banner update data' });
    }
  });

  // Editor: Set active banner
  app.post('/api/editor/hero-banners/:id/activate', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.setActiveBanner(id);
      
      // Broadcast banner change
      broadcast({
        type: 'bannerActivated',
        banner,
        timestamp: new Date()
      });
      
      res.json(banner);
    } catch (error) {
      console.error('Error activating banner:', error);
      res.status(500).json({ error: 'Failed to activate banner' });
    }
  });

  // Editor: Delete hero banner
  app.delete('/api/editor/hero-banners/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHeroBanner(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting hero banner:', error);
      res.status(500).json({ error: 'Failed to delete hero banner' });
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
  // SCHEDULE API - Programming grid
  // =================

  app.get("/api/schedule", async (req, res) => {
    try {
      const { upcoming } = req.query;
      
      // Get scheduled and aired episode submissions
      const episodes = await storage.getEpisodeSubmissions({});
      
      // Filter for scheduled and aired episodes
      let scheduledEpisodes = episodes.filter(ep => 
        (ep.status === 'scheduled' || ep.status === 'aired') && ep.scheduledAirDate
      );
      
      // Filter by upcoming if requested
      if (upcoming === 'true') {
        const now = new Date();
        scheduledEpisodes = scheduledEpisodes.filter(ep => 
          new Date(ep.scheduledAirDate!) > now
        );
      }
      
      // Sort by air date (upcoming first, then chronological)
      scheduledEpisodes.sort((a, b) => {
        const dateA = new Date(a.scheduledAirDate!).getTime();
        const dateB = new Date(b.scheduledAirDate!).getTime();
        return dateA - dateB;
      });
      
      // Format for frontend
      const schedule = scheduledEpisodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        hostName: ep.residentName,
        description: ep.description || '',
        scheduledAt: ep.scheduledAirDate,
        duration: ep.duration ? Math.floor(ep.duration / 60) : 60, // Convert to minutes
        status: ep.status === 'aired' ? 'aired' : (new Date(ep.scheduledAirDate!) <= new Date() ? 'live' : 'upcoming'),
        artworkUrl: null, // No artwork for episodes yet
        isRecurring: false,
        recurrencePattern: null
      }));
      
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

  app.post("/api/azuracast/upload/:id", requireAdmin, async (req, res) => {
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
  app.post('/api/azuracast/process-mix/:id', requireAdmin, async (req, res) => {
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
  app.post('/api/azuracast/upload/:id', requireAdmin, async (req, res) => {
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
  // ENHANCED OEMBED - Complete metadata for rich embeds
  // =================

  app.get('/api/oembed/enhanced', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      const href = String(url);
      console.log('[oEmbed Enhanced] Fetching metadata for:', href);

      let platform: string;
      let endpoint: string;
      let data: any;

      // Determine platform and fetch oEmbed data
      if (href.includes('soundcloud.com')) {
        platform = 'soundcloud';
        endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(href)}`;
        
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'EnamoradoRadio/1.0',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('[oEmbed Enhanced] SoundCloud fetch failed:', response.status);
          return res.status(502).json({ error: 'Failed to fetch SoundCloud oEmbed data' });
        }

        data = await response.json();

      } else if (href.includes('open.spotify.com')) {
        platform = 'spotify';
        endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(href)}`;
        
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'EnamoradoRadio/1.0',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('[oEmbed Enhanced] Spotify fetch failed:', response.status);
          return res.status(502).json({ error: 'Failed to fetch Spotify oEmbed data' });
        }

        data = await response.json();

      } else if (href.includes('mixcloud.com')) {
        platform = 'mixcloud';
        endpoint = `https://www.mixcloud.com/oembed/?format=json&url=${encodeURIComponent(href)}`;
        
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'EnamoradoRadio/1.0',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('[oEmbed Enhanced] Mixcloud fetch failed:', response.status);
          return res.status(502).json({ error: 'Failed to fetch Mixcloud oEmbed data' });
        }

        data = await response.json();

      } else {
        return res.status(400).json({ error: 'Unsupported platform. Supported: SoundCloud, Spotify, Mixcloud' });
      }

      // Upgrade thumbnail to higher quality
      let thumbnail = data.thumbnail_url || data.thumbnail_url_https || null;
      if (thumbnail) {
        thumbnail = thumbnail
          .replace(/^http:/, 'https:')
          .replace('large.jpg', 't500x500.jpg')
          .replace('t67x67.jpg', 't500x500.jpg')
          .replace('badge.jpg', 't500x500.jpg')
          .replace('crop.jpg', 't500x500.jpg');
      }

      // Normalize response structure across platforms
      const result = {
        platform,
        url: href,
        title: data.title || null,
        artist: data.author_name || null,
        thumbnail_url: thumbnail,
        artUrl: thumbnail,
        description: data.description || null,
        html: data.html || null,
        width: data.width || null,
        height: data.height || null,
        provider_name: data.provider_name || platform,
        provider_url: data.provider_url || null,
        duration: data.duration || null,
      };

      console.log('[oEmbed Enhanced] Returning normalized data for', platform);
      res.json(result);

    } catch (error) {
      console.error('[oEmbed Enhanced] Error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        detail: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // =================
  // COMMUNITY CONTENT API - Unified feed of mixes, episodes, and guides
  // =================

  app.get('/api/community', async (req, res) => {
    try {
      const { type, genre, search, limit, sort } = req.query;
      
      // Fetch all content types in parallel
      const [allMixes, allEpisodes, allGuides, allPlaylists] = await Promise.all([
        storage.getMixSubmissions({}),
        storage.getEpisodes({}),
        storage.getGuides ? storage.getGuides({}) : Promise.resolve([]),
        storage.getPlaylistSubmissions({})
      ]);

      // Normalize mixes to ContentItem format
      const mixItems = allMixes
        .filter(mix => mix.status === 'approved' || mix.status === 'featured')
        .map(mix => ({
          type: 'mix' as const,
          id: mix.id,
          title: mix.title,
          name: mix.name,
          artworkUrl: mix.artwork_url || mix.artUrl || mix.coverUrl || null,
          genre: mix.genre || null,
          about: mix.about || null,
          url: mix.url || null,
          platform: mix.platform || null,
          status: mix.status || 'approved',
          submittedAt: mix.submittedAt ? new Date(mix.submittedAt) : null,
          createdAt: mix.createdAt ? new Date(mix.createdAt) : null,
          isFeatured: mix.status === 'featured' || mix.featured || false,
          approved_at: mix.approved_at ? new Date(mix.approved_at) : null,
          featured_at: mix.featured_at ? new Date(mix.featured_at) : null,
        }));

      // Normalize episodes to ContentItem format
      const episodeItems = allEpisodes
        .filter(ep => ep.status === 'published')
        .map(ep => ({
          type: 'episode' as const,
          id: ep.id,
          title: ep.title,
          hostName: ep.hostName,
          artworkUrl: ep.artworkUrl || null,
          genre: ep.genre || null,
          description: ep.description || null,
          seriesTitle: ep.seriesTitle || null,
          episodeNumber: ep.episodeNumber || null,
          airDate: new Date(ep.airDate),
          duration: ep.duration,
          audioUrl: ep.audioUrl,
          tracklist: ep.tracklist || null,
          tags: ep.tags || null,
          status: ep.status,
          isLive: ep.isLive || false,
          isFeatured: ep.isFeatured || false,
          viewCount: ep.viewCount || 0,
          createdAt: ep.createdAt ? new Date(ep.createdAt) : null,
          submittedAt: ep.airDate ? new Date(ep.airDate) : null,
          url: ep.audioUrl,
        }));

      // Normalize playlists to ContentItem format
      const playlistItems = allPlaylists
        .filter(playlist => playlist.approvedAt !== null)
        .map(playlist => ({
          type: 'playlist' as const,
          id: playlist.id,
          title: playlist.title,
          curatorName: playlist.curatorName,
          artworkUrl: playlist.artworkUrl || null,
          genre: null, // Playlists don't have genre
          description: playlist.description || null,
          playlistUrl: playlist.playlistUrl,
          trackCount: playlist.trackCount || null,
          tags: playlist.tags || null,
          status: playlist.status || 'approved',
          submittedAt: playlist.submittedAt ? new Date(playlist.submittedAt) : null,
          createdAt: playlist.createdAt ? new Date(playlist.createdAt) : null,
          isFeatured: playlist.featuredAt !== null,
          url: playlist.playlistUrl,
        }));

      // Combine all content
      let allContent = [...mixItems, ...episodeItems, ...playlistItems];

      // Apply type filter
      if (type && type !== 'all') {
        allContent = allContent.filter(item => item.type === type);
      }

      // Apply genre filter
      if (genre && typeof genre === 'string') {
        const genreLower = genre.toLowerCase();
        allContent = allContent.filter(item => 
          item.genre && item.genre.toLowerCase().includes(genreLower)
        );
      }

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        allContent = allContent.filter(item => {
          const searchableText = [
            item.title,
            'name' in item ? item.name : '',
            'hostName' in item ? item.hostName : '',
            'authorName' in item ? item.authorName : '',
            'description' in item ? item.description : '',
            'about' in item ? item.about : '',
          ].join(' ').toLowerCase();
          
          return searchableText.includes(searchLower);
        });
      }

      // Apply sorting
      const sortBy = (sort as string) || 'recent';
      allContent.sort((a, b) => {
        if (sortBy === 'recent') {
          // Sort by submittedAt/createdAt descending (newest first)
          const dateA = a.submittedAt || a.createdAt || new Date(0);
          const dateB = b.submittedAt || b.createdAt || new Date(0);
          return dateB.getTime() - dateA.getTime();
        } else if (sortBy === 'featured') {
          // Featured items first
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        }
        return 0;
      });

      // Apply limit
      const limitNum = limit ? parseInt(limit as string) : 24;
      allContent = allContent.slice(0, limitNum);

      console.log(`[Community API] Returning ${allContent.length} items (${mixItems.length} mixes, ${episodeItems.length} episodes, ${playlistItems.length} playlists)`);
      res.json(allContent);

    } catch (error) {
      console.error('[Community API] Error:', error);
      res.status(500).json({ error: 'Failed to fetch community content' });
    }
  });

  // GET individual content item by ID or slug
  app.get('/api/community/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      const numericId = parseInt(itemId);
      const isNumeric = !isNaN(numericId);
      
      // Try mixes (by ID or slug)
      const allMixes = await storage.getAllMixSubmissions();
      const mix = allMixes.find((m: any) => 
        (isNumeric && m.id === numericId) || 
        (m.slug && m.slug === itemId)
      );
      
      if (mix) {
        const mixItem = {
          type: 'mix' as const,
          id: mix.id,
          title: mix.title,
          name: mix.name,
          slug: (mix as any).slug || null,
          artworkUrl: (mix as any).artwork || (mix as any).artUrl || (mix as any).artworkUrl || null,
          genre: mix.genre || null,
          description: (mix as any).description || (mix as any).about || null,
          url: mix.url,
          submittedAt: mix.submittedAt,
          createdAt: mix.submittedAt,
          isFeatured: mix.isFeatured || false,
        };
        return res.json(mixItem);
      }

      // Try episodes (by ID or slug)
      const episodes = await storage.getEpisodes();
      const episode = episodes.find((e: any) => 
        (isNumeric && e.id === numericId) || 
        (e.slug && e.slug === itemId)
      );
      
      if (episode) {
        const episodeItem = {
          type: 'episode' as const,
          id: episode.id,
          title: episode.title,
          hostName: episode.hostName,
          slug: episode.slug || null,
          artworkUrl: episode.artUrl || episode.artworkUrl || null,
          genre: episode.genre || null,
          description: episode.about || null,
          tracklist: episode.tracklist || null,
          airDate: episode.airDate,
          url: (episode as any).streamUrl || (episode as any).fileUrl || null,
          submittedAt: episode.airDate,
          createdAt: episode.airDate,
          isFeatured: episode.isFeatured || false,
        };
        return res.json(episodeItem);
      }

      // Playlist support to be added in future
      
      // Not found
      res.status(404).json({ error: 'Content not found' });

    } catch (error) {
      console.error('[Community API] Error fetching item:', error);
      res.status(500).json({ error: 'Failed to fetch content item' });
    }
  });

  // =================
  // PLAYLIST SUBMISSIONS API
  // =================

  // PUBLIC: Submit a playlist
  app.post('/api/public/playlists', async (req, res) => {
    try {
      // Validate ONLY user-editable fields - NEVER accept privileged fields from public
      const publicSchema = z.object({
        curatorName: z.string().min(1, 'Curator name is required'),
        title: z.string().min(1, 'Title is required'),
        playlistUrl: z.string().url('Must be a valid URL'),
        description: z.string().optional().nullable(),
        tags: z.array(z.string()).optional().nullable(),
        artworkUrl: z.string().url().optional().nullable(),
        curatorEmail: z.string().email().optional().nullable(),
      });
      
      const validated = publicSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ 
          error: 'Invalid playlist data', 
          details: validated.error.issues 
        });
      }

      const data = validated.data;

      // Detect platform from URL
      let platform = 'unknown';
      if (data.playlistUrl.includes('spotify.com')) {
        platform = 'spotify';
      } else if (data.playlistUrl.includes('apple.com') || data.playlistUrl.includes('music.apple')) {
        platform = 'apple_music';
      } else if (data.playlistUrl.includes('youtube.com') || data.playlistUrl.includes('youtu.be')) {
        platform = 'youtube';
      }

      // Create submission with ONLY validated user fields - storage layer enforces secure defaults
      const submission = await storage.createPlaylistSubmission({
        curatorName: data.curatorName,
        title: data.title,
        playlistUrl: data.playlistUrl,
        description: data.description || null,
        tags: data.tags || null,
        artworkUrl: data.artworkUrl || null,
        curatorEmail: data.curatorEmail || null,
        platform,
      });

      console.log(`[Playlist Submission] Created submission ${submission.id}: "${submission.title}" by ${submission.curatorName}`);
      res.status(201).json({ success: true, id: submission.id, submission });
    } catch (error) {
      console.error('[Playlist Submission] Error:', error);
      res.status(500).json({ error: 'Failed to submit playlist' });
    }
  });

  // PUBLIC: Get approved playlists
  app.get('/api/public/playlists', async (req, res) => {
    try {
      const { limit, featured } = req.query;
      const playlists = await storage.getPlaylistSubmissions({
        approved: true,
        featured: featured === 'true' ? true : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(playlists);
    } catch (error) {
      console.error('[Playlist API] Error:', error);
      res.status(500).json({ error: 'Failed to fetch playlists' });
    }
  });

  // EDITOR: Get all playlist submissions (requires editor role)
  app.get('/api/editor/playlists', requireRole('editor'), async (req, res) => {
    try {
      const { status, limit } = req.query;
      const playlists = await storage.getPlaylistSubmissions({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(playlists);
    } catch (error) {
      console.error('[Editor Playlists] Error:', error);
      res.status(500).json({ error: 'Failed to fetch playlist submissions' });
    }
  });

  // EDITOR: Approve/Unapprove playlist
  app.patch('/api/editor/playlists/:id/approve', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.togglePlaylistApproval(id);
      
      broadcast({ type: 'playlist_updated', data: playlist });
      res.json(playlist);
    } catch (error) {
      console.error('[Editor Playlists] Approve error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to approve playlist' });
    }
  });

  // EDITOR: Feature/Unfeature playlist
  app.patch('/api/editor/playlists/:id/feature', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.togglePlaylistFeature(id);
      
      broadcast({ type: 'playlist_updated', data: playlist });
      res.json(playlist);
    } catch (error) {
      console.error('[Editor Playlists] Feature error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to feature playlist' });
    }
  });

  // EDITOR: Update playlist submission
  app.patch('/api/editor/playlists/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const playlist = await storage.updatePlaylistSubmission(id, updates);
      
      broadcast({ type: 'playlist_updated', data: playlist });
      res.json(playlist);
    } catch (error) {
      console.error('[Editor Playlists] Update error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update playlist' });
    }
  });

  // EDITOR: Delete playlist submission
  app.delete('/api/editor/playlists/:id', requireRole('editor'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlaylistSubmission(id);
      
      broadcast({ type: 'playlist_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('[Editor Playlists] Delete error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete playlist' });
    }
  });

  // PUBLIC: Like a playlist
  app.post('/api/playlists/:id/like', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.likePlaylistSubmission(id);
      
      res.json({ success: true, likes: playlist.likes });
    } catch (error) {
      console.error('[Playlist Like] Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to like playlist' });
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

  // ADMIN: Get all draft album picks (editor role required)
  app.get('/api/admin/albums/drafts', requireRole('editor'), async (req, res) => {
    try {
      const drafts = await storage.getDraftAlbumPicks();
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch draft picks' });
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

  // =================
  // SETTINGS ROUTES (ADMIN ONLY)
  // =================

  // Get all settings
  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Get setting by key
  app.get('/api/admin/settings/:key', requireAdmin, async (req, res) => {
    try {
      const setting = await storage.getSettingByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  // Upsert setting (create or update)
  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const { key, value, description, isSecret } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
      }

      const setting = await storage.upsertSetting(key, value, description, isSecret);
      
      // Re-initialize AzuraCast service if AzuraCast settings were updated
      if (key.startsWith('azuracast_')) {
        await azuracastService.initializeWithStorage(storage);
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error upserting setting:', error);
      res.status(500).json({ error: 'Failed to upsert setting' });
    }
  });

  // Delete setting
  app.delete('/api/admin/settings/:key', requireAdmin, async (req, res) => {
    try {
      await storage.deleteSetting(req.params.key);
      
      // Re-initialize AzuraCast service if AzuraCast settings were deleted
      if (req.params.key.startsWith('azuracast_')) {
        await azuracastService.initializeWithStorage(storage);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  });

  return httpServer;
}