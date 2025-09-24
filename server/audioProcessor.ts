// Audio Processing Module
// Handles audio file downloads, conversions, and preparations for AzuraCast

import fs from 'fs';
import path from 'path';
import * as NodeID3 from 'node-id3';
import { EventEmitter } from 'events';

export class AudioProcessor extends EventEmitter {
  private tempDir: string;

  constructor() {
    super();
    this.tempDir = path.join(process.cwd(), 'temp_audio');
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Download audio from SoundCloud, Mixcloud, etc. and prepare for AzuraCast
  async processSubmissionForAzuraCast(mixSubmission: any): Promise<boolean> {
    try {
      console.log(`🎧 Processing ${mixSubmission.title} for AzuraCast upload...`);
      
      const fileName = this.sanitizeFileName(`${mixSubmission.name}-${mixSubmission.title}.mp3`);
      const localPath = path.join(this.tempDir, fileName);
      
      // Emit initial progress
      this.emit('progress', {
        mixId: mixSubmission.id,
        stage: 'initializing',
        progress: 0,
        message: 'Starting download...'
      });
      
      // Check if file already exists
      if (fs.existsSync(localPath)) {
        console.log(`✅ Audio file already exists: ${localPath}`);
        this.emit('progress', {
          mixId: mixSubmission.id,
          stage: 'complete',
          progress: 100,
          message: 'File already exists'
        });
        return true;
      }
      
      console.log(`📥 Downloading audio from: ${mixSubmission.url}`);
      
      // Use yt-dlp to download audio from SoundCloud/Mixcloud
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
          '--extract-audio',
          '--audio-format', 'mp3',
          '--audio-quality', '0', // Best quality
          '--output', localPath.replace('.mp3', '.%(ext)s'), // yt-dlp will add .mp3 extension
          '--no-playlist',
          '--embed-thumbnail',
          '--add-metadata',
          '--progress',
          '--newline',
          mixSubmission.url
        ]);

        let stderr = '';
        let startTime = Date.now();
        
        ytdlp.stdout.on('data', (data) => {
          const output = data.toString().trim();
          console.log(`yt-dlp: ${output}`);
          
          // Parse progress from yt-dlp output
          const progressMatch = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
          const speedMatch = output.match(/(\d+(?:\.\d+)?(?:K|M|G)?iB\/s)/);
          const etaMatch = output.match(/ETA\s+(\d+:\d+)/);
          const sizeMatch = output.match(/of\s+([\d.]+(?:K|M|G)?iB)/);
          
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            const speed = speedMatch ? speedMatch[1] : 'calculating...';
            const eta = etaMatch ? etaMatch[1] : 'unknown';
            const totalSize = sizeMatch ? sizeMatch[1] : 'unknown';
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            
            this.emit('progress', {
              mixId: mixSubmission.id,
              stage: 'downloading',
              progress: Math.round(progress),
              speed,
              eta,
              totalSize,
              elapsed: `${elapsed}s`,
              message: `Downloading at ${speed}`
            });
          }
          
          // Check for conversion/post-processing
          if (output.includes('[ExtractAudio]') || output.includes('Converting')) {
            this.emit('progress', {
              mixId: mixSubmission.id,
              stage: 'converting',
              progress: 95,
              message: 'Converting to MP3...'
            });
          }
        });

        ytdlp.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log(`yt-dlp: ${data.toString().trim()}`);
        });

        ytdlp.on('close', async (code) => {
          if (code === 0) {
            console.log(`✅ Downloaded: ${fileName}`);
            
            this.emit('progress', {
              mixId: mixSubmission.id,
              stage: 'tagging',
              progress: 98,
              message: 'Adding metadata tags...'
            });
            
            // Add ID3 tags
            try {
              await this.tagLocalMp3(localPath, mixSubmission.name, mixSubmission.title);
            } catch (tagError) {
              console.warn('⚠️ Failed to add ID3 tags, but download succeeded');
            }
            
            this.emit('progress', {
              mixId: mixSubmission.id,
              stage: 'complete',
              progress: 100,
              message: 'Download completed successfully!'
            });
            
            resolve(true);
          } else {
            console.error(`❌ yt-dlp failed with code ${code}: ${stderr}`);
            this.emit('progress', {
              mixId: mixSubmission.id,
              stage: 'error',
              progress: 0,
              message: `Download failed: ${stderr}`
            });
            reject(new Error(`Audio download failed: ${stderr}`));
          }
        });

        ytdlp.on('error', (error) => {
          console.error(`❌ Failed to spawn yt-dlp:`, error);
          this.emit('progress', {
            mixId: mixSubmission.id,
            stage: 'error',
            progress: 0,
            message: `Process failed: ${error.message}`
          });
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      return false;
    }
  }

  // Add ID3 tags to MP3 file
  async tagLocalMp3(
    filePath: string,
    artist: string,
    title: string,
    album = 'Community Mixes',
    artworkBuffer?: Buffer
  ) {
    try {
      const tags: any = { 
        artist: artist || 'Unknown', 
        title: title || 'Untitled', 
        album 
      };
      
      if (artworkBuffer) {
        tags.image = {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'cover',
          imageBuffer: artworkBuffer
        };
      }
      
      NodeID3.update(tags, filePath);
      console.log(`🏷️ Added ID3 tags to ${filePath}: ${artist} - ${title}`);
    } catch (error) {
      console.error('Failed to add ID3 tags:', error);
    }
  }

  // Upload processed audio to AzuraCast
  async uploadToAzuraCast(mixSubmission: any): Promise<boolean> {
    try {
      const fileName = this.sanitizeFileName(`${mixSubmission.name}-${mixSubmission.title}.mp3`);
      const localPath = path.join(this.tempDir, fileName);
      
      // Check if file exists locally
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  Audio file not found at ${localPath}, skipping upload`);
        return false;
      }
      
      console.log(`✅ Audio file ready for upload: ${localPath}`);
      // Note: This method is deprecated - use azuracastIntegration.pushFileToAzuraCast instead
      return true;
    } catch (error) {
      console.error('❌ Upload to AzuraCast failed:', error);
      return false;
    }
  }

  // Note: Playlist management moved to azuraCastManager.ensurePlaylist and addToPlaylist

  // Sanitize filename for cross-platform compatibility
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  // Get temp directory for manual file placement
  getTempDirectory(): string {
    return this.tempDir;
  }

  // List files ready for upload
  listReadyFiles(): string[] {
    try {
      return fs.readdirSync(this.tempDir)
        .filter(file => file.endsWith('.mp3'))
        .map(file => path.join(this.tempDir, file));
    } catch (error) {
      console.error('❌ Error listing ready files:', error);
      return [];
    }
  }
}

export const audioProcessor = new AudioProcessor();