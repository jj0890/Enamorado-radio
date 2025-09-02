// Audio Processing Module
// Handles audio file downloads, conversions, and preparations for AzuraCast

import fs from 'fs';
import path from 'path';
import * as NodeID3 from 'node-id3';

export class AudioProcessor {
  private tempDir: string;

  constructor() {
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
      
      // For now, we'll create a placeholder approach since actual audio extraction
      // from SoundCloud/Mixcloud requires specialized libraries
      
      const fileName = this.sanitizeFileName(`${mixSubmission.name}-${mixSubmission.title}.mp3`);
      const localPath = path.join(this.tempDir, fileName);
      
      // TODO: Implement actual audio download/conversion
      // For demonstration, we'll create a metadata file that AzuraCast can read
      const metadataContent = JSON.stringify({
        title: mixSubmission.title,
        artist: mixSubmission.name,
        genre: mixSubmission.genre,
        originalUrl: mixSubmission.url,
        submittedAt: new Date().toISOString()
      }, null, 2);
      
      const metadataPath = path.join(this.tempDir, `${fileName}.json`);
      fs.writeFileSync(metadataPath, metadataContent);
      
      console.log(`📝 Created metadata file for ${fileName}`);
      
      // In a real implementation, you would:
      // 1. Use youtube-dl or similar to extract audio
      // 2. Convert to MP3 using ffmpeg
      // 3. Add proper ID3 tags
      // 4. Then upload to AzuraCast
      
      console.log(`⚠️  Manual step required: Download ${mixSubmission.url} as MP3 and place at ${localPath}`);
      console.log(`   Then the system will automatically upload to AzuraCast`);
      
      return true;
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
  private sanitizeFileName(fileName: string): string {
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