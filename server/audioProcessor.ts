// Audio Processing Module
// Handles audio file downloads, conversions, and preparations for AzuraCast

import fs from 'fs';
import path from 'path';
import { azuracastService } from './azuracastIntegration.js';

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
      
      // Upload to AzuraCast
      const uploadSuccess = await azuracastService.uploadAudioFile(localPath, fileName);
      
      if (uploadSuccess) {
        // Add to rotation playlist
        await this.addToRotationPlaylist(fileName);
        
        // Cleanup local file
        fs.unlinkSync(localPath);
        console.log(`🗑️  Cleaned up local file: ${fileName}`);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Upload to AzuraCast failed:', error);
      return false;
    }
  }

  // Add uploaded track to rotation playlist
  private async addToRotationPlaylist(fileName: string): Promise<void> {
    try {
      // Check if rotation playlist exists, create if not
      const playlistName = 'Community Rotation';
      // TODO: Store playlist ID in database or config
      const playlistId = 1; // This would be retrieved from AzuraCast or stored config
      
      const mediaPath = `media/${fileName}`;
      const success = await azuracastService.addToPlaylist(playlistId, mediaPath);
      
      if (success) {
        console.log(`📋 Added ${fileName} to rotation playlist`);
      } else {
        console.error(`❌ Failed to add ${fileName} to playlist`);
      }
    } catch (error) {
      console.error('❌ Error adding to playlist:', error);
    }
  }

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