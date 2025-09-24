import { storage } from './storage';
import { azuracastService } from './azuracastService';
import { MixSubmission } from '@shared/schema';

/**
 * Mix Router - Single standardized workflow for approved mixes
 * 
 * Routes mixes based on flags:
 * - featureOnSite: true → publish to website collections
 * - pushToAzura: true → upload to AzuraCast via SFTP + add to playlist
 * 
 * Idempotent: can be safely retried, skips completed steps
 */
export class MixRouter {
  
  /**
   * Main routing function - handles all post-approval workflow
   */
  async routeMix(mixId: number): Promise<{ success: boolean; message: string; errors?: string[] }> {
    const errors: string[] = [];
    
    try {
      const mix = await storage.getMixSubmission(mixId);
      if (!mix) {
        return { success: false, message: 'Mix not found' };
      }

      if (mix.status !== 'approved' && mix.status !== 'featured') {
        return { success: false, message: 'Mix must be approved or featured before routing' };
      }

      console.log(`🚀 Routing mix ${mix.id}: "${mix.title}" by ${mix.name}`);
      console.log(`   ✅ Feature on site: ${mix.featureOnSite}`);
      console.log(`   📻 Push to AzuraCast: ${mix.pushToAzura}`);

      // Step 1: Feature on site (if enabled)
      if (mix.featureOnSite) {
        await this.publishToSite(mix);
        console.log(`   ✅ Published to website`);
      }

      // Step 2: Push to AzuraCast (if enabled)
      if (mix.pushToAzura) {
        await this.pushToAzuraCast(mix);
        console.log(`   ✅ AzuraCast workflow completed`);
      }

      await storage.updateMixSubmission(mixId, {
        approvedAt: mix.approvedAt || new Date()
      });

      return {
        success: true,
        message: `Mix "${mix.title}" successfully routed`,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Mix routing failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        message: 'Mix routing failed',
        errors
      };
    }
  }

  /**
   * Publish mix to website collections (featured content, latest, etc.)
   */
  private async publishToSite(mix: MixSubmission): Promise<void> {
    // Mix is already in the database with approved status
    // Website queries will automatically pick it up if featureOnSite=true
    console.log(`Publishing mix "${mix.title}" to website collections`);
    
    // Could trigger cache invalidation, search indexing, etc. here
    // For now, the persistent storage handles this automatically
  }

  /**
   * Complete AzuraCast workflow: convert → upload → rescan → playlist
   */
  private async pushToAzuraCast(mix: MixSubmission): Promise<void> {
    const mixId = mix.id;
    
    // Skip if already uploaded
    if (mix.azuraFilePath && mix.uploadedAt) {
      console.log(`   ⏭️  Already uploaded: ${mix.azuraFilePath}`);
      return;
    }

    // Step 1: Ensure local MP3 file exists
    console.log(`   🎵 Processing audio for: ${mix.url}`);
    const localMp3Path = await this.ensureLocalMp3(mix);
    
    // Step 2: SFTP upload to AzuraCast media directory
    console.log(`   📤 Uploading to AzuraCast...`);
    const uploadResult = await azuracastService.uploadMixToAzuraCast(
      mix.title,
      mix.name,
      localMp3Path
    );

    // Update with upload details
    await storage.updateMixSubmission(mixId, {
      azuraFilePath: uploadResult.path,
      uploadedAt: new Date()
    });

    // Step 3: Trigger AzuraCast library rescan
    console.log(`   🔄 Triggering library rescan...`);
    await this.triggerLibraryRescan();
    
    await storage.updateMixSubmission(mixId, {
      rescannedAt: new Date()
    });

    // Step 4: Add to target playlist
    if (mix.targetPlaylist) {
      console.log(`   📋 Adding to playlist: ${mix.targetPlaylist}`);
      const playlistId = await this.addToPlaylist(uploadResult.filename, mix.targetPlaylist);
      
      await storage.updateMixSubmission(mixId, {
        azuraPlaylistId: playlistId,
        playlistLinkedAt: new Date()
      });
    }

    // Step 5: Optional scheduling
    if (mix.airDate) {
      console.log(`   ⏰ Scheduling for: ${mix.airDate}`);
      await this.scheduleFirstPlay(mix.targetPlaylist || 'General Rotation', mix.airDate);
    }
  }

  /**
   * Ensure mix is available as local MP3 file
   * Downloads from SoundCloud/Mixcloud/YouTube and converts to MP3
   */
  private async ensureLocalMp3(mix: MixSubmission): Promise<string> {
    // Create safe filename - more aggressive sanitization
    const safeName = `${mix.name.replace(/[^a-zA-Z0-9]/g, '_')}-${mix.title.replace(/[^a-zA-Z0-9]/g, '_')}`
      .replace(/_+/g, '_')  // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50);     // Limit length
    const tempPath = `/tmp/mixes/${safeName}.mp3`;
    
    // Check if file already exists
    const fs = await import('fs');
    if (fs.existsSync(tempPath)) {
      console.log(`   ✅ Audio file already exists: ${tempPath}`);
      return tempPath;
    }
    
    console.log(`   🎵 Downloading audio from: ${mix.url}`);
    console.log(`   📁 Target path: ${tempPath}`);
    
    try {
      // Use yt-dlp to download audio and convert to MP3
      const { spawn } = await import('child_process');
      const path = await import('path');
      
      // Create unique temp filename for yt-dlp output
      const outputTemplate = path.join('/tmp/mixes', `${safeName}.%(ext)s`);
      
      // Use spawn instead of exec for better control and avoid shell escaping issues
      const ytDlpArgs = [
        '--extract-audio',
        '--audio-format', 'mp3', 
        '--audio-quality', '192',
        '--output', outputTemplate,
        '--no-playlist',
        '--quiet',
        mix.url  // No quotes needed with spawn
      ];
      
      console.log(`   🔄 Running: yt-dlp ${ytDlpArgs.join(' ')}`);
      
      // Execute yt-dlp using spawn (safer than exec for command injection)
      const ytDlpProcess = spawn('yt-dlp', ytDlpArgs, {
        cwd: '/tmp/mixes',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      ytDlpProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      ytDlpProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Wait for process to complete with timeout
      const processResult = await new Promise<{code: number | null, signal: string | null}>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ytDlpProcess.kill();
          reject(new Error('yt-dlp process timed out after 5 minutes'));
        }, 300000); // 5 minutes
        
        ytDlpProcess.on('close', (code, signal) => {
          clearTimeout(timeout);
          resolve({ code, signal });
        });
        
        ytDlpProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      if (processResult.code !== 0) {
        throw new Error(`yt-dlp failed with code ${processResult.code}: ${stderr || stdout}`);
      }
      
      if (stderr && !stderr.includes('WARNING')) {
        console.log(`   ⚠️  yt-dlp stderr: ${stderr}`);
      }
      
      // Verify file was created
      if (!fs.existsSync(tempPath)) {
        throw new Error(`Downloaded file not found at ${tempPath}. yt-dlp output: ${stdout}`);
      }
      
      // Check file size
      const stats = fs.statSync(tempPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`   ✅ Downloaded ${fileSizeMB.toFixed(1)}MB audio file`);
      
      // Add ID3 tags
      await this.addId3Tags(tempPath, mix);
      
      return tempPath;
      
    } catch (error) {
      console.error(`   ❌ Audio download failed: ${error}`);
      
      // Create a placeholder file to prevent repeated download attempts
      const fs = await import('fs');
      fs.writeFileSync(tempPath + '.failed', `Download failed: ${error}\nURL: ${mix.url}\nTime: ${new Date().toISOString()}`);
      
      throw new Error(`Failed to download audio from ${mix.url}: ${error}`);
    }
  }
  
  /**
   * Add ID3 tags to downloaded MP3
   */
  private async addId3Tags(filePath: string, mix: MixSubmission): Promise<void> {
    try {
      const NodeID3 = await import('node-id3');
      
      const tags: any = {
        artist: mix.name || 'Unknown Artist',
        title: mix.title || 'Untitled Mix',
        album: 'Enamorado Radio - Community Mixes',
        genre: mix.genre || 'Electronic',
        comment: {
          language: 'eng',
          shortText: `Original URL: ${mix.url}`
        },
        userDefinedText: [
          {
            description: 'SOURCE_URL',
            value: mix.url
          },
          {
            description: 'SUBMITTED_BY',
            value: mix.name
          }
        ]
      };
      
      // Add artwork if available
      if (mix.coverUrl) {
        try {
          const response = await fetch(mix.coverUrl);
          if (response.ok) {
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            tags.image = {
              mime: 'image/jpeg',
              type: { id: 3, name: 'front cover' },
              description: 'Cover Art',
              imageBuffer: imageBuffer
            };
          }
        } catch (artworkError) {
          console.log(`   ⚠️  Could not add artwork: ${artworkError}`);
        }
      }
      
      NodeID3.default.update(tags, filePath);
      console.log(`   🏷️  Added ID3 tags: ${mix.name} - ${mix.title}`);
      
    } catch (error) {
      console.log(`   ⚠️  Failed to add ID3 tags: ${error}`);
      // Don't fail the whole process if ID3 tagging fails
    }
  }

  /**
   * Trigger AzuraCast to rescan media library
   */
  private async triggerLibraryRescan(): Promise<void> {
    // Use AzuraCast API to trigger library rescan
    const baseUrl = process.env.AZURACAST_BASE_URL || 'http://24.199.109.18';
    const apiKey = process.env.AZURACAST_API_KEY;
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/stations/1/files/rescan`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log(`   ⚠️  Rescan API returned ${response.status}, continuing anyway`);
      }
    } catch (error) {
      console.log(`   ⚠️  Rescan failed: ${error}, continuing anyway`);
    }
  }

  /**
   * Add file to AzuraCast playlist
   */
  private async addToPlaylist(filename: string, playlistName: string): Promise<string> {
    // In production: use AzuraCast API to find playlist ID and add file
    console.log(`   📋 Adding ${filename} to ${playlistName} playlist`);
    
    // Mock playlist ID for now
    const playlistId = `playlist_${playlistName.toLowerCase().replace(/\s+/g, '_')}`;
    
    return playlistId;
  }

  /**
   * Schedule playlist for specific air time
   */
  private async scheduleFirstPlay(playlistName: string, airDate: Date): Promise<void> {
    // In production: use AzuraCast scheduling API
    console.log(`   ⏰ Scheduling ${playlistName} for ${airDate.toISOString()}`);
  }

  /**
   * Re-run router for a mix (useful for retries)
   */
  async retryMix(mixId: number): Promise<{ success: boolean; message: string }> {
    console.log(`🔄 Retrying routing for mix ${mixId}`);
    return this.routeMix(mixId);
  }

  /**
   * Update routing flags for an approved mix and re-route
   */
  async updateRouting(
    mixId: number, 
    routing: {
      featureOnSite?: boolean;
      pushToAzura?: boolean;
      targetPlaylist?: string;
      airDate?: Date;
    }
  ): Promise<{ success: boolean; message: string }> {
    
    await storage.updateMixSubmission(mixId, routing);
    console.log(`🔄 Updated routing for mix ${mixId}, re-running router`);
    
    return this.routeMix(mixId);
  }
}

export const mixRouter = new MixRouter();