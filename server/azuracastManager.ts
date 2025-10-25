import Client from 'ssh2-sftp-client';
import { storage } from './storage';

/**
 * AzuraCast Manager - Complete upload & scheduling workflow
 * Handles SFTP uploads, library rescans, and playlist management
 */
export class AzuraCastManager {
  private baseUrl: string;
  private apiKey: string;
  private stationId: string; // Numeric ID for API calls (e.g., "1")
  private stationSlug: string; // Slug for SFTP paths (e.g., "enamorado_radio")
  private sftpConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
  };

  constructor() {
    this.baseUrl = process.env.AZURACAST_BASE_URL || 'http://24.199.109.18';
    this.apiKey = process.env.AZURACAST_API_KEY || '';
    this.stationId = process.env.AZURACAST_STATION_ID || '1'; // Numeric ID
    this.stationSlug = process.env.AZURACAST_STATION_SLUG || 'enamorado_radio'; // Slug for file paths
    
    this.sftpConfig = {
      host: process.env.SFTP_HOST || '24.199.109.18',
      port: parseInt(process.env.SFTP_PORT || '2022'),
      username: process.env.SFTP_USER || '',
      password: process.env.SFTP_PASS || ''
    };
  }

  /**
   * Complete upload workflow: SFTP → Rescan → Database Update
   */
  async uploadEpisode(episodeId: number, filePath: string, metadata: {
    title: string;
    showSlug: string;
    artist?: string;
    album?: string;
  }): Promise<{ 
    success: boolean; 
    azuraFilePath?: string; 
    error?: string;
    errorType?: 'sftp_connection' | 'sftp_auth' | 'sftp_upload' | 'rescan' | 'network' | 'unknown';
    stage?: 'connecting' | 'uploading' | 'rescanning' | 'completed';
  }> {
    const sftp = new Client();
    let currentStage: 'connecting' | 'uploading' | 'rescanning' | 'completed' = 'connecting';

    try {
      console.log(`🚀 Starting upload for episode ${episodeId}`);
      
      // Generate AzuraCast file path - use station SLUG for SFTP paths, not numeric ID
      const fileName = `${metadata.showSlug}-${Date.now()}.mp3`;
      const remotePath = `/var/azuracast/stations/${this.stationSlug}/media/Shows/${metadata.showSlug}/${fileName}`;
      
      // SFTP Upload - Connection Stage
      console.log(`📤 Connecting to SFTP at ${this.sftpConfig.host}:${this.sftpConfig.port}...`);
      currentStage = 'connecting';
      
      try {
        await sftp.connect(this.sftpConfig);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        // Determine specific error type
        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('EHOSTUNREACH')) {
          throw new Error(`Connection failed: Could not reach SFTP server at ${this.sftpConfig.host}:${this.sftpConfig.port}. Please verify the server is running and accessible.`);
        } else if (errorMsg.includes('authentication') || errorMsg.includes('password') || errorMsg.includes('denied')) {
          throw new Error(`Authentication failed: Invalid SFTP credentials. Please check username and password in settings.`);
        } else {
          throw new Error(`SFTP connection error: ${errorMsg}`);
        }
      }
      
      console.log(`✅ Connected to SFTP server`);
      
      // Create directory if needed
      const remoteDir = `/var/azuracast/stations/${this.stationSlug}/media/Shows/${metadata.showSlug}`;
      try {
        await sftp.mkdir(remoteDir, true);
      } catch (error) {
        console.warn(`⚠️ Could not create directory (may already exist): ${remoteDir}`);
      }
      
      // Upload Stage
      console.log(`📤 Uploading to: ${remotePath}`);
      currentStage = 'uploading';
      
      await sftp.put(filePath, remotePath);
      await sftp.end();
      
      console.log(`✅ SFTP upload completed`);
      
      // Rescan Stage
      console.log(`🔄 Triggering library rescan...`);
      currentStage = 'rescanning';
      
      const rescanResult = await this.triggerRescan();
      
      if (rescanResult.success) {
        console.log(`✅ Library rescan completed`);
      } else {
        console.warn(`⚠️ Rescan may have failed:`, rescanResult.error);
        // Don't fail the whole upload if rescan fails - file is already there
      }
      
      currentStage = 'completed';
      console.log(`✅ Episode ${episodeId} upload workflow completed`);
      
      return {
        success: true,
        azuraFilePath: remotePath,
        stage: 'completed'
      };
      
    } catch (error) {
      console.error(`❌ Upload failed for episode ${episodeId} at stage: ${currentStage}`, error);
      
      try {
        await sftp.end();
      } catch (e) {
        // Ignore SFTP cleanup errors
      }
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown upload error';
      
      // Determine error type
      let errorType: 'sftp_connection' | 'sftp_auth' | 'sftp_upload' | 'rescan' | 'network' | 'unknown' = 'unknown';
      
      if (currentStage === 'connecting') {
        if (errorMsg.includes('Authentication') || errorMsg.includes('denied') || errorMsg.includes('credentials')) {
          errorType = 'sftp_auth';
        } else if (errorMsg.includes('Connection') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
          errorType = 'sftp_connection';
        } else {
          errorType = 'network';
        }
      } else if (currentStage === 'uploading') {
        errorType = 'sftp_upload';
      } else if (currentStage === 'rescanning') {
        errorType = 'rescan';
      }
      
      return {
        success: false,
        error: errorMsg,
        errorType,
        stage: currentStage
      };
    }
  }

  /**
   * Trigger AzuraCast library rescan
   */
  async triggerRescan(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/station/${this.stationId}/files/rescan`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rescan error'
      };
    }
  }

  /**
   * Create or get playlist for a show
   */
  async ensurePlaylist(showSlug: string, showTitle: string): Promise<{ playlistId?: string; error?: string }> {
    try {
      // First, try to get existing playlists
      const response = await fetch(`${this.baseUrl}/api/station/${this.stationId}/playlists`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playlists = await response.json();
      
      // Look for existing playlist
      const existingPlaylist = playlists.find((p: any) => 
        p.name === showTitle || p.name === `${showTitle} Reruns`
      );
      
      if (existingPlaylist) {
        console.log(`✅ Found existing playlist: ${existingPlaylist.name}`);
        return { playlistId: existingPlaylist.id.toString() };
      }
      
      // Create new playlist
      const createResponse = await fetch(`${this.baseUrl}/api/station/${this.stationId}/playlists`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${showTitle} Reruns`,
          description: `Reruns and episodes from ${showTitle}`,
          is_enabled: true,
          type: 'standard'
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create playlist: HTTP ${createResponse.status}`);
      }
      
      const newPlaylist = await createResponse.json();
      console.log(`✅ Created new playlist: ${newPlaylist.name}`);
      
      return { playlistId: newPlaylist.id.toString() };
      
    } catch (error) {
      console.error(`❌ Playlist management failed:`, error);
      return {
        error: error instanceof Error ? error.message : 'Unknown playlist error'
      };
    }
  }

  /**
   * Add episode to playlist
   */
  async addToPlaylist(playlistId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get media files to find the file ID
      const filesResponse = await fetch(`${this.baseUrl}/api/station/${this.stationId}/files`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!filesResponse.ok) {
        throw new Error(`Failed to get files: HTTP ${filesResponse.status}`);
      }
      
      const files = await filesResponse.json();
      const targetFile = files.find((f: any) => f.path === filePath);
      
      if (!targetFile) {
        return {
          success: false,
          error: `File not found in AzuraCast media: ${filePath}`
        };
      }
      
      // Add to playlist
      const addResponse = await fetch(`${this.baseUrl}/api/station/${this.stationId}/playlist/${playlistId}/files`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: [{ id: targetFile.id }]
        })
      });
      
      if (!addResponse.ok) {
        throw new Error(`Failed to add to playlist: HTTP ${addResponse.status}`);
      }
      
      console.log(`✅ Added file to playlist ${playlistId}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to add to playlist:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown playlist add error'
      };
    }
  }

  /**
   * Schedule episode for specific air time
   */
  async scheduleEpisode(playlistId: string, startTime: Date, duration: number = 3600): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/station/${this.stationId}/schedule`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Scheduled Episode`,
          playlist_id: playlistId,
          start_time: startTime.toISOString(),
          end_time: new Date(startTime.getTime() + duration * 1000).toISOString(),
          days: [startTime.getDay()], // Day of week
          is_enabled: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Episode scheduled for ${startTime.toISOString()}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Scheduling failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scheduling error'
      };
    }
  }

  /**
   * Get current file path mapping for now playing lookups
   */
  async getFilePathMapping(): Promise<{ [filePath: string]: number }> {
    try {
      // Note: File path mapping for now playing lookups
      // Currently not actively used - placeholder for future functionality
      return {};
    } catch (error) {
      console.error('Failed to get file path mapping:', error);
      return {};
    }
  }
}

export const azuraCastManager = new AzuraCastManager();