import 'express-async-errors';
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { uploadViaSftp, rescanLibrary, ensurePlaylist, addMediaToPlaylist, createSchedule, getNowPlaying } from './azuracastHelpers';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const logger = pino();

const app = express();

// Security and CORS middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for dev - enable in production
}));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      logger.info({ method: req.method, path, statusCode: res.statusCode, duration }, 'API Request');
    }
  });

  next();
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Server Error');
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve audio files statically from attached_assets directory (before routes)
app.use('/attached_assets', express.static('attached_assets', {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  }
}));

// Redirect resident application route to Google Form (must be before Vite middleware)
app.get('/resident-application', (req, res) => {
  res.redirect(301, 'https://docs.google.com/forms/d/e/1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw/viewform');
});

// Set up multer for file uploads
const upload = multer({ 
  dest: '/tmp/uploads/',
  limits: { fileSize: 1024 * 1024 * 300 } // 300MB
});

// Health check endpoint
app.get('/health', (_req, res) => res.json({ ok: true }));

// Upload mix file to AzuraCast
app.post('/api/mix/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file provided' });
    }

    const localPath = req.file.path;
    const finalFilename = req.body.final_filename || req.file.originalname.replace(/\s+/g, '_');
    
    await uploadViaSftp(localPath, finalFilename);
    await rescanLibrary();
    
    // Clean up temp file
    await fs.unlink(localPath).catch(() => {});
    
    log(`File uploaded to AzuraCast: ${finalFilename}`);
    res.json({ ok: true, filename: finalFilename });
  } catch (err) {
    logger.error({ err }, 'Upload to AzuraCast failed');
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Publish mix to playlist
app.post('/api/mix/publish', async (req, res) => {
  try {
    const { show_slug, filenames } = req.body;
    
    if (!show_slug || !Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ ok: false, error: 'show_slug and filenames[] required' });
    }
    
    const playlistName = `show__${show_slug}`;
    const playlist = await ensurePlaylist(playlistName);
    await addMediaToPlaylist(playlist.id, filenames);
    
    log(`Added ${filenames.length} files to playlist: ${playlistName}`);
    res.json({ ok: true, playlist_id: playlist.id });
  } catch (err) {
    logger.error({ err }, 'Failed to publish to playlist');
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Schedule playlist
app.post('/api/mix/schedule', async (req, res) => {
  try {
    const { playlist_id, show_slug, days, start, end, loopOnce = true } = req.body;
    
    let playlistId = playlist_id;
    if (!playlistId && show_slug) {
      const playlist = await ensurePlaylist(`show__${show_slug}`);
      playlistId = playlist.id;
    }
    
    if (!playlistId || !Array.isArray(days) || !start || !end) {
      return res.status(400).json({ 
        ok: false, 
        error: 'playlist_id/show_slug, days[], start, end required' 
      });
    }
    
    const schedule = await createSchedule(playlistId, days, start, end, loopOnce);
    
    log(`Created schedule for playlist ${playlistId}: ${days.join(',')} ${start}-${end}`);
    res.json({ ok: true, schedule });
  } catch (err) {
    logger.error({ err }, 'Failed to create schedule');
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Proxy AzuraCast now playing data
app.get('/api/nowplaying', async (_req, res) => {
  try {
    const data = await getNowPlaying();
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch now playing data');
    res.status(500).json({ ok: false, error: 'Failed to fetch now playing data' });
  }
});

// Legacy endpoint for existing player
app.get('/api/now', async (_req, res) => {
  try {
    const data = await getNowPlaying();
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch now playing data');
    res.status(500).json({ ok: false, error: 'Failed to fetch now playing data' });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
